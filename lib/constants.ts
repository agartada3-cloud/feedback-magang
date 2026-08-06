// lib/constants.ts — default elements, font bundle, warna

import type { ElementSetting } from "@/lib/cert-types";

export const CANVAS_W = 2000;
export const CANVAS_H = 1414;
export const MAX_LINE_WIDTH = 1650;
export const MIN_SHRINK = 8;

export const FONT_KEYS = {
  "glacial-bold": { family: "GlacialIndifference-Bold", file: "glacial-bold.otf", weight: "bold" },
  "opensauce-bold": { family: "OpenSauceSans-Bold", file: "opensauce-bold.ttf", weight: "bold" },
  "opensauce-regular": { family: "OpenSauceSans-Regular", file: "opensauce-regular.ttf", weight: "normal" },
} as const;

export type FontKey = keyof typeof FONT_KEYS;

/** Default elements — posisi disesuaikan template A4 2000x1414 final */
export const DEFAULT_ELEMENTS: Record<string, ElementSetting> = {
  nama: {
    x: CANVAS_W / 2, y: 545, size: 150, color: "#CF3424",
    font: "glacial-bold", auto_shrink: true, min_size: 30,
  },
  program: {
    x: CANVAS_W / 2, y: 750, size: 68, color: "#151613",
    font: "opensauce-bold", auto_shrink: true, min_size: 24,
  },
  perusahaan: {
    x: CANVAS_W / 2, y: 828, size: 56, color: "#151613",
    font: "opensauce-bold", auto_shrink: true, min_size: 24,
  },
  bagian: {
    x: CANVAS_W / 2, y: 896, size: 52, color: "#161714",
    font: "opensauce-bold", auto_shrink: true, min_size: 22,
  },
  periode: {
    x: CANVAS_W / 2, y: 956, size: 46, color: "#161714",
    font: "opensauce-bold", auto_shrink: true, min_size: 20,
  },
  taken: {
    x: CANVAS_W / 2, y: 1080, size: 55, color: "#273152",
    font: "opensauce-bold", auto_shrink: true, min_size: 20,
  },
};

export const VAR_KEYS = [
  "VAR_NAMA",
  "VAR_PROGRAM",
  "VAR_BAGIAN",
  "VAR_SUB_BAGIAN",
  "VAR_PERIODE",
  "VAR_TGL_TAKEN",
] as const;

/** Format tanggal Indonesia: "1 Juni 2026" */
export const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
