// components/settings/CanvasPreview.tsx — preview SVG live (client-side)

"use client";

import * as React from "react";
import type { ElementSetting, Template } from "@/lib/cert-types";
import { FONT_KEYS, MAX_LINE_WIDTH } from "@/lib/constants";

const FONT_CSS: Record<string, string> = {
  "glacial-bold": "GlacialIndifference-Bold",
  "opensauce-bold": "OpenSauceSans-Bold",
  "opensauce-regular": "OpenSauceSans-Regular",
};

export function CanvasPreview({
  elements,
  template,
  data,
}: {
  elements: Record<string, ElementSetting>;
  template: Template | null;
  data: Record<string, string>;
}) {
  const W = template?.width ?? 2000;
  const H = template?.height ?? 1414;
  const tplUrl = template ? `/api/sertifikat/templates/${template.id}/image` : null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-800">Preview</h3>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100" style={{ aspectRatio: `${W}/${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <rect width="100%" height="100%" fill="#ffffff" />
          {tplUrl && <image href={tplUrl} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice" />}
          {Object.entries(elements).map(([key, el]) => {
            const text = data[key] ?? key;
            const family = FONT_CSS[el.font] ?? el.font;
            return (
              <text
                key={key}
                x={el.x}
                y={el.y}
                textAnchor="middle"
                fontSize={el.size}
                fill={el.color}
                fontFamily={family}
                style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 2 }}
              >
                {text}
              </text>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-[11px] text-zinc-400">
        Preview 1:1 kanvas {W}×{H}. Posisi = center x/y.
      </p>
    </div>
  );
}
