import type { Metadata } from "next";
export const metadata: Metadata = { title: "Assessment review" };
import AssessmentReview from "@/components/admin/AssessmentReview";
export default function Page() {
  return <AssessmentReview />;
}
