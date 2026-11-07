import type { Metadata } from "next";
import CertificateDemo from "@/components/admin/CertificateDemo";
export const metadata: Metadata = { title: "Certificate preview" };
export default function Page() {
  return <CertificateDemo />;
}
