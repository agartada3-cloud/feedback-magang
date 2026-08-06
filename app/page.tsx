import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock3, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero — Decide/Learn surface: satu pesan, satu CTA */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <Reveal>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            PG Djatiroto · Program Magang / Penelitian / PKL
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Bagikan pengalaman magang Anda di PG Djatiroto
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Isi feedback dalam ±2 menit. Data Anda digunakan untuk evaluasi program dan penerbitan sertifikat magang.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/feedback"
              className="inline-flex h-12 min-h-[44px] items-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover active:scale-[0.98]"
            >
              Isi Formulir
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex h-12 min-h-[44px] items-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Admin
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 3 hal singkat — bukan feature grid kosong, tiap poin punya isi nyata */}
      <Stagger className="mx-auto grid w-full max-w-4xl gap-4 px-6 pb-20 sm:grid-cols-3">
        <StaggerItem>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="space-y-2 pt-4">
              <Clock3 className="h-5 w-5 text-primary" aria-hidden />
              <p className="text-sm font-semibold text-foreground">±2 menit</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Form 3 langkah singkat — tidak bertele-tele.
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="space-y-2 pt-4">
              <BadgeCheck className="h-5 w-5 text-success" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Data dipakai persis</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Nama & program sesuai surat kampus untuk sertifikat.
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="space-y-2 pt-4">
              <FileText className="h-5 w-5 text-info" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Nomor referensi</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Bukti pengisian setelah form dikirim.
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </Stagger>
    </main>
  );
}
