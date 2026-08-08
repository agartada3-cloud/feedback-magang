// app/page.tsx — Homepage feedback magang & Public Certificate Verification Engine
// Hallmark · macrostructure: Stat-Led · tone: utilitarian · anchor hue: indigo

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Clock3, Search, ShieldCheck, FileText, Building2, TrendingUp, Users } from "lucide-react";
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

      {/* Hero — Stat-Led: giant number IS the hook */}
      <section className="flex flex-1 flex-col justify-center px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto w-full max-w-4xl">
          <Reveal>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Program Magang / Penelitian / PKL
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="text-5xl font-bold leading-none tracking-tight text-foreground sm:text-6xl md:text-7xl">
              <span className="block text-muted-foreground">Bagikan pengalaman</span>
              <span className="block text-foreground">magang Anda</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Feedback Anda membantu kami meningkatkan program magang di PG Djatiroto. 
              Isi form, dapatkan sertifikat resmi dengan QR code verifikasi.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/feedback"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Isi Form Feedback
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => document.getElementById("verify")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <ShieldCheck className="h-4 w-4" />
                Verifikasi Sertifikat
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats Row — supporting data */}
      <section className="border-y border-border/60 bg-card/40 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <Stagger className="grid gap-6 sm:grid-cols-3">
            <StaggerItem>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">3 menit</p>
                  <p className="mt-1 text-xs text-muted-foreground">Waktu pengisian form</p>
                </div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                  <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">Otomatis</p>
                  <p className="mt-1 text-xs text-muted-foreground">Sertifikat langsung terbit</p>
                </div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
                  <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">QR Code</p>
                  <p className="mt-1 text-xs text-muted-foreground">Verifikasi anti-palsu</p>
                </div>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Verification Section */}
      <section id="verify" className="px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Verifikasi Keaslian Sertifikat
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Masukkan nomor referensi sertifikat untuk memeriksa keasliannya
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={handleVerify} className="mt-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value)}
                    placeholder="Contoh: FDBK-20260808-001"
                    className="h-12 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  Cek
                </button>
              </div>
            </form>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Atau scan QR code yang tertera di sertifikat Anda
            </p>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40 px-6 py-8">
        <div className="mx-auto max-w-4xl text-center text-xs text-muted-foreground">
          <p>© 2026 PT Sinergi Gula Nusantara — Pabrik Gula Djatiroto</p>
          <p className="mt-1">Sistem Feedback & Sertifikat Magang v1.0</p>
        </div>
      </footer>
    </main>
  );
}
