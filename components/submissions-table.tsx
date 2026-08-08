"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Search, Settings, Trash2, Check, CheckCircle2, X } from "lucide-react";
import { Badge, Button, Card, CardContent, EmptyState, Input, Select } from "@/components/ui";
import { DatePicker, MonthPicker } from "@/components/date-picker";
import { deleteSubmissions, listSubmissions } from "@/lib/store";
import type { StatusSertifikat, Submission } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUS_TONE: Record<StatusSertifikat, "info" | "warning" | "success"> = {
  Belum: "info",
  Proses: "warning",
  Terbit: "success",
};

const RATINGS = ["Sangat Baik", "Baik", "Cukup", "Kurang"] as const;
const JENIS = ["Magang", "Penelitian", "Praktik Kerja Lapangan (PKL)", "Lainnya"] as const;
const BAGIAN = ["Keuangan dan Umum", "Quality Assurance", "Tanaman TR", "Teknik", "Pengolahan"] as const;

export default function SubmissionsTable() {
  const [items, setItems] = React.useState<Submission[]>([]);
  const [query, setQuery] = React.useState("");
  const [jenis, setJenis] = React.useState("");
  const [bagian, setBagian] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [rating, setRating] = React.useState("");
  const [bulan, setBulan] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<keyof Submission>("createdAt");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    listSubmissions().then(setItems);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  /* reset halaman kalau filter berubah */
  React.useEffect(() => setPage(1), [query, jenis, bagian, status, rating, bulan, from, to]);

  const filtered = React.useMemo(() => {
    let rows = [...items];
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.namaLengkap.toLowerCase().includes(q) ||
          s.universitas.toLowerCase().includes(q) ||
          s.jurusan.toLowerCase().includes(q) ||
          s.noWa.includes(q) ||
          s.ref.toLowerCase().includes(q)
      );
    }
    if (jenis) rows = rows.filter((s) => s.jenisProgram === jenis);
    if (bagian) rows = rows.filter((s) => s.bagian === bagian);
    if (status) rows = rows.filter((s) => s.statusSertifikat === status);
    if (rating) rows = rows.filter((s) => s.rating === rating);
    if (bulan) rows = rows.filter((s) => s.createdAt.slice(0, 7) === bulan);
    if (from) rows = rows.filter((s) => s.createdAt.slice(0, 10) >= from);
    if (to) rows = rows.filter((s) => s.createdAt.slice(0, 10) <= to);

    rows.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [items, query, jenis, bagian, status, rating, bulan, from, to, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: keyof Submission) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      const pageIds = pageRows.map((r) => r.id);
      const allSelected = pageRows.length > 0 && pageIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(pageIds);
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const [downloadingZip, setDownloadingZip] = React.useState(false);

  async function handleBatchZipDownload() {
    const ids = [...selected];
    if (!ids.length) return;
    setDownloadingZip(true);
    try {
      const res = await fetch("/api/sertifikat/generate-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Gagal generate ZIP");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sertifikat-batch-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengunduh berkas batch ZIP.");
    } finally {
      setDownloadingZip(false);
    }
  }

  async function handleDelete() {
    const ids = [...selected];
    if (!ids.length) return;
    setDeleting(true);
    await deleteSubmissions(ids);
    setSelected(new Set());
    setConfirmDelete(false);
    setDeleting(false);
    load();
  }

  function exportCsv() {
    const header = [
      "No. Referensi", "Tanggal", "Nama", "WA", "Email", "Universitas", "Jurusan",
      "Jenis Program", "Bagian", "Sub Bagian", "Nama Program Surat", "Periode Mulai",
      "Periode Akhir", "Rating", "Manfaat", "Saran", "Status Sertifikat",
    ];
    const esc = (v: string | undefined) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = filtered.map((s) =>
      [
        s.ref, s.createdAt.slice(0, 10), s.namaLengkap, s.noWa, s.email, s.universitas, s.jurusan,
        s.jenisProgram, s.bagian, s.subBagian, s.namaProgramSurat, s.periodeMulai, s.periodeAkhir,
        s.rating, s.manfaat, s.saran ?? "", s.statusSertifikat,
      ]
        .map(esc)
        .join(",")
    );
    const csv = [header.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filterActive = query || jenis || bagian || status || rating || bulan || from || to;
  const hasSelection = selected.size > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Submissions</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filterActive ? (
              <>Menampilkan <span className="font-medium text-foreground">{filtered.length}</span> hasil (terfilter)</>
            ) : (
              <>Total <span className="font-medium text-foreground">{filtered.length}</span> submission</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              placeholder="Cari nama, universitas, jurusan, WA…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={jenis} onChange={(e) => setJenis(e.target.value)}>
            <option value="">Semua Jenis</option>
            {JENIS.map((j) => <option key={j}>{j}</option>)}
          </Select>
          <Select value={bagian} onChange={(e) => setBagian(e.target.value)}>
            <option value="">Semua Bagian</option>
            {BAGIAN.map((b) => <option key={b}>{b}</option>)}
          </Select>
          <Select value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="">Semua Rating</option>
            {RATINGS.map((r) => <option key={r}>{r}</option>)}
          </Select>
          <MonthPicker value={bulan} onChange={setBulan} />
          <DatePicker
            value={from}
            onChange={(v) => { setFrom(v); if (to && v > to) setTo(""); }}
            placeholder="Dari tanggal"
            max={to || undefined}
          />
          <DatePicker
            value={to}
            onChange={(v) => { setTo(v); if (from && v && v < from) setFrom(""); }}
            placeholder="Sampai tanggal"
            min={from || undefined}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                {[
                  { key: "ref", label: "No. Ref" },
                  { key: "createdAt", label: "Tanggal" },
                  { key: "namaLengkap", label: "Nama" },
                  { key: "universitas", label: "Universitas" },
                  { key: "jenisProgram", label: "Jenis" },
                  { key: "bagian", label: "Bagian" },
                  { key: "rating", label: "Rating" },
                ].map((col) => (
                  <th key={col.key} className="px-4 py-3 font-medium">
                    <button
                      onClick={() => toggleSort(col.key as keyof Submission)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                        sortKey === col.key && "text-primary"
                      )}
                    >
                      {col.label}
                      <span className="text-[10px]">{sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                    </button>
                  </th>
                ))}
                <th className="w-16 px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((s) => (
                <tr
                  key={s.id}
                  className={cn(
                    "group border-b border-border/60 transition-colors last:border-0 hover:bg-muted/50 cursor-pointer",
                    selected.has(s.id) && "bg-primary/5"
                  )}
                  onClick={() => toggleSelect(s.id)}
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/submissions/${s.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                      {s.ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{s.namaLengkap}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.universitas}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.jenisProgram}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.bagian}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.rating}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={`/admin/submissions/${s.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Edit ${s.ref}`}
                      >
                        <Settings className="h-4 w-4" aria-hidden />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(new Set([s.id]));
                          setConfirmDelete(true);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                        aria-label={`Hapus ${s.ref}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pageRows.length && <EmptyState title="Tidak ada data" desc="Coba ubah kata kunci atau filter." />}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Floating Action Bar - appears when items selected */}
      {hasSelection && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 md:static md:relative md:z-auto md:bottom-auto md:left-auto md:right-auto"
          role="toolbar"
          aria-label="Batch actions"
        >
          <div className="mx-auto max-w-screen-2xl px-4 pb-4 md:p-0 md:mx-0 md:flex md:items-center md:justify-end md:gap-2 md:border-t md:border-border md:bg-card/95 md:backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="hidden sm:inline-flex items-center text-sm font-medium text-foreground">
                {selected.size} dipilih
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="hidden sm:inline-flex min-h-[40px]"
                aria-label="Batal pilih"
              >
                <X className="h-4 w-4" aria-hidden />
                Batal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchZipDownload}
                loading={downloadingZip}
                className="min-h-[40px] flex-1 sm:flex-none border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
              >
                <Download className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{downloadingZip ? "Memproses ZIP..." : `Download ZIP (${selected.size})`}</span>
                <span className="sm:hidden">{selected.size}</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="min-h-[40px] flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Hapus ({selected.size})</span>
                <span className="sm:hidden">{selected.size}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi hapus */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(false)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg">
            <h2 className="text-base font-semibold text-foreground">Hapus {selected.size} data?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Data yang dihapus tidak bisa dikembalikan. Pastikan sudah mengekspor CSV jika perlu arsip.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDelete} loading={deleting}>
                {deleting ? "Menghapus…" : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}