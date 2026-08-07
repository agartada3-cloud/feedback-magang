import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateCertificate } from "@/lib/cert-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const feedbackId = searchParams.get("id");
    const isPdf = searchParams.get("pdf") === "1" || searchParams.get("format") === "pdf";
    const format = isPdf ? "pdf" : "png";
    const isInline = searchParams.get("inline") === "1" || searchParams.get("preview") === "1";

    if (!feedbackId) {
      return NextResponse.json({ error: "Missing feedback_id" }, { status: 400 });
    }

    // Get submission info to get applicant name for clean filename
    const { data: sub } = await supabaseAdmin
      .from("submissions")
      .select("nama_lengkap, ref")
      .eq("id", feedbackId)
      .maybeSingle();

    // Query cert_generated for existing certificate record
    const { data: certs } = await supabaseAdmin
      .from("cert_generated")
      .select("storage_path, status")
      .eq("feedback_id", feedbackId)
      .order("created_at", { ascending: false })
      .limit(1);

    let storagePath = certs?.[0]?.storage_path;

    // If not generated yet, auto-generate on-demand!
    if (!storagePath || certs?.[0]?.status !== "ok") {
      const genResult = await generateCertificate(feedbackId, 3);
      if (genResult.ok && genResult.path) {
        storagePath = genResult.path;
      }
    }

    // Fallback: list files in 'hasil' storage bucket matching feedbackId
    if (!storagePath) {
      const { data: files } = await supabaseAdmin.storage.from("hasil").list();
      const match = files?.find((f) => f.name.includes(feedbackId));
      if (match) {
        storagePath = match.name;
      }
    }

    if (!storagePath) {
      return NextResponse.json({ error: "Gagal memproses sertifikat. Pastikan data feedback valid." }, { status: 404 });
    }

    const cleanPath = storagePath.replace(/^hasil\//, "");
    let { data: blob, error } = await supabaseAdmin.storage.from("hasil").download(cleanPath);

    // If download failed, try one more on-demand generation retry
    if (error || !blob) {
      const retryResult = await generateCertificate(feedbackId, 3);
      if (retryResult.ok && retryResult.path) {
        const retryClean = retryResult.path.replace(/^hasil\//, "");
        const retryDownload = await supabaseAdmin.storage.from("hasil").download(retryClean);
        blob = retryDownload.data;
        error = retryDownload.error;
      }
    }

    if (error || !blob) {
      return NextResponse.json({ error: error?.message || "File sertifikat tidak dapat diunduh dari storage" }, { status: 500 });
    }

    const safeName = (sub?.nama_lengkap || feedbackId).replace(/[^a-zA-Z0-9_-]/g, "_");
    const arrayBuffer = await blob.arrayBuffer();

    // Convert PNG to print-ready PDF if requested
    if (isPdf) {
      const pdfDoc = await PDFDocument.create();
      const pngImage = await pdfDoc.embedPng(arrayBuffer);
      const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pngImage.width,
        height: pngImage.height,
      });
      const pdfBytes = await pdfDoc.save();
      const disposition = isInline ? "inline" : `attachment; filename="Sertifikat_${safeName}.pdf"`;

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": disposition,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const filename = `Sertifikat_${safeName}.png`;
    const disposition = isInline ? "inline" : `attachment; filename="${filename}"`;

    return new NextResponse(new Uint8Array(arrayBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
