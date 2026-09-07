"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";

const HIDDEN_PATHS = new Set(["/quiz", "/result", "/topic", "/ranking", "/record"]);

export default function GameNavigation() {
  const pathname = usePathname();
  return HIDDEN_PATHS.has(pathname) ? null : <BottomNav />;
}
