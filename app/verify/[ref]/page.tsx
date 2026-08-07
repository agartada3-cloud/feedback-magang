// app/verify/[ref]/page.tsx — Public Certificate Verification Page

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, ShieldCheck, Download, Award, ArrowLeft, Building2 } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-server";

interface PageProps {
  params: Promise<{ ref: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ref } = await params;
  return {
    title: `Verifikasi Sertifikat #${ref} — PT Sinergi Gula Nusantara`,
    description: `Halaman resmi verifikasi keaslian sertifikat magang / penelitian PG Djatiroto referensi ${ref}.`,
  };
}

export default async function VerifyPage({ params }: PageProps) {
  const { ref } = await params;
  const decodedRef = decodeURIComponent(ref);
  const cleanRef = decodedRef.trim();
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(cleanRef);

  // 1. Search DB using supabaseAdmin
  let sub: any = null;
  try {
    let query = supabaseAdmin.from("submissions").select("*");
    if (isUuid) {
      query = query.or(`ref.ilike.${cleanRef},id.eq.${cleanRef}`);
    } else {
      query = query.ilike("ref", cleanRef);
    }
    const { data, error } = await query.maybeSingle();
    if (error) console.error("Supabase query error:", error.message);
    sub = data;
  } catch (e) {
    console.error("Supabase verify query exception:", e);
  }

  // 2. Fallback for demo / offline mode
  if (!sub) {
    try {
      const { listSubmissions } = await import("@/lib/store");
      const all = await listSubmissions();
      const match = all.find(
        (s) => s.ref.toLowerCase() === cleanRef.toLowerCase() || s.id === cleanRef
      );
      if (match) {
        // Map camelCase to snake_case for UI rendering compatibility
        sub = {
          id: match.id,
          ref: match.ref,
          nama_lengkap: match.namaLengkap,
          nama_program_surat: match.namaProgramSurat,
          jenis_program: match.jenisProgram,
          universitas: match.universitas,
          jurusan: match.jurusan,
          bagian: match.bagian,
          sub_bagian: match.subBagian,
          periode_mulai: match.periodeMulai,
          periode_akhir: match.periodeAkhir,
        };
      }
    } catch {
      /* ignore */
    }
  }

  const isVerified = Boolean(sub);

  return (
    <main className="min-h-screen bg-zinc-50 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4">
        {/* Top Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Form Feedback
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <Building2 className="h-4 w-4 text-emerald-600" />
            PG Djatiroto — PT Sinergi Gula Nusantara
          </div>
        </div>

        {isVerified && sub ? (
          <div className="space-y-6">
            {/* Verified Header Badge */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> RESMI & TERVERIFIKASI
              </span>
              <h1 className="mt-3 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                Sertifikat Magang Sah & Valid
              </h1>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                Sertifikat dengan nomor referensi <code className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{sub.ref}</code> terdaftar resmi dalam basis data PT Sinergi Gula Nusantara - Pabrik Gula Djatiroto.
              </p>
            </div>

            {/* Certificate Meta Details */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Details Peserta & Program
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs text-zinc-400">Nama Penerima:</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{sub.nama_lengkap.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-400">No. Referensi:</span>
                  <p className="font-mono font-medium text-indigo-600 dark:text-indigo-400">{sub.ref}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-400">Program:</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{sub.nama_program_surat || sub.jenis_program}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-400">Instansi / Kampus:</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{sub.universitas} ({sub.jurusan})</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-400">Bagian:</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{sub.bagian} {sub.sub_bagian ? `— ${sub.sub_bagian}` : ""}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-400">Periode Magang:</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{sub.periode_mulai} s/d {sub.periode_akhir}</p>
                </div>
              </div>
            </div>

            {/* Certificate Preview Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Pratinjau Sertifikat Keahlian
                </h2>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/sertifikat/download?id=${sub.id}&download=1`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Download className="h-3.5 w-3.5" /> PNG
                  </a>
                  <a
                    href={`/api/sertifikat/download?id=${sub.id}&pdf=1`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </a>
                </div>
              </div>

              <div className="relative aspect-[2000/1414] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/sertifikat/download?id=${sub.id}&inline=1`}
                  alt={`Sertifikat ${sub.nama_lengkap}`}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Unverified / Invalid Reference State */
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center shadow-sm dark:border-red-900/60 dark:bg-red-950/40">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
              <XCircle className="h-8 w-8" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 dark:bg-red-900/80 dark:text-red-200">
              TIDAK DITEMUKAN
            </span>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
              Sertifikat Tidak Ditemukan / Tidak Valid
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              Kode sertifikat <code className="font-mono font-bold text-red-700 dark:text-red-300">{decodedRef}</code> tidak cocok dengan sertifikat manapun dalam sistem database PG Djatiroto. Mohon periksa kembali nomor referensi atau hubungi pihak pengelola magang.
            </p>

            <div className="mt-6">
              <Link
                href="/feedback"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Ke Halaman Utama Feedback
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
