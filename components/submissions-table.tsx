"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { Badge, Button, Card, CardContent, EmptyState, Input, Select } from "@/components/ui";
import { listSubmissions } from "@/lib/store";
import type { StatusSertifikat, Submission } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUS_TONE: Record<StatusSertifikat, "info" | "warning" | "success"> = {
  Belum: "info",
  Proses: "warning",
  Terbit: "success",
};

export default function SubmissionsTable() {
  const [items, setItems] = React.useState<Submission[]>([]);
  const [query, setQuery] = React.useState("");
  const [jenis, setJenis] = React.useState("");
  const [bagian, setBagian] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<keyof Submission>("createdAt");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  React.useEffect(() => {
    listSubmissions().then(setItems);
  }, []);

  /* reset halaman kalau filter berubah */
  React.useEffect(() => setPage(1), [query, jenis, bagian, status, from, to]);

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
    if (from) rows = rows.filter((s) => s.createdAt.slice(0, 10) >= from);
    if (to) rows = rows.filter((s) => s.createdAt.slice(0, 10) <= to);

    rows.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [items, query, jenis, bagian, status, from, to, sortKey, sortDir]);

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

  const filterActive = query || jenis || bagian || status || from || to;

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
        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="h-4 w-4" aria-hidden />
          Export CSV
        </Button>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
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
            <option>Magang</option>
            <option>Penelitian</option>
            <option>Praktik Kerja Lapangan (PKL)</option>
            <option>Lainnya</option>
          </Select>
          <Select value={bagian} onChange={(e) => setBagian(e.target.value)}>
            <option value="">Semua Bagian</option>
            <option>Keuangan dan Umum</option>
            <option>Quality Assurance</option>
            <option>Tanaman TR</option>
            <option>Teknik</option>
            <option>Pengolahan</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option>Belum</option>
            <option>Proses</option>
            <option>Terbit</option>
          </Select>
          <div className="flex items-center gap-1.5">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Dari tanggal" />
            <span className="text-muted-foreground">–</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Sampai tanggal" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
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
                  { key: "statusSertifikat", label: "Status" },
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
              </tr>
            </thead>
            <tbody>
              {pageRows.map((s) => (
                <tr key={s.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/50">
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
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[s.statusSertifikat]}>{s.statusSertifikat}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pageRows.length && <EmptyState title="Tidak ada data" desc="Coba ubah kata kunci atau filter." />}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
