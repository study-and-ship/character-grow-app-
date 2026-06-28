import { ICONS } from "@/lib/pixel/icons";
import { gridRects, gridWidth } from "@/lib/pixel/render";

interface IconProps {
  name: keyof typeof ICONS | string;
  size: number;
}

/** 픽셀 아이콘 (fire, book, star, home, shop, coin, empty) */
export default function Icon({ name, size }: IconProps) {
  const def = ICONS[name];
  if (!def) return null;

  const rows = def.g.length;
  const cols = gridWidth(def.g);
  const rects = gridRects(def.g, (ch) => def.c[ch]);

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={size}
      height={(size * rows) / cols}
      shapeRendering="crispEdges"
      style={{ verticalAlign: "middle" }}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={1.04} height={1.04} fill={r.fill} />
      ))}
    </svg>
  );
}
