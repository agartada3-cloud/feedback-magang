import type { FeedbackFormData, JenisProgram, Rating, Stats, StatusSertifikat, Submission } from "./types";

/**
 * Data layer — Supabase-ready.
 *
 * Saat env NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY tersedia,
 * ganti implementasi di bawah dengan @supabase/supabase-js. Kontrak fungsi
 * (list/get/create/updateStatus/stats) sudah disesuaikan biar swap-nya tinggal
 * ganti isi fungsi, bukan pemanggilnya.
 */

const LS_KEY = "feedback_magang_submissions";
const LS_SESSION = "feedback_magang_admin";

export const ADMIN_EMAIL = "admin@pgdjatiroto.web.id";
export const ADMIN_PASSWORD = "admin123"; // TODO: pindah ke Supabase Auth

/* ---------- seed data (mock, buat demo) ---------- */

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

/* ---------- storage helpers ---------- */

function readAll(): Submission[] {
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

function writeAll(items: Submission[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

/* ---------- public API (Supabase-compatible contract) ---------- */

export async function listSubmissions(): Promise<Submission[]> {
  // Supabase: supabase.from("submissions").select("*").order("createdAt", {ascending: false})
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSubmission(id: string): Promise<Submission | null> {
  return readAll().find((s) => s.id === id) ?? null;
}

export async function createSubmission(data: FeedbackFormData): Promise<Submission> {
  // Supabase: supabase.from("submissions").insert(row).select().single()
  const items = readAll();
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
  writeAll(items);
  return sub;
}

export async function updateStatus(id: string, status: StatusSertifikat): Promise<void> {
  // Supabase: supabase.from("submissions").update({statusSertifikat: status}).eq("id", id)
  const items = readAll();
  const idx = items.findIndex((s) => s.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], statusSertifikat: status };
    writeAll(items);
  }
}

export async function getStats(): Promise<Stats> {
  const items = readAll();
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

/* ---------- auth (mock — ganti dengan Supabase Auth) ---------- */

export async function loginAdmin(email: string, password: string): Promise<boolean> {
  // Supabase: supabase.auth.signInWithPassword({email, password})
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(LS_SESSION, JSON.stringify({ email, at: Date.now() }));
    return true;
  }
  return false;
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!sessionStorage.getItem(LS_SESSION);
}

export function logoutAdmin() {
  sessionStorage.removeItem(LS_SESSION);
}
