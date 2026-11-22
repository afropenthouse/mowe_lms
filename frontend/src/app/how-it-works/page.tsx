import type { Metadata } from "next";
import HowItWorksPage from "../../screens/HowItWorksPage";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "See how to create your learner account, join the CBA program, complete coursework, and earn your certificate.",
};

export default function Page() {
  return <HowItWorksPage />;
}
