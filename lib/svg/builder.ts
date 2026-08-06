// lib/svg/builder.ts — bangun SVG dari setting + data
//
// Rendering teks: prefer vector <path> (opentype.js) karena resvg di
// Vercel serverless tidak me-render data-URI @font-face dengan konsisten.
// Fallback ke <text> kalau font tidak tersedia.

import type { ElementSetting, Segment } from "@/lib/cert-types";
import { CANVAS_H, CANVAS_W, MAX_LINE_WIDTH } from "../constants";
import { autoShrink, segmentsOverflow } from "./measure";
import { textToPath } from "./paths";
import { hasBundleFonts } from "./fonts";

export interface BuildSvgInput {
  /** URL template (bisa data-url / http) atau null */
  templateUrl: string | null;
  templateWidth: number;
  templateHeight: number;
  elements: Record<string, ElementSetting>;
  /** resolver VAR_* → teks final per elemen */
  resolveSegments: (elementKey: string) => Segment[];
}

/**
 * Build SVG string + metadata ukuran teks.
 * Semua elemen diposisikan di kanvas templateWidth x templateHeight
 * (default 2000x1414), text-anchor=middle (via path offset).
 */
export function buildSvg(input: BuildSvgInput): { svg: string; width: number; height: number; overflows: string[] } {
  const { templateUrl, templateWidth, templateHeight, elements, resolveSegments } = input;
  const W = templateWidth || CANVAS_W;
  const H = templateHeight || CANVAS_H;
  const overflows: string[] = [];

  // apakah bundle font tersedia? (untuk pilih rendering path vs text)
  const fontsOk = hasBundleFonts();

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  parts.push(`<rect width="100%" height="100%" fill="#ffffff"/>`);

  if (templateUrl) {
    parts.push(`<image href="${templateUrl}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`);
  }

  for (const [key, el] of Object.entries(elements)) {
    const segments = resolveSegments(key);
    if (!segments.length) continue;

    // auto-shrink kalau flag aktif (khusus nama panjang)
    let size = el.size;
    if (el.auto_shrink) {
      const result = autoShrink(segments, el.size, MAX_LINE_WIDTH, el.min_size ?? 8);
      size = result.size;
      if (result.overflow) overflows.push(key);
    }

    // ukur total lebar (buat center offset per segmen)
    const totalWidth = segments.reduce(
      (acc, s) => acc + (fontsOk ? measureWidthSafe(s.text, s.font, size) : s.text.length * size * 0.55),
      0
    );
    let cursorX = el.x - totalWidth / 2;

    const rendered = segments.map((s) => {
      if (fontsOk) {
        const p = textToPath(s.text, s.font, cursorX + measureWidthSafe(s.text, s.font, size) / 2, el.y, size);
        if (p) {
          cursorX += p.width;
          return `<path d="${p.d}" fill="${el.color}"/>`;
        }
      }
      // fallback: <text> biasa
      const frag = `<text x="${cursorX + s.text.length * size * 0.55 / 2}" y="${el.y}" text-anchor="middle" font-size="${size}" fill="${el.color}" font-family="sans-serif">${escapeXml(s.text)}</text>`;
      cursorX += s.text.length * size * 0.55;
      return frag;
    });

    parts.push(`<g>${rendered.join("")}</g>`);
  }

  parts.push(`</svg>`);
  return { svg: parts.join(""), width: W, height: H, overflows };
}

function measureWidthSafe(text: string, fontKey: string, size: number): number {
  // import langsung biar ngga circular
  const { measureTextWidth } = require("./measure");
  return measureTextWidth(text, fontKey, size);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
