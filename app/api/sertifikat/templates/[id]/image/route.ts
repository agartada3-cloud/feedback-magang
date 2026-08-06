// app/api/templates/[id]/image/route.ts — serve template image (browser preview)

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: tpl } = await supabaseAdmin.from("cert_templates").select("storage_path").eq("id", id).maybeSingle();
    if (!tpl?.storage_path) return new NextResponse("Not found", { status: 404 });
    const clean = tpl.storage_path.replace(/^templates\//, "");
    const { data: blob } = await supabaseAdmin.storage.from("templates").download(clean);
    if (!blob) return new NextResponse("Not found", { status: 404 });
    const arr = await blob.arrayBuffer();
    return new NextResponse(new Uint8Array(arr), {
      headers: { "Content-Type": blob.type || "image/png", "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
