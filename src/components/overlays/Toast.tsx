"use client";

import { useEffect } from "react";
import { useGame } from "@/context/GameContext";
import styles from "./overlays.module.scss";

const TOAST_MS = 1400;

export default function Toast() {
  const { toast, clearToast } = useGame();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, TOAST_MS);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  return <div className={styles.toast}>{toast}</div>;
}
