import type { Metadata } from "next";
import SubmissionDetail from "@/components/submission-detail";

export const metadata: Metadata = {
  title: "Detail Submission — Feedback Magang",
};

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SubmissionDetail id={id} />;
}
