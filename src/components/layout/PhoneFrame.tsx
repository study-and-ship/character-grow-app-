"use client";

import Overlays from "@/components/overlays/Overlays";
import Toast from "@/components/overlays/Toast";
import styles from "./PhoneFrame.module.scss";

/** 앱 셸: 폰 프레임 + 스크롤 영역 + 전역 오버레이/토스트 */
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.phone}>
      <div className={styles.screen}>{children}</div>
      <Overlays />
      <Toast />
    </div>
  );
}
