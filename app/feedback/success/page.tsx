import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";

export const metadata = { title: "Berhasil Terkirim — Feedback Magang" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const isBot = ref === "BOT-BLOCKED";

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {isBot ? "Pengiriman diblokir" : "Feedback berhasil dikirim"}
        </h1>
        {!isBot && ref && (
          <p className="mt-3 text-sm text-muted-foreground">
            Simpan nomor referensi Anda sebagai bukti pengisian:
          </p>
        )}
        {!isBot && ref && (
          <p className="mt-2 inline-block rounded-lg border border-border bg-card px-4 py-2 font-mono text-base font-semibold text-primary">
            {ref}
          </p>
        )}
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {isBot
            ? "Deteksi aktivitas tidak wajar. Jika Anda manusia, coba lagi dari awal."
            : "Terima kasih sudah mengisi feedback. Data Anda akan digunakan untuk evaluasi program dan penerbitan sertifikat."}
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button variant="outline">Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
