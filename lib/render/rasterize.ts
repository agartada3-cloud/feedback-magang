// lib/render/rasterize.ts — SVG → PNG via resvg-js

import { Resvg } from "@resvg/resvg-js";

export interface RasterizeOptions {
  /** fitTo width target = canvasWidth * scale */
  scale: 1 | 2 | 3;
  canvasWidth: number;
  background?: string;
}

/**
 * Render SVG string → PNG Buffer.
 * font-size sudah dalam unit kanvas → tidak perlu skala font,
 * cukup render pada width = canvasWidth * scale.
 */
export function rasterize(svg: string, { scale, canvasWidth, background = "#ffffff" }: RasterizeOptions): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: canvasWidth * scale },
    background,
  });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}

/** Nama path di bucket `hasil` — relative (tanpa prefix bucket) */
export function storagePathFor(templateId: string, feedbackId: string, scale: number): string {
  return `${templateId}/${feedbackId}_${scale}x.png`;
}
