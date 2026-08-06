// app/admin/(panel)/sertifikat/settings/page.tsx — Room Setting: layout editor + template

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { ElementSetting, Template } from "@/lib/cert-types";
import { ElementPanel } from "@/components/settings/ElementPanel";
import { TemplatePicker } from "@/components/settings/TemplatePicker";
import { CanvasPreview } from "@/components/settings/CanvasPreview";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

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
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [elements, setElements] = React.useState<Record<string, ElementSetting>>({});
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([fetch("/api/sertifikat/settings"), fetch("/api/sertifikat/templates")]);
      const s = await sRes.json();
      const t = await tRes.json();
      setElements(s.settings?.elements ?? {});
      setActiveTemplateId(s.settings?.template_id ?? null);
      setTemplates(t.templates ?? []);
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
    try {
      const r = await fetch("/api/sertifikat/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elements }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal simpan");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Pengaturan Sertifikat</h1>
            <p className="text-xs text-zinc-500">Template background & posisi elemen teks</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin/sertifikat")}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
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

        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* kiri: preview + elemen */}
            <div className="space-y-6">
              <CanvasPreview elements={elements} template={activeTemplate} data={PREVIEW_DATA} />

              <div>
                <h2 className="mb-3 text-sm font-semibold text-zinc-700">Elemen Teks</h2>
                <Stagger className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(elements).map(([key, el]) => (
                    <StaggerItem key={key}>
                      <ElementPanel
                        elementKey={key}
                        setting={el}
                        onChange={(updated) => setElements((prev) => ({ ...prev, [key]: updated }))}
                      />
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            </div>

            {/* kanan: template */}
            <div>
              <TemplatePicker
                templates={templates}
                activeId={activeTemplateId}
                onActivate={activateTemplate}
                onDeleted={loadAll}
              />
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
                <strong>Tips:</strong> Preview pakai data contoh. Posisi & ukuran disimpan otomatis ke database saat
                klik <strong>Simpan</strong>. Generate pakai elemen ini.
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
