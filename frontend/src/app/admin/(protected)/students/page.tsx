import type { Metadata } from "next";
export const metadata: Metadata = { title: "Learner management" };
import Screen from "@/screens/AdminPage";
export default function Page() {
  return <Screen />;
}
