import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { FeedbackFormData, JenisProgram, Rating, Stats, StatusSertifikat, Submission } from "./types";

/**
 * Data layer — Supabase (primary) + localStorage fallback (demo/offline).
 *
 * Mode dipilih otomatis:
 * - Kalau NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY ada → Supabase
 * - Kalau ngga → localStorage stub (seed data demo) biar app tetep jalan
 *
 * Schema: supabase/schema.sql (table `submissions` + RLS + trigger ref otomatis).
 * Catatan: kolom DB pakai snake_case; mapping rowToSubmission/submissionToRow di lib/supabase.ts.
 */

/* ---------- mode detection ---------- */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseMode = Boolean(URL && ANON);

export const supabase: SupabaseClient | null = isSupabaseMode ? createClient(URL!, ANON!) : null;

export const ADMIN_EMAIL = "admin@pgdjatiroto.web.id";
export const ADMIN_PASSWORD = "admin123"; // TODO: pindah ke Supabase Auth

/* ---------- localStorage fallback (demo) ---------- */

const LS_KEY = "feedback_magang_submissions";
const LS_SESSION = "feedback_magang_admin";

const seedRatings: Rating[] = ["Sangat Baik", "Baik", "Cukup", "Sangat Baik", "Baik", "Sangat Baik"];
const seedJenis: JenisProgram[] = ["Magang", "Magang", "Penelitian", "Praktik Kerja Lapangan (PKL)", "Magang", "Magang"];
const seedBagian: string[] = ["Quality Assurance", "Teknik", "Tanaman TR", "Pengolahan", "Keuangan dan Umum", "Quality Assurance"];

function seedSubmissions(): Submission[] {
  const now = new Date();
  const items: Submission[] = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 9);
    d.setMonth(d.getMonth() - (i % 5));
    const statuses: StatusSertifikat[] = ["Terbit", "Terbit", "Proses", "Belum", "Terbit"];
    items.push({
      id: `seed-${i}`,
      ref: `FDBK-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`,
      createdAt: d.toISOString(),
      namaLengkap: ["Ahmad Fauzi", "Siti Nurhaliza", "Budi Santoso", "Dewi Lestari", "Rizky Pratama", "Nadia Putri"][i % 6],
      noWa: "0812345678" + String((i % 90) + 10),
      email: `peserta${i + 1}@gmail.com`,
      universitas: ["Universitas Jember", "Politeknik Negeri Banyuwangi", "Universitas Brawijaya", "Universitas Airlangga"][i % 4],
      jurusan: ["Teknik Informatika", "Agribisnis", "Teknik Mesin", "Manajemen"][i % 4],
      jenisProgram: seedJenis[i % seedJenis.length],
      periodeMulai: "2026-01-05",
      periodeAkhir: "2026-03-31",
      bagian: seedBagian[i % seedBagian.length] as Submission["bagian"],
      subBagian: ["Sub QA & Konten", "Sub Pengolahan", "Sub Tanaman", "Sub Keuangan", "Sub Teknik"][i % 5],
      namaProgramSurat: "Program Magang MBKM",
      rating: seedRatings[i % seedRatings.length],
      manfaat: "Belajar komunikasi tim, editing video, dan manajemen konten media sosial selama program berlangsung.",
      saran: i % 3 === 0 ? "Tambah sesi mentoring rutin untuk peserta magang." : undefined,
      setuju: true,
      statusSertifikat: statuses[i % statuses.length],
    });
  }
  return items;
}

function lsReadAll(): Submission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Submission[];
  } catch {
    /* corrupted — reseed */
  }
  const seeded = seedSubmissions();
  localStorage.setItem(LS_KEY, JSON.stringify(seeded));
  return seeded;
}

function lsWriteAll(items: Submission[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

/* ---------- row mapping (snake_case DB ↔ camelCase app) ---------- */

interface SubmissionRow {
  id: string;
  ref: string;
  created_at: string;
  nama_lengkap: string;
  no_wa: string;
  email: string;
  universitas: string;
  jurusan: string;
  jenis_program: JenisProgram;
  jenis_program_lainnya: string | null;
  periode_mulai: string;
  periode_akhir: string;
  bagian: Submission["bagian"];
  sub_bagian: string;
  nama_program_surat: string;
  rating: Rating;
  manfaat: string;
  saran: string | null;
  status_sertifikat: StatusSertifikat;
}

function rowToSubmission(r: SubmissionRow): Submission {
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

function submissionToRow(s: FeedbackFormData) {
  return {
    nama_lengkap: s.namaLengkap,
    no_wa: s.noWa,
    email: s.email,
    universitas: s.universitas,
    jurusan: s.jurusan,
    jenis_program: s.jenisProgram,
    jenis_program_lainnya: s.jenisProgram === "Lainnya" ? s.jenisProgramLainnya ?? null : null,
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

/* ---------- public API ---------- */

export async function listSubmissions(): Promise<Submission[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as SubmissionRow[]).map(rowToSubmission);
  }
  return lsReadAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSubmission(id: string): Promise<Submission | null> {
  if (supabase) {
    const { data, error } = await supabase.from("submissions").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? rowToSubmission(data as SubmissionRow) : null;
  }
  return lsReadAll().find((s) => s.id === id) ?? null;
}

export async function createSubmission(data: FeedbackFormData): Promise<Submission> {
  if (supabase) {
    const { data: row, error } = await supabase
      .from("submissions")
      .insert(submissionToRow(data))
      .select("*")
      .single();
    if (error) throw error;
    return rowToSubmission(row as SubmissionRow);
  }
  const items = lsReadAll();
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const seq = items.filter((s) => s.ref.includes(ymd)).length + 1;
  const sub: Submission = {
    ...data,
    id: crypto.randomUUID(),
    ref: `FDBK-${ymd}-${String(seq).padStart(3, "0")}`,
    createdAt: now.toISOString(),
    statusSertifikat: "Belum",
  };
  items.push(sub);
  lsWriteAll(items);
  return sub;
}

export async function updateStatus(id: string, status: StatusSertifikat): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("submissions").update({ status_sertifikat: status }).eq("id", id);
    if (error) throw error;
    return;
  }
  const items = lsReadAll();
  const idx = items.findIndex((s) => s.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], statusSertifikat: status };
    lsWriteAll(items);
  }
}

export async function deleteSubmissions(ids: string[]): Promise<void> {
  if (!ids.length) return;
  if (isSupabaseMode) {
    const res = await fetch("/api/submissions/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "Gagal menghapus data submissions");
    }
    return;
  }
  const items = lsReadAll();
  lsWriteAll(items.filter((s) => !ids.includes(s.id)));
}

export async function getStats(): Promise<Stats> {
  if (supabase) {
    const { data, error } = await supabase.from("submissions").select("*");
    if (error) throw error;
    const items = (data as SubmissionRow[]).map(rowToSubmission);
    return computeStats(items);
  }
  return computeStats(lsReadAll());
}

function computeStats(items: Submission[]): Stats {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const ratingOrder: Rating[] = ["Sangat Baik", "Baik", "Cukup", "Kurang"];
  const bagianSet = [...new Set(items.map((s) => s.bagian))];

  const perBulan: Stats["perBulan"] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "short" });
    perBulan.push({ bulan: label, jumlah: items.filter((s) => s.createdAt.slice(0, 7) === key).length });
  }

  const ratingMap = new Map<Rating, number>();
  ratingOrder.forEach((r) => ratingMap.set(r, items.filter((s) => s.rating === r).length));

  return {
    total: items.length,
    avgRating: items.length
      ? Math.round((items.reduce((acc, s) => acc + (4 - ratingOrder.indexOf(s.rating)), 0) / items.length) * 10) / 10
      : 0,
    thisMonth: items.filter((s) => s.createdAt.slice(0, 7) === monthKey).length,
    belumProses: items.filter((s) => s.statusSertifikat === "Belum").length,
    perBulan,
    perRating: ratingOrder.map((r) => ({ rating: r, jumlah: ratingMap.get(r) ?? 0 })),
    perBagian: bagianSet.map((b) => ({ bagian: b, jumlah: items.filter((s) => s.bagian === b).length })),
  };
}

/* ---------- auth ---------- */

export async function loginAdmin(email: string, password: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(LS_SESSION, JSON.stringify({ email, at: Date.now() }));
    return true;
  }
  return false;
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  if (supabase) {
    // Supabase Auth session tersimpan di localStorage-nya sendiri; cek session
    const session = supabase.auth.getSession();
    // getSession async — fallback: cek access token di localStorage supabase
    return Boolean(
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-") && k.includes("-auth-token"))
        .some((k) => {
          try {
            const v = JSON.parse(localStorage.getItem(k) || "null");
            return v?.access_token;
          } catch {
            return false;
          }
        })
    );
  }
  return !!sessionStorage.getItem(LS_SESSION);
}

export function logoutAdmin() {
  if (supabase) {
    supabase.auth.signOut();
    return;
  }
  sessionStorage.removeItem(LS_SESSION);
}
