import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim() || "";
const REPO = process.env.REPO;

// Try to get PR_NUMBER from env, or find it using gh cli
let PR_NUMBER = process.env.PR_NUMBER;
if (!PR_NUMBER && GITHUB_TOKEN) {
  try {
    console.log("PR_NUMBER not found, attempting to find it for current branch...");
    PR_NUMBER = execSync("gh pr view --json number -q .number", {
      encoding: "utf-8",
      env: { ...process.env, GH_TOKEN: GITHUB_TOKEN },
    }).trim();
    console.log(`Found PR_NUMBER: ${PR_NUMBER}`);
  } catch {
    console.warn("Failed to find PR_NUMBER using gh cli.");
  }
}

if (!GEMINI_API_KEY) {
  console.log("GEMINI_API_KEY not set, skipping review.");
  process.exit(0);
}

if (!PR_NUMBER) {
  console.log("PR_NUMBER not set and could not be found, skipping review.");
  process.exit(0);
}

// Ensure diff.txt exists, or generate it
let diff = "";
if (existsSync("diff.txt")) {
  diff = readFileSync("diff.txt", "utf-8");
} else {
  try {
    console.log("diff.txt not found, generating diff from git...");
    // Attempt to get diff between base branch and current HEAD
    const baseBranch = process.env.BASE_BRANCH || "main";
    diff = execSync(
      `git diff origin/${baseBranch}...HEAD -- '*.js' '*.jsx' '*.ts' '*.tsx'`,
      {
        encoding: "utf-8",
      },
    );
  } catch (e) {
    console.error("Failed to generate diff from git:", e.message);
  }
}

if (!diff || !diff.trim()) {
  console.log("Empty diff, skipping review.");
  process.exit(0);
}

const MAX_CHARS = 30_000; // Reduced from 100,000 for Free Tier TPM stability
if (diff.length > 3000) {
  console.log(`Current diff size: ${diff.length} characters (Max: ${MAX_CHARS})`);
}
const truncatedDiff =
  diff.length > MAX_CHARS ? diff.substring(0, MAX_CHARS) + "\n...(truncated)..." : diff;

// Read CLAUDE.md for project conventions
let conventions = "";
try {
  conventions = readFileSync("CLAUDE.md", "utf-8");
} catch {
  console.warn("CLAUDE.md not found, proceeding without conventions context.");
}

// Parse unified diff to build (filePath, newLineNumber) → diffPosition mapping.
// GitHub PR Review inline comments require diff position, not raw line numbers.
function parseDiffPositions(diffText) {
  const positions = {}; // { [filePath]: { [lineNumber]: position } }
  let currentFile = null;
  let diffPosition = 0;
  let newLineNumber = 0;

  for (const line of diffText.split("\n")) {
    if (line.startsWith("diff --git")) {
      currentFile = null;
      diffPosition = 0;
      newLineNumber = 0;
      continue;
    }

    if (line.startsWith("+++ b/")) {
      currentFile = line.slice(6);
      diffPosition = 0;
      newLineNumber = 0;
      if (!positions[currentFile]) positions[currentFile] = {};
      continue;
    }

    if (!currentFile) continue;

    // Skip diff metadata lines (no position increment)
    if (
      line.startsWith("--- ") ||
      line.startsWith("index ") ||
      line.startsWith("new file") ||
      line.startsWith("deleted file") ||
      line.startsWith("Binary")
    ) {
      continue;
    }

    if (line.startsWith("@@")) {
      // Hunk header: @@ -old,count +newStart,count @@
      // The hunk header itself counts as position 1 of the hunk
      const match = line.match(/\+(\d+)/);
      if (match) newLineNumber = parseInt(match[1]) - 1;
      diffPosition++;
      continue;
    }

    if (line.startsWith("+")) {
      diffPosition++;
      newLineNumber++;
      positions[currentFile][newLineNumber] = diffPosition;
    } else if (line.startsWith("-")) {
      diffPosition++;
      // Removed lines don't advance new file line numbers
    } else {
      // Context line
      diffPosition++;
      newLineNumber++;
    }
  }

  return positions;
}

const positionMap = parseDiffPositions(diff);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini() {
  const systemInstruction = `너는 시니어 코드 리뷰어야. 다음 우선순위로 코드를 리뷰해줘.

**우선순위 1 — 일반 코드 품질 (중점):**
- 버그, 로직 오류, null/undefined 참조
- 보안 취약점 (XSS, SQL injection, 인증/인가 문제, 민감 정보 노출 등)
- 성능 이슈 (불필요한 리렌더링, N+1 쿼리, 메모리 누수 등)
- 타입 안전성 문제

**우선순위 2 — 프로젝트 컨벤션:**
${conventions || "(컨벤션 정보 없음)"}

**규칙:**
- 실제 문제가 있는 코드만 지적해. 개인 취향 차이는 제외.
- 인라인 코멘트는 diff에서 추가된 라인(+로 시작)만 대상으로 해.
- 응답은 반드시 JSON만. 다른 텍스트 절대 포함 금지.`;

  const prompt = `아래 git diff를 리뷰하고, 다음 JSON 스키마로만 응답해:

{
  "summary": "전체 리뷰 요약 (마크다운 형식, 한국어)",
  "inline_comments": [
    {
      "path": "파일 상대 경로",
      "line": 새_파일_줄_번호,
      "body": "코멘트 내용 (한국어)",
      "severity": "error" | "warning" | "suggestion"
    }
  ]
}

inline_comments가 없으면 빈 배열 [].

Diff:
${truncatedDiff}`;

  const maxRetries = 5;
  const initialDelay = 35000; // 35 seconds for Free Tier RPM (2)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        },
      );

      if (response.status === 429) {
        if (attempt === maxRetries) {
          throw new Error("Gemini API Error: 429 Too Many Requests (Max retries reached)");
        }
        const delay = initialDelay * Math.pow(1.5, attempt - 1);
        console.warn(
          `[Attempt ${attempt}/${maxRetries}] ⚠️ Rate limit (429) hit. Waiting ${Math.round(delay / 1000)}s...`,
        );
        await sleep(delay);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error("No response from Gemini");

      return JSON.parse(text);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.error(`[Attempt ${attempt}/${maxRetries}] ❌ Error: ${error.message}`);
      await sleep(5000 * attempt); // Short delay for other errors
    }
  }
}

async function postGithubReview(summary, inlineComments) {
  const [owner, repo] = REPO.split("/");

  const severityEmoji = { error: "🔴", warning: "🟡", suggestion: "💡" };

  const reviewComments = inlineComments
    .map((comment) => {
      const position = positionMap[comment.path]?.[comment.line];
      if (!position) return null; // Line not in diff, skip

      return {
        path: comment.path,
        position,
        body: `${severityEmoji[comment.severity] ?? "💬"} **${comment.severity.toUpperCase()}**\n\n${comment.body}`,
      };
    })
    .filter(Boolean);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${PR_NUMBER}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        body: `## 🤖 AI 코드 리뷰\n\n${summary}`,
        event: "COMMENT",
        comments: reviewComments,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub Review API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function postFallbackComment(summary) {
  const [owner, repo] = REPO.split("/");

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        body: `## 🤖 AI 코드 리뷰\n\n${summary}\n\n> ⚠️ 인라인 코멘트 게시 중 오류가 발생해 전체 요약만 표시됩니다.`,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub Comment API Error: ${response.status}`);
  }
}

// Main
try {
  console.log(`Calling Gemini (${GEMINI_MODEL}) for code review...`);
  const review = await callGemini();

  const inlineCount = review.inline_comments?.length ?? 0;
  console.log(`Review complete: ${inlineCount} inline comments`);

  try {
    await postGithubReview(review.summary, review.inline_comments ?? []);
    console.log("Review posted successfully.");
  } catch (reviewError) {
    console.warn("Inline review failed, falling back to comment:", reviewError.message);
    await postFallbackComment(review.summary);
    console.log("Fallback comment posted.");
  }
} catch (error) {
  console.error("Review failed:", error);
  process.exit(1);
}
