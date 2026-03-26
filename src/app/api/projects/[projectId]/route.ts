import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase
    .from("ghostdev_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  return new NextResponse(null, { status: 204 });
}
