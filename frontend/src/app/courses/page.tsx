import type { Metadata } from "next";
export const metadata: Metadata = { title: "CBA courses" };
import Screen from "../../screens/CoursesPage";
export default function Page() {
  return <Screen />;
}
