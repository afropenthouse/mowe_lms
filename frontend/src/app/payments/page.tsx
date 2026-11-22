import type { Metadata } from "next";
import { requireUser } from "../../lib/serverAuth";
import PaymentsPage from "../../screens/PaymentsPage";

export const metadata: Metadata = { title: "Payments" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string | string[] }>;
}) {
  const { reference } = await searchParams;
  const validReference =
    typeof reference === "string" && /^mowe-[a-f0-9]{32}$/.test(reference)
      ? reference
      : undefined;
  await requireUser(
    validReference ? `/payments?reference=${validReference}` : "/payments",
  );
  return <PaymentsPage reference={validReference} />;
}
