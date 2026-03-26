import type { Octokit } from "@octokit/rest";
import type { WorkspaceConfig, WorkspacePackage } from "@/types";

type OctokitInstance = InstanceType<typeof Octokit>;

async function getFileContent(
  octokit: OctokitInstance,
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if ("content" in data && data.type === "file") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}

async function listDirectory(
  octokit: OctokitInstance,
  owner: string,
  repo: string,
  path: string,
): Promise<string[]> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (Array.isArray(data)) {
      return data
        .filter((item) => item.type === "dir")
        .map((item) => item.name);
    }
    return [];
  } catch {
    return [];
  }
}

async function resolveGlobs(
  octokit: OctokitInstance,
  owner: string,
  repo: string,
  globs: string[],
): Promise<WorkspacePackage[]> {
  const packages: WorkspacePackage[] = [];

  for (const glob of globs) {
    // 간단한 glob: "apps/*", "packages/*" 형태만 처리
    const wildcardIndex = glob.indexOf("/*");
    if (wildcardIndex === -1) continue;

    const dirPath = glob.slice(0, wildcardIndex);
    const subdirs = await listDirectory(octokit, owner, repo, dirPath);

    for (const subdir of subdirs) {
      const pkgPath = `${dirPath}/${subdir}`;
      const pkgJsonContent = await getFileContent(
        octokit,
        owner,
        repo,
        `${pkgPath}/package.json`,
      );

      if (pkgJsonContent) {
        let pkgName = pkgPath;
        try {
          const parsed = JSON.parse(pkgJsonContent) as { name?: string };
          if (parsed.name) pkgName = parsed.name;
        } catch {
          // ignore
        }
        packages.push({
          name: pkgName,
          path: pkgPath,
          displayName: pkgPath,
        });
      }
    }
  }

  return packages;
}

function parsePnpmWorkspaceYaml(content: string): string[] {
  // 간단한 YAML 파싱 (js-yaml 없이): "packages:" 섹션의 배열 항목 추출
  const lines = content.split("\n");
  const globs: string[] = [];
  let inPackages = false;

  for (const line of lines) {
    if (line.trim() === "packages:") {
      inPackages = true;
      continue;
    }
    if (inPackages) {
      const match = line.match(/^\s+-\s+['"]?([^'"]+)['"]?\s*$/);
      if (match) {
        globs.push(match[1].trim());
      } else if (
        line.trim() &&
        !line.startsWith(" ") &&
        !line.startsWith("\t")
      ) {
        break;
      }
    }
  }

  return globs;
}

export async function detectMonorepo(
  octokit: OctokitInstance,
  owner: string,
  repo: string,
): Promise<WorkspaceConfig | null> {
  // 1. pnpm-workspace.yaml
  const pnpmYaml = await getFileContent(
    octokit,
    owner,
    repo,
    "pnpm-workspace.yaml",
  );
  if (pnpmYaml) {
    const globs = parsePnpmWorkspaceYaml(pnpmYaml);
    if (globs.length > 0) {
      const packages = await resolveGlobs(octokit, owner, repo, globs);
      if (packages.length > 0) {
        return {
          type: "pnpm-workspaces",
          packages,
          detectedAt: new Date().toISOString(),
        };
      }
    }
  }

  // 2. package.json#workspaces (npm/yarn)
  const pkgJson = await getFileContent(octokit, owner, repo, "package.json");
  if (pkgJson) {
    try {
      const parsed = JSON.parse(pkgJson) as {
        workspaces?: string[] | { packages?: string[] };
      };
      const workspaces = parsed.workspaces;
      if (workspaces) {
        const globs = Array.isArray(workspaces)
          ? workspaces
          : (workspaces.packages ?? []);
        if (globs.length > 0) {
          // turbo.json도 있으면 turbo로 표기
          const hasTurbo = await getFileContent(
            octokit,
            owner,
            repo,
            "turbo.json",
          );
          const type = hasTurbo ? "turbo" : "npm-workspaces";
          const packages = await resolveGlobs(octokit, owner, repo, globs);
          if (packages.length > 0) {
            return { type, packages, detectedAt: new Date().toISOString() };
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. lerna.json
  const lernaJson = await getFileContent(octokit, owner, repo, "lerna.json");
  if (lernaJson) {
    try {
      const parsed = JSON.parse(lernaJson) as { packages?: string[] };
      const globs = parsed.packages ?? ["packages/*"];
      const packages = await resolveGlobs(octokit, owner, repo, globs);
      if (packages.length > 0) {
        return {
          type: "lerna",
          packages,
          detectedAt: new Date().toISOString(),
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
}
