/** 픽셀 → SVG rect 변환 공용 유틸. 모든 스프라이트가 이 헬퍼만 사용한다. */
export interface Rect {
  x: number;
  y: number;
  fill: string;
}

type ColorResolver = (ch: string) => string | null | undefined;

/** 문자 그리드를 색칠 가능한 셀만 골라 rect 목록으로 변환 */
export function gridRects(
  grid: string[],
  resolve: ColorResolver,
  offsetY = 0,
): Rect[] {
  const rects: Rect[] = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const fill = resolve(row[x]);
      if (fill) rects.push({ x, y: y + offsetY, fill });
    }
  }
  return rects;
}

/** 좌표 기반 픽셀([y, x, char])을 rect 목록으로 변환 (액세서리 오버레이용) */
export function coordRects(
  px: [number, number, string][],
  palette: Record<string, string>,
  offsetY = 0,
): Rect[] {
  const rects: Rect[] = [];
  for (const [y, x, ch] of px) {
    const fill = palette[ch];
    if (fill) rects.push({ x, y: y + offsetY, fill });
  }
  return rects;
}

/** 그리드 최대 가로 길이 */
export const gridWidth = (grid: string[]) =>
  grid.reduce((w, row) => Math.max(w, row.length), 0);
