# Feedback Magang — PG Djatiroto

Web app pengganti form Jotform untuk **Feedback Program Magang / Penelitian / PKL** di PG Djatiroto. Form publik multi-step + admin dashboard rekap submission.

## Stack

- **Next.js 16** (App Router, TypeScript) + TailwindCSS v4
- **UI**: hand-rolled components (indigo/zinc/Inter, dark mode) — mengikuti PRD `Second-Brain/Humas/prd-form-feedback-magang.md`
- **Form**: react-hook-form + zod (validasi real-time)
- **Charts**: recharts (bar + donut)
- **Data**: `lib/store.ts` (localStorage stub, Supabase-ready) → ganti ke Supabase saat env tersedia (`lib/supabase.ts`)

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start
```

## Supabase setup

1. Buat project di [supabase.com](https://supabase.com)
2. Jalankan `supabase/schema.sql` di SQL Editor (tabel `submissions` + RLS + trigger ref otomatis)
3. Isi `.env.local` dari `.env.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Dashboard Supabase > Authentication > Add user `admin@pgdjatiroto.web.id` (password kuat)
5. Ganti implementasi `lib/store.ts` → `lib/supabase.ts` (kontrak fungsi sama: `listSubmissions`, `getSubmission`, `createSubmission`, `updateStatus`, `getStats`, `loginAdmin`)

## Routes

| Route | Fungsi |
|---|---|
| `/` | Landing |
| `/feedback` | Form 3 langkah (Data Peserta → Umpan Balik → Pernyataan) |
| `/feedback/success` | Konfirmasi + nomor referensi `FDBK-YYYYMMDD-NNN` |
| `/admin/login` | Login admin (demo: `admin@pgdjatiroto.web.id` / `admin123`) |
| `/admin/dashboard` | KPI + chart (submission/bulan, rating, per bagian) |
| `/admin/submissions` | Tabel + search/filter/sort/pagination + export CSV |
| `/admin/submissions/[id]` | Detail jawaban + status sertifikat + link WA |

## Demo credentials (localStorage stub)

`admin@pgdjatiroto.web.id` / `admin123`

## Fitur validasi form

- WA: regex `^(08|62|628)\d{8,13}$`
- Email valid
- Periode: `Akhir ≥ Mulai`, rentang maks 24 bulan
- "Lainnya" → field penjelasan wajib (conditional)
- Honeypot anti-bot + auto-save draft localStorage
- Checkbox pernyataan wajib sebelum submit
