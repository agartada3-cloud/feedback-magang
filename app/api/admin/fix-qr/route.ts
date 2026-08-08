// app/api/admin/fix-qr/route.ts — POST auto-fix QR position ke kiri bawah
// Call sekali: POST /api/admin/fix-qr

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST() {
  try {
    // 1. Ambil settings aktif
    const { data: settingsRows, error: fetchErr } = await supabaseAdmin
      .from("cert_settings")
      .select("*")
      .limit(1);

    if (fetchErr) throw new Error("Fetch settings: " + fetchErr.message);
    if (!settingsRows?.length) throw new Error("Settings tidak ditemukan");

    const current = settingsRows[0];

    // 2. Inject/update QR element — kiri bawah (250, 1150) ukuran 120x120
    const currentImages = (current.image_elements as Record<string, any>) ?? {};
    const updatedImages = {
      ...currentImages,
      qrcode: {
        label: "QR Verifikasi",
        url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        x: 250,
        y: 1150,
        width: 120,
        height: 120,
        opacity: 100,
      },
    };

    // 3. Update
    const { error: updateErr } = await supabaseAdmin
      .from("cert_settings")
      .update({ image_elements: updatedImages })
      .eq("id", current.id);

    if (updateErr) throw new Error("Update settings: " + updateErr.message);

    return NextResponse.json({
      ok: true,
      message: "QR element berhasil di-set ke kiri bawah (250, 1150) ukuran 120x120",
      qr: updatedImages.qrcode,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
