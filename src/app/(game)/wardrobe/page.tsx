"use client";

import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { ACCS } from "@/lib/pixel/accessories";
import { EGG_ACCS } from "@/lib/pixel/egg";
import Icon from "@/components/pixel/Icon";
import PetSprite from "@/components/pixel/PetSprite";
import EggSprite from "@/components/pixel/EggSprite";
import BottomNav from "@/components/layout/BottomNav";
import styles from "./page.module.scss";

const PET_CATS = [
  { slot: "hat", label: "모자" },
  { slot: "glasses", label: "안경" },
] as const;

const EGG_CATS = [
  { slot: "pattern", label: "무늬" },
  { slot: "hat", label: "모자" },
  { slot: "nest", label: "둥지" },
] as const;

function ItemTile({
  name,
  equipped,
  preview,
  onToggle,
}: {
  name: string;
  equipped: boolean;
  preview: React.ReactNode;
  onToggle: () => void;
}) {
  return (
    <div className={`${styles.item} ${equipped ? styles.equipped : ""}`}>
      <div className={styles.preview}>{preview}</div>
      <div className={styles.nm}>{name}</div>
      <button className={`${styles.minibtn} ${equipped ? styles.sec : ""}`} onClick={onToggle}>
        {equipped ? "착용 해제" : "착용하기"}
      </button>
    </div>
  );
}

export default function WardrobePage() {
  const router = useRouter();
  const g = useGame();

  const ownedKeys = Object.keys(g.owned).filter((k) => g.owned[k]);
  const petEntries = ownedKeys.filter((k) => ACCS[k]).map((k) => ({ key: k, item: ACCS[k] }));
  const eggEntries = ownedKeys.filter((k) => EGG_ACCS[k]).map((k) => ({ key: k, item: EGG_ACCS[k] }));
  const total = petEntries.length + eggEntries.length;

  const petCats = PET_CATS.map((c) => ({
    ...c,
    items: petEntries.filter((e) => e.item.slot === c.slot),
  })).filter((c) => c.items.length > 0);

  const eggCats = EGG_CATS.map((c) => ({
    ...c,
    items: eggEntries.filter((e) => e.item.slot === c.slot),
  })).filter((c) => c.items.length > 0);

  return (
    <>
      <div className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => router.push("/home")}>←</button>
        <b className={styles.heading}>내 옷장</b>
        <span className={`${styles.pill} ${styles.coin}`}>
          <Icon name="coin" size={18} /> {g.coins}
        </span>
      </div>

      {total === 0 ? (
        <div className={styles.empty}>
          <Icon name="shirt" size={72} />
          <p className={styles.emptyText}>
            아직 구매한 아이템이 없어요.
            <br />
            상점에서 코인으로 꾸며보세요!
          </p>
          <button className={styles.shopBtn} onClick={() => router.push("/shop")}>
            상점 가기 ▶
          </button>
        </div>
      ) : (
        <div className={styles.groups}>
          {petCats.length > 0 && (
            <section className={styles.group}>
              {petCats.map((c) => (
                <div key={`pet-${c.slot}`} className={styles.cat}>
                  <div className={styles.catHead}>
                    <span className={styles.catName}>{c.label}</span>
                  </div>
                  <div className={styles.grid}>
                    {c.items.map(({ key, item }) => (
                      <ItemTile
                        key={key}
                        name={item.name}
                        equipped={g.equipped[item.slot] === key}
                        onToggle={() => g.equip(key)}
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
                </div>
              ))}
            </section>
          )}

          {eggCats.length > 0 && (
            <section className={styles.group}>
              {eggCats.map((c) => (
                <div key={`egg-${c.slot}`} className={styles.cat}>
                  <div className={styles.catHead}>
                    <span className={styles.catName}>{c.label}</span>
                  </div>
                  <div className={styles.grid}>
                    {c.items.map(({ key, item }) => (
                      <ItemTile
                        key={key}
                        name={item.name}
                        equipped={g.eggEquip[item.slot] === key}
                        onToggle={() => g.equip(key)}
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
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      <div className={styles.grow} />
      <BottomNav />
    </>
  );
}
