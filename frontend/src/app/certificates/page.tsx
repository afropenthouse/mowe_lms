import { requireUser } from "../../lib/serverAuth";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Your certificates" };
import Screen from "../../screens/CertificatesPage";
export default async function Page() {
  await requireUser("/certificates");
  return <Screen />;
}
