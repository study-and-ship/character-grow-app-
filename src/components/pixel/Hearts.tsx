import { HEART_PX } from "@/lib/pixel/icons";
import { gridRects } from "@/lib/pixel/render";
import { MAX_HEARTS } from "@/lib/data";

function Heart({ size, filled }: { size: number; filled: boolean }) {
  const rects = gridRects(HEART_PX, (ch) =>
    ch === "X" ? (filled ? "#ff7eb3" : "#e6dccd") : null,
  );
  return (
    <svg
      viewBox="0 0 8 8"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ verticalAlign: "middle", margin: "0 1px" }}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={1.04} height={1.04} fill={r.fill} />
      ))}
    </svg>
  );
}

/** 남은 목숨 하트 줄 */
export default function Hearts({ hearts, size = 20 }: { hearts: number; size?: number }) {
  return (
    <span>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <Heart key={i} size={size} filled={i < hearts} />
      ))}
    </span>
  );
}
