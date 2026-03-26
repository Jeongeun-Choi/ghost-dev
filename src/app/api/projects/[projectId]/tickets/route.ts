import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 프로젝트 소유권 확인
  const { data: project } = await supabase
    .from("ghostdev_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data } = await supabase
    .from("ghostdev_tickets")
    .select("*")
    .eq("project_id", projectId)
    .order("priority");

  return NextResponse.json(data ?? []);
}
