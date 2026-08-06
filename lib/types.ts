export type JenisProgram = "Magang" | "Penelitian" | "Praktik Kerja Lapangan (PKL)" | "Lainnya";
export type Bagian = "Keuangan dan Umum" | "Quality Assurance" | "Tanaman TR" | "Teknik" | "Pengolahan";
export type Rating = "Sangat Baik" | "Baik" | "Cukup" | "Kurang";
export type StatusSertifikat = "Belum" | "Proses" | "Terbit";

export interface FeedbackFormData {
  namaLengkap: string;
  noWa: string;
  email: string;
  universitas: string;
  jurusan: string;
  jenisProgram: JenisProgram;
  jenisProgramLainnya?: string;
  periodeMulai: string; // ISO yyyy-mm-dd
  periodeAkhir: string;
  bagian: Bagian;
  subBagian: string;
  namaProgramSurat: string;
  rating: Rating;
  manfaat: string;
  saran?: string;
  setuju: boolean;
}

export interface Submission extends FeedbackFormData {
  id: string;
  ref: string; // FDBK-YYYYMMDD-NNN
  createdAt: string; // ISO
  statusSertifikat: StatusSertifikat;
}

export interface Stats {
  total: number;
  avgRating: number;
  thisMonth: number;
  belumProses: number;
  perBulan: { bulan: string; jumlah: number }[];
  perRating: { rating: Rating; jumlah: number }[];
  perBagian: { bagian: string; jumlah: number }[];
}
