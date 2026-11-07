import { requireUser } from "../../lib/serverAuth";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Your learning dashboard" };
import Screen from "../../screens/DashboardPage";
export default async function Page() {
  await requireUser("/dashboard");
  return <Screen />;
}
