import { requireUser } from "@/lib/api/auth";
import { queryErrorResponse } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import type { UserMeData } from "@/interface/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("id, nickname")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (error) return queryErrorResponse(error, "get current user");

  const data: UserMeData = profile
    ? { initialized: true, profile }
    : { initialized: false, profile: null };

  return ok(data);
}
