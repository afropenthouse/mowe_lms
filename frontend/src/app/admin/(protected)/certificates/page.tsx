import type { Metadata } from "next";
import CertificateManager from "@/components/admin/CertificateManager";
export const metadata: Metadata = { title: "Certificates" };
export default function Page() {
  return <CertificateManager />;
}
