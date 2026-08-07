// app/api/sertifikat/generate-zip/route.ts — Batch ZIP Generator API

import { NextResponse } from "next/server";
import JSZip from "jszip";
import { generateCertificate } from "@/lib/cert-service";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids } = body as { ids?: string[] };

    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: "Missing submission ids" }, { status: 400 });
    }

    const zip = new JSZip();
    const certFolder = zip.folder("sertifikat") || zip;

    for (const feedbackId of ids) {
      try {
        // Generate or get certificate
        const gen = await generateCertificate(feedbackId, 3);
        if (!gen.path) continue;

        // Fetch PNG from Supabase storage
        const cleanPath = gen.path.replace(/^hasil\//, "");
        const { data: blob } = await supabaseAdmin.storage
          .from("hasil")
          .download(cleanPath);

        if (blob) {
          const arr = await blob.arrayBuffer();
          const buffer = Buffer.from(arr);

          // Get participant info for clean filename
          const { data: sub } = await supabaseAdmin
            .from("submissions")
            .select("nama_lengkap, ref")
            .eq("id", feedbackId)
            .maybeSingle();

          const safeName = (sub?.nama_lengkap || "peserta").replace(/[^a-zA-Z0-9_-]/g, "_");
          const refCode = sub?.ref || feedbackId.slice(0, 8);
          const fileName = `${safeName}_${refCode}.png`;

          certFolder.file(fileName, buffer);
        }
      } catch (e) {
        console.error(`Failed to generate zip item for ${feedbackId}:`, e);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="sertifikat-batch-${new Date().toISOString().slice(0, 10)}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
