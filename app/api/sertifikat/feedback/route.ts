// app/api/feedback/route.ts — GET daftar data sertifikat (view cert_input + status)

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from("cert_input")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // ambil status terakhir per feedback_id dari cert_generated
    const ids = (rows ?? []).map((r) => r.feedback_id);
    let generated: Record<string, { status: string; storage_path: string; created_at: string }> = {};
    if (ids.length) {
      const { data: gens } = await supabaseAdmin
        .from("cert_generated")
        .select("feedback_id, status, storage_path, created_at")
        .in("feedback_id", ids)
        .order("created_at", { ascending: false });
      // ambil yang terbaru per feedback_id
      for (const g of gens ?? []) {
        if (!generated[g.feedback_id]) generated[g.feedback_id] = g;
      }
    }

    return NextResponse.json({ rows, generated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
