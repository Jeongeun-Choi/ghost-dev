import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ ticketId: string }>;
}

const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "FAILED"]).optional(),
  priority: z.number().int().optional(),
  base_branch: z.string().optional(),
  branch_prefix: z.string().optional(),
  target_workspace: z.string().nullable().optional(),
});

async function verifyTicketOwnership(ticketId: string, userId: string) {
  const supabase = await createClient();
  // ghostdev_tickets → ghostdev_repos → user_id 소유권 확인
  const { data } = await supabase
    .from("ghostdev_tickets")
    .select("id, ghostdev_repos!inner(user_id)")
    .eq("id", ticketId)
    .eq("ghostdev_repos.user_id", userId)
    .single();
  return data;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { ticketId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateTicketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ticket = await verifyTicketOwnership(ticketId, user.id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const { data: updated } = await supabase
    .from("ghostdev_tickets")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .select()
    .single();

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { ticketId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await verifyTicketOwnership(ticketId, user.id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  await supabase.from("ghostdev_tickets").delete().eq("id", ticketId);
  return new NextResponse(null, { status: 204 });
}
