import { requireUser } from "@/lib/api/auth";
import { queryErrorResponse } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import type { QuestionCategoryData } from "@/interface/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("question_categories")
    .select("id, code, name")
    .eq("is_active", true)
    .order("id");
  if (error) return queryErrorResponse(error, "get question categories");

  return ok(data satisfies QuestionCategoryData[]);
}
