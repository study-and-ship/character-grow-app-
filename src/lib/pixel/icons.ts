/** 픽셀 아이콘 정의 (그리드 g + 색상맵 c) */
export interface PixelIcon {
  g: string[];
  c: Record<string, string>;
}

export const ICONS: Record<string, PixelIcon> = {"fire":{"g":["...X....","..XX....","..XXX...",".XXoXX..","XXooXXX.","XXoooXX.","XXooXXX.",".XXXXX.."],"c":{"X":"#ff8c3c","o":"#ffd23f"}},"book":{"g":[".XXXX.XXXX.","XwwwwXwwwwX","Xw--wXw--wX","XwwwwXwwwwX","Xw--wXw--wX","XwwwwXwwwwX","Xw--wXw--wX",".XXXXXXXXX."],"c":{"X":"#6fae84","w":"#ffffff","-":"#bfe0cb"}},"star":{"g":["....X....","....X....","...XXX...","XXXXXXXXX",".XXXXXXX.","..XXXXX..","..XX.XX..",".XX...XX."],"c":{"X":"#ffce3a"}},"home":{"g":["....X....","...XXX...","..XXXXX..",".XXXXXXX.","XXXXXXXXX",".XX...XX.",".XX.o.XX.",".XX.o.XX."],"c":{"X":"#e0894f","o":"#fff3e6"}},"shop":{"g":["..X...X..","..X...X..",".XXXXXXX.",".XoXXXoX.",".XXXXXXX.",".XXXXXXX.",".XXXXXXX.",".XXXXXXX."],"c":{"X":"#6fae84","o":"#eafaef"}},"coin":{"g":["..XXXX..",".XXXXXX.","XXoXXoXX","XXoXXoXX","XXoXXoXX","XXoXXoXX",".XXXXXX.","..XXXX.."],"c":{"X":"#ffce3a","o":"#e0a000"}},"empty":{"g":[".X.....X.","XXX...XXX",".XXXXXXX.",".X.....X.",".X.....X.",".X.....X.",".XXXXXXX."],"c":{"X":"#c3b6a3"}}};

/** 이펙트용 단색 픽셀 모양 */
export const HEART_PX: string[] = ["........",".XX..XX.","XXXXXXXX","XXXXXXXX",".XXXXXX.","..XXXX..","...XX...","........"];
export const NOTE_PX: string[] = ["..XX","..X.","..X.","XXX.","XXX."];
export const EXCL_PX: string[] = ["X.X.X","X.X.X","X.X.X","X.X.X",".....","X.X.X"];
export const Z_PX: string[] = ["XXXXX","...X.","..X..",".X...","XXXXX"];
