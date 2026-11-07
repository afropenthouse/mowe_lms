"use client";
import BrandFilter from "./BrandFilter";
import type { ReactNode } from "react";
import { LoadingState } from "../components/ui";
import { useAcademy } from "../providers/AcademyProvider";
import CertificatePreview from "./CertificatePreview";
import PublicHeader from "./PublicHeader";
import SavingIndicator from "./SavingIndicator";
import Sidebar from "./Sidebar";
import Toast from "./Toast";
import WorkspaceHeader from "./WorkspaceHeader";
export default function SiteShell({ children }: { children: ReactNode }) {
  const { app, authPage, error, refresh, loading, mobile, setMobile } =
    useAcademy();
  if (authPage)
    return (
      <>
        <BrandFilter />
        <main id="main" className="auth-main">
          {children}
        </main>
      </>
    );
  return (
    <>
      <BrandFilter />
      <a className="skip" href="#main">
        Skip to content
      </a>
      {app ? (
        <>
          {mobile && (
            <button
              className="sidebar-backdrop"
              aria-label="Close navigation"
              onClick={() => setMobile(false)}
            />
          )}
          <Sidebar />
          <WorkspaceHeader />
        </>
      ) : (
        <PublicHeader />
      )}
      <main id="main" className={app ? "app-main" : ""}>
        {error && (
          <div className="service-error" role="alert">
            {error}
            <button onClick={refresh}>Try again</button>
          </div>
        )}
        {app && loading ? <LoadingState /> : children}
      </main>
      <CertificatePreview />
      <Toast />
      <SavingIndicator />
    </>
  );
}
