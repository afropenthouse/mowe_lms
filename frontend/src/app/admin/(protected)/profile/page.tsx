import type { Metadata } from "next";
import { requireUser } from "../../../../lib/serverAuth";
import ProfilePage from "../../../../screens/ProfilePage";
export const metadata: Metadata = { title: "Your profile" };
export default async function Page() {
  await requireUser("/admin/profile", true);
  return <ProfilePage />;
}
