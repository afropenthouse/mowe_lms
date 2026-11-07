import { requireUser } from "../../lib/serverAuth";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Saved courses" };
import Screen from "../../screens/CoursesPage";
export default async function Page() {
  await requireUser("/saved");
  return <Screen />;
}
