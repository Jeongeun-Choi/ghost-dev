import { Octokit } from "@octokit/rest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptToken } from "./token-crypto";

export function createOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

/**
 * session.provider_token 우선 사용, 없으면 DB의 암호화된 토큰으로 fallback
 */
export async function getGitHubToken(
  supabase: SupabaseClient,
  providerToken: string | null | undefined,
): Promise<string | null> {
  if (providerToken) return providerToken;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("ghostdev_users")
    .select("github_access_token")
    .eq("id", user.id)
    .single();

  if (!data?.github_access_token) return null;

  try {
    return decryptToken(data.github_access_token);
  } catch {
    return null;
  }
}
