import type { Metadata } from "next";
import AdminTeamPage from "../../../../screens/AdminTeamPage";
import { requireUser } from "../../../../lib/serverAuth";
import { redirect } from "next/navigation";
export const metadata: Metadata = { title: "Administrators" };
export default async function Page() {
  const user = await requireUser("/admin/team", true);
  if (!user.isSuperAdmin) redirect("/admin");
  return <AdminTeamPage />;
}
