// app/api/submissions/delete/route.ts — Delete submissions and dependent certificate logs

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids } = body as { ids?: string[] };

    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: "Missing submission ids" }, { status: 400 });
    }

    // 1. Delete dependent cert_generated records first to prevent foreign key error
    await supabaseAdmin.from("cert_generated").delete().in("feedback_id", ids);

    // 2. Delete submissions via service role key (bypasses RLS)
    const { error } = await supabaseAdmin.from("submissions").delete().in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deletedCount: ids.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
