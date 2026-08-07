// app/api/sertifikat/upload-element/route.ts — Upload image elements to Supabase Storage

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const label = (formData.get("label") as string) || "Elemen Gambar";

    if (!file) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "png";
    const filename = `elements/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload to 'templates' bucket in Supabase Storage
    const { data: uploadData, error } = await supabaseAdmin.storage
      .from("templates")
      .upload(filename, buffer, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const storagePath = uploadData.path;

    // Get public URL or internal route
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("templates")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    return NextResponse.json({
      ok: true,
      id: `img_${Date.now()}`,
      label,
      url: publicUrl,
      storage_path: storagePath,
      width: 300,
      height: 150,
      x: 1000,
      y: 1100,
      opacity: 100,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
