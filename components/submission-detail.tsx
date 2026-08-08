"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Pencil, Save, Star, Trash2, X } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Select, Textarea } from "@/components/ui";
import { getSubmission, updateStatus, deleteSubmissions } from "@/lib/store";
import type { StatusSertifikat, Submission } from "@/lib/types";
import { formatDateFull } from "@/lib/utils";

const STATUS_TONE: Record<StatusSertifikat, "info" | "warning" | "success"> = {
  Belum: "info",
  Proses: "warning",
  Terbit: "success",
};

const JENIS_PROGRAM = ["Magang", "Penelitian", "Praktik Kerja Lapangan (PKL)", "Lainnya"] as const;
const BAGIAN = ["Keuangan dan Umum", "Quality Assurance", "Tanaman TR", "Teknik", "Pengolahan"] as const;
const RATINGS = ["Sangat Baik", "Baik", "Cukup", "Kurang"] as const;

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2 text-sm sm:grid-cols-[140px_1fr] sm:gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function EditField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  textarea,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const common =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2 text-sm sm:grid-cols-[140px_1fr] sm:gap-2 sm:items-center">
      <label className="text-muted-foreground" htmlFor={`edit-${name}`}>
        {label}{required && <span className="ml-0.5 text-error">*</span>}
      </label>
      {textarea ? (
        <Textarea
          id={`edit-${name}`}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className={common}
          rows={3}
        />
      ) : (
        <Input
          id={`edit-${name}`}
          type={type}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className={common}
        />
      )}
    </div>
  );
}

export default function SubmissionDetail({ id }: { id: string }) {
  const [sub, setSub] = React.useState<Submission | null | undefined>(undefined);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [editData, setEditData] = React.useState<Record<string, string>>({});
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
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

  function enterEditMode() {
    setEditData({
      namaLengkap: sub!.namaLengkap,
      noWa: sub!.noWa,
      email: sub!.email,
      universitas: sub!.universitas,
      jurusan: sub!.jurusan,
      jenisProgram: sub!.jenisProgram,
      jenisProgramLainnya: sub!.jenisProgramLainnya ?? "",
      periodeMulai: sub!.periodeMulai,
      periodeAkhir: sub!.periodeAkhir,
      bagian: sub!.bagian,
      subBagian: sub!.subBagian,
      namaProgramSurat: sub!.namaProgramSurat,
      rating: sub!.rating,
      manfaat: sub!.manfaat,
      saran: sub!.saran ?? "",
    });
    setEditMode(true);
    setEditError(null);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditData({});
    setEditError(null);
  }

  function handleEditChange(name: string, value: string) {
    setEditData((prev) => ({ ...prev, [name]: value }));
  }

  async function saveEdit() {
    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await fetch("/api/submissions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sub!.id, ...editData }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Gagal menyimpan perubahan");
      }
      // Refresh local state
      const updated = await getSubmission(id);
      if (updated) setSub(updated);
      setEditMode(false);
      setEditData({});
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSavingEdit(false);
    }
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
          <div className="ml-auto flex items-center gap-1.5">
            {editMode ? (
              <>
                <Button size="sm" onClick={saveEdit} loading={savingEdit} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" aria-hidden />
                  {savingEdit ? "Menyimpan…" : "Simpan"}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1.5">
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Batal
                </Button>
              </>
            ) : (
              <>
                <button
                  onClick={enterEditMode}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Hapus
                </button>
              </>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Dikirim {formatDateFull(sub.createdAt)}</p>
      </div>

      {editError && (
        <p className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
          {editError}
        </p>
      )}

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
          {editMode ? (
            <dl className="divide-y divide-border/60">
              <EditField label="Nama Lengkap" name="namaLengkap" value={editData.namaLengkap} onChange={handleEditChange} required />
              <EditField label="No. WA" name="noWa" value={editData.noWa} onChange={handleEditChange} required />
              <EditField label="Email" name="email" value={editData.email} onChange={handleEditChange} type="email" required />
              <EditField label="Universitas" name="universitas" value={editData.universitas} onChange={handleEditChange} required />
              <EditField label="Jurusan" name="jurusan" value={editData.jurusan} onChange={handleEditChange} required />
              <div className="grid grid-cols-1 gap-0.5 py-2 text-sm sm:grid-cols-[140px_1fr] sm:gap-2 sm:items-center">
                <label className="text-muted-foreground" htmlFor="edit-jenisProgram">Jenis Program<span className="ml-0.5 text-error">*</span></label>
                <Select id="edit-jenisProgram" value={editData.jenisProgram} onChange={(e) => handleEditChange("jenisProgram", e.target.value)} className="w-full">
                  {JENIS_PROGRAM.map((j) => <option key={j} value={j}>{j}</option>)}
                </Select>
              </div>
              {editData.jenisProgram === "Lainnya" && (
                <EditField label="Lainnya, yaitu" name="jenisProgramLainnya" value={editData.jenisProgramLainnya} onChange={handleEditChange} required />
              )}
              <EditField label="Periode Mulai" name="periodeMulai" value={editData.periodeMulai} onChange={handleEditChange} type="date" required />
              <EditField label="Periode Akhir" name="periodeAkhir" value={editData.periodeAkhir} onChange={handleEditChange} type="date" required />
              <div className="grid grid-cols-1 gap-0.5 py-2 text-sm sm:grid-cols-[140px_1fr] sm:gap-2 sm:items-center">
                <label className="text-muted-foreground" htmlFor="edit-bagian">Bagian<span className="ml-0.5 text-error">*</span></label>
                <Select id="edit-bagian" value={editData.bagian} onChange={(e) => handleEditChange("bagian", e.target.value)} className="w-full">
                  {BAGIAN.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </div>
              <EditField label="Sub Bagian" name="subBagian" value={editData.subBagian} onChange={handleEditChange} required />
              <EditField label="Nama Program Surat" name="namaProgramSurat" value={editData.namaProgramSurat} onChange={handleEditChange} required />
            </dl>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Umpan balik */}
      <Card>
        <CardHeader>
          <CardTitle>Umpan Balik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <div className="grid grid-cols-1 gap-0.5 py-2 text-sm sm:grid-cols-[140px_1fr] sm:gap-2 sm:items-center">
                <label className="text-muted-foreground" htmlFor="edit-rating">Penilaian<span className="ml-0.5 text-error">*</span></label>
                <Select id="edit-rating" value={editData.rating} onChange={(e) => handleEditChange("rating", e.target.value)} className="w-full">
                  {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </div>
              <EditField label="Manfaat" name="manfaat" value={editData.manfaat} onChange={handleEditChange} required textarea />
              <EditField label="Saran" name="saran" value={editData.saran} onChange={handleEditChange} textarea />
            </>
          ) : (
            <>
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
            </>
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
