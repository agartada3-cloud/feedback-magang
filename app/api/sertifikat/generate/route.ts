// app/api/generate/route.ts — POST generate 1 sertifikat → PNG

import { NextResponse } from "next/server";
import { generateCertificate } from "@/lib/cert-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { feedback_id, scale = 3 } = body as { feedback_id?: string; scale?: number };
    if (!feedback_id) {
      return NextResponse.json({ error: "feedback_id wajib" }, { status: 400 });
    }
    if (![1, 2, 3].includes(scale)) {
      return NextResponse.json({ error: "scale harus 1|2|3" }, { status: 400 });
    }
    const result = await generateCertificate(feedback_id, scale as 1 | 2 | 3);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, path: result.path });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
