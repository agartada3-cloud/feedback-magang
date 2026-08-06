"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button, FormField, Input, Progress, Select, Textarea } from "@/components/ui";
import { createSubmission } from "@/lib/store";
import type { FeedbackFormData } from "@/lib/types";

const WA_REGEX = /^(08|62|628)\d{8,13}$/;
const DRAFT_KEY = "feedback_magang_draft";
const HONEYPOT_KEY = "website"; // field umpan anti-bot, hidden

const schema = z.object({
  namaLengkap: z.string().min(3, "Minimal 3 karakter"),
  noWa: z.string().regex(WA_REGEX, "Format WA tidak valid (08xx / 62xx / 628xx, 9-15 digit)"),
  email: z.string().email("Format email tidak valid"),
  universitas: z.string().min(3, "Minimal 3 karakter"),
  jurusan: z.string().min(3, "Minimal 3 karakter"),
  jenisProgram: z.enum(["Magang", "Penelitian", "Praktik Kerja Lapangan (PKL)", "Lainnya"]),
  jenisProgramLainnya: z.string().optional(),
  periodeMulai: z.string().min(1, "Wajib diisi"),
  periodeAkhir: z.string().min(1, "Wajib diisi"),
  bagian: z.enum(["Keuangan dan Umum", "Quality Assurance", "Tanaman TR", "Teknik", "Pengolahan"]),
  subBagian: z.string().min(2, "Minimal 2 karakter"),
  namaProgramSurat: z.string().min(3, "Minimal 3 karakter"),
  rating: z.enum(["Sangat Baik", "Baik", "Cukup", "Kurang"]),
  manfaat: z.string().min(20, "Minimal 20 karakter"),
  saran: z.string().optional(),
  setuju: z.boolean().refine((v) => v === true, "Harus menyetujui pernyataan"),
  [HONEYPOT_KEY]: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const JENIS_PROGRAM = ["Magang", "Penelitian", "Praktik Kerja Lapangan (PKL)", "Lainnya"] as const;
const BAGIAN = ["Keuangan dan Umum", "Quality Assurance", "Tanaman TR", "Teknik", "Pengolahan"] as const;
const RATINGS = ["Sangat Baik", "Baik", "Cukup", "Kurang"] as const;

const STEPS = ["Data Peserta", "Umpan Balik", "Pernyataan"];

export default function FeedbackForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      jenisProgram: undefined,
      bagian: undefined,
      rating: undefined,
      setuju: false,
      website: "",
    },
  });

  const { watch, setValue, trigger, getValues } = form;
  const jenisProgram = watch("jenisProgram");
  const setuju = watch("setuju");

  /* auto-save draft ke localStorage */
  React.useEffect(() => {
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } catch {
        /* quota — abaikan */
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  /* restore draft */
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.entries(parsed).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") setValue(k as keyof FormValues, v as never, { shouldValidate: false });
        });
      }
    } catch {
      /* corrupted draft — abaikan */
    }
  }, [setValue]);

  const stepFields: (keyof FormValues)[][] = [
    ["namaLengkap", "noWa", "email", "universitas", "jurusan", "jenisProgram", "jenisProgramLainnya", "periodeMulai", "periodeAkhir", "bagian", "subBagian", "namaProgramSurat"],
    ["rating", "manfaat", "saran"],
    ["setuju"],
  ];

  async function nextStep() {
    const ok = await trigger(stepFields[step] as (keyof FormValues)[]);
    if (!ok) return;
    // validasi silang periode
    const m = getValues("periodeMulai");
    const a = getValues("periodeAkhir");
    if (step === 0 && m && a) {
      const start = new Date(m);
      const end = new Date(a);
      if (end < start) {
        form.setError("periodeAkhir", { type: "manual", message: "Akhir program tidak boleh sebelum tanggal mulai" });
        return;
      }
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      if (months > 24) {
        form.setError("periodeAkhir", { type: "manual", message: "Rentang maksimal 24 bulan" });
        return;
      }
    }
    if (step === 0 && jenisProgram === "Lainnya" && !getValues("jenisProgramLainnya")?.trim()) {
      form.setError("jenisProgramLainnya", { type: "manual", message: "Tuliskan program lainnya" });
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prevStep() {
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    // honeypot: kalau keisi → anggap bot, jangan submit
    if (values.website) {
      router.push("/feedback/success?ref=BOT-BLOCKED");
      return;
    }
    setSubmitting(true);
    try {
      const data: FeedbackFormData = {
        namaLengkap: values.namaLengkap,
        noWa: values.noWa,
        email: values.email,
        universitas: values.universitas,
        jurusan: values.jurusan,
        jenisProgram: values.jenisProgram,
        jenisProgramLainnya: values.jenisProgram === "Lainnya" ? values.jenisProgramLainnya : undefined,
        periodeMulai: values.periodeMulai,
        periodeAkhir: values.periodeAkhir,
        bagian: values.bagian,
        subBagian: values.subBagian,
        namaProgramSurat: values.namaProgramSurat,
        rating: values.rating,
        manfaat: values.manfaat,
        saran: values.saran || undefined,
        setuju: values.setuju,
      };
      const sub = await createSubmission(data);
      localStorage.removeItem(DRAFT_KEY);
      router.push(`/feedback/success?ref=${sub.ref}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Gagal mengirim. Coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      {/* Stepper header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div className="mx-2 h-px flex-1 bg-border" />}
              <div className={`flex items-center gap-1.5 ${i === step ? "text-primary" : i < step ? "text-success" : "text-muted-foreground"}`}>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : i < step
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <Progress value={((step + 1) / 3) * 100} className="mt-4" />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Honeypot — hidden from humans */}
        <input
          type="text"
          {...form.register(HONEYPOT_KEY)}
          tabIndex={-1}
          autoComplete="off"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          aria-hidden="true"
        />

        {step === 0 && (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
              Data di bawah ini akan digunakan <span className="font-medium text-foreground">secara persis</span> untuk penerbitan sertifikat. Pastikan penulisan sesuai identitas & surat resmi kampus.
            </div>
            <FormField label="Nama Lengkap" required error={form.formState.errors.namaLengkap?.message}>
              <Input placeholder="Contoh: Ahmad Fauzi" {...form.register("namaLengkap")} />
            </FormField>
            <FormField label="No. WA Aktif" required hint="Untuk konfirmasi sertifikat" error={form.formState.errors.noWa?.message}>
              <Input placeholder="08xxxxxxxxxx" inputMode="tel" {...form.register("noWa")} />
            </FormField>
            <FormField label="Email" required error={form.formState.errors.email?.message}>
              <Input placeholder="nama@email.com" type="email" {...form.register("email")} />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Asal Universitas / Institusi" required error={form.formState.errors.universitas?.message}>
                <Input placeholder="Nama kampus / institusi" {...form.register("universitas")} />
              </FormField>
              <FormField label="Jurusan / Program Studi" required error={form.formState.errors.jurusan?.message}>
                <Input placeholder="Nama jurusan" {...form.register("jurusan")} />
              </FormField>
            </div>
            <FormField label="Jenis Program" required error={form.formState.errors.jenisProgram?.message}>
              <Select {...form.register("jenisProgram")}>
                <option value="">Pilih jenis program</option>
                {JENIS_PROGRAM.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </Select>
            </FormField>
            {jenisProgram === "Lainnya" && (
              <FormField label="Lainnya, yaitu" required error={form.formState.errors.jenisProgramLainnya?.message}>
                <Input placeholder="Tuliskan nama program" {...form.register("jenisProgramLainnya")} />
              </FormField>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Periode Mulai" required error={form.formState.errors.periodeMulai?.message}>
                <Input type="date" {...form.register("periodeMulai")} />
              </FormField>
              <FormField label="Periode Akhir" required error={form.formState.errors.periodeAkhir?.message}>
                <Input type="date" {...form.register("periodeAkhir")} />
              </FormField>
            </div>
            <FormField label="Penempatan Bagian/Divisi" required error={form.formState.errors.bagian?.message}>
              <Select {...form.register("bagian")}>
                <option value="">Pilih bagian</option>
                {BAGIAN.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Penempatan Spesifik / Sub Bagian" required error={form.formState.errors.subBagian?.message}>
              <Input placeholder="Contoh: Sub QA & Konten" {...form.register("subBagian")} />
            </FormField>
            <FormField label="Nama Program Sesuai Surat Kampus" required hint="Contoh: Magang Wajib, Magang MBKM, PKL" error={form.formState.errors.namaProgramSurat?.message}>
              <Input placeholder="Nama program di surat resmi" {...form.register("namaProgramSurat")} />
            </FormField>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <FormField label="Penilaian Pengalaman Secara Umum" required error={form.formState.errors.rating?.message}>
              <div className="grid gap-2 sm:grid-cols-2">
                {RATINGS.map((r) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-sm transition-colors ${
                      getValues("rating") === r
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      value={r}
                      checked={getValues("rating") === r}
                      onChange={() => setValue("rating", r, { shouldValidate: true })}
                      className="h-4 w-4 accent-primary"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </FormField>
            <FormField label="Manfaat dan Kompetensi yang Diperoleh" required hint="Jelaskan pengetahuan, keterampilan, atau pengalaman yang diperoleh." error={form.formState.errors.manfaat?.message}>
              <Textarea placeholder="Contoh: belajar komunikasi tim, editing video, manajemen konten…" {...form.register("manfaat")} />
            </FormField>
            <FormField label="Saran dan Masukan" hint="Saran untuk peningkatan pelaksanaan program ke depan." error={form.formState.errors.saran?.message}>
              <Textarea placeholder="Opsional" {...form.register("saran")} />
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/50 px-4 py-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={setuju}
                  onChange={(e) => setValue("setuju", e.target.checked, { shouldValidate: true })}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="text-sm leading-relaxed text-foreground">
                  Saya menyatakan bahwa seluruh data yang saya isi adalah <span className="font-medium">benar dan dapat dipertanggungjawabkan</span> serta digunakan untuk keperluan evaluasi dan penerbitan sertifikat.
                </span>
              </label>
            </div>
            {form.formState.errors.setuju && (
              <p className="text-xs font-medium text-error" role="alert">{form.formState.errors.setuju.message}</p>
            )}
            <div className="rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
              Setelah dikirim, Anda akan menerima <span className="font-medium text-foreground">nomor referensi</span> sebagai bukti pengisian form.
            </div>
          </div>
        )}

        {submitError && (
          <p className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              Sebelumnya
            </Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <Button type="button" onClick={nextStep}>
              Selanjutnya
            </Button>
          ) : (
            <Button type="submit" loading={submitting} disabled={!setuju}>
              {submitting ? "Mengirim…" : "Kirim"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
