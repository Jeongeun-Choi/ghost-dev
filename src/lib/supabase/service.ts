import { createClient } from "@supabase/supabase-js";

/**
 * Service role 클라이언트 — RLS를 우회하여 서버 간 통신에 사용.
 * 쿠키/세션 없이 동작하므로 콜백 API 등에서 사용.
 */
export function createServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
