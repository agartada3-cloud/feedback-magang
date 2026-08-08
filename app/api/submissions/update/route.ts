// app/api/submissions/update/route.ts — Update a submission's editable fields

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const UPDATABLE_FIELDS = [
  "nama_lengkap",
  "no_wa",
  "email",
  "universitas",
  "jurusan",
  "jenis_program",
  "jenis_program_lainnya",
  "periode_mulai",
  "periode_akhir",
  "bagian",
  "sub_bagian",
  "nama_program_surat",
  "rating",
  "manfaat",
  "saran",
] as const;

type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

// camelCase → snake_case mapping for client payload
const CAMEL_TO_SNAKE: Record<string, UpdatableField> = {
  namaLengkap: "nama_lengkap",
  noWa: "no_wa",
  email: "email",
  universitas: "universitas",
  jurusan: "jurusan",
  jenisProgram: "jenis_program",
  jenisProgramLainnya: "jenis_program_lainnya",
  periodeMulai: "periode_mulai",
  periodeAkhir: "periode_akhir",
  bagian: "bagian",
  subBagian: "sub_bagian",
  namaProgramSurat: "nama_program_surat",
  rating: "rating",
  manfaat: "manfaat",
  saran: "saran",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, ...fields } = body as { id?: string; [key: string]: unknown };

    if (!id) {
      return NextResponse.json({ error: "Missing submission id" }, { status: 400 });
    }

    // Build update payload — only include fields that were sent
    const payload: Record<string, unknown> = {};
    for (const [camelKey, value] of Object.entries(fields)) {
      const snakeKey = CAMEL_TO_SNAKE[camelKey];
      if (snakeKey && UPDATABLE_FIELDS.includes(snakeKey)) {
        // Normalize jenisProgramLainnya: null if not "Lainnya"
        if (snakeKey === "jenis_program_lainnya") {
          payload[snakeKey] = fields.jenisProgram === "Lainnya" ? (value ?? null) : null;
        } else {
          payload[snakeKey] = value;
        }
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("submissions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, submission: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
