import { tool } from "ai";
import { z } from "zod";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { execSync } from "child_process";
import { resolve, join, dirname } from "path";
import { Octokit } from "@octokit/rest";
import type { AgentLogger } from "../../types.js";

export function createTools(logger: AgentLogger) {
  // 동일 실행 내 파일 재읽기 방지용 캐시. writeFile 시 무효화.
  const fileCache = new Map<string, string>();

  return {
    readFile: tool({
      description: "Read a file by repo-relative path.",
      parameters: z.object({
        path: z.string().describe("Repo-relative path"),
      }),
      execute: async ({ path }) => {
        const absPath = resolve(process.cwd(), path);
        if (fileCache.has(absPath)) {
          await logger.toolResult("readFile", { path, cached: true });
          return fileCache.get(absPath)!;
        }
        const content = readFileSync(absPath, "utf-8");
        fileCache.set(absPath, content);
        await logger.toolResult("readFile", { path, length: content.length });
        return content;
      },
    }),

    writeFile: tool({
      description: "Create or overwrite a file.",
      parameters: z.object({
        path: z.string().describe("Repo-relative path"),
        content: z.string().describe("Full file content"),
      }),
      execute: async ({ path, content }) => {
        const absPath = resolve(process.cwd(), path);
        mkdirSync(dirname(absPath), { recursive: true });
        writeFileSync(absPath, content, "utf-8");
        fileCache.set(absPath, content);
        await logger.toolResult("writeFile", { path, bytes: content.length });
        return { success: true, path };
      },
    }),

    listDirectory: tool({
      description: "List directory contents.",
      parameters: z.object({
        path: z.string().default(".").describe("Repo-relative path (default: root)"),
        recursive: z.boolean().default(false),
      }),
      execute: async ({ path, recursive }) => {
        const absPath = resolve(process.cwd(), path);
        const entries = listDir(absPath, recursive, 0);
        await logger.toolResult("listDirectory", {
          path,
          count: entries.length,
        });
        return entries;
      },
    }),

    runCommand: tool({
      description: "Run a shell command (lint, typecheck, test, etc.).",
      parameters: z.object({
        command: z.string().describe("Shell command to execute"),
      }),
      execute: async ({ command }) => {
        await logger.toolCall("runCommand", { command });
        try {
          const output = execSync(command, {
            cwd: process.cwd(),
            encoding: "utf-8",
            timeout: 120_000, // 2분 타임아웃
          });
          await logger.toolResult("runCommand", { command, success: true });
          return { success: true, output };
        } catch (error) {
          const err = error as {
            message?: string;
            stdout?: string;
            stderr?: string;
          };
          await logger.error(
            `명령어 실패: ${command}${err.stderr ? ` — ${err.stderr}` : ""}`,
          );
          return {
            success: false,
            error: err.message,
            stdout: err.stdout,
            stderr: err.stderr,
          };
        }
      },
    }),

    createPR: tool({
      description: "Commit changes, push to a new branch, and open a Pull Request.",
      parameters: z.object({
        branchName: z.string().describe("New branch name (e.g. ghostdev/fix-auth-bug)"),
        commitMessage: z.string().describe("Commit message"),
        prTitle: z.string().describe("PR title"),
        prBody: z.string().describe("PR body (markdown)"),
      }),
      execute: async ({ branchName, commitMessage, prTitle, prBody }) => {
        await logger.info(`브랜치 생성: ${branchName}`);

        execSync(`git checkout -b ${branchName}`);
        execSync("git add -A");
        execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
        execSync(`git push origin ${branchName}`);

        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const [owner, repo] = process.env.GITHUB_REPOSITORY!.split("/");

        const { data: pr } = await octokit.pulls.create({
          owner,
          repo,
          title: prTitle,
          body: prBody,
          head: branchName,
          base: process.env.GHOSTDEV_BASE_BRANCH || "main",
        });

        await logger.success(`PR 생성 완료: ${pr.html_url}`);
        return { prUrl: pr.html_url, prNumber: pr.number };
      },
    }),
  };
}

function listDir(dirPath: string, recursive: boolean, depth: number): string[] {
  if (depth > 3) return []; // 최대 깊이 제한
  const SKIP = new Set(["node_modules", ".git", ".next", "dist", ".turbo"]);

  const entries: string[] = [];
  for (const entry of readdirSync(dirPath)) {
    if (SKIP.has(entry)) continue;
    const full = join(dirPath, entry);
    const rel = full.replace(process.cwd() + "/", "");
    const stat = statSync(full);
    entries.push(stat.isDirectory() ? `${rel}/` : rel);
    if (recursive && stat.isDirectory()) {
      entries.push(...listDir(full, true, depth + 1));
    }
  }
  return entries;
}
