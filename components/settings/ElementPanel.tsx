// components/settings/ElementPanel.tsx — kartu setting per elemen

"use client";

import * as React from "react";
import type { ElementSetting } from "@/lib/cert-types";
import { FONT_KEYS } from "@/lib/constants";
import { Pencil, Trash2, Check, Sparkles } from "lucide-react";

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
  sampleText,
  isSelected,
  onChange,
  onTextChange,
  onDelete,
}: {
  elementKey: string;
  setting: ElementSetting;
  sampleText?: string;
  isSelected?: boolean;
  onChange: (s: ElementSetting) => void;
  onTextChange?: (text: string) => void;
  onDelete?: () => void;
}) {
  const [editingTitle, setEditingTitle] = React.useState(false);
  const titleText = setting.label || ELEMENT_LABELS[elementKey] || elementKey;

  return (
    <div
      className={`group relative rounded-xl border p-4 transition-all duration-150 ${
        isSelected
          ? "border-indigo-500 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/30 dark:border-indigo-500 dark:bg-indigo-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      {/* Header & Top-Right Hover Action Bar */}
      <div className="mb-3 flex items-center justify-between gap-2">
        {editingTitle ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="text"
              value={setting.label ?? titleText}
              onChange={(e) => onChange({ ...setting, label: e.target.value })}
              className="h-7 w-full rounded border border-indigo-400 bg-white px-2 text-xs font-semibold text-zinc-900 outline-none dark:border-indigo-500 dark:bg-zinc-800 dark:text-zinc-100"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingTitle(false);
              }}
            />
            <button
              type="button"
              onClick={() => setEditingTitle(false)}
              className="rounded bg-indigo-600 p-1 text-white hover:bg-indigo-700"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {titleText}
            </h3>
            {isSelected && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Terpilih
              </span>
            )}
          </div>
        )}

        {/* Hover Action Bar (Top Right) */}
        {!editingTitle && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTitle(true);
              }}
              className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title="Ubah judul elemen"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {setting.auto_shrink !== undefined && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ ...setting, auto_shrink: !setting.auto_shrink });
                }}
                className={`rounded p-1 transition ${
                  setting.auto_shrink
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                }`}
                title="Toggle Auto-Shrink"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Hapus elemen "${titleText}"?`)) onDelete();
                }}
                className="rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                title="Hapus elemen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {/* Sample text editing input with Token Shortcuts */}
        {sampleText !== undefined && onTextChange && (
          <div className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Redaksi Teks & Token Dinamis
            </span>
            <input
              type="text"
              value={sampleText}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Contoh: <nama> atau pada bagian <bagian>"
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {/* Token Badge Shortcuts */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {[
                { tag: "<nama>", label: "Nama" },
                { tag: "<program>", label: "Program" },
                { tag: "<bagian>", label: "Bagian" },
                { tag: "<sub_bagian>", label: "Sub Bagian" },
                { tag: "<tgl_awal>", label: "Mulai" },
                { tag: "<tgl_akhir>", label: "Akhir" },
                { tag: "<tgl_taken>", label: "Tanggal" },
              ].map((tk) => (
                <button
                  key={tk.tag}
                  type="button"
                  onClick={() => onTextChange(`${sampleText} ${tk.tag}`.trim())}
                  className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
                  title={`Sisipkan ${tk.tag}`}
                >
                  {tk.tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">X (center)</span>
            <input
              type="number"
              value={setting.x}
              onChange={(e) => onChange({ ...setting, x: Number(e.target.value) })}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Y (center)</span>
            <input
              type="number"
              value={setting.y}
              onChange={(e) => onChange({ ...setting, y: Number(e.target.value) })}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Ukuran (px)</span>
            <input
              type="number"
              value={setting.size}
              onChange={(e) => onChange({ ...setting, size: Number(e.target.value) })}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Warna</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={setting.color}
                onChange={(e) => onChange({ ...setting, color: e.target.value })}
                className="h-7 w-8 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
              />
              <input
                type="text"
                value={setting.color}
                onChange={(e) => onChange({ ...setting, color: e.target.value })}
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </label>
          <label className="col-span-2 block">
            <span className="mb-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Font</span>
            <select
              value={setting.font}
              onChange={(e) => onChange({ ...setting, font: e.target.value })}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
                className="h-4 w-4 rounded border-zinc-300 accent-indigo-600 dark:border-zinc-700"
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Auto-shrink kalau kepanjangan</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
