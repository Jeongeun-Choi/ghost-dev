import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/token-crypto";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
  }

  const { user } = data;
  const githubLogin = user.user_metadata?.user_name as string | undefined;
  const githubNodeId = user.user_metadata?.sub as string | undefined;
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  if (githubLogin && githubNodeId) {
    const providerToken = data.session.provider_token;
    await supabase.from("ghostdev_users").upsert(
      {
        id: user.id,
        github_login: githubLogin,
        github_node_id: githubNodeId,
        avatar_url: avatarUrl ?? null,
        github_access_token: providerToken ? encryptToken(providerToken) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  }

  return NextResponse.redirect(`${origin}/projects`);
}
