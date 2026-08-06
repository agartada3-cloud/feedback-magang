// lib/svg/measure.ts — ukur lebar teks via opentype.js advance width

import { loadFont } from "./fonts";

/**
 * Ukur lebar teks (px, kanvas 2000) — pakai font size tertentu.
 * Fallback: estimasi kasar (0.55 * size * chars) kalau font belum ada.
 */
export function measureTextWidth(text: string, fontKey: string, size: number): number {
  const entry = loadFont(fontKey);
  if (entry) {
    const scale = size / entry.font.unitsPerEm;
    let width = 0;
    for (const ch of text) {
      const glyph = entry.font.charToGlyph(ch);
      width += (glyph.advanceWidth ?? 0) * scale;
    }
    return width;
  }
  // fallback estimasi
  return text.length * size * 0.55;
}

/** Cek overflow: total width segmen > maxWidth */
export function segmentsOverflow(
  segments: { text: string; font: string }[],
  size: number,
  maxWidth: number
): boolean {
  const total = segments.reduce((acc, s) => acc + measureTextWidth(s.text, s.font, size), 0);
  return total > maxWidth;
}

/**
 * Auto-shrink: turunkan size bertahap sampai total lebar ≤ maxWidth.
 * Returns { size, overflow }.
 */
export function autoShrink(
  segments: { text: string; font: string }[],
  startSize: number,
  maxWidth: number,
  minSize = 8
): { size: number; overflow: boolean } {
  let size = startSize;
  while (size > minSize && segmentsOverflow(segments, size, maxWidth)) {
    size -= 2;
  }
  return { size, overflow: segmentsOverflow(segments, size, maxWidth) };
}
