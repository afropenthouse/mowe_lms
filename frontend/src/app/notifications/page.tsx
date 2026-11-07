import type { Metadata } from "next";
import { requireUser } from "@/lib/serverAuth";
import LearnerAnnouncements from "@/components/LearnerAnnouncements";
export const metadata: Metadata = { title: "Notifications" };
export default async function Page() {
  await requireUser("/notifications");
  return <LearnerAnnouncements />;
}
