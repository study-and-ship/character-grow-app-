"use client";

import { useGame } from "@/context/GameContext";
import type { Accessory, EggAccessory } from "@/types/game";
import { ACCS } from "@/lib/pixel/accessories";
import { EGG_ACCS } from "@/lib/pixel/egg";
import Icon from "@/components/pixel/Icon";
import EggSprite from "@/components/pixel/EggSprite";
import PetSprite from "@/components/pixel/PetSprite";
import BottomNav from "@/components/layout/BottomNav";
import styles from "./page.module.scss";

const PET_TABS = [
  { key: "hat", label: "모자" },
  { key: "glasses", label: "안경" },
] as const;

const EGG_TABS = [
  { key: "pattern", label: "무늬" },
  { key: "hat", label: "모자" },
  { key: "nest", label: "둥지" },
] as const;

function ItemCard({
  itemKey,
  item,
  owned,
  equipped,
  preview,
}: {
  itemKey: string;
  item: Accessory | EggAccessory;
  owned: boolean;
  equipped: boolean;
  preview: React.ReactNode;
}) {
  const g = useGame();
  const cardClass = [styles.item, equipped && styles.equipped, owned && !equipped && styles.owned]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className={styles.preview}>{preview}</div>
      <div className={styles.nm}>{item.name}</div>
      <div className={styles.price}>
        {owned ? (
          <span className={styles.ownedTag}>보유중</span>
        ) : (
          <><Icon name="coin" size={16} /> {item.price}</>
        )}
      </div>
      {!owned ? (
        <button className={styles.minibtn} disabled={g.coins < item.price} onClick={() => g.buy(itemKey)}>
          구매
        </button>
      ) : (
        <button className={`${styles.minibtn} ${equipped ? styles.sec : ""}`} onClick={() => g.equip(itemKey)}>
          {equipped ? "착용 해제" : "착용하기"}
        </button>
      )}
    </div>
  );
}

function PetShop() {
  const g = useGame();
  const items = Object.entries(ACCS).filter(([, v]) => v.slot === g.shopTab);

  return (
    <>
      <div className={styles.topbar}>
        <b className={styles.heading}>상점</b>
        <span className={`${styles.pill} ${styles.coin}`}><Icon name="coin" size={18} /> {g.coins}</span>
      </div>
      <div className={styles.tabs}>
        {PET_TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${g.shopTab === t.key ? styles.on : ""}`}
            onClick={() => g.setShopTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {items.map(([key, item]) => (
          <ItemCard
            key={key}
            itemKey={key}
            item={item}
            owned={!!g.owned[key]}
            equipped={g.equipped[item.slot] === key}
            preview={
              <PetSprite
                pet={g.pet}
                state="idle"
                size={56}
                animate={false}
                equipped={{
                  hat: item.slot === "hat" ? key : null,
                  glasses: item.slot === "glasses" ? key : null,
                }}
              />
            }
          />
        ))}
      </div>
      <div className={styles.note}>
        <span className={styles.label}>더 열심히 공부하면 코인을 모을 수 있어요! 정답마다 코인 20</span>
      </div>
      <div className={styles.grow} />
      <BottomNav />
    </>
  );
}

function EggShop() {
  const g = useGame();
  const items = Object.entries(EGG_ACCS).filter(([, v]) => v.slot === g.eggTab);

  return (
    <>
      <div className={styles.topbar}>
        <b className={styles.heading}>상점</b>
        <span className={`${styles.pill} ${styles.coin}`}><Icon name="coin" size={18} /> {g.coins}</span>
      </div>
      <div className={`${styles.note} ${styles.eggNote}`}>
        <span className={styles.label}>아직 알이에요! 알을 꾸며보세요. 부화하면 더 많은 펫 아이템이 열려요</span>
      </div>
      <div className={styles.tabs}>
        {EGG_TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${g.eggTab === t.key ? styles.on : ""}`}
            onClick={() => g.setEggTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {items.map(([key, item]) => (
          <ItemCard
            key={key}
            itemKey={key}
            item={item}
            owned={!!g.owned[key]}
            equipped={g.eggEquip[item.slot] === key}
            preview={
              <EggSprite
                size={item.slot === "hat" ? 46 : 50}
                animate={false}
                equip={{
                  pattern: item.slot === "pattern" ? key : null,
                  hat: item.slot === "hat" ? key : null,
                  nest: item.slot === "nest" ? key : null,
                }}
              />
            }
          />
        ))}
      </div>
      <div className={`${styles.note} ${styles.lockNote}`}>
        <span className={styles.label}>펫 전용 아이템은 부화 후 오픈돼요</span>
      </div>
      <div className={styles.grow} />
      <BottomNav />
    </>
  );
}

export default function ShopPage() {
  const { hatched } = useGame();
  return hatched ? <PetShop /> : <EggShop />;
}
