import { createClient } from "@/lib/supabase/server";
import { TopNav } from "./TopNav";

export async function TopNavLoader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: ghostUser } = await supabase
    .from("ghostdev_users")
    .select("github_login, avatar_url")
    .eq("id", user!.id)
    .single();

  return (
    <TopNav
      userLogin={ghostUser?.github_login}
      userAvatar={ghostUser?.avatar_url ?? undefined}
    />
  );
}
