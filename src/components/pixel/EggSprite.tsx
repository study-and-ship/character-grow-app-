import type { EggEquip } from "@/types/game";
import { EGG_PX, EGG_PAL, EGG_ACCS, EGGACC_PAL, eggDims } from "@/lib/pixel/egg";
import { gridRects, coordRects, type Rect } from "@/lib/pixel/render";
import styles from "./pixel.module.scss";

interface EggSpriteProps {
  size: number;
  equip?: EggEquip | null;
  /** 물음표 표시 여부 (시작 화면에서만 true) */
  withQuestion?: boolean;
  /** 흔들림 애니메이션 (상점 미리보기에서는 false) */
  animate?: boolean;
}

/** 알 + 꾸미기(무늬·둥지는 알과 함께, 모자는 맨 위) 렌더 */
export default function EggSprite({ size, equip, withQuestion = false, animate = true }: EggSpriteProps) {
  const { lift, rows, cols, height } = eggDims(size, equip);

  const rects: Rect[] = gridRects(
    EGG_PX,
    (ch) => (ch === "Q" ? (withQuestion ? EGG_PAL.Q : EGG_PAL.W) : EGG_PAL[ch]),
    lift,
  );

  if (equip) {
    // 둥지·무늬는 알과 같은 높이로 내려옴
    (["nest", "pattern"] as const).forEach((slot) => {
      const item = equip[slot] && EGG_ACCS[equip[slot] as string];
      if (item) rects.push(...coordRects(item.px, EGGACC_PAL, lift));
    });
    // 모자는 알 꼭대기(오프셋 없음)에 얹힘
    const hat = equip.hat && EGG_ACCS[equip.hat];
    if (hat) rects.push(...coordRects(hat.px, EGGACC_PAL, 0));
  }

  return (
    <div className={styles.wrap} style={{ width: size, height }}>
      <div className={animate ? styles.eggWobble : undefined}>
        <svg
          viewBox={`0 0 ${cols} ${rows}`}
          width={size}
          height={(size * rows) / cols}
          shapeRendering="crispEdges"
          style={{ overflow: "visible" }}
        >
          {rects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={1.04} height={1.04} fill={r.fill} />
          ))}
        </svg>
      </div>
    </div>
  );
}
