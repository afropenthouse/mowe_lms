import { course, lesson } from "./helpers.js";
export const technology = course(
  6,
  "Business Technology",
  "Use data and digital tools to improve decisions and operational work, while protecting accounts, business information and customer trust.",
  [
    lesson(
      "Business Analytics & Digital Tools for Operations",
      "Frame a business question, check data quality and communicate a useful analysis using appropriate tools.",
      `## Begin with the decision

Analytics helps turn data into evidence for action. Define a question before building a dashboard: 'Which stage delays customer onboarding?' is more useful than 'Show us all the data'. Identify the decision owner, measure, period and comparison that would change a decision.

Descriptive analysis explains what happened. Diagnostic analysis explores possible reasons. Predictive analysis estimates what might happen, while prescriptive analysis compares possible actions. A pattern or correlation does not by itself prove causation. Check alternative explanations and avoid claiming certainty beyond the evidence.

## Prepare trustworthy data

Check completeness, duplicates, valid dates, consistent units and definitions. Retain a safe original and document cleaning steps. A spreadsheet can support sorting, filtering, formulas, validation and pivot summaries. Shared task tools support ownership and deadlines; dashboards support monitoring. Choose the simplest tool that meets the decision and access requirements.

## Present and automate responsibly

Use a bar chart for category comparisons and a line chart for trends where appropriate. Label axes and denominators. State the finding, implication, recommended action and uncertainty. Automate a stable process with defined inputs, exception handling and a responsible owner. Test a small sample and review outputs; automation can repeat a mistake at scale. Never put confidential data into an unapproved digital or AI tool.`,
      "An onboarding sheet contains duplicate applications and mixed date formats. Cleaning those issues changes the apparent average turnaround. The analyst reports the revised definition and recommends addressing the stage with the longest reliable delay.",
      "Create a 12-row fictional dataset with dates, owners and status. Add a deliberate duplicate and missing value, explain how you handle them, and summarise one decision-relevant measure. Propose an automation and its exception check.",
      "Good analysis starts with a decision and trustworthy definitions. Tools accelerate judgement; they do not replace it.",
    ),
    lesson(
      "Cybersecurity Awareness in the Workplace",
      "Recognise phishing, protect access and report suspected incidents promptly.",
      `## Recognise social engineering

Phishing tries to trick people into sharing information, approving access or opening malicious content. Warning signs include unexpected urgency, payment changes, unusual attachments, mismatched addresses and requests for passwords or verification codes. A familiar display name is not proof of identity.

Verify unusual requests using a trusted channel already on record, not a phone number supplied in the suspicious message. For a bank-detail change, follow the approved independent verification and payment authorisation process. Do not click a suspicious link merely to investigate it.

## Protect accounts and information

Use unique passwords or passphrases and an approved password manager. Enable multifactor authentication where available, preferably stronger phishing-resistant methods when supported. Never share passwords or one-time codes. Lock devices, install approved updates and use only authorised software.

Access should follow least privilege: people receive the permissions needed for their work, with review when roles change. Protect customer records, check recipients before sharing and use approved storage and backups. A synchronised folder alone is not evidence that recovery has been tested.

## Respond early

Report suspected phishing, accidental disclosure or account compromise through the organisation's incident process immediately. Preserve relevant details, avoid further interaction and follow the security team's instructions. Concealing an error delays containment. CISA's Secure Our World guidance provides practical awareness resources; your employer's incident instructions take precedence for local response steps.`,
      "An email appears to come from a director and demands an urgent transfer to a new bank account. The administrator pauses and verifies through an established internal contact, exposing the impersonation before payment.",
      "Write a short checklist for an unexpected supplier bank-change request. Include verification, approval and reporting. Then list what details to report if you accidentally opened a suspicious attachment.",
      "Pause, verify and report. Strong access controls and early reporting reduce the impact of both attacks and mistakes.",
      "https://www.cisa.gov/secure-our-world",
    ),
  ],
  [
    [
      "What should come before building a dashboard?",
      "A business question and the decision it will support.",
      "Selecting the brightest chart colours.",
      "Collecting every available personal detail.",
      "Purchasing the most expensive tool.",
      "A defined decision determines the relevant data, measure and comparison.",
    ],
    [
      "Which analysis describes what happened?",
      "Descriptive analysis",
      "Automatic proof of causation",
      "Access control",
      "Supplier onboarding",
      "Descriptive analysis summarises observed results.",
    ],
    [
      "Two measures rise together. What can you conclude immediately?",
      "They are associated; causation needs further evidence.",
      "One definitely caused the other.",
      "No further analysis is useful.",
      "Both datasets are necessarily complete.",
      "Correlation can have other explanations and does not establish causation.",
    ],
    [
      "Why remove duplicate application records before counting?",
      "Duplicates can inflate totals and distort conclusions.",
      "Duplicates always improve accuracy.",
      "Counting is unrelated to data quality.",
      "Every repeated name is necessarily a duplicate.",
      "Validate genuine duplicates using suitable identifiers before adjusting counts.",
    ],
    [
      "Which chart is usually suitable for a time trend?",
      "A clearly labelled line chart.",
      "An unlabelled decorative image.",
      "A list of passwords.",
      "A chart with an invented axis.",
      "Line charts can show change over time when the scale and periods are clear.",
    ],
    [
      "What must an automated workflow include?",
      "An owner, exception handling and tested outputs.",
      "No human responsibility.",
      "Unlimited access for all users.",
      "A rule to ignore failures.",
      "Automation needs oversight so failures and unusual inputs are handled.",
    ],
    [
      "An email requests an urgent supplier bank change. What should you do?",
      "Verify through an established trusted channel and follow approvals.",
      "Pay immediately because the display name is familiar.",
      "Reply with your password.",
      "Use only the new phone number in that email.",
      "Independent verification reduces impersonation and payment-diversion risk.",
    ],
    [
      "What does least privilege mean?",
      "Give only the access needed for the person's work.",
      "Give all staff administrator rights.",
      "Share one account across the company.",
      "Remove every access review.",
      "Limited permissions reduce exposure and should be reviewed as roles change.",
    ],
    [
      "How should you handle a one-time verification code?",
      "Keep it private and enter it only in the legitimate process you initiated.",
      "Send it to anyone claiming to be support.",
      "Post it in the team chat.",
      "Include it in an invoice.",
      "A verification code can authorise access and must not be shared.",
    ],
    [
      "You opened a suspicious attachment. What is the best next step?",
      "Report promptly and follow the incident-response instructions.",
      "Hide it until a problem appears.",
      "Forward it to every colleague.",
      "Delete all evidence and say nothing.",
      "Early reporting supports containment and preserves useful incident details.",
    ],
  ],
  "Improve a workflow securely",
  "Describe a small data-driven workflow using fictional data. Define a business question, data-quality checks, a useful metric and a suitable tool. Recommend one automation with exception handling. Add least-privilege roles, a suspicious-request verification procedure and an incident-reporting checklist. Submit 600–900 words. Criteria: decision and data quality (30%), practical tool use (25%), security controls (30%), clarity (15%).",
);
