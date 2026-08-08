// app/api/sertifikat/generate-csv/route.ts — POST CSV → bulk generate sertifikat
// CSV format: nama,program,bagian,sub_bagian,tgl_awal,tgl_akhir
// tgl format: YYYY-MM-DD. Header row wajib. Returns ZIP of PNGs.

import { NextResponse } from "next/server";
import JSZip from "jszip";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateCertificate } from "@/lib/cert-service";

interface CsvRow {
  nama: string;
  program?: string;
  bagian?: string;
  sub_bagian?: string;
  tgl_awal: string;
  tgl_akhir: string;
}

function parseCsv(text: string): CsvRow[] {
  // Strip BOM, split lines, parse dengan support quoted fields
  const clean = text.replace(/^﻿/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV harus punya header + minimal 1 baris data");

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iNama = idx("nama");
  const iAwal = idx("tgl_awal");
  const iAkhir = idx("tgl_akhir");
  if (iNama < 0 || iAwal < 0 || iAkhir < 0) {
    throw new Error("CSV wajib punya kolom: nama, tgl_awal, tgl_akhir. Opsional: program, bagian, sub_bagian");
  }

  return lines.slice(1).map((l) => {
    const cols = parseLine(l);
    return {
      nama: cols[iNama] ?? "",
      program: cols[idx("program")] || undefined,
      bagian: cols[idx("bagian")] || undefined,
      sub_bagian: cols[idx("sub_bagian")] || undefined,
      tgl_awal: cols[iAwal] ?? "",
      tgl_akhir: cols[iAkhir] ?? "",
    };
  }).filter((r) => r.nama && r.tgl_awal && r.tgl_akhir);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const scale = Number(form.get("scale") ?? 2) as 1 | 2 | 3;

    if (!file) return NextResponse.json({ error: "file CSV wajib diupload" }, { status: 400 });

    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) return NextResponse.json({ error: "CSV kosong / tidak ada baris valid" }, { status: 400 });

    // Insert setiap row sebagai submission minimal (supaya bisa diproses cert-service)
    const results: { nama: string; ok: boolean; ref?: string; error?: string }[] = [];
    const zip = new JSZip();

    for (const r of rows) {
      try {
        // Insert minimal submission row — field lain dikasih default placeholder
        const now = new Date();
        const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        const { count } = await supabaseAdmin
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .like("ref", `FDBK-${ymd}-%`);
        const seq = (count ?? 0) + 1;
        const ref = `FDBK-${ymd}-${String(seq).padStart(3, "0")}`;

        const { data: inserted, error: insErr } = await supabaseAdmin
          .from("submissions")
          .insert({
            ref,
            nama_lengkap: r.nama,
            no_wa: "-",
            email: "-",
            universitas: "-",
            jurusan: "-",
            jenis_program: r.program ?? "Magang",
            nama_program_surat: r.program ?? "Magang",
            bagian: r.bagian ?? "-",
            sub_bagian: r.sub_bagian ?? null,
            periode_mulai: r.tgl_awal,
            periode_akhir: r.tgl_akhir,
            rating: "Baik",
            kesan: "-",
            manfaat: "-",
            saran: null,
            setuju: true,
            status_sertifikat: "Belum",
          })
          .select("id")
          .single();

        if (insErr) throw new Error(insErr.message);

        // Generate sertifikat
        const gen = await generateCertificate(inserted.id, scale);
        if (!gen.ok) throw new Error(gen.error ?? "generate failed");

        // Ambil PNG dari storage → masukin ZIP
        const clean = gen.path!.replace(/^hasil\//, "");
        const { data: blob } = await supabaseAdmin.storage.from("hasil").download(clean);
        if (blob) {
          const safeName = r.nama.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "_");
          zip.file(`${safeName}_${ref}.png`, Buffer.from(await blob.arrayBuffer()));
        }

        results.push({ nama: r.nama, ok: true, ref });
      } catch (e) {
        results.push({ nama: r.nama, ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }

    const okCount = results.filter((r) => r.ok).length;
    if (okCount === 0) {
      return NextResponse.json({ error: "Semua baris gagal diproses", results }, { status: 500 });
    }

    const zipBuf = await zip.generateAsync({ type: "nodebuffer" });
    return new NextResponse(new Uint8Array(zipBuf), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="sertifikat_bulk_${Date.now()}.zip"`,
        "X-Results": encodeURIComponent(JSON.stringify(results)),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
