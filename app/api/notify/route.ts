// app/api/notify/route.ts — POST trigger admin email notification
// Dipanggil client-side dari feedback-form setelah createSubmission sukses.

import { NextResponse } from "next/server";
import { notifyAdminNewSubmission } from "@/lib/notify";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await notifyAdminNewSubmission({
      ref: String(body.ref ?? ""),
      namaLengkap: String(body.namaLengkap ?? ""),
      universitas: body.universitas,
      jenisProgram: body.jenisProgram,
      bagian: body.bagian,
      rating: body.rating,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // fire-and-forget — jangan gagalkan user flow
    console.error("[api/notify]", err);
    return NextResponse.json({ ok: false });
  }
}
