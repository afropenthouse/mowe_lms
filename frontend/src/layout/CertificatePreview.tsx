"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import CertificateDocument from "../components/CertificateDocument";
import { useAcademy } from "../providers/AcademyProvider";

export default function CertificatePreview() {
  const { sampleCertificate, setSampleCertificate, data } = useAcademy();
  const settings = data.certificateSettings;
  useEffect(() => {
    if (!sampleCertificate) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const closeButton =
      document.querySelector<HTMLButtonElement>(".modal-close");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSampleCertificate(false);
      if (event.key === "Tab") {
        event.preventDefault();
        closeButton?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [sampleCertificate, setSampleCertificate]);
  return (
    <>
      {sampleCertificate && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Sample certificate design"
          onClick={(event) => {
            if (event.target === event.currentTarget)
              setSampleCertificate(false);
          }}
        >
          <div className="certificate-sample-modal">
            <button
              className="modal-close icon-btn"
              aria-label="Close certificate preview"
              onClick={() => setSampleCertificate(false)}
            >
              <X size={22} />
            </button>
            <CertificateDocument
              demo
              certificate={{
                id: "MOWE-CBA-000001",
                name: "Ada Okafor",
                studentNumber: "MOWE000",
                programName:
                  settings?.programName || "Certified Business Administrator",
                issuer: settings?.issuer || "MOWE Academy",
                signatoryName: settings?.signatoryName || "",
                signatoryTitle: settings?.signatoryTitle || "Program Director",
                issuedAt: new Date().toISOString(),
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
