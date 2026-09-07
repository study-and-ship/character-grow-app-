import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GameNavigation from "./_components/GameNavigation";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  return (
    <>
      {children}
      <GameNavigation />
    </>
  );
}
