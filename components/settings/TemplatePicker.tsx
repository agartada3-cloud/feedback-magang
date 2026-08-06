// components/settings/TemplatePicker.tsx — daftar template + upload

"use client";

import * as React from "react";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import type { Template } from "@/lib/cert-types";

export function TemplatePicker({
  templates,
  activeId,
  onActivate,
  onDeleted,
}: {
  templates: Template[];
  activeId: string | null;
  onActivate: (id: string) => Promise<void>;
  onDeleted: () => Promise<void>;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("nama", file.name.replace(/\.[^.]+$/, ""));
      const r = await fetch("/api/sertifikat/templates", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Upload gagal");
      await onActivate(d.path ? await getTemplateIdByPath(d.path) : "");
      await onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function getTemplateIdByPath(path: string): Promise<string> {
    const r = await fetch("/api/sertifikat/templates");
    const d = await r.json();
    const tpl = (d.templates as Template[]).find((t) => t.storage_path === path);
    return tpl?.id ?? "";
  }

  async function onDelete(id: string) {
    if (!confirm("Hapus template ini?")) return;
    await fetch(`/api/sertifikat/templates/${id}`, { method: "DELETE" });
    await onDeleted();
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-800">Template Background</h3>

      <div className="space-y-2">
        {templates.map((t) => (
          <div
            key={t.id}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
              activeId === t.id ? "border-indigo-400 bg-indigo-50" : "border-zinc-200"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
                {t.nama}
                {t.is_default && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
              </div>
              <div className="text-[11px] text-zinc-400">
                {t.width}×{t.height}px
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onActivate(t.id)}
                className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-indigo-700"
              >
                {activeId === t.id ? "Aktif" : "Pakai"}
              </button>
              <button
                onClick={() => onDelete(t.id)}
                className="rounded-md p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                title="Hapus"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="rounded-lg bg-zinc-50 px-3 py-4 text-center text-xs text-zinc-400">
            Belum ada template. Upload PNG background di bawah.
          </p>
        )}
      </div>

      {error && <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs text-red-600">{error}</p>}

      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-3 text-xs font-medium text-zinc-500 transition hover:border-indigo-400 hover:text-indigo-600">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {uploading ? "Uploading…" : "Upload Template PNG (max 15MB)"}
        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onUpload} />
      </label>
      <p className="mt-1.5 text-[10px] text-zinc-400">
        Rekomendasi 2000×1414 px (A4 landscape). Template harus tanpa teks dinamis.
      </p>
    </div>
  );
}
