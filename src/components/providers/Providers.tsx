"use client";

import { GameProvider } from "@/context/GameContext";
import PhoneFrame from "@/components/layout/PhoneFrame";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      <PhoneFrame>{children}</PhoneFrame>
    </GameProvider>
  );
}
