"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { ElementSetting, ImageElementSetting, Template } from "@/lib/cert-types";
import { ElementPanel } from "@/components/settings/ElementPanel";
import { ImageElementPanel } from "@/components/settings/ImageElementPanel";
import { TemplatePicker } from "@/components/settings/TemplatePicker";
import { CanvasPreview } from "@/components/settings/CanvasPreview";
import { Reveal } from "@/components/motion";
import { Card } from "@/components/ui";

// data contoh untuk preview
const PREVIEW_DATA: Record<string, string> = {
  nama: "RAHMAT HIDAYATULLAH",
  program: "Program Magang Merdeka",
  perusahaan: "di PT Sinergi Gula Nusantara - Pabrik Gula Djatiroto",
  bagian: "pada bagian Tanaman TR - Sub Tanaman",
  periode: "Periode magang dimulai dari 02 Februari 2026 sampai 30 April 2026.",
  taken: "Lumajang, 02 Mei 2026",
};

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [elements, setElements] = React.useState<Record<string, ElementSetting>>({});
  const [imageElements, setImageElements] = React.useState<Record<string, ImageElementSetting>>({});
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = React.useState<boolean>(false);
  const [previewData, setPreviewData] = React.useState<Record<string, string>>(PREVIEW_DATA);

  async function loadAll() {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([fetch("/api/sertifikat/settings"), fetch("/api/sertifikat/templates")]);
      const s = await sRes.json();
      const t = await tRes.json();
      const loadedElements: Record<string, ElementSetting> = s.settings?.elements ?? {};
      const loadedImages: Record<string, ImageElementSetting> = s.settings?.image_elements ?? {};
      setElements(loadedElements);
      setImageElements(loadedImages);
      setActiveTemplateId(s.settings?.template_id ?? null);
      setTemplates(t.templates ?? []);

      // Auto-load saved custom redaksi texts into previewData
      const initialPreview = { ...PREVIEW_DATA };
      Object.entries(loadedElements).forEach(([key, el]) => {
        if (el?.sample_text) {
          initialPreview[key] = el.sample_text;
        }
      });
      setPreviewData(initialPreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    // AuthGuard (layout) udah handle login — langsung load
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const r = await fetch("/api/sertifikat/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: activeTemplateId,
          elements,
          image_elements: imageElements,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal simpan");
      setSuccessMsg("✓ Pengaturan sertifikat, elemen teks & gambar berhasil disimpan!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function handleAddTextElement() {
    const key = `kustom_${Date.now()}`;
    const newEl: ElementSetting = {
      label: "Teks Kustom Baru",
      x: 1000,
      y: 700,
      size: 24,
      color: "#000000",
      font: "opensauce-bold",
      sample_text: "Teks Baru <nama>",
    };
    setElements((prev) => ({ ...prev, [key]: newEl }));
    setPreviewData((prev) => ({ ...prev, [key]: newEl.sample_text! }));
    setSelectedKey(key);
    setSelectedImageType(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", file.name.split(".")[0] || "Gambar Elemen");
      const res = await fetch("/api/sertifikat/upload-element", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload gambar gagal");
      setImageElements((prev) => ({
        ...prev,
        [data.id]: {
          id: data.id,
          label: data.label,
          url: data.url,
          storage_path: data.storage_path,
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          opacity: data.opacity,
        },
      }));
      setSelectedKey(data.id);
      setSelectedImageType(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function activateTemplate(id: string) {
    await fetch(`/api/sertifikat/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ set_active: true }),
    });
    setActiveTemplateId(id);
    await loadAll();
  }

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) ?? null;

  function handleDataChange(key: string, text: string) {
    setPreviewData((prev) => ({ ...prev, [key]: text }));
    setElements((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { x: 1000, y: 700, size: 24, color: "#000000", font: "opensauce-bold" }),
        sample_text: text,
      },
    }));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Pengaturan Sertifikat</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Template background, elemen teks dinamis, & upload gambar (TTD / Stempel / Logo)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin/sertifikat")}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              ← Daftar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Simpan
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {successMsg}
          </div>
        )}

        <Reveal>
          <div className="space-y-6">
            {/* Top Toolbar Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Kanvas Interactive Layout Editor
                </h2>
                <p className="text-xs text-zinc-500">
                  Klik 1x untuk memilih & edit teks/gambar. Klik & Drag elemen untuk mengubah posisi (X, Y).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                >
                  {uploading ? "Uploading..." : "+ Upload Gambar (TTD/Stempel/Logo)"}
                </button>

                <button
                  type="button"
                  onClick={handleAddTextElement}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-900 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
                >
                  + Tambah Elemen Teks
                </button>
              </div>
            </div>

            {/* Canvas Preview */}
            <Card className="p-4 sm:p-5">
              <CanvasPreview
                elements={elements}
                imageElements={imageElements}
                template={activeTemplate}
                data={previewData}
                selectedKey={selectedKey}
                selectedImageType={selectedImageType}
                onSelectElement={(key, isImage) => {
                  setSelectedKey(key);
                  setSelectedImageType(Boolean(isImage));
                }}
                onChangeElement={(key, updated) => setElements((prev) => ({ ...prev, [key]: updated }))}
                onChangeImageElement={(key, updated) => setImageElements((prev) => ({ ...prev, [key]: updated }))}
                onChangeData={(key, text) => {
                  setPreviewData((prev) => ({ ...prev, [key]: text }));
                  setElements((prev) => {
                    if (prev[key]) {
                      return { ...prev, [key]: { ...prev[key], sample_text: text } };
                    }
                    return prev;
                  });
                }}
                onDeleteImageElement={(key) => {
                  setImageElements((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                  if (selectedKey === key) setSelectedKey(null);
                }}
              />
            </Card>

            {/* Template Picker & Elements Grid */}
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                {/* Image Elements Cards */}
                {Object.keys(imageElements).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Elemen Gambar (TTD, Stempel, Logo, QR)
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Object.entries(imageElements).map(([key, img]) => (
                        <div key={key} onClick={() => { setSelectedKey(key); setSelectedImageType(true); }}>
                          <ImageElementPanel
                            imageKey={key}
                            setting={img}
                            isSelected={selectedKey === key && selectedImageType}
                            onChange={(updated) => setImageElements((prev) => ({ ...prev, [key]: updated }))}
                            onDelete={() => {
                              setImageElements((prev) => {
                                const next = { ...prev };
                                delete next[key];
                                return next;
                              });
                              if (selectedKey === key) setSelectedKey(null);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Elements Cards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    Elemen Teks ({Object.keys(elements).length})
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(elements).map(([key, setting]) => (
                      <div key={key} onClick={() => { setSelectedKey(key); setSelectedImageType(false); }}>
                        <ElementPanel
                          elementKey={key}
                          setting={setting}
                          sampleText={previewData[key] ?? setting.sample_text}
                          isSelected={selectedKey === key && !selectedImageType}
                          onChange={(updated) => setElements((prev) => ({ ...prev, [key]: updated }))}
                          onTextChange={(text) => handleDataChange(key, text)}
                          onDelete={() => {
                            setElements((prev) => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            });
                            if (selectedKey === key) setSelectedKey(null);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Template background selector */}
              <div>
                <TemplatePicker
                  templates={templates}
                  activeId={activeTemplateId}
                  onActivate={activateTemplate}
                  onDeleted={loadAll}
                />
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                  <strong>Tips:</strong> Pengaturan koordinat (X, Y), ukuran font/gambar, dan jenis font disimpan otomatis ke database saat klik <strong>Simpan</strong>.
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
