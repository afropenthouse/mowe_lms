import { course, lesson } from "./helpers.js";
export const business = course(
  1,
  "Business Fundamentals & Corporate Structure",
  "Understand how businesses are structured, how departments create value together, and how governance, ethics, communication and negotiation support responsible decisions.",
  [
    lesson(
      "Introduction to Business Structures",
      "Compare ownership and organisational structures, and explain authority and accountability.",
      `## How a business creates value

A business identifies a need, combines resources to meet it, and earns enough income to sustain its activities. Its value proposition is the specific benefit offered to a particular customer. Revenue, costs, customer trust and delivery capacity all influence whether that promise is sustainable.

## Ownership and internal structure

Distinguish legal ownership from internal organisation. Sole proprietorships are closely tied to their owners. Partnerships involve shared ownership and agreed responsibilities. An incorporated company is a separate legal entity; limited liability does not remove every possible personal obligation. Registration requirements depend on the chosen structure. Consult the Corporate Affairs Commission for current Nigerian registration guidance.

Inside an organisation, a functional structure groups people by specialism, such as finance or operations. A divisional structure groups them around products, locations or customers. A matrix combines reporting relationships and needs especially clear priorities. An organisation chart shows formal reporting; a responsibility map shows who decides, delivers, advises and receives updates.

## Following a decision

Identify the decision owner, approval limit and escalation route before acting. Delegation gives someone authority to perform work, while the manager retains appropriate oversight. Good structure reduces duplicated work and decisions nobody owns. As a business grows, review whether information still reaches the people who need it.`,
      "A Lagos distributor appoints sales and warehouse leads. Sales promises a delivery date without checking stock. Defining an order-confirmation owner and requiring an availability check fixes the handoff more directly than adding another management layer.",
      "Sketch an organisation chart for a small business. Trace one order from request to payment. Name the person responsible at each stage and identify one unclear decision. Explain how you would clarify it without slowing routine work.",
      "Choose structure to support value delivery. Distinguish ownership, reporting relationships and decision authority.",
      "https://www.cac.gov.ng/services/business-name",
    ),
    lesson(
      "Understanding Core Business Functions",
      "Explain how marketing, sales, operations, finance and HR contribute to a shared outcome.",
      `## The functions and their contributions

Marketing researches customer needs and communicates a relevant offer. Sales converts suitable opportunities into agreements. Operations delivers products or services consistently. Finance records transactions, monitors cash, supports budgets and evaluates performance. HR supports recruitment, capability, fair processes and employee wellbeing. Technology and administration provide systems, information and coordination.

Functions depend on one another. A campaign can create demand operations cannot fulfil. Cost reductions can weaken customer service. Hiring without onboarding can increase headcount without increasing capacity. Evaluate the complete customer outcome instead of assuming every departmental target supports the organisation's goal.

## Map the handoffs

For a process, record its trigger, inputs, activities, outputs and customer. At each handoff specify the required information, receiving owner and turnaround. A RACI map distinguishes those responsible for doing the work, the accountable decision owner, those consulted and those informed. Aim for one clear accountable owner for each defined decision.

## Select useful measures

Combine activity measures with outcomes. Calls made show sales activity; suitable customers retained show a business outcome. Balance speed with quality and cost with reliability. Short cross-functional reviews help teams resolve constraints rather than shift problems to one another. Agree which data source each team will use to avoid arguments over inconsistent figures.`,
      "An Abuja training business has many enquiries but few paid registrations. Marketing checks audience fit, sales records objections, finance simplifies payment reconciliation and operations confirms availability. Together they address conversion rather than blaming the enquiry team.",
      "Map a purchase request from need to supplier payment. List the contributions of the requesting team, procurement, finance and the approver. Specify the minimum information for each handoff and measures protecting speed and accuracy.",
      "Functions create value together. Clear handoffs and shared outcomes prevent local improvements from creating wider problems.",
    ),
    lesson(
      "Corporate Governance & Business Ethics",
      "Distinguish governance from management and respond responsibly to conflicts of interest.",
      `## Direction, oversight and accountability

Governance establishes how an organisation is directed and held accountable. Management runs daily activities within that framework. A board typically provides strategic oversight and challenges management; managers execute plans and maintain controls. Responsibilities depend on the organisation and applicable rules. Nigeria's Financial Reporting Council publishes governance guidance whose scope should be checked for the organisation concerned.

## Ethics in ordinary decisions

Ethical decisions consider honesty, fairness, confidentiality and affected stakeholders. A weak internal process can permit an action that is still dishonest. Watch for conflicts between personal interests and professional responsibilities: a supplier owned by a relative, a gift during a tender, or confidential information that could benefit a friend.

Use a repeatable check: establish facts, identify stakeholders, check policy, consider alternatives and consequences, seek independent advice, and document the rationale. Disclose conflicts early and step away from decisions where impartiality is compromised.

## Controls and speaking up

Separate requesting, approving and paying where practical. Keep accurate records and proportionate approval limits. Report concerns through approved channels using factual details and preserve evidence securely. Avoid spreading allegations or investigating beyond your role. Ethical workplaces encourage concerns and handle them fairly; silence should never be mistaken for evidence that controls are working.`,
      "A procurement officer's cousin bids for a contract. The officer discloses the relationship and does not score bids. An independent reviewer applies the same criteria to all suppliers. Disclosure alone would not resolve the conflict if the officer still controlled the award.",
      "Draft a response to a supplier offering an expensive gift during selection. Identify the conflict, policy check, disclosure route and record you would keep. Explain how to protect confidentiality while escalating.",
      "Disclose conflicts, use fair processes and keep decisions accountable.",
      "https://frcnigeria.gov.ng/publications/",
    ),
    lesson(
      "Business Communication & Negotiation",
      "Write actionable messages, listen actively and negotiate using interests and evidence.",
      `## Make the message easy to act on

Start with purpose and the action required. Choose a suitable audience and channel: a brief message suits a routine update; a sensitive disagreement needs a considered conversation and appropriate written record. Structure requests with context, a specific ask, an owner and a deadline. Verify names, figures and attachments.

Active listening involves open questions, paraphrasing and checking assumptions. Distinguish observation from interpretation: 'the report arrived on Thursday' is more useful than 'you never care about deadlines'. Summarise agreements and invite correction.

## Prepare before bargaining

A position is what someone asks for; an interest is the need behind it. A supplier requesting advance payment may be concerned about cash flow. Prepare your target, acceptable limits, objective criteria and BATNA: your best alternative if no agreement is reached. Your alternative helps you judge whether a deal is worthwhile.

## Build a workable agreement

Explore options before trading concessions. Consider payment timing, scope, service levels and dates together. Make concessions conditional and confirm what each side will deliver. Record price, responsibilities, deadlines, acceptance criteria and how changes will be handled. A positive conversation is not a substitute for a clear agreement. If authority is limited, explain what you can agree and what requires approval.`,
      "A customer requests a training discount. The administrator asks about group size and budget timing. A larger confirmed group with staged payment may meet both parties' needs better than reducing price without changing terms.",
      "Draft a six-sentence email requesting an overdue input without blame. Prepare a negotiation sheet with your target, minimum terms, evidence, the other party's likely interests and your BATNA.",
      "Communicate for action. Negotiate around interests and credible alternatives, then document the agreement.",
    ),
  ],
  [
    [
      "Which statement describes an incorporated company?",
      "It is a separate legal entity from its owners.",
      "It never has reporting obligations.",
      "Employees personally own all its assets.",
      "It cannot appoint managers.",
      "Incorporation creates a separate legal entity without removing governance duties.",
    ],
    [
      "Which structure groups people by specialism?",
      "Functional structure",
      "Customer queue",
      "Supplier register",
      "Informal friendship group",
      "A functional structure groups work around areas such as finance and HR.",
    ],
    [
      "Who normally monitors cash and supports budgeting?",
      "Finance",
      "Marketing alone",
      "Customers",
      "Reception alone",
      "Finance supports financial records, cash monitoring and budgets.",
    ],
    [
      "Sales promises unavailable stock. What is the best first improvement?",
      "Define a stock check and an order-confirmation owner.",
      "Increase sales targets immediately.",
      "Conceal the shortage.",
      "Remove all delivery promises permanently.",
      "A reliable handoff prevents promises operations cannot fulfil.",
    ],
    [
      "How does governance differ from daily management?",
      "Governance directs and oversees; management executes.",
      "Governance only creates advertisements.",
      "Management has no accountability.",
      "Governance replaces all staff.",
      "Direction and oversight establish the framework for daily management.",
    ],
    [
      "Your relative bids for a contract you evaluate. What should you do?",
      "Disclose the conflict and step away from evaluation.",
      "Keep the relationship secret.",
      "Award the contract immediately.",
      "Let the relative set the criteria.",
      "Disclosure and independent evaluation protect impartiality.",
    ],
    [
      "Which control reduces unauthorised payment risk?",
      "Separate requesting, approving and paying.",
      "Share all passwords.",
      "Discard invoices.",
      "Let suppliers approve payments.",
      "Separating incompatible duties creates checks before payment.",
    ],
    [
      "Which request is clearest?",
      "Please send approved sales figures to Ada by 2 pm Friday for the board report.",
      "Sort it soon.",
      "Everyone knows what to do.",
      "The report is a problem.",
      "A clear request specifies action, recipient, deadline and purpose.",
    ],
    [
      "What is an interest in negotiation?",
      "The need behind a stated demand.",
      "Only the first price mentioned.",
      "A threat to end discussion.",
      "An obligation to accept any offer.",
      "Understanding underlying needs opens options beyond competing positions.",
    ],
    [
      "What does a BATNA help you assess?",
      "Whether an agreement beats your best alternative.",
      "Which colleague speaks loudest.",
      "How to avoid evidence.",
      "Whether records can be deleted.",
      "A credible alternative gives a basis for accepting or rejecting a deal.",
    ],
  ],
  "Map a business and improve a handoff",
  "Write 600–900 words about a real or fictional organisation. Explain its ownership and internal structure; map a workflow across three functions; identify an unclear handoff and an ethical risk; propose a clearer decision process and draft a message to the people involved. Include two success measures and a 30-day review plan. Use fictional names and exclude confidential information. Review criteria: business concepts (30%), analysis of handoffs and ethics (30%), practical recommendations (25%), clear communication (15%).",
);
