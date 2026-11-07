"use client";
import { useEffect, useState } from "react";
import { Printer, ShieldCheck } from "lucide-react";
import { learningRequest } from "../lib/auth";
import { LoadingState } from "./ui";
import CertificateDocument, {
  type CertificateDetails,
} from "./CertificateDocument";
export default function Verify({ id }: { id: string }) {
  const [certificate, setCertificate] = useState<CertificateDetails | null>(
      null,
    ),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setCertificate(null);
    setError("");
    learningRequest("/certificates/" + encodeURIComponent(id))
      .then((result) => {
        if (active) setCertificate(result.certificate);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "Unable to verify this certificate.",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <div className="verify panel" role="alert">
        <h1>Certificate unavailable</h1>
        <p>{error}</p>
      </div>
    );
  if (!certificate) return <LoadingState label="Verifying certificate" />;
  return (
    <section className="issued-certificate">
      <div className="credential-tools">
        <span>
          <ShieldCheck size={17} /> Verified certificate issued by{" "}
          {certificate.issuer}
        </span>
        <button className="btn secondary" onClick={() => window.print()}>
          <Printer size={17} /> Print / Save PDF
        </button>
      </div>
      <CertificateDocument certificate={certificate} />
      <p className="credential-verify-link">
        Verify this credential at{" "}
        {typeof window !== "undefined" ? window.location.origin : ""}/verify/
        {certificate.id}
      </p>
    </section>
  );
}
