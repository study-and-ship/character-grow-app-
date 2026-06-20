import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { env } from "@/lib/env";

/**
 * 서버(Route Handler)용 Supabase 클라이언트.
 * publishable key 를 사용하므로 RLS 정책의 통제를 받는다(읽기 위주 설계).
 * 세션을 브라우저처럼 유지할 필요가 없으므로 persistSession 을 끈다.
 *
 * 관리자 권한(RLS 우회)이 필요해지면 secret key(sb_secret_...)용 클라이언트를
 * 여기에 별도로 추가한다. secret key 는 절대 NEXT_PUBLIC_ 접두사로 두지 않는다.
 */
export const supabaseServer = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
