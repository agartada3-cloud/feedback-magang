// lib/notify.ts — fire-and-forget admin notification on new submission
// Uses Resend if RESEND_API_KEY is set. Otherwise no-op (log only).

interface SubmissionLite {
  ref: string;
  namaLengkap: string;
  universitas?: string;
  jenisProgram?: string;
  bagian?: string;
  rating?: string;
}

export async function notifyAdminNewSubmission(sub: SubmissionLite): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  const from = process.env.RESEND_FROM ?? "Feedback Magang <onboarding@resend.dev>";

  if (!key || !to) {
    console.log(`[notify] skip (no RESEND_API_KEY/ADMIN_NOTIFY_EMAIL): ${sub.ref} — ${sub.namaLengkap}`);
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://feedback-magang.vercel.app";
  const adminUrl = `${baseUrl}/admin/submissions`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 8px;font-size:18px;color:#18181b">Feedback baru masuk 🎉</h2>
      <p style="margin:0 0 16px;color:#52525b;font-size:13px">
        <b>${sub.namaLengkap}</b> baru saja mengirim feedback <b>${sub.jenisProgram ?? "magang"}</b>.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#3f3f46">
        <tr><td style="padding:6px 0;color:#71717a;width:120px">No. Referensi</td><td><code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-family:monospace">${sub.ref}</code></td></tr>
        ${sub.universitas ? `<tr><td style="padding:6px 0;color:#71717a">Universitas</td><td>${sub.universitas}</td></tr>` : ""}
        ${sub.bagian ? `<tr><td style="padding:6px 0;color:#71717a">Bagian</td><td>${sub.bagian}</td></tr>` : ""}
        ${sub.rating ? `<tr><td style="padding:6px 0;color:#71717a">Rating</td><td>${sub.rating}</td></tr>` : ""}
      </table>
      <a href="${adminUrl}" style="display:inline-block;margin-top:20px;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">
        Buka Dashboard Admin →
      </a>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `[Feedback] ${sub.namaLengkap} — ${sub.ref}`,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[notify] resend error ${res.status}: ${body.slice(0, 200)}`);
    }
  } catch (e) {
    console.error("[notify] fetch failed:", e);
  }
}
