import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ title: z.string().min(1) });

const fallbackSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const prompt = (title: string) =>
  `You are a git branch name generator. Your output must contain ONLY lowercase English letters (a-z) and hyphens (-). No Korean, no Japanese, no special characters, no spaces.

Rules:
- Translate ALL non-English words to English first
- Summarize the meaning into 2-4 words
- Output format: kebab-case (e.g. add-user-auth, fix-login-bug)
- Return ONLY the slug, nothing else

Example:
Input: "pin-plate에서 ghostdev 잘 되는지 테스트중"
Output: test-ghostdev-integration

Title: "${title}"`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt(parsed.data.title) }] }],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const slug =
      text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || fallbackSlug(parsed.data.title);

    return NextResponse.json({ slug });
  } catch {
    const fallback = fallbackSlug(parsed.data.title);
    return NextResponse.json({ slug: fallback });
  }
}
