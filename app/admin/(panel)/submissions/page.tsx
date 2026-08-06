import type { Metadata } from "next";
import SubmissionsTable from "@/components/submissions-table";

export const metadata: Metadata = {
  title: "Submissions — Feedback Magang",
};

export default function SubmissionsPage() {
  return <SubmissionsTable />;
}
