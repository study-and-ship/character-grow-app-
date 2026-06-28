"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/pixel/Icon";
import styles from "./BottomNav.module.scss";

const TABS = [
  { href: "/home", icon: "home", label: "홈" },
  { href: "/shop", icon: "shop", label: "상점" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={pathname === tab.href ? styles.on : undefined}
        >
          <span className={styles.nico}>
            <Icon name={tab.icon} size={24} />
          </span>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
