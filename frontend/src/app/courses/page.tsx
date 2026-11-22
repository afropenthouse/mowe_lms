import type { Metadata } from "next";
import PublicCoursesPage from "../../screens/PublicCoursesPage";

export const metadata: Metadata = {
  title: "Our courses",
  description:
    "Explore the published CBA courses and preview the lessons before you enroll.",
};

export default function Page() {
  return <PublicCoursesPage />;
}
