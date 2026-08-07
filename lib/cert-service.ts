// lib/cert-service.ts — pipeline generate 1 sertifikat (server-only)

import { supabaseAdmin } from "./supabase-server";
import { buildSvg } from "./svg/builder";
import { rasterize, storagePathFor } from "./render/rasterize";
import { formatPeriode, hitungTanggalTaken, formatTanggalId } from "./dates";
import type { CertInputRow, Segment, Settings, Template } from "@/lib/cert-types";

export interface GenerateResult {
  ok: boolean;
  path?: string;
  error?: string;
}

/**
 * Generate 1 sertifikat:
 * 1. Ambil row cert_input (view)
 * 2. Ambil settings aktif + template
 * 3. Bangun SVG (nama FULL CAPS, VAR_* resolved)
 * 4. Rasterize @scale
 * 5. Simpan ke Storage + log cert_generated
 */
function resolveSubmissionTokens(templateStr: string, cert: CertInputRow, tglTaken: string): string {
  const perusahaan = "PT Sinergi Gula Nusantara - Pabrik Gula Djatiroto";
  return templateStr
    .replaceAll("<nama>", cert.nama.toUpperCase())
    .replaceAll("<program>", cert.program || "Program Magang")
    .replaceAll("<bagian>", cert.bagian || "-")
    .replaceAll("<sub_bagian>", cert.sub_bagian || "")
    .replaceAll("<tgl_awal>", formatTanggalId(cert.tgl_awal))
    .replaceAll("<tgl_akhir>", formatTanggalId(cert.tgl_akhir))
    .replaceAll("<tgl_taken>", formatTanggalId(tglTaken))
    .replaceAll("<perusahaan>", perusahaan);
}

export async function generateCertificate(feedbackId: string, scale: 1 | 2 | 3 | 4 = 2): Promise<GenerateResult> {
  try {
    // 1. data
    const { data: row, error: e1 } = await supabaseAdmin
      .from("cert_input")
      .select("*")
      .eq("feedback_id", feedbackId)
      .maybeSingle();
    if (e1) throw new Error("view cert_input: " + e1.message);
    if (!row) throw new Error("Data feedback tidak ditemukan di view cert_input");

    const cert = row as CertInputRow;

    // 2. settings aktif (ambil yang pertama)
    const { data: settingsRows, error: e2 } = await supabaseAdmin
      .from("cert_settings")
      .select("*")
      .limit(1);
    if (e2) throw new Error("cert_settings: " + e2.message);
    if (!settingsRows?.length) throw new Error("Settings belum dikonfigurasi — buka /admin/settings");

    const settings = settingsRows[0] as unknown as Settings & { elements: Record<string, any> };

    // 3. template — download dari storage → base64 data URI
    let templateUrl: string | null = null;
    let templateW = 2000;
    let templateH = 1414;
    if (settings.template_id) {
      const { data: tpl, error: e3 } = await supabaseAdmin
        .from("cert_templates")
        .select("*")
        .eq("id", settings.template_id)
        .maybeSingle();
      if (e3) throw new Error("cert_templates: " + e3.message);
      if (tpl) {
        const t = tpl as Template;
        templateW = t.width;
        templateH = t.height;
        if (t.storage_path) {
          const cleanPath = t.storage_path.replace(/^templates\//, "");
          const { data: blob } = await supabaseAdmin.storage
            .from("templates")
            .download(cleanPath);
          if (blob) {
            const arr = await blob.arrayBuffer();
            const b64 = Buffer.from(arr).toString("base64");
            templateUrl = `data:image/png;base64,${b64}`;
          }
        }
      }
    }

    // 4. resolve segmen per elemen
    const tglTaken = hitungTanggalTaken(cert.tgl_akhir);
    const perusahaan = "PT Sinergi Gula Nusantara - Pabrik Gula Djatiroto";
    const elSettings = settings.elements ?? {};
    const imgSettings = settings.image_elements ?? {};

    const segs: Record<string, Segment[]> = {};

    // Standard & Custom Text Elements
    Object.entries(elSettings).forEach(([key, el]) => {
      let defaultText = "";
      if (key === "nama") defaultText = cert.nama.toUpperCase();
      else if (key === "program") defaultText = cert.program || "Program Magang";
      else if (key === "perusahaan") defaultText = `di ${perusahaan}`;
      else if (key === "bagian") defaultText = `pada bagian ${cert.bagian || "-"}${cert.sub_bagian ? ` - ${cert.sub_bagian}` : ""}`;
      else if (key === "periode") defaultText = `Periode magang dimulai dari ${formatTanggalId(cert.tgl_awal)} sampai ${formatTanggalId(cert.tgl_akhir)}.`;
      else if (key === "taken") defaultText = `Lumajang, ${formatTanggalId(tglTaken)}`;
      else defaultText = el.sample_text || key;

      const finalText = el.sample_text
        ? resolveSubmissionTokens(el.sample_text, cert, tglTaken)
        : defaultText;

      segs[key] = [{ text: finalText, font: el.font || "opensauce-bold" }];
    });

    const { svg, width, overflows } = buildSvg({
      templateUrl,
      templateWidth: templateW,
      templateHeight: templateH,
      elements: elSettings,
      imageElements: imgSettings,
      resolveSegments: (k) => segs[k] ?? [],
    });

    // 5. rasterize
    const png = rasterize(svg, { scale, canvasWidth: width });

    // 6. simpan Storage + log
    const tplId = settings.template_id ?? "no-template";
    const storagePath = storagePathFor(tplId, feedbackId, scale);
    const { error: e4 } = await supabaseAdmin.storage
      .from("hasil")
      .upload(storagePath, png, { contentType: "image/png", upsert: true });
    if (e4 && !e4.message.includes("Duplicate")) throw new Error("storage hasil: " + e4.message);

    const { error: e5 } = await supabaseAdmin.from("cert_generated").insert({
      feedback_id: feedbackId,
      template_id: settings.template_id ?? null,
      scale,
      storage_path: storagePath,
      status: "ok",
      error_msg: overflows.length ? "overflow: " + overflows.join(",") : null,
    });
    if (e5) throw new Error("cert_generated log: " + e5.message);

    return { ok: true, path: storagePath };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // log error juga
    try {
      await supabaseAdmin.from("cert_generated").insert({
        feedback_id: feedbackId,
        template_id: null,
        scale,
        storage_path: "",
        status: "error",
        error_msg: msg,
      });
    } catch {
      /* log error gagal — abaikan */
    }
    return { ok: false, error: msg };
  }
}
