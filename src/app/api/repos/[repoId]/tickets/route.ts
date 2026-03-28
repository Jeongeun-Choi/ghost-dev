import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ repoId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { repoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 레포 소유권 확인
  const { data: repo } = await supabase
    .from("ghostdev_repos")
    .select("id")
    .eq("id", repoId)
    .eq("user_id", user.id)
    .single();

  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const { data } = await supabase
    .from("ghostdev_tickets")
    .select("*")
    .eq("repo_id", repoId)
    .order("priority");

  return NextResponse.json(data ?? []);
}
