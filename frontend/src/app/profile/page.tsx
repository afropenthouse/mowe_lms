import { requireUser } from "../../lib/serverAuth";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Your profile" };
import Screen from "../../screens/ProfilePage";
export default async function Page() {
  await requireUser("/profile");
  return <Screen />;
}
