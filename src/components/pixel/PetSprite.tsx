import type { Mood, PetEquip, PetKey } from "@/types/game";
import { PETDATA, PAL } from "@/lib/pixel/pet";
import { ACCS, ACC_PAL } from "@/lib/pixel/accessories";
import { HEART_PX, NOTE_PX, EXCL_PX, Z_PX } from "@/lib/pixel/icons";
import { gridRects, gridWidth } from "@/lib/pixel/render";
import styles from "./pixel.module.scss";

const ANIM: Record<Mood, string> = {
  idle: styles.bob,
  sleepy: styles.bob,
  happy: styles.jump,
  correct: styles.cheer,
  angry: styles.shake,
  sulk: styles.bob,
};

/** 단색 이펙트 픽셀 (하트·음표·느낌표·Z) */
function Fx({ grid, fill, size }: { grid: string[]; fill: string; size: number }) {
  const cols = gridWidth(grid);
  const rects = gridRects(grid, (ch) => (ch === "X" ? fill : null));
  return (
    <svg
      viewBox={`0 0 ${cols} ${grid.length}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={1.04} height={1.04} fill={r.fill} />
      ))}
    </svg>
  );
}

/** 기분별 떠다니는 이펙트 오버레이 */
function moodEffects(state: Mood, w: number) {
  switch (state) {
    case "correct":
      return [
        { top: 0, left: w * 0.12, size: w * 0.2, grid: HEART_PX, fill: "#ff7eb3", anim: styles.floatA },
        { top: -w * 0.06, left: w * 0.44, size: w * 0.17, grid: HEART_PX, fill: "#ff7eb3", anim: styles.floatB },
        { top: w * 0.02, left: w * 0.72, size: w * 0.2, grid: HEART_PX, fill: "#ff7eb3", anim: styles.floatC },
      ];
    case "happy":
      return [
        { top: w * 0.06, left: -w * 0.04, size: w * 0.14, grid: NOTE_PX, fill: "#7c5cc8", anim: styles.floatD },
        { top: w * 0.14, left: w * 0.86, size: w * 0.11, grid: NOTE_PX, fill: "#a98be0", anim: styles.floatE },
      ];
    case "angry":
      return [{ top: 0, left: w * 0.7, size: w * 0.22, grid: EXCL_PX, fill: "#ff3d6e", anim: styles.blink }];
    case "sleepy":
      return [{ top: w * 0.04, left: w * 0.74, size: w * 0.16, grid: Z_PX, fill: "#7fa6e8", anim: styles.floatF }];
    default:
      return [];
  }
}

interface PetSpriteProps {
  pet: PetKey;
  state: Mood;
  size: number;
  equipped?: PetEquip;
  /** 모션 애니메이션 (상점 미리보기에서는 false) */
  animate?: boolean;
}

export default function PetSprite({ pet, state, size, equipped, animate = true }: PetSpriteProps) {
  const data = PETDATA[pet];
  const palette = PAL[pet];

  // 32x32 그리드: 베이스 → 표정 → 액세서리 순으로 덮어쓰기
  const grid = data.base.map((row) => row.split(""));
  (data.faces[state] ?? data.faces.idle).forEach(([r, c, ch]) => (grid[r][c] = ch));
  if (equipped) {
    (["hat", "glasses"] as const).forEach((slot) => {
      const key = equipped[slot];
      if (key && ACCS[key]) ACCS[key].px.forEach(([r, c, ch]) => (grid[r][c] = ch));
    });
  }

  const rows = grid.map((cols) => cols.join(""));
  const rects = gridRects(rows, (ch) => palette[ch] ?? ACC_PAL[ch]);
  const effects = moodEffects(state, size);

  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <div className={animate ? ANIM[state] : undefined}>
        <svg
          viewBox="0 0 32 32"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          style={{ overflow: "visible" }}
        >
          {rects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={1.02} height={1.02} fill={r.fill} />
          ))}
        </svg>
      </div>
      {effects.map((fx, i) => (
        <div key={i} className={`${styles.fx} ${fx.anim}`} style={{ top: fx.top, left: fx.left }}>
          <Fx grid={fx.grid} fill={fx.fill} size={fx.size} />
        </div>
      ))}
    </div>
  );
}
