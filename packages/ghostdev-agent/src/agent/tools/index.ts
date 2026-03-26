import { tool } from "ai";
import { z } from "zod";
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { execSync } from "child_process";
import { resolve, join } from "path";
import { Octokit } from "@octokit/rest";
import type { AgentLogger } from "../../types.js";

export function createTools(logger: AgentLogger) {
  return {
    readFile: tool({
      description: "레포 루트 기준 상대 경로로 파일을 읽습니다.",
      parameters: z.object({
        path: z.string().describe("레포 루트 기준 상대 경로"),
      }),
      execute: async ({ path }) => {
        const absPath = resolve(process.cwd(), path);
        const content = readFileSync(absPath, "utf-8");
        await logger.toolResult("readFile", { path, length: content.length });
        return content;
      },
    }),

    writeFile: tool({
      description: "파일을 생성하거나 덮어씁니다.",
      parameters: z.object({
        path: z.string().describe("레포 루트 기준 상대 경로"),
        content: z.string().describe("파일 전체 내용"),
      }),
      execute: async ({ path, content }) => {
        const absPath = resolve(process.cwd(), path);
        writeFileSync(absPath, content, "utf-8");
        await logger.toolResult("writeFile", { path, bytes: content.length });
        return { success: true, path };
      },
    }),

    listDirectory: tool({
      description: "디렉토리 내용을 나열합니다.",
      parameters: z.object({
        path: z
          .string()
          .default(".")
          .describe("레포 루트 기준 상대 경로 (기본: 루트)"),
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
      description:
        "쉘 명령어를 실행합니다. lint, typecheck, test 등에 사용하세요.",
      parameters: z.object({
        command: z.string().describe("실행할 명령어"),
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
      description:
        "변경사항을 커밋하고 새 브랜치에 푸시한 뒤 Pull Request를 생성합니다.",
      parameters: z.object({
        branchName: z
          .string()
          .describe("새 브랜치명 (예: ghostdev/fix-auth-bug)"),
        commitMessage: z.string().describe("커밋 메시지"),
        prTitle: z.string().describe("PR 제목"),
        prBody: z.string().describe("PR 본문 (마크다운)"),
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
