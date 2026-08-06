"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Star, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Select } from "@/components/ui";
import { getSubmission, updateStatus, deleteSubmissions } from "@/lib/store";
import type { StatusSertifikat, Submission } from "@/lib/types";
import { formatDateFull } from "@/lib/utils";

const STATUS_TONE: Record<StatusSertifikat, "info" | "warning" | "success"> = {
  Belum: "info",
  Proses: "warning",
  Terbit: "success",
};

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2 text-sm sm:grid-cols-[140px_1fr] sm:gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

export default function SubmissionDetail({ id }: { id: string }) {
  const [sub, setSub] = React.useState<Submission | null | undefined>(undefined);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    getSubmission(id).then(setSub);
  }, [id]);

  if (sub === undefined) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Memuat…</p>;
  }
  if (sub === null) {
    return (
      <EmptyState
        title="Submission tidak ditemukan"
        desc="Data mungkin sudah dihapus atau ID salah."
      />
    );
  }

  async function onStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as StatusSertifikat;
    setSaving(true);
    await updateStatus(sub!.id, status);
    setSub({ ...sub!, statusSertifikat: status });
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteSubmissions([sub!.id]);
    setDeleting(false);
    router.replace("/admin/submissions");
  }

  const waLink = `https://wa.me/${sub.noWa.replace(/^0/, "62")}`;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link
          href="/admin/submissions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Kembali ke Submissions
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-semibold tracking-tight text-foreground">{sub.ref}</h1>
          <Badge tone={STATUS_TONE[sub.statusSertifikat]}>{sub.statusSertifikat}</Badge>
          <button
            onClick={() => setConfirmDelete(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Hapus
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Dikirim {formatDateFull(sub.createdAt)}</p>
      </div>

      {/* Aksi admin */}
      <Card>
        <CardHeader>
          <CardTitle>Status Sertifikat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={sub.statusSertifikat} onChange={onStatusChange} className="w-44" disabled={saving}>
            <option>Belum</option>
            <option>Proses</option>
            <option>Terbit</option>
          </Select>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4 text-success" aria-hidden />
            Chat WA ({sub.noWa})
          </a>
        </CardContent>
      </Card>

      {/* Data peserta */}
      <Card>
        <CardHeader>
          <CardTitle>Data Peserta</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border/60">
            <DetailRow label="Nama Lengkap" value={sub.namaLengkap} />
            <DetailRow label="No. WA" value={sub.noWa} />
            <DetailRow label="Email" value={sub.email} />
            <DetailRow label="Universitas" value={sub.universitas} />
            <DetailRow label="Jurusan" value={sub.jurusan} />
            <DetailRow label="Jenis Program" value={sub.jenisProgram === "Lainnya" ? `Lainnya: ${sub.jenisProgramLainnya}` : sub.jenisProgram} />
            <DetailRow label="Periode" value={`${sub.periodeMulai} s/d ${sub.periodeAkhir}`} />
            <DetailRow label="Bagian" value={sub.bagian} />
            <DetailRow label="Sub Bagian" value={sub.subBagian} />
            <DetailRow label="Nama Program Surat" value={sub.namaProgramSurat} />
          </dl>
        </CardContent>
      </Card>

      {/* Umpan balik */}
      <Card>
        <CardHeader>
          <CardTitle>Umpan Balik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-warning" aria-hidden />
            <span className="text-muted-foreground">Penilaian:</span>
            <span className="font-semibold text-foreground">{sub.rating}</span>
          </div>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Manfaat dan Kompetensi yang Diperoleh</p>
            <p className="text-sm leading-relaxed text-foreground">{sub.manfaat}</p>
          </div>
          {sub.saran && (
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Saran dan Masukan</p>
              <p className="text-sm leading-relaxed text-foreground">{sub.saran}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Link href="/admin/submissions">
          <Button variant="outline">Kembali</Button>
        </Link>
      </div>

      {/* Konfirmasi hapus */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(false)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg">
            <h2 className="text-base font-semibold text-foreground">Hapus {sub.ref}?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Data ini tidak bisa dikembalikan. Pastikan sudah mengekspor CSV jika perlu arsip.
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
