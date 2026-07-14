"use client";

import { useRouter } from "next/navigation";
import type { PetKey } from "@/types/game";
import { useGame } from "@/context/GameContext";
import { buildBoard, type RankedEntry } from "@/lib/ranking";
import Icon from "@/components/pixel/Icon";
import PetSprite from "@/components/pixel/PetSprite";
import styles from "./page.module.scss";

/** 왕관을 각 펫 머리 위에 맞춰 얹는 오프셋 (귀 높이가 펫마다 달라 별도 지정) */
const CROWN_OFFSET: Record<PetKey, string> = {
  bunny: styles.crownBunny,
  cat: styles.crownCat,
  hamster: styles.crownHamster,
};

function RankRow({ r }: { r: RankedEntry }) {
  const medal = r.rank <= 3 ? styles[`medal${r.rank}`] : "";
  return (
    <div className={`${styles.row} ${r.me ? styles.meRow : ""}`}>
      <span className={`${styles.badge} ${medal}`}>{r.rank}</span>
      <span className={styles.avatar}>
        <PetSprite pet={r.pet} state="idle" size={40} animate={false} />
      </span>
      <div className={styles.rowBody}>
        <div className={styles.rowName}>
          {r.name}
          {r.me && <span className={styles.youBadge}>나</span>}
        </div>
        <div className={styles.rowMeta}>Lv.{r.level} · 연속 {r.streak}일</div>
      </div>
      <div className={styles.rowScore}>
        <b>{r.correct}</b>개
      </div>
    </div>
  );
}

export default function RankingPage() {
  const router = useRouter();
  const g = useGame();

  const { top, mine } = buildBoard({
    id: "me",
    name: g.nick || "펫집사",
    pet: g.pet,
    level: g.level,
    correct: g.correct,
    streak: g.streak,
  });

  const [champ, ...rest] = top;
  const mineInTop = mine.rank <= 5;

  return (
    <>
      <div className={styles.topbar}>
        <button className={styles.iconbtn} onClick={() => router.push("/home")}>←</button>
        <b className={styles.heading}>랭킹</b>
        <span className={styles.metricTag}>정답 순</span>
      </div>

      <div className={`${styles.champion} ${champ.me ? styles.meChamp : ""}`}>
        <div className={styles.champHead}>
          <div className={`${styles.crown} ${CROWN_OFFSET[champ.pet]}`}>
            <Icon name="crown" size={36} />
          </div>
          <div className={styles.champPet}>
            <PetSprite pet={champ.pet} state="idle" size={92} animate={false} />
          </div>
        </div>
        <div className={styles.champName}>
          <span className={styles.champRank}>1위</span>
          {champ.name}
          {champ.me && <span className={styles.youBadge}>나</span>}
        </div>
        <div className={styles.champMeta}>Lv.{champ.level} · 연속 {champ.streak}일</div>
        <div className={styles.champScore}>
          <b>{champ.correct}</b>개 정답
        </div>
      </div>

      <div className={styles.list}>
        {rest.map((r) => (
          <RankRow key={r.id} r={r} />
        ))}
      </div>

      {!mineInTop && (
        <>
          <div className={styles.divider}><span>내 순위</span></div>
          <div className={styles.list}>
            <RankRow r={mine} />
          </div>
        </>
      )}

      <div className={styles.grow} />
    </>
  );
}
