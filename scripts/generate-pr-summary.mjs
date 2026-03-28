import { execSync } from "child_process";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";

if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set.");
  process.exit(1);
}

// 1. Get Git Diff
try {
  // Limit diff to avoid token limits. Gemini 1.5 Flash has a large context window, but we still handle huge diffs gracefully.
  // excluding lock files and minified files
  const diff = execSync(
    "git diff origin/main..HEAD -- . ':!pnpm-lock.yaml' ':!*.min.js' ':!*.svg'",
  ).toString();

  if (!diff.trim()) {
    console.log("No changes detected.");
    process.exit(0);
  }

  // Truncate if extremely large (e.g., > 100k chars) just to be safe and fast
  const MAX_CHARS = 100000;
  const truncatedDiff =
    diff.length > MAX_CHARS ? diff.substring(0, MAX_CHARS) + "\n...(truncated)..." : diff;

  generateSummary(truncatedDiff);
} catch (error) {
  console.error("Failed to get git diff:", error);
  process.exit(1);
}

async function generateSummary(diffData) {
  const prompt = `
You are a skilled senior software engineer.
The following is a git diff of a Pull Request.
Please summarize the changes in a clear, concise manner using Markdown.
**IMPORTANT: Please write the response in Korean (한국어).**

Format:
## ✨ 요약
(A one-line high-level summary in Korean)

## 🔑 주요 변경 사항
- (Bullet points of specific important changes in Korean)

## 🛠️ 구현 세부 사항
(Optional: meaningful technical details if any in Korean)

Diff:
${diffData}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Gemini response structure
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw new Error("No summary returned from Gemini API");
    }

    const cleanSummary = summary.trim();

    // Output to stdout so it can be captured
    console.log(cleanSummary);
  } catch (error) {
    console.error("Failed to generate summary:", error);
    process.exit(1);
  }
}
