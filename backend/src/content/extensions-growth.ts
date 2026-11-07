import type { ModuleExtension } from "./extensions.js";
export const growthExtensions: ModuleExtension[][] = [
  [
    {
      title: "Writing a charter that prevents scope confusion",
      objective:
        "Connect a project objective to deliverables, exclusions, acceptance and benefits ownership.",
      deepening: `## Turn a request into an agreed outcome

'Improve onboarding' is a direction, not yet a workable project definition. Describe the problem with evidence and define what will be different for the users. Separate the deliverable, such as an intake form and workflow, from the benefit, such as fewer incomplete requests.

A charter should identify sponsor, decision authority, scope, exclusions, key stakeholders, constraints, assumptions and success criteria. Make acceptance testable: a trained team can process defined sample cases using the new workflow, with required records present. A vague promise of satisfaction leaves different people judging success against different expectations.

## Protect the business reason

Assign an operational owner for the outcome after handover. Record who measures the benefit and when. When a new feature is requested, evaluate how it affects the objective, cost, schedule and adoption. Useful scope control does not reject every change; it enables an informed decision about whether the benefit justifies the effect on delivery.`,
      scenario:
        "A fictional manager asks for a new onboarding system within six weeks. Different stakeholders expect a new form, a mobile app, payment integration and staff training. The budget covers only a small pilot, and nobody has agreed how success will be accepted.",
      task: "Write a charter for a pilot with objective, deliverables, exclusions, sponsor, assumptions and acceptance criteria. Identify the benefits owner and explain how the mobile-app request will be assessed.",
      solution:
        "Define a one-team pilot with an intake form, clear approvals, a tracking view and training. Exclude the mobile app unless separately approved. Agree sample-case acceptance, required records and a review of incomplete submissions after launch. Ask the sponsor to evaluate additional features against budget, time and the original business problem.",
    },
    {
      title: "Managing handover and benefits after launch",
      objective:
        "Plan acceptance, operational readiness and a benefits review rather than ending at technical delivery.",
      deepening: `## Delivery needs an operational owner

A working system is not the same as a service people can operate reliably. Identify who will manage access, answer routine questions, handle exceptions and maintain instructions. Include these responsibilities in planning rather than leaving them for the final week.

Acceptance criteria should be agreed before the test. Record the cases tested, expected outcomes, results and outstanding defects. Distinguish an acceptable limitation with a named owner from a serious unresolved issue that prevents use. A sponsor's approval should be informed by this evidence.

## Close responsibly

Prepare user guidance, support contacts, training and a clear handover record. Confirm where ongoing costs and maintenance responsibilities sit. Capture lessons about planning and delivery while the team remembers them. Schedule a benefits review using the baseline and consistent measures. If adoption is weak, investigate workload, incentives, training or design rather than assuming the original business case has been achieved.`,
      scenario:
        "A fictional booking system passes its technical demonstration. Reception staff have no accounts, the help guide is incomplete and nobody knows who resolves duplicate bookings. The project manager plans to close the project on Friday because all software tasks are marked done.",
      task: "Create a readiness checklist, acceptance record and handover plan. Assign operational support, training and unresolved issues. Define a 30-day benefits review with measures comparing the new service with its baseline.",
      solution:
        "Delay unrestricted launch until access, essential guidance and exception ownership are ready. Test representative bookings and duplicate cases with operational users. Assign each remaining issue a severity, owner and date, and obtain informed acceptance. Track adoption, booking corrections and turnaround after launch rather than equating installation with benefit.",
    },
    {
      title: "Choosing a delivery approach and planning a Sprint",
      objective:
        "Justify predictive, iterative or hybrid delivery and connect a Sprint Goal to usable work.",
      deepening: `## Separate uncertainty from avoidable confusion

Stable, well-understood work can often be planned in detail. Work exploring user needs may benefit from short feedback cycles. In either situation, clarify purpose, authority and quality. Calling a project agile does not remove those responsibilities, and using a predictive plan does not make feedback unnecessary.

For an iterative service, define a small outcome that users can inspect. In Scrum, the Sprint Goal gives a coherent purpose rather than a random list of tickets. Developers plan work towards a usable Increment that meets a shared Definition of Done. Testing, security and operational considerations should not be postponed behind a misleading 'finished' label.

## Use feedback to adapt

At a review, inspect the result with stakeholders and discuss what it means for future work. At a retrospective, inspect how the team worked and choose improvements. Do not confuse approval of a presentation with inspection of a usable outcome. Keep formal gates where genuinely required and explain how they interact with iterative delivery.`,
      scenario:
        "A fictional team is building a learner enquiry tool. Staff are unsure which information they need, but the organisation requires a privacy review before launch. The team proposes either planning every screen for six months or launching immediately with no review.",
      task: "Recommend a delivery approach. Write one Sprint Goal, three candidate work items and a short Definition of Done. Explain the privacy review, stakeholder feedback and one retrospective improvement.",
      solution:
        "Use short iterations to test a minimal enquiry workflow while retaining a defined privacy gate before real launch. A Sprint Goal could be to let authorised staff capture and follow up a fictional enquiry end to end. Done should include tested behaviour, permissions, validation and usable guidance. Review the actual workflow and adapt the backlog from evidence.",
    },
    {
      title: "Using a risk register to trigger action",
      objective:
        "Assess a cause-event-effect risk and distinguish mitigation from contingency.",
      deepening: `## Write a risk that can be managed

'Delivery risk' does not reveal enough to act. A useful statement explains the cause, uncertain event and consequence: because one venue is being negotiated, it may become unavailable, causing a launch delay. Identify the affected objective and the evidence supporting concern.

Use agreed likelihood and impact scales to compare priorities, acknowledging that ratings are estimates. An important risk needs an owner with the ability to coordinate action. Record the preventive response, cost or resource need, trigger, contingency and review date. Mitigation reduces exposure before an event; a contingency describes what to do if a defined condition occurs.

## Keep the register alive

Review changes in assumptions, supplier performance and remaining time. A risk may become an issue, reduce after a control, or remain unacceptable despite the control. Communicate residual exposure and escalate beyond the team's authority. Closing a risk requires a reason, not merely the arrival of a reporting deadline.`,
      scenario:
        "A fictional programme launch depends on a single venue reservation that is not confirmed. The venue owner has another enquiry. The launch is four weeks away, but the risk register simply says 'venue: medium' with no owner or action.",
      task: "Rewrite the risk as cause-event-effect. Assign rating assumptions, owner, mitigation, trigger and contingency. Add four other launch risks and explain how one would be converted into an issue if it occurred.",
      solution:
        "Name an owner to obtain written confirmation by a defined date and assess an approved alternative venue now. If confirmation is missing at the trigger date, activate the alternative with the sponsor's approval. If the venue is lost, record an issue with immediate actions and impacts. Reassess remaining schedule and communicate rather than leaving the old rating unchanged.",
    },
    {
      title: "Building a dependency-based project schedule",
      objective:
        "Calculate a simple critical path, distinguish effort from elapsed time and assign owners.",
      deepening: `## Sequence work from real dependencies

Suppose requirements take two days. Venue booking then takes three days and materials preparation takes four days in parallel. Invitations take one day after venue booking. A two-day rehearsal needs both invitations and materials complete. The paths are 2 + 3 + 1 + 2 = 8 days and 2 + 4 + 2 = 8 days under these simplified assumptions.

Both paths therefore affect the earliest completion. Delaying either can delay the rehearsal. A milestone marks a significant event without adding duration. The calculation assumes resources are available and the durations and dependencies are valid.

## Check feasibility beyond the diagram

If the same person must book the venue and prepare materials, the apparent parallel plan may be unrealistic. Distinguish working time, waiting and review. Assign owners, record assumptions and agree acceptance of work packages. When a deadline changes, explain which scope, resources or sequence must change instead of simply compressing every estimate.`,
      scenario:
        "A fictional workshop team promises delivery in eight working days using the lesson's dependency plan. The same administrator owns venue booking and all materials, and a sponsor's review is not included. The chart looks feasible but ignores resource and approval constraints.",
      task: "Draw the two paths in text, calculate the earliest finish and identify shared-resource and review risks. Produce an owner/duration/dependency table and recommend a realistic revised plan with milestones and a communication routine.",
      solution:
        "Show both eight-day paths, then state that this result assumes parallel capacity and no additional approval waiting. Confirm the sponsor's review duration and either assign separate resources or revise sequencing. Record the agreed baseline, owners and milestone dates. Report the effect of the changed assumptions before committing to the date.",
    },
  ],
  [
    {
      title: "Planning useful professional conversations",
      objective:
        "Build a reciprocal network with thoughtful introductions, permission and reliable follow-up.",
      deepening: `## Prepare a reason to connect

A useful introduction explains your role or interests and why this conversation is relevant. Ask about a real problem or learning goal rather than requesting generic advice from someone who has no context. Make the request small enough to answer and provide an easy way to decline.

Map connections across peers, related functions, mentors and communities. Strong relationships in one circle are valuable, but a varied network can reveal different perspectives. Offer useful resources or help within your capability without turning every exchange into a transaction.

## Follow through respectfully

After a conversation, refer to something specific and fulfil any promise you made. Ask permission before introducing people or sharing their details. Maintain only relevant private notes and respect communication preferences. A network grows through repeated reliability, not repeated demands. Review whether your plan includes contribution and learning as well as access to opportunities.`,
      scenario:
        "A fictional administrator attends an industry event and meets an operations manager discussing process improvement. They want career advice but have not yet identified a target skill. Their first draft message asks for a referral and includes three colleagues' phone numbers without permission.",
      task: "Rewrite the introduction and follow-up. Create a four-week relationship plan with peers, one adjacent function and a possible mentor. Explain what value you can contribute and how consent will be handled for introductions.",
      solution:
        "Reference the process-improvement discussion and ask one focused question or request a brief conversation about a defined skill. Do not attach other people's details. Offer an anonymised learning resource if relevant, follow through on promises and share what you applied later. Keep the conversation respectful without implying a referral is owed.",
    },
    {
      title: "Building evidence for a credible professional profile",
      objective:
        "Turn work examples into accurate achievement statements and a consistent portfolio.",
      deepening: `## Replace adjectives with evidence

'Excellent administrator' is difficult to assess. An achievement statement explains the situation, your action and the result. Use genuine measures where available, such as fewer missing records or faster retrieval, and state the period and baseline. If no reliable number exists, describe the observable outcome without inventing a percentage.

Distinguish your contribution from the team's result. You may have designed a checklist used in a wider improvement rather than led the entire programme. That contribution can still be valuable when described accurately.

## Curate a responsible portfolio

Choose a few examples that demonstrate the capabilities relevant to your direction. Explain the problem, your role, approach and learning. Use fictional data or obtain permission, and remove confidential details. Keep your CV, professional summary and public profile consistent. A polished profile attracts attention, but behaviour, evidence and honest boundaries sustain credibility.`,
      scenario:
        "A fictional coordinator helped a team reduce missing meeting actions. They created an action log but now describe themselves as having led a company-wide transformation with an unverified 90% efficiency gain. Their portfolio screenshot exposes client names.",
      task: "Rewrite the achievement accurately, draft a 70-word profile summary and create an anonymised portfolio description. Identify which claims need evidence and which details must be removed. Suggest how to gather a reliable measure for future work.",
      solution:
        "Explain that the coordinator introduced and maintained an action log supporting the team's follow-up process. Remove the invented percentage and confidential names. Describe verified adoption or feedback, and establish a baseline for future missed-action tracking. Align the same truthful contribution across the CV and profile.",
    },
    {
      title: "Turning a career goal into a 90-day evidence plan",
      objective:
        "Prioritise capability gaps, choose applied development activities and prepare an honest interview example.",
      deepening: `## Investigate the target work

Compare several relevant job descriptions and discuss the responsibilities with someone doing similar work. Separate capabilities repeatedly required from employer-specific preferences. Consider your values, practical constraints and the experience needed to work independently.

For each priority gap, record current evidence, the development activity and what would demonstrate improvement. A short course may build understanding; a supervised task can show application. Choose a manageable number of goals so the plan fits alongside existing responsibilities.

## Make progress visible

Divide 90 days into learning, practice and review stages, allowing overlap. Agree feedback with a supervisor or mentor where appropriate. Keep examples using Situation, Task, Action and Result, making your own contribution clear. A certificate is useful evidence of participation but should not be presented as proof of every workplace capability. Revisit the plan when new evidence changes your understanding of the role.`,
      scenario:
        "A fictional administrator wants an operations coordinator role. They can organise meetings but have little evidence of analysing process data or managing a small improvement. Their plan currently lists six courses with no practice, feedback or time allowance.",
      task: "Choose three capabilities and build a 90-day plan with weekly time, practice opportunities, feedback and evidence. Draft a STAR example from a genuine experience or a clearly labelled fictional practice case. Define a review decision at days 30, 60 and 90.",
      solution:
        "Prioritise process mapping, simple reporting and cross-team coordination. Learn the basics, apply them in an authorised small task, seek feedback and document the result. Review whether the evidence shows the required level of independence. Reduce the number of courses if the plan leaves no time for application.",
    },
    {
      title: "Writing and presenting a recommendation for action",
      objective:
        "Build a concise business case with evidence, options, a specific ask and a clear next step.",
      deepening: `## Give the reader a decision structure

Lead with the recommendation and requested approval, then explain the problem, evidence, options and implications. Distinguish facts, estimates and assumptions. A decision-maker should understand what changes, what it costs, who owns it and how success will be reviewed.

Use headings and a short comparison when options are genuinely parallel. Avoid an unexplained pile of figures. Define measures and show calculation steps where they matter. State uncertainty without burying the recommendation in caveats.

## Present the same reasoning clearly

Create a short sequence: problem, evidence, options, recommendation and action. Each slide should have one purpose and readable information. Rehearse to the time available and prepare for questions about cost, risk and alternatives. When you do not know an answer, state what you will check and when. Finish by confirming the decision, owner and follow-up rather than ending with a vague request for support.`,
      scenario:
        "A fictional office spends significant time locating files. An administrator wants a shared naming and indexing process, but their draft memo contains four pages of background and no clear request. The manager has three minutes to consider it.",
      task: "Write a 200-word memo recommending a limited filing pilot. Outline five presentation slides, compare two options, identify a cost assumption and propose success measures. Draft answers to questions about training effort and confidentiality.",
      solution:
        "Ask for a defined pilot with a named owner, scope and review date. Summarise a sample of retrieval delays, compare the current method with a controlled shared index and explain access safeguards. Measure retrieval time and misfiled items while monitoring adoption. Use the slides to support the same decision rather than adding unrelated information.",
    },
  ],
];
