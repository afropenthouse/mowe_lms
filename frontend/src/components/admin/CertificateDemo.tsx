"use client";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useAcademy } from "../../providers/AcademyProvider";
import CertificateDocument from "../CertificateDocument";

export default function CertificateDemo() {
  const { data } = useAcademy();
  const settings = data.certificateSettings;
  const [name, setName] = useState("Ada Okafor");
  return (
    <div className="certificate-demo-page">
      <Link className="text-link" href="/admin/certificates">
        <ArrowLeft size={16} /> Certificates
      </Link>
      <header className="people-heading">
        <div>
          <h1>Certificate preview</h1>
          <p>
            Preview the design learners receive when they complete the program.
          </p>
        </div>
        <button className="people-secondary" onClick={() => window.print()}>
          <Printer size={16} /> Print sample / Save PDF
        </button>
      </header>
      <div className="certificate-demo-toolbar">
        <label>
          Preview recipient
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            placeholder="Enter a learner name"
          />
        </label>
        <p>
          This is a sample. Previewing or printing does not issue a certificate
          or change learner records. Certificate details come from your{" "}
          <Link href="/admin/certificates">certificate settings</Link>.
        </p>
      </div>
      <section className="issued-certificate certificate-demo-paper">
        <CertificateDocument
          demo
          certificate={{
            id: "MOWE-CBA-000001",
            name: name.trim() || "Learner name",
            studentNumber: "MOWE000",
            programName:
              settings?.programName || "Certified Business Administrator",
            issuer: settings?.issuer || "MOWE Academy",
            signatoryName: settings?.signatoryName || "",
            signatoryTitle: settings?.signatoryTitle || "Program Director",
            issuedAt: new Date().toISOString(),
          }}
        />
      </section>
    </div>
  );
}
