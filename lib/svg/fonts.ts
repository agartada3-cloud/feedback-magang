// lib/svg/fonts.ts — load font bundle (base64 embedded), parse via opentype.js
//
// Font di-embed sebagai base64 TS module (src/lib/fonts-data.ts) karena
// fs read public/ TIDAK reliable di Vercel serverless (file tracing).
// Regenerate data: node scripts/embed-fonts.mjs
//
// CATATAN: wajib opentype.js v1.3.4 — v2.0 generate path commands `N`/`a`
// yang TIDAK dikenali resvg-js → teks panjang ke-truncate.

import opentype from "opentype.js";
import type { Font as OpentypeFont } from "opentype.js";
import { FONTS_BASE64 } from "../fonts-data";
import { FONT_KEYS } from "../constants";

type FontCache = { font: OpentypeFont; base64: string; mime: string; family: string } | null;

const cache = new Map<string, FontCache>();

function mimeFor(file: string): string {
  return file.endsWith(".otf") ? "font/otf" : "font/ttf";
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = Buffer.from(b64, "base64");
  return bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength) as ArrayBuffer;
}

/** Load font bundle + base64. Returns null kalau key tidak dikenal. */
export function loadFont(key: string): FontCache {
  if (cache.has(key)) return cache.get(key)!;
  const meta = FONT_KEYS[key as keyof typeof FONT_KEYS];
  if (!meta) {
    cache.set(key, null);
    return null;
  }
  const b64 = FONTS_BASE64[meta.file];
  if (!b64) {
    cache.set(key, null);
    return null;
  }
  const font = opentype.parse(base64ToArrayBuffer(b64));
  const entry: FontCache = { font, base64: b64, mime: mimeFor(meta.file), family: meta.family };
  cache.set(key, entry);
  return entry;
}

/** Cek apakah bundle font tersedia */
export function hasBundleFonts(): boolean {
  return Object.keys(FONT_KEYS).some((k) => loadFont(k) !== null);
}

/** Build <style> @font-face dari semua font yang dipakai (base64 embed) */
export function buildFontFaceCss(fontKeys: string[]): string {
  const faces: string[] = [];
  for (const key of fontKeys) {
    const entry = loadFont(key);
    if (!entry) continue;
    faces.push(
      `@font-face{font-family:"${entry.family}";src:url(data:${entry.mime};base64,${entry.base64}) format("${entry.mime === "font/otf" ? "opentype" : "truetype"}");font-weight:normal;font-style:normal}`
    );
  }
  return faces.join("");
}
