// app/api/templates/[id]/route.ts — DELETE template + PATCH (set default)

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    // set default: clear others, set this one
    if (body.is_default) {
      await supabaseAdmin.from("cert_templates").update({ is_default: false }).neq("id", id);
      await supabaseAdmin.from("cert_templates").update({ is_default: true }).eq("id", id);
    }
    // update settings.template_id kalau diminta
    if (body.set_active) {
      await supabaseAdmin
        .from("cert_settings")
        .update({ template_id: id, updated_at: new Date().toISOString() })
        .neq("id", "00000000-0000-0000-0000-000000000000");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: tpl } = await supabaseAdmin.from("cert_templates").select("storage_path").eq("id", id).maybeSingle();
    if (tpl?.storage_path) {
      const clean = tpl.storage_path.replace(/^templates\//, "");
      await supabaseAdmin.storage.from("templates").remove([clean]);
    }
    const { error } = await supabaseAdmin.from("cert_templates").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
