import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase 환경변수가 없습니다. .env 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 설정하세요."
  );
}

/**
 * 브라우저용 Supabase 클라이언트 (publishable key, sb_publishable_...).
 * 접근 제어는 Supabase RLS 정책으로 보호한다. 이 앱은 읽기 위주로 동작한다.
 */
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey);
