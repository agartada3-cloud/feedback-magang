"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Button, Card, CardContent, FormField, Input } from "@/components/ui";
import { ADMIN_EMAIL, loginAdmin } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const ok = await loginAdmin(email.trim(), password);
    setLoading(false);
    if (ok) {
      router.replace("/admin/dashboard");
    } else {
      setError("Email atau kata sandi salah.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <a href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Kembali
        </a>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <h1 className="text-lg font-semibold text-foreground">Masuk Admin</h1>
              <p className="text-sm text-muted-foreground">Panel manajemen feedback magang PG Djatiroto.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <FormField label="Email" required>
                <Input
                  type="email"
                  placeholder={ADMIN_EMAIL}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </FormField>
              <FormField label="Kata Sandi" required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </FormField>
              {error && (
                <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" loading={loading}>
                {loading ? "Memeriksa…" : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo: {ADMIN_EMAIL} · admin123
        </p>
      </div>
    </main>
  );
}
