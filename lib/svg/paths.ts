// lib/svg/paths.ts — konversi teks → SVG <path> via opentype.js
//
// Kenapa path, bukan <text>+@font-face:
// resvg di Vercel serverless TIDAK me-render data-URI @font-face dengan
// konsisten (lokal iya, production tidak — PNG jadi fallback font).
// Teks sebagai vector path = identik di mana pun, ngga butuh font system.
// Bonus: hasil crisp di semua scale, preview === export.

import { loadFont } from "./fonts";
import { measureTextWidth } from "./measure";

export interface TextToPathResult {
  d: string;
  width: number;
  size: number;
  ok: boolean;
}

/**
 * Konversi teks ke SVG path data, center di x, baseline di y.
 * Returns null kalau font tidak tersedia (fallback ke <text>).
 */
export function textToPath(
  text: string,
  fontKey: string,
  x: number,
  y: number,
  size: number
): TextToPathResult | null {
  const entry = loadFont(fontKey);
  if (!entry) return null;

  const width = measureTextWidth(text, fontKey, size);
  // text-anchor=middle → offset setengah lebar
  const startX = x - width / 2;

  // opentype path: (text, x, y, fontSize, options?)
  const opPath = entry.font.getPath(text, startX, y, size);
  const d = opPath.toPathData(2); // 2 decimal places

  return { d, width, size, ok: true };
}
