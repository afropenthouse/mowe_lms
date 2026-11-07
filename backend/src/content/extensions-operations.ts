import type { ModuleExtension } from "./extensions.js";
export const operationsExtensions: ModuleExtension[][] = [
  [
    {
      title: "From customer insight to a focused offer",
      objective:
        "Translate research into a segment, value proposition and testable marketing plan.",
      deepening: `## Separate observations from conclusions

An interview comment is evidence of what one person said, not proof that an entire market wants the same thing. Combine interviews with enquiry patterns, purchase behaviour, support records and competitor alternatives. Write the assumption behind your offer and what evidence would weaken it.

Define a segment by a meaningful need or behaviour. 'Professionals' is broad; 'first-time supervisors managing small service teams' gives a clearer starting point for content, channels and price research. Explain the problem, desired outcome, constraints and alternatives available to that group.

## Test the complete proposition

State why your offer should be chosen and what evidence supports that claim. Check that the marketing mix can deliver it: the service, price, access and message must agree. Select one measurable objective, such as qualified enquiries that become paid registrations during a defined period. Record a baseline and review date. A useful experiment can disprove a weak assumption before the business commits a large budget.`,
      scenario:
        "A fictional academy promotes one course to every working adult. Interviews with ten new supervisors reveal a repeated need for giving feedback and allocating work. Existing customers say evening access matters more than printed manuals. The team has limited funds and cannot redesign everything at once.",
      task: "Write a segment profile, a one-sentence value proposition and a marketing-mix checklist. Identify three assumptions to test, select one pilot audience and define a 30-day objective with a conversion measure and denominator.",
      solution:
        "Pilot a practical supervisor offer with evening access and examples of feedback and delegation. Treat the interview findings as hypotheses to validate through actual enquiries and purchases. Compare qualified leads, registrations and early engagement against a baseline. Keep claims limited to what the course actually provides and share demand assumptions with delivery staff.",
    },
    {
      title: "Recovering a service failure and retaining trust",
      objective:
        "Coordinate a complaint response, maintain a useful CRM record and address the process cause.",
      deepening: `## Recovery has several stages

Acknowledge the problem accurately, establish facts and agree a remedy within your authority. A vague apology without ownership leaves the customer uncertain. Name the next action, responsible person and update time, even when a full resolution is not yet possible.

Use the CRM to preserve relevant history: what was promised, what evidence was checked, the customer preference, owner and follow-up date. Avoid recording unnecessary sensitive details or subjective labels. Make sure the next colleague can continue the work without asking the customer to repeat everything.

## Close the loop

Resolution requires confirming the outcome, not simply changing an internal ticket status. Review repeated complaints by cause and handoff. Measure first response, time to resolution, repeat contact and relevant customer feedback together. If a process repeatedly fails, coaching one support officer will not be enough. Assign an improvement owner and verify whether the change reduces recurrence.`,
      scenario:
        "A fictional learner pays for a cohort but receives no access. They contact support three times and each agent asks for the same receipt. Payment is valid, but the confirmation was never linked to the learner account. The learner is now considering leaving the programme.",
      task: "Draft the first response and a follow-up confirmation. Design a minimal CRM record, assign the payment/access handoff owner and propose an improvement. Define measures for the recovery and for preventing recurrence.",
      solution:
        "Acknowledge the repeated effort, verify payment through the approved process and assign one owner to coordinate access. State an update time that can be met. Confirm that the learner can enter the course, then document the failure cause. Link payment references to accounts and flag unmatched transactions for review. Track repeated access failures and resolution time together.",
    },
    {
      title: "Evaluating a digital campaign beyond clicks",
      objective:
        "Calculate conversion and acquisition measures and design a useful landing-page experiment.",
      deepening: `## Define the funnel precisely

Suppose a campaign produces 20,000 impressions, 800 clicks, 600 measured landing-page visits, 60 enquiries and 12 paid customers. Click-through rate is 800 / 20,000 = 4%. Enquiry conversion by measured visits is 60 / 600 = 10%. Paid-customer conversion by measured visits is 2%. These measures have different denominators and answer different questions.

If campaign cost is ₦72,000, attributed acquisition cost is ₦6,000 per paid customer. That is not automatically good or bad: compare customer contribution, retention, attribution quality and delivery capacity. The difference between clicks and measured visits also deserves investigation.

## Improve the weak stage

Check message-to-page consistency, mobile usability, form clarity and follow-up. Change one meaningful variable in an experiment and define the success measure beforehand. Avoid judging a test by whichever metric happens to improve. Small samples and multiple channels can limit confidence; include those limits when recommending whether to increase spending.`,
      scenario:
        "A fictional course campaign has many clicks, but support replies to enquiries only after four days. Marketing wants a larger ad budget. Operations reports available course places, and the signup form asks for information that is not needed to answer an enquiry.",
      task: "Calculate the funnel measures using the lesson figures. Choose one landing-page or follow-up experiment, specify a control and review period, and state what would justify more spending. Include a privacy-conscious form improvement.",
      solution:
        "Report the 4% click-through rate, 10% enquiry conversion, 2% visit-to-paid conversion and ₦6,000 acquisition cost with clear definitions. Test a simpler enquiry form or a faster follow-up process, changing one variable at a time. Judge paid-customer outcomes and quality, not clicks alone. Confirm capacity and customer contribution before expanding the budget.",
    },
  ],
  [
    {
      title: "Finding the constraint in a slow process",
      objective:
        "Distinguish processing time, waiting and rework, then design a controlled process pilot.",
      deepening: `## Measure elapsed time and effort separately

A request might require 15 minutes of active work but take five days to complete. Record when it arrives, when each step starts and ends, and why it waits. Do not assume the longest visible task is the constraint. Queue length, available capacity and the rate of incoming work influence flow.

Track rework as well as delay. If forms are incomplete, staff may repeatedly stop and restart the same request. A standard input checklist can improve flow more than asking people to type faster. Check whether a step is essential control, customer value or avoidable duplication before removing it.

## Run a bounded improvement

State the problem, baseline and hypothesis. Pilot with a defined group and period, keeping a way to handle exceptions. Compare lead time, complete-first-time rate and errors before deciding to scale. Review whether work was merely shifted elsewhere. Involve the people receiving the output so the new process improves the entire service.`,
      scenario:
        "A fictional reimbursement process takes ten days. Staff spend 25 minutes processing each complete claim. Forty percent of submissions lack a receipt or approval, and the approver checks the queue only once a week. Employees believe the finance team simply works too slowly.",
      task: "Map the process with waiting and active time. Identify two causes to investigate and propose a one-week pilot. Define entry requirements, an approval routine, an exception path and measures that protect speed and payment accuracy.",
      solution:
        "Test a complete-submission checklist and more frequent scheduled approval reviews. Record incomplete submissions separately and name an owner for exceptions. Compare end-to-end lead time, missing-document rate and payment corrections. Do not remove approval merely to make the chart look faster; first test whether clearer inputs and a predictable queue reduce the delay.",
    },
    {
      title: "Stock availability, lead time and supplier reliability",
      objective:
        "Use a reorder calculation and supplier evidence to balance stockouts against excess inventory.",
      deepening: `## A trigger needs reliable inputs

With average use of 12 units per working day, replenishment lead time of four working days and safety stock of 15 units, a simple reorder point is 63 units. The calculation assumes stable demand and lead time. It is a planning aid, not a guarantee against shortages.

Check the inventory position: physical stock, usable stock, committed demand and orders already placed can differ. Do not reorder repeatedly because an incoming order has been omitted from the records. Count critical items and investigate discrepancies. Damaged or expired items should not inflate available stock.

## Evaluate the supply risk

Compare suppliers on complete deliveries, defects, actual lead time, total cost and responsiveness. A low price loses value if delays interrupt a service. Decide which items need a backup source, and approve the alternative before an emergency. Review demand and lead-time changes regularly, especially around promotions or seasonal activity.`,
      scenario:
        "A fictional office uses 12 toner units each working day. Its supplier promises four-day delivery, but the last three orders arrived in four, seven and nine days. Records also include damaged stock as available. The purchasing team wants to keep using the same 63-unit reorder trigger without review.",
      task: "Calculate the original reorder point and explain its assumptions. Create a supplier scorecard, correct the stock definition and recommend evidence needed before changing the safety allowance or using a backup supplier.",
      solution:
        "The simple trigger is 12 × 4 + 15 = 63 units. Actual delays and damaged stock make its inputs unreliable. Exclude unusable stock, include valid incoming orders and review demand and lead-time history with the responsible team. Evaluate a qualified backup source and document the trade-off between availability, cash tied up and obsolescence.",
    },
    {
      title: "Planning a realistic week with competing priorities",
      objective:
        "Allocate capacity, identify dependencies and renegotiate conflicting deadlines clearly.",
      deepening: `## Start with capacity, not optimism

Estimate the time genuinely available after fixed meetings, service commitments and routine administration. A 40-hour week does not offer 40 hours of uninterrupted project work. Add reasonable buffers for review, coordination and predictable interruptions. Record assumptions so a plan can be adjusted when the work changes.

Rank work by business effect, deadline, dependency and consequences of delay. A task with no immediate deadline may prevent a serious future problem. Break outcomes into actions and define what finished means. Identify external waiting that affects elapsed time even when personal effort is short.

## Make trade-offs visible

Use a small ready/doing/blocked/done board and limit simultaneous tasks. When urgent work arrives, show what it displaces and ask the decision owner to confirm priorities. A concise renegotiation message describes the conflict, options, recommendation and decision date. Daily review should update the plan, not become another long meeting.`,
      scenario:
        "A fictional administrator has 24 hours of flexible capacity after routine commitments. Three planned tasks require 10, eight and six hours. A manager adds a six-hour urgent request while keeping every original deadline. One task also depends on data due Thursday.",
      task: "Create a weekly plan showing focus blocks, dependencies and a buffer. Explain why the total commitments conflict with capacity. Propose options to defer, reduce scope or delegate, then write a short message requesting a priority decision.",
      solution:
        "The original tasks consume all 24 flexible hours and leave no buffer; the urgent request takes demand to 30 hours. Clarify the business impact of each outcome, protect the dependency and propose a specific trade-off. Delegate only with capability, authority and acceptance criteria. Confirm revised commitments rather than promising to solve a structural capacity problem by working faster.",
    },
  ],
];
