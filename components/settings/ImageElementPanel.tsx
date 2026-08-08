// components/settings/ImageElementPanel.tsx — Kartu setting elemen gambar (TTD, Stempel, Logo, QR)

"use client";

import * as React from "react";
import type { ImageElementSetting } from "@/lib/cert-types";
import { Trash2, Pencil, Check } from "lucide-react";

export function ImageElementPanel({
  imageKey,
  setting,
  isSelected,
  onChange,
  onDelete,
  onRename,
}: {
  imageKey: string;
  setting: ImageElementSetting;
  isSelected?: boolean;
  onChange: (s: ImageElementSetting) => void;
  onDelete: () => void;
  onRename?: (oldKey: string, newKey: string) => void;
}) {
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [editingId, setEditingId] = React.useState(false);
  const [newId, setNewId] = React.useState(imageKey);

  function handleRename() {
    if (newId && newId !== imageKey && onRename) {
      onRename(imageKey, newId);
    }
    setEditingId(false);
  }

  return (
    <div
      className={`group relative rounded-xl border p-4 transition-all duration-150 ${
        isSelected
          ? "border-indigo-500 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/30 dark:border-indigo-500 dark:bg-indigo-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      {/* ID (key) — editable */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ID:</span>
        {editingId ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              type="text"
              value={newId}
              onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              className="h-6 w-full rounded border border-amber-400 bg-white px-1.5 font-mono text-[11px] text-zinc-900 outline-none dark:border-amber-500 dark:bg-zinc-800 dark:text-zinc-100"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setNewId(imageKey); setEditingId(false); }
              }}
            />
            <button
              type="button"
              onClick={handleRename}
              className="rounded bg-amber-600 p-0.5 text-white hover:bg-amber-700"
            >
              <Check className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingId(true)}
            className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            title="Klik untuk ubah ID (contoh: qrcode)"
          >
            {imageKey}
          </button>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        {editingTitle ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="text"
              value={setting.label}
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
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              GAMBAR
            </span>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {setting.label || imageKey}
            </h3>
            {isSelected && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Terpilih
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTitle(true);
            }}
            className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Ubah nama gambar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Hapus elemen gambar "${setting.label}"?`)) onDelete();
            }}
            className="rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            title="Hapus elemen gambar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div className="relative h-12 w-16 overflow-hidden rounded border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setting.url} alt={setting.label} className="h-full w-full object-contain" />
        </div>
        <div className="text-xs text-zinc-500">
          <p className="font-mono text-[11px] text-zinc-400 truncate max-w-[180px]">{setting.url}</p>
        </div>
      </div>

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
          <span className="mb-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Lebar (px)</span>
          <input
            type="number"
            value={setting.width}
            onChange={(e) => onChange({ ...setting, width: Math.max(10, Number(e.target.value)) })}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Tinggi (px)</span>
          <input
            type="number"
            value={setting.height}
            onChange={(e) => onChange({ ...setting, height: Math.max(10, Number(e.target.value)) })}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
      </div>
    </div>
  );
}
