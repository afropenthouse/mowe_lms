import { course, lesson } from "./helpers.js";
export const operations = course(
  4,
  "Operations and Productivity",
  "Improve how work moves through a business. Practise process mapping, supply-chain coordination and personal task management while balancing speed, quality and cost.",
  [
    lesson(
      "Operational Excellence & Process Optimization",
      "Map a process, identify bottlenecks and test an improvement using baseline measures.",
      `## Understand the work before changing it

Operations turns inputs into outputs that customers value. A process is a repeatable sequence with a trigger, owner, inputs, steps, output and customer. Map how work actually happens, including waiting, rework and informal approvals, rather than drawing only the official procedure.

Distinguish value-adding steps from necessary controls and avoidable waste. Waiting for information, duplicate data entry, unnecessary movement and correcting mistakes can consume more time than the main task. A bottleneck is the constrained step limiting overall flow. Making other steps faster may simply create a larger queue before that constraint.

## Measure a baseline

Useful measures include lead time from request to delivery, processing time spent actively working, throughput over a period, error rate and first-pass quality. Define each measure consistently. Collect enough observations to distinguish a recurring pattern from one unusual case.

## Improve and standardise

Use a small plan-do-check-act cycle: define a problem and hypothesis, test a change on a limited scale, compare results and unintended effects, then adapt or standardise. Ask why an error occurs rather than assigning blame. A checklist may prevent missing inputs, but only if the task owner can use it reliably. Protect safety, quality and essential approvals when removing steps.`,
      "Expense reimbursement takes ten days, although processing needs only 25 minutes. Most delay comes from missing receipts and an approval queue. A submission checklist and scheduled approvals reduce waiting without weakening financial checks.",
      "Map a seven-step process. Record waiting and working time for five examples, locate the likely constraint and design a one-week pilot. Name a speed measure and a quality measure.",
      "Improve the whole flow with evidence. Removing a necessary control can make work faster and less reliable.",
    ),
    lesson(
      "Introduction to Supply Chain Management",
      "Explain planning, sourcing, inventory and delivery, and balance availability with cost and risk.",
      `## Follow value from supplier to customer

A supply chain connects demand planning, sourcing, purchasing, receiving, storage, production or service preparation, delivery and returns. Money and information move alongside materials. Clear specifications, reliable forecasts and timely updates are as important as transport.

Evaluate suppliers using quality, lead time, reliability, capacity, total cost and risk, rather than price alone. Confirm what is being ordered, quantities, delivery terms, acceptance checks and escalation contacts. Keep purchase orders, receipt records and invoices aligned before payment.

## Manage inventory and uncertainty

Inventory supports availability but ties up cash and may expire, become damaged or become obsolete. Stockouts interrupt service and can harm trust. Reorder planning considers demand during replenishment lead time plus an appropriate safety allowance.

In a simplified stable-demand example, if daily use is 10 units, lead time is five working days and safety stock is 20 units, reorder point is 70 units. Actual practice must consider variability, orders already placed and the definition of available stock.

## Build resilience

Review supplier concentration, alternative sources, lead-time changes and quality trends. A backup supplier is useful only if approved and capable. Share accurate demand updates and communicate delays early. Returns and damaged stock should be recorded so inventory figures remain usable.`,
      "A small office repeatedly runs out of printer supplies despite low purchase prices. Tracking actual use, replenishment time and available stock leads to a reorder trigger and an approved backup supplier.",
      "Create a supplier scorecard with five criteria. Calculate a reorder point for 12 units of daily demand, four days of lead time and 15 safety units. Explain two risks that this simple calculation does not capture.",
      "Supply-chain performance balances availability, total cost and resilience. Accurate information reduces both shortages and unnecessary stock.",
    ),
    lesson(
      "Time and Task Management Techniques",
      "Prioritise by outcome, plan realistic capacity and communicate dependencies before deadlines slip.",
      `## Decide what deserves attention

A task list records work; priorities explain the order in which it should be done. Start with deadlines, business impact, dependencies and consequences of delay. Distinguish urgent work from important work. An urgent request is not automatically more valuable than a planned task that prevents a major future problem.

Break large outcomes into actions with a clear owner and definition of done. Estimate effort and include review, communication and interruptions. Track dependencies: a task may take one hour but still need three days of elapsed time while you wait for an input.

## Protect focus and limit work in progress

Time blocking reserves periods for focused work. Batching similar tasks reduces repeated setup. A simple Kanban board shows ready, doing, blocked and done. Limiting work in progress helps finish existing commitments before starting more. Short focused intervals can help concentration, but choose a rhythm suitable for the job.

## Review and renegotiate

Plan a short daily check and a weekly review. Compare promised work with available capacity and communicate risks early. When a new priority arrives, ask what should move instead of silently accepting incompatible deadlines. Delegation should include expected output, authority, resources, check-in dates and acceptance criteria. Working longer is not a reliable substitute for clear priorities and manageable commitments.`,
      "An administrator has a board pack due tomorrow and several routine requests. They protect a focused preparation block, delegate document collection with clear criteria and agree a later date for low-impact requests.",
      "List ten tasks, estimate effort and identify dependencies. Choose three outcomes for tomorrow, create focus blocks with a buffer, and draft a message renegotiating one unrealistic deadline.",
      "Productivity means completing the right work reliably. Make trade-offs visible and keep commitments realistic.",
    ),
  ],
  [
    [
      "What should a useful process map show?",
      "The actual steps, handoffs, waiting and rework.",
      "Only the manager's preferred version.",
      "Only staff names.",
      "Only the final invoice.",
      "Mapping actual work reveals constraints hidden by the official procedure.",
    ],
    [
      "What is a bottleneck?",
      "A constrained step limiting overall flow.",
      "Every task with a deadline.",
      "The cheapest supplier.",
      "A record of all expenses.",
      "The bottleneck limits system throughput; faster upstream work can simply enlarge its queue.",
    ],
    [
      "Why measure both speed and quality after a change?",
      "Faster work may create more errors or rework.",
      "Quality never affects customers.",
      "Speed proves every control works.",
      "Only one measure is ever allowed.",
      "Balanced measures reveal whether an improvement creates harmful side effects.",
    ],
    [
      "What follows a small improvement pilot?",
      "Compare results with the baseline and adapt or standardise.",
      "Roll it out regardless of results.",
      "Delete the baseline.",
      "Assume every delay was staff laziness.",
      "The check and act stages use evidence to decide what happens next.",
    ],
    [
      "Which supplier comparison is strongest?",
      "Quality, reliability, lead time, capacity and total cost.",
      "Lowest price alone.",
      "The nicest logo alone.",
      "The most social-media followers alone.",
      "A low purchase price can be outweighed by delays, defects and other costs.",
    ],
    [
      "Daily use is 10 units, lead time five days and safety stock 20. What is the simple reorder point?",
      "70 units",
      "30 units",
      "50 units",
      "200 units",
      "Expected lead-time demand is 50 units; adding 20 safety units gives 70.",
    ],
    [
      "What is a cost of holding excessive inventory?",
      "Cash is tied up and stock may become obsolete.",
      "Every item becomes free.",
      "All supply risks disappear.",
      "Demand becomes guaranteed.",
      "Inventory supports service but consumes working capital and introduces storage risks.",
    ],
    [
      "What is the purpose of a work-in-progress limit?",
      "Finish commitments before starting too many more.",
      "Prevent every new idea permanently.",
      "Remove all customer requests.",
      "Avoid tracking blocked work.",
      "Limiting concurrent tasks helps flow, focus and completion.",
    ],
    [
      "A new urgent task conflicts with an agreed deadline. What should you do?",
      "Clarify priorities and agree which commitment moves.",
      "Accept both silently regardless of capacity.",
      "Ignore the new request without explanation.",
      "Hide the original deadline.",
      "Visible trade-offs allow realistic planning and informed decisions.",
    ],
    [
      "What should a delegated task include?",
      "Output, authority, resources and check-in dates.",
      "Only a vague instruction to help.",
      "No owner.",
      "No acceptance criteria.",
      "Delegation works when expectations and support are explicit.",
    ],
  ],
  "Improve an operational workflow",
  "Map a real or fictional process, including owners, waiting, rework and the customer outcome. Identify one bottleneck and propose a small improvement pilot. Include baseline measures, a supplier or resource dependency, a one-week task plan and risks to quality. Submit 600–900 words plus a simple process map described in text. Criteria: process analysis (30%), feasible improvement (30%), measures and risk controls (25%), clarity (15%).",
);
