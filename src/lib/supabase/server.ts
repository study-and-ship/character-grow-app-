import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase 환경변수가 없습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 설정하세요."
  );
}

/**
 * 서버(Route Handler)용 Supabase 클라이언트.
 * publishable key 를 사용하므로 RLS 정책의 통제를 받는다(읽기 위주 설계).
 * 세션을 브라우저처럼 유지할 필요가 없으므로 persistSession 을 끈다.
 *
 * 관리자 권한(RLS 우회)이 필요해지면 secret key(sb_secret_...)용 클라이언트를
 * 여기에 별도로 추가한다. secret key 는 절대 NEXT_PUBLIC_ 접두사로 두지 않는다.
 */
export const supabaseServer = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
