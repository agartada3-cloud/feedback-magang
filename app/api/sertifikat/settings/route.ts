// app/api/settings/route.ts — GET/POST setting aktif

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("cert_settings").select("*").limit(1);
    if (error) throw new Error(error.message);
    return NextResponse.json({ settings: data?.[0] ?? null });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { template_id, elements, image_elements, upscale_default, zoom_default } = body as {
      template_id?: string;
      elements?: Record<string, unknown>;
      image_elements?: Record<string, unknown>;
      upscale_default?: number;
      zoom_default?: number;
    };

    // ambil yang ada sekarang
    const { data: existing } = await supabaseAdmin.from("cert_settings").select("*").limit(1);

    if (existing?.length) {
      const { error } = await supabaseAdmin
        .from("cert_settings")
        .update({
          template_id: template_id ?? existing[0].template_id,
          elements: elements ?? existing[0].elements,
          image_elements: image_elements ?? existing[0].image_elements,
          upscale_default: upscale_default ?? existing[0].upscale_default,
          zoom_default: zoom_default ?? existing[0].zoom_default,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("cert_settings").insert({
        template_id: template_id ?? null,
        elements: elements ?? {},
        image_elements: image_elements ?? {},
        upscale_default: upscale_default ?? 3,
        zoom_default: zoom_default ?? 100,
      });
      if (error) throw new Error(error.message);
    }

    const { data: after } = await supabaseAdmin.from("cert_settings").select("*").limit(1);
    return NextResponse.json({ settings: after?.[0] ?? null });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
