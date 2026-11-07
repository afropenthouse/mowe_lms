import { GraduationCap, ShieldCheck } from "lucide-react";

export type CertificateDetails = {
  id: string;
  name: string;
  studentNumber: string | null;
  programName: string;
  issuer: string;
  signatoryName: string;
  signatoryTitle: string;
  issuedAt: string;
};

export default function CertificateDocument({
  certificate: c,
  demo = false,
}: {
  certificate: CertificateDetails;
  demo?: boolean;
}) {
  const issued = new Date(c.issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <article
      className="credential-document"
      aria-label={
        demo ? "Sample certificate design" : "Certificate of completion"
      }
    >
      <div className="credential-topline">
        <img src="/mowe-logo.png" alt="MOWE Academy" />
        <span>
          ACADEMIC CREDENTIAL
          <b>{c.issuer}</b>
        </span>
      </div>
      <div className="credential-main">
        <h1>
          Certificate <em>of Completion</em>
        </h1>
        <p className="credential-presented">Presented to</p>
        <h2>{c.name}</h2>
        {c.studentNumber && (
          <span className="credential-student">
            Student number · {c.studentNumber}
          </span>
        )}
        <p className="credential-description">
          For successfully completing the required learning and assessments in
        </p>
        <h3>{c.programName}</h3>
      </div>
      <div className="credential-bottom">
        <div className="credential-signature">
          <div className="credential-autograph" aria-hidden="true">
            {c.signatoryName || "Mowe"}
          </div>
          <strong>{c.signatoryName || c.issuer}</strong>
          <span>{c.signatoryTitle || "Authorized issuer"}</span>
        </div>
        <div className="credential-emblem" aria-label="Academy completion seal">
          <svg
            className="credential-laurel"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
          >
            {[false, true].map((mirror) => (
              <g
                key={String(mirror)}
                transform={mirror ? "translate(100 0) scale(-1 1)" : undefined}
              >
                <path
                  d="M33 79C14 64 12 40 28 22"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <g fill="currentColor">
                  <ellipse
                    cx="25"
                    cy="70"
                    rx="2.4"
                    ry="5"
                    transform="rotate(-48 25 70)"
                  />
                  <ellipse
                    cx="20"
                    cy="58"
                    rx="2.4"
                    ry="5"
                    transform="rotate(-28 20 58)"
                  />
                  <ellipse
                    cx="19"
                    cy="46"
                    rx="2.4"
                    ry="5"
                    transform="rotate(-12 19 46)"
                  />
                  <ellipse
                    cx="22"
                    cy="34"
                    rx="2.4"
                    ry="5"
                    transform="rotate(20 22 34)"
                  />
                  <ellipse
                    cx="28"
                    cy="24"
                    rx="2.2"
                    ry="4.4"
                    transform="rotate(38 28 24)"
                  />
                </g>
              </g>
            ))}
          </svg>
          <div className="credential-seal-core">
            <GraduationCap
              className="credential-emblem-icon"
              size={23}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span>MOWE</span>
            <small>ACADEMY</small>
          </div>
        </div>
        <div className="credential-date">
          <span>Issued on</span>
          <strong>{issued}</strong>
        </div>
      </div>
      <div className="credential-reference">
        <span>
          <ShieldCheck size={13} />
          Certificate of completion
        </span>
        <span>Certificate ID · {c.id}</span>
      </div>
    </article>
  );
}
