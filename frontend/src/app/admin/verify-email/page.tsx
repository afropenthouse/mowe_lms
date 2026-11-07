import { LoadingState } from "@/components/ui";
import type { Metadata } from "next";
import { Suspense } from "react";
import AuthScreen from "@/components/auth/AuthScreen";
export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function Page() {
  return (
    <Suspense
      fallback={<LoadingState label="Loading your account" />}
    >
      <AuthScreen mode="verify-email" portal="admin" />
    </Suspense>
  );
}
