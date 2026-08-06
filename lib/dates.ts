// lib/dates.ts — VAR_TGL_TAKEN + format tanggal Indonesia

import { BULAN_ID } from "./constants";

/** Format YYYY-MM-DD → "02 Juni 2026" (leading zero) */
export function formatTanggalId(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso + (iso.length === 10 ? "T00:00:00" : "")) : iso;
  return `${String(d.getDate()).padStart(2, "0")} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format range: "1 Juni 2026 s.d. 31 Agustus 2026" */
export function formatPeriode(awal: string, akhir: string): string {
  return `${formatTanggalId(awal)} s.d. ${formatTanggalId(akhir)}`;
}

/** Libur nasional Indonesia 2026 (static seed — bisa upgrade ke API) */
const LIBUR_2026: string[] = [
  "2026-01-01", // Tahun Baru
  "2026-01-19", // Isra Mikraj
  "2026-02-17", // Tahun Baru Imlek
  "2026-03-09", // Nyepi
  "2026-03-20", // Wafat Isa Almasih
  "2026-03-21", // Cuti bersama Nyepi
  "2026-03-31", // Idul Fitri 1447 H (perkiraan)
  "2026-04-01",
  "2026-04-02", // Idul Fitri (lanjutan)
  "2026-04-03",
  "2026-05-01", // Hari Buruh
  "2026-05-10", // Waisak
  "2026-05-14", // Kenaikan Isa Almasih
  "2026-05-28", // Idul Adha (perkiraan)
  "2026-06-01", // Hari Lahir Pancasila
  "2026-06-17", // Tahun Baru Islam
  "2026-08-17", // Proklamasi
  "2026-08-19", // Maulid Nabi (perkiraan)
  "2026-12-25", // Natal
];

/**
 * Hitung tanggal "taken" (sertifikat diterbitkan): tgl_akhir + 1 hari,
 * skip Minggu (day 0) + libur nasional.
 */
export function hitungTanggalTaken(tglAkhir: string): string {
  const d = new Date(tglAkhir + "T00:00:00");
  d.setDate(d.getDate() + 1);
  // loop max 14 hari kalau libur panjang
  for (let i = 0; i < 14; i++) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const isSunday = d.getDay() === 0;
    const isLibur = LIBUR_2026.includes(iso);
    if (!isSunday && !isLibur) return iso;
    d.setDate(d.getDate() + 1);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
