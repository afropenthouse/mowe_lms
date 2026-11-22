import type { Metadata } from "next";
import CoursesPage from "../../screens/CoursesPage";
import { requireUser } from "../../lib/serverAuth";

export const metadata: Metadata = { title: "My courses" };

export default async function Page() {
  await requireUser("/my-courses");
  return <CoursesPage />;
}
