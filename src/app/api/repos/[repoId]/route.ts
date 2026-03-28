import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ repoId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { repoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase
    .from("ghostdev_repos")
    .delete()
    .eq("id", repoId)
    .eq("user_id", user.id);

  return new NextResponse(null, { status: 204 });
}
