import type { Metadata } from "next";
import FeedbackForm from "@/components/feedback-form";

export const metadata: Metadata = {
  title: "Isi Formulir — Feedback Magang PG Djatiroto",
};

export default function FeedbackPage() {
  return (
    <main className="flex flex-1 justify-center bg-background px-4 py-10 sm:px-6">
      <div className="w-full max-w-xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Form Feedback Program Magang / Penelitian / PKL
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Terima kasih sudah berpartisipasi di PG Djatiroto. Mohon isi dengan jujur.
          </p>
        </header>
        <FeedbackForm />
      </div>
    </main>
  );
}
