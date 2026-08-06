import type { Metadata } from "next";
import AuthGuard from "@/components/auth-guard";
import AdminShell from "@/components/admin-shell";

export const metadata: Metadata = {
  title: "Admin — Feedback Magang PG Djatiroto",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
