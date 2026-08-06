// components/settings/ElementPanel.tsx — kartu setting per elemen

"use client";

import * as React from "react";
import type { ElementSetting } from "@/lib/cert-types";
import { FONT_KEYS } from "@/lib/constants";

const ELEMENT_LABELS: Record<string, string> = {
  nama: "Nama Penerima (MERAH)",
  program: "Nama Program Magang",
  perusahaan: "PT Sinergi Gula Nusantara",
  bagian: "Kalimat Bagian",
  periode: "Kalimat Periode",
  taken: "Tanggal (Lumajang)",
};

export function ElementPanel({
  elementKey,
  setting,
  onChange,
}: {
  elementKey: string;
  setting: ElementSetting;
  onChange: (s: ElementSetting) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-800">
        {ELEMENT_LABELS[elementKey] ?? elementKey}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-medium text-zinc-500">X (center)</span>
          <input
            type="number"
            value={setting.x}
            onChange={(e) => onChange({ ...setting, x: Number(e.target.value) })}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-indigo-500"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-medium text-zinc-500">Y (center)</span>
          <input
            type="number"
            value={setting.y}
            onChange={(e) => onChange({ ...setting, y: Number(e.target.value) })}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-indigo-500"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-medium text-zinc-500">Ukuran (px)</span>
          <input
            type="number"
            value={setting.size}
            onChange={(e) => onChange({ ...setting, size: Number(e.target.value) })}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-indigo-500"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-medium text-zinc-500">Warna</span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={setting.color}
              onChange={(e) => onChange({ ...setting, color: e.target.value })}
              className="h-7 w-8 cursor-pointer rounded border border-zinc-300"
            />
            <input
              type="text"
              value={setting.color}
              onChange={(e) => onChange({ ...setting, color: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-indigo-500"
            />
          </div>
        </label>
        <label className="col-span-2 block">
          <span className="mb-0.5 block text-[11px] font-medium text-zinc-500">Font</span>
          <select
            value={setting.font}
            onChange={(e) => onChange({ ...setting, font: e.target.value })}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-indigo-500"
          >
            {Object.entries(FONT_KEYS).map(([key, meta]) => (
              <option key={key} value={key}>
                {key} ({meta.file})
              </option>
            ))}
          </select>
        </label>
        {setting.auto_shrink !== undefined && (
          <label className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={setting.auto_shrink}
              onChange={(e) => onChange({ ...setting, auto_shrink: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <span className="text-xs text-zinc-600">Auto-shrink kalau kepanjangan</span>
          </label>
        )}
      </div>
    </div>
  );
}
