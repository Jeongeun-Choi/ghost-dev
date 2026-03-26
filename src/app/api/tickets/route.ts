import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createTicketSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  baseBranch: z.string().optional(),
  branchPrefix: z.string().optional(),
  targetWorkspace: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(3).optional().default(2),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createTicketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // 프로젝트 소유권 확인
  const { data: project } = await supabase
    .from("ghostdev_projects")
    .select("id")
    .eq("id", parsed.data.projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: created } = await supabase
    .from("ghostdev_tickets")
    .insert({
      project_id: parsed.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      branch_prefix: parsed.data.branchPrefix ?? null,
      base_branch: parsed.data.baseBranch ?? null,
      target_workspace: parsed.data.targetWorkspace ?? null,
      priority: parsed.data.priority,
      status: "TODO",
    })
    .select()
    .single();

  return NextResponse.json(created, { status: 201 });
}
