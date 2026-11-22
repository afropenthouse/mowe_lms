import type { Metadata } from "next";
import ProgramPage from "../../screens/ProgramPage";

export const metadata: Metadata = {
  title: "The CBA program",
  description:
    "Learn who the Certified Business Administrator program is for and what you’ll practise across business, finance, and marketing.",
};

export default function Page() {
  return <ProgramPage />;
}
