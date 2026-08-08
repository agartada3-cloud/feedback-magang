// app/admin/page.tsx — daftar data sertifikat + generate + download

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Loader2, RefreshCw, Settings2, Sparkles, Zap } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import { AnimatedNumber, Reveal, Stagger, StaggerItem } from "@/components/motion";

interface CertRow {
  feedback_id: string;
  nama: string;
  program: string;
  bagian: string;
  sub_bagian: string | null;
  tgl_awal: string;
  tgl_akhir: string;
  created_at: string;
}

interface GenInfo {
  status: string;
  storage_path: string;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<CertRow[]>([]);
  const [generated, setGenerated] = React.useState<Record<string, GenInfo>>({});
  const [loading, setLoading] = React.useState(true);
  const [genLoading, setGenLoading] = React.useState<string | null>(null);
  const [batchLoading, setBatchLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const [previewRow, setPreviewRow] = React.useState<CertRow | null>(null);
  const [csvUploading, setCsvUploading] = React.useState(false);
  const [csvResult, setCsvResult] = React.useState<string | null>(null);

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);
    setCsvResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("scale", "2");
      const res = await fetch("/api/sertifikat/generate-csv", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const resultsHeader = res.headers.get("X-Results");
      const results = resultsHeader ? JSON.parse(decodeURIComponent(resultsHeader)) : [];
      const ok = results.filter((r: any) => r.ok).length;
      const fail = results.filter((r: any) => !r.ok).length;
      setCsvResult(`Sukses: ${ok} sertifikat${fail ? `, Gagal: ${fail}` : ""}`);

      // Download ZIP
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sertifikat_bulk_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      load();
    } catch (err) {
      setCsvResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCsvUploading(false);
      e.target.value = "";
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/sertifikat/feedback");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal load data");
      setRows(d.rows ?? []);
      setGenerated(d.generated ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    // AuthGuard (layout) udah handle login — langsung load
    load();
    const timer = setInterval(load, 30_000); // polling 30s
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate(id: string) {
    setGenLoading(id);
    setError(null);
    try {
      const r = await fetch("/api/sertifikat/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_id: id, scale: 3 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal generate");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenLoading(null);
    }
  }

  function download(id: string, name?: string) {
    const url = `/api/sertifikat/download?id=${id}&download=1`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sertifikat_${(name || id).replace(/\s+/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function downloadPdf(id: string, name?: string) {
    const url = `/api/sertifikat/download?id=${id}&pdf=1`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sertifikat_${(name || id).replace(/\s+/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /** Batch: generate semua (belum punya) + download ZIP */
  async function generateAll() {
    if (!confirm("Generate semua sertifikat & download ZIP? Ini bisa makan waktu 1-2 detik per sertifikat.")) return;
    setBatchLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/sertifikat/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scale: 3 }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Batch gagal");
      }
      // download ZIP dari response
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sertifikat_all_3x_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBatchLoading(false);
    }
  }

  const filtered = rows.filter(
    (r) =>
      r.nama.toLowerCase().includes(search.toLowerCase()) ||
      r.program.toLowerCase().includes(search.toLowerCase()) ||
      r.bagian.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* topbar */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Sertifikat Magang</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">PG Djatiroto — generator sertifikat otomatis</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <FileText className="h-3.5 w-3.5" />
              {csvUploading ? "Uploading..." : "Upload CSV"}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvUpload}
                disabled={csvUploading}
              />
            </label>
            <button
              onClick={() => router.push("/admin/sertifikat/settings")}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Settings2 className="h-3.5 w-3.5" /> Settings
            </button>
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {csvResult && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {csvResult}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* summary strip */}
        <Stagger className="mb-5 grid grid-cols-3 gap-3">
          <StaggerItem>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Total Data</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                <AnimatedNumber value={rows.length} />
              </p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Sertifikat Terbit</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                <AnimatedNumber value={rows.filter((r) => generated[r.feedback_id]?.status === "ok").length} />
              </p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Belum Generate</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                <AnimatedNumber value={rows.filter((r) => !generated[r.feedback_id]?.status).length} />
              </p>
            </div>
          </StaggerItem>
        </Stagger>

        {/* search + batch */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, program, bagian…"
            className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={generateAll}
            disabled={batchLoading || rows.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {batchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {batchLoading ? "Generate…" : "Generate Semua + ZIP"}
          </button>
        </div>

        {/* table */}
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">No</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium">Bagian</th>
                  <th className="px-4 py-3 font-medium">Periode</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-zinc-400">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      Memuat data…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-zinc-400">
                      <FileText className="mx-auto mb-2 h-6 w-6 opacity-40" />
                      Belum ada data feedback. Isi form feedback dulu.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((r, i) => {
                    const gen = generated[r.feedback_id];
                    return (
                      <tr key={r.feedback_id} className="transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">{r.nama}</div>
                          {r.sub_bagian && <div className="text-xs text-zinc-400">{r.sub_bagian}</div>}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{r.program}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{r.bagian}</td>
                        <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                          {r.tgl_awal} → {r.tgl_akhir}
                        </td>
                        <td className="px-4 py-3">
                          {gen ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                gen.status === "ok"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                              }`}
                            >
                              {gen.status === "ok" ? "✓ Terbit" : "✗ Error"}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                              Belum
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewRow(r)}
                              className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                              title="Preview Sertifikat"
                            >
                              <FileText className="h-3.5 w-3.5 text-indigo-500" /> Preview
                            </button>
                            <button
                              onClick={() => download(r.feedback_id, r.nama)}
                              className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                              title="Download PNG"
                            >
                              <Download className="h-3.5 w-3.5" /> PNG
                            </button>
                            <button
                              onClick={() => downloadPdf(r.feedback_id, r.nama)}
                              className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                              title="Download PDF"
                            >
                              <Download className="h-3.5 w-3.5" /> PDF
                            </button>
                            <button
                              onClick={() => generate(r.feedback_id)}
                              disabled={genLoading === r.feedback_id}
                              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {genLoading === r.feedback_id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                              )}
                              {gen ? "Regenerate" : "Generate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        </Reveal>

        {/* Live Preview Modal */}
        {previewRow && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setPreviewRow(null)}
          >
            <div
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Preview Sertifikat — {previewRow.nama}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {previewRow.program} ({previewRow.bagian})
                  </p>
                </div>
                <button
                  onClick={() => setPreviewRow(null)}
                  className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              <div className="relative aspect-[2000/1414] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/sertifikat/download?id=${previewRow.feedback_id}&inline=1`}
                  alt={`Sertifikat ${previewRow.nama}`}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setPreviewRow(null)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Tutup
                </button>
                <button
                  onClick={() => download(previewRow.feedback_id, previewRow.nama)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <Download className="h-3.5 w-3.5" /> PNG
                </button>
                <button
                  onClick={() => downloadPdf(previewRow.feedback_id, previewRow.nama)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-700"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          {filtered.length} data · polling otomatis tiap 30 detik
        </p>
      </div>
    </main>
  );
}
