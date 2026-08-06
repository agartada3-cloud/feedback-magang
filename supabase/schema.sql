-- ============================================================
-- Supabase Schema — Form Feedback Magang / Penelitian / PKL
-- PG Djatiroto · Jalankan di SQL Editor Supabase (sekali saja)
-- ============================================================

-- ---------- 1. Enum types ----------
create type public.jenis_program as enum ('Magang', 'Penelitian', 'Praktik Kerja Lapangan (PKL)', 'Lainnya');
create type public.bagian_divisi as enum ('Keuangan dan Umum', 'Quality Assurance', 'Tanaman TR', 'Teknik', 'Pengolahan');
create type public.rating as enum ('Sangat Baik', 'Baik', 'Cukup', 'Kurang');
create type public.status_sertifikat as enum ('Belum', 'Proses', 'Terbit');

-- ---------- 2. Table submissions ----------
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,                       -- FDBK-YYYYMMDD-NNN
  created_at timestamptz not null default now(),

  -- Data Peserta
  nama_lengkap text not null,
  no_wa text not null check (no_wa ~ '^(08|62|628)[0-9]{8,13}$'),
  email text not null check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  universitas text not null,
  jurusan text not null,
  jenis_program public.jenis_program not null,
  jenis_program_lainnya text,                     -- wajib kalau jenis_program = 'Lainnya'
  periode_mulai date not null,
  periode_akhir date not null,
  bagian public.bagian_divisi not null,
  sub_bagian text not null,
  nama_program_surat text not null,

  -- Umpan Balik
  rating public.rating not null,
  manfaat text not null,
  saran text,

  -- Status admin
  status_sertifikat public.status_sertifikat not null default 'Belum',

  -- constraint periode: akhir >= mulai & rentang maks 24 bulan
  constraint chk_periode_urut check (periode_akhir >= periode_mulai),
  constraint chk_periode_max check (periode_akhir <= periode_mulai + interval '24 months'),

  constraint chk_lainnya_wajib check (
    (jenis_program = 'Lainnya' and jenis_program_lainnya is not null and length(trim(jenis_program_lainnya)) > 0)
    or (jenis_program <> 'Lainnya')
  )
);

comment on table public.submissions is 'Feedback program magang/penelitian/PKL — pengganti form Jotform';
create index idx_submissions_created_at on public.submissions (created_at desc);
create index idx_submissions_bagian on public.submissions (bagian);
create index idx_submissions_status on public.submissions (status_sertifikat);

-- ---------- 3. Nomor referensi otomatis (trigger) ----------
-- ref = FDBK-<YYYYMMDD>-<NNN> ; NNN = urutan submission hari itu
create or replace function public.gen_submission_ref()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  day_count int;
  seq int;
begin
  select count(*) into day_count
  from public.submissions
  where created_at::date = new.created_at::date;

  seq := day_count + 1;
  new.ref := 'FDBK-' || to_char(new.created_at, 'YYYYMMDD') || '-' || lpad(seq::text, 3, '0');
  return new;
end;
$$;

create trigger trg_submissions_ref
  before insert on public.submissions
  for each row
  when (new.ref is null or new.ref = '')
  execute function public.gen_submission_ref();

-- ---------- 4. Row Level Security ----------
alter table public.submissions enable row level security;

-- Admin role: dibuat manual via dashboard Supabase (Authentication > Users)
-- lalu assign:  grant usage on schema public to authenticated;
-- (Supabase default sudah grant — cukup pastikan user admin terdaftar)

-- Siapa pun boleh INSERT (form publik, anon)
create policy "pub_insert_submissions"
  on public.submissions for insert
  to anon, authenticated
  with check (true);

-- Hanya user yang sudah login (admin) boleh SELECT
create policy "auth_select_submissions"
  on public.submissions for select
  to authenticated
  using (true);

-- Hanya admin boleh UPDATE status sertifikat
create policy "auth_update_status_submissions"
  on public.submissions for update
  to authenticated
  using (true)
  with check (true);

-- DELETE: tidak disediakan di v1 (read-only + status saja)

-- ---------- 5. Admin user (jalankan manual setelah bikin user di dashboard) ----------
-- 1. Dashboard Supabase > Authentication > Users > Add user
--    email: admin@pgdjatiroto.web.id · password: (pilih kuat)
-- 2. Jalankan query ini setelah user ada:
--
--    update auth.users set raw_app_meta_data =
--      jsonb_set(coalesce(raw_app_meta_data,'{}'::jsonb), '{role}', '"admin"')
--    where email = 'admin@pgdjatiroto.web.id';
--
-- (Role admin dipakai opsional — v1 cukup "sudah login = bisa akses admin panel")
