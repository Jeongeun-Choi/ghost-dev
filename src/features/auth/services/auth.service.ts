import { createClient } from "@/lib/supabase/client";

export async function signInWithGitHub() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      // repo: 레포 읽기/쓰기, workflow: workflow_dispatch 트리거에 필수
      scopes: "repo workflow",
      redirectTo: `${location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
