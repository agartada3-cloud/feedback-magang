// app/api/templates/route.ts — GET list + POST upload template

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("cert_templates")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({ templates: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const nama = String(form.get("nama") || "Untitled");
    if (!file) return NextResponse.json({ error: "file wajib" }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "file max 15MB" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const path = `templates/${Date.now()}_${file.name}`;

    const { error: e1 } = await supabaseAdmin.storage.from("templates").upload(path, buf, {
      contentType: file.type || "image/png",
      upsert: false,
    });
    if (e1) throw new Error("storage: " + e1.message);

    const { error: e2 } = await supabaseAdmin.from("cert_templates").insert({
      nama,
      storage_path: path,
      width: 2000, // default — override via settings kelak
      height: 1414,
      is_default: false,
    });
    if (e2) throw new Error("insert: " + e2.message);

    return NextResponse.json({ ok: true, path });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
