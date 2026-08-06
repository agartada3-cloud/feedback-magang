import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client — dipakai kalau env tersedia.
 * Lihat supabase/schema.sql untuk setup tabel + RLS.
 *
 * Swapping dari localStorage stub:
 *   lib/store.ts → pakai fungsi-fungsi di file ini (kontrak sama).
 *   Hapus/arsipkan store.ts setelah data migrasi.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = () => supabase !== null;

/* ---------- types mapping (snake_case DB ↔ camelCase app) ---------- */

export interface SubmissionRow {
  id: string;
  ref: string;
  created_at: string;
  nama_lengkap: string;
  no_wa: string;
  email: string;
  universitas: string;
  jurusan: string;
  jenis_program: "Magang" | "Penelitian" | "Praktik Kerja Lapangan (PKL)" | "Lainnya";
  jenis_program_lainnya: string | null;
  periode_mulai: string;
  periode_akhir: string;
  bagian: "Keuangan dan Umum" | "Quality Assurance" | "Tanaman TR" | "Teknik" | "Pengolahan";
  sub_bagian: string;
  nama_program_surat: string;
  rating: "Sangat Baik" | "Baik" | "Cukup" | "Kurang";
  manfaat: string;
  saran: string | null;
  status_sertifikat: "Belum" | "Proses" | "Terbit";
}

export function rowToSubmission(r: SubmissionRow) {
  return {
    id: r.id,
    ref: r.ref,
    createdAt: r.created_at,
    namaLengkap: r.nama_lengkap,
    noWa: r.no_wa,
    email: r.email,
    universitas: r.universitas,
    jurusan: r.jurusan,
    jenisProgram: r.jenis_program,
    jenisProgramLainnya: r.jenis_program_lainnya ?? undefined,
    periodeMulai: r.periode_mulai,
    periodeAkhir: r.periode_akhir,
    bagian: r.bagian,
    subBagian: r.sub_bagian,
    namaProgramSurat: r.nama_program_surat,
    rating: r.rating,
    manfaat: r.manfaat,
    saran: r.saran ?? undefined,
    setuju: true,
    statusSertifikat: r.status_sertifikat,
  };
}

export function submissionToRow(s: {
  namaLengkap: string;
  noWa: string;
  email: string;
  universitas: string;
  jurusan: string;
  jenisProgram: string;
  jenisProgramLainnya?: string;
  periodeMulai: string;
  periodeAkhir: string;
  bagian: string;
  subBagian: string;
  namaProgramSurat: string;
  rating: string;
  manfaat: string;
  saran?: string;
}) {
  return {
    nama_lengkap: s.namaLengkap,
    no_wa: s.noWa,
    email: s.email,
    universitas: s.universitas,
    jurusan: s.jurusan,
    jenis_program: s.jenisProgram,
    jenis_program_lainnya: s.jenisProgramLainnya ?? null,
    periode_mulai: s.periodeMulai,
    periode_akhir: s.periodeAkhir,
    bagian: s.bagian,
    sub_bagian: s.subBagian,
    nama_program_surat: s.namaProgramSurat,
    rating: s.rating,
    manfaat: s.manfaat,
    saran: s.saran ?? null,
  };
}
