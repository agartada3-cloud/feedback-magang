// app/api/generate-batch/route.ts — POST generate semua → ZIP
// Catatan Vercel free tier: batas body 4.5MB → batch besar bisa timeout.
// Strategy: proses berurutan, stream ZIP (fallback: per-file download).

import { NextResponse } from "next/server";
import JSZip from "jszip";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateCertificate } from "@/lib/cert-service";
import { storagePathFor } from "@/lib/render/rasterize";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scale = 3, feedback_ids } = body as { scale?: 1 | 2 | 3; feedback_ids?: string[] };

    // kalau tidak dikirim ids → ambil semua dari view
    let ids = feedback_ids;
    if (!ids?.length) {
      const { data } = await supabaseAdmin.from("cert_input").select("feedback_id");
      ids = (data ?? []).map((r) => r.feedback_id);
    }

    const zip = new JSZip();
    const results: { feedback_id: string; ok: boolean; error?: string }[] = [];

    for (const fid of ids) {
      const res = await generateCertificate(fid, scale);
      results.push({ feedback_id: fid, ok: res.ok, error: res.error });
      if (res.ok && res.path) {
        // ambil PNG dari storage untuk dimasukkan ZIP
        const clean = res.path.replace(/^hasil\//, "");
        const { data: blob } = await supabaseAdmin.storage.from("hasil").download(clean);
        if (blob) {
          const fileName = `${fid}_${scale}x.png`;
          zip.file(fileName, Buffer.from(await blob.arrayBuffer()));
        }
      }
    }

    const zipBuf = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(zipBuf), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="sertifikat_${scale}x_${Date.now()}.zip"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
