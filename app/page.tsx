// app/page.tsx — Homepage feedback magang & Public Certificate Verification Engine

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Clock3, Search, ShieldCheck, FileText, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

export default function Home() {
  const router = useRouter();
  const [refInput, setRefInput] = React.useState("");

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!refInput.trim()) return;
    router.push(`/verify/${encodeURIComponent(refInput.trim())}`);
  }

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Banner */}
      <div className="border-b border-border/60 bg-card/60 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          PG Djatiroto — PT Sinergi Gula Nusantara
        </span>
        <span className="mx-2 text-border">•</span>
        <span>Sistem Feedback & Generator Sertifikat Resmi</span>
      </div>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 pt-16 pb-12 text-center">
        <Reveal>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Program Magang / Penelitian / PKL
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            Bagikan pengalaman magang Anda di PG Djatiroto
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Isi feedback singkat dalam ±2 menit. Data Anda digunakan untuk evaluasi program & penerbitan sertifikat resmi.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/feedback"
              className="inline-flex h-12 min-h-[44px] items-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary-hover hover:shadow-lg active:scale-[0.98]"
            >
              Isi Formulir Feedback
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex h-12 min-h-[44px] items-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Portal Admin
            </Link>
          </div>
        </Reveal>

        {/* Public Certificate Verification Search Box */}
        <Reveal delay={0.32}>
          <div className="mt-12 w-full max-w-xl rounded-2xl border border-emerald-200 bg-white p-5 shadow-lg dark:border-emerald-900/50 dark:bg-zinc-900/90">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" /> Verifikasi Keaslian Sertifikat
              </div>
              <span className="text-[11px] text-muted-foreground">Pencarian Publik</span>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  placeholder="No. Referensi (contoh: FDBK-20260331-001)"
                  className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs font-mono font-medium text-foreground outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
              >
                <ShieldCheck className="h-4 w-4" />
                Cek Keaslian
              </button>
            </form>
          </div>
        </Reveal>
      </section>

      {/* Feature Cards */}
      <Stagger className="mx-auto grid w-full max-w-4xl gap-4 px-6 pb-20 sm:grid-cols-3">
        <StaggerItem>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="space-y-2 pt-5">
              <Clock3 className="h-5 w-5 text-primary" aria-hidden />
              <p className="text-sm font-semibold text-foreground">±2 Menit Singkat</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Formulir 3 langkah mudah — cepat, tidak bertele-tele.
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="space-y-2 pt-5">
              <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Sertifikat Otomatis</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Nama & program sesuai surat kampus di-generate instant.
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="space-y-2 pt-5">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Verifikasi Sah Publik</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Cek keaslian sertifikat kapan saja via kode referensi.
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </Stagger>
    </main>
  );
}
