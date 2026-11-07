import { LoadingState } from "@/components/ui";
import type { Metadata } from "next";
import { Suspense } from "react";
import AuthScreen from "@/components/auth/AuthScreen";
export const metadata: Metadata = {
  title: "Accept your invitation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function Page() {
  return (
    <Suspense
      fallback={<LoadingState label="Loading your account" />}
    >
      <AuthScreen mode="signup" portal="admin" />
    </Suspense>
  );
}
