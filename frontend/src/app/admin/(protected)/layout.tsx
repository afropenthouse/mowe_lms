import type { ReactNode } from "react";
import { requireUser } from "@/lib/serverAuth";
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser("/admin", true);
  return children;
}
