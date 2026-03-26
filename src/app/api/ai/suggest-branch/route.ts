import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const schema = z.object({ directives: z.string().min(1).max(2000) });

const sanitizeSlug = (raw: string): string =>
  raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "unnamed-task";

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ slug: "unnamed-task" });

  try {
    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5"),
      prompt: `Generate a 2-4 word kebab-case git branch slug for this task:
"${parsed.data.directives}"
Return only the slug, nothing else. No quotes, no explanation.`,
    });
    return NextResponse.json({ slug: sanitizeSlug(text) });
  } catch {
    return NextResponse.json({ slug: "unnamed-task" });
  }
}
