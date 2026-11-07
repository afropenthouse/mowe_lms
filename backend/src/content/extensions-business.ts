import type { ModuleExtension } from "./extensions.js";
export const businessExtensions: ModuleExtension[][] = [
  [
    {
      title: "Designing accountability as a business grows",
      objective:
        "Compare organisational options and create clear decision rights for a growing business.",
      deepening: `## Structure follows the work

A small business often coordinates through its founder. As orders, staff and locations increase, that habit becomes a constraint: routine decisions wait for someone who no longer has enough context or time. Growth therefore requires explicit responsibilities, decision limits and reporting routines, not simply new job titles.

Compare functional and divisional arrangements against the work. A shared finance function can provide consistent controls across locations. Local operating teams can respond to customer needs, but need boundaries for pricing, hiring and purchasing. A matrix may share specialists between projects, provided conflicting priorities have a defined resolution route.

## Build a decision-rights map

For each recurring decision, write who proposes, who decides, who executes and who receives the record. Give routine decisions a reasonable limit and escalate exceptions. For a supplier purchase, define the budget, approval threshold, evidence and backup approver. Review whether decisions are becoming faster without increasing mistakes. An organisation chart helps people find a manager; a decision map helps them finish work.`,
      scenario:
        "A fictional distributor expands from one Lagos office to branches in Ibadan and Abuja. Every discount, purchase and leave request still waits for the founder. Branch managers understand local customers but have no written authority. Customers complain about delays, while finance worries that unlimited local discretion could cause inconsistent pricing and overspending.",
      task: "Produce a decision-rights table for discounts, routine purchasing, recruitment and customer complaints. Compare one centralised and one delegated approach. Choose limits appropriate to fictional budgets, identify exception triggers and explain how the founder receives assurance without approving every action.",
      solution:
        "Keep policy, cash oversight and exceptional commitments centrally controlled. Give branch managers defined authority for routine decisions within approved budgets and price limits. Record decisions in a shared log, name backup approvers and review exception rates monthly. Explain that the amounts are planning assumptions, not legal thresholds. Success combines shorter turnaround with fewer unauthorised exceptions.",
    },
    {
      title: "Following an order across departments",
      objective:
        "Diagnose a cross-functional handoff using a process map and shared measures.",
      deepening: `## Follow one complete customer outcome

An order-to-cash process links enquiry, agreement, stock allocation, delivery, invoicing and collection. Sales may see an order as complete when the contract is signed; operations sees completion at delivery; finance sees it when the payment clears. These local definitions can hide a broken overall process.

Map the information passed at every boundary: customer identity, agreed scope, price, delivery address, payment terms and approval evidence. Specify a receiving owner and a way to reject incomplete inputs promptly. Use a shared identifier so staff can trace an order without repeatedly asking colleagues for context.

## Use a balanced handoff agreement

Set a service expectation for complete requests, not an unrealistic promise covering every exception. Track end-to-end lead time, incomplete handoffs, corrections and collection delays. A responsibility matrix should identify one accountable owner for the customer outcome while retaining specialist approvals. Regularly inspect a few real cases together: averages can conceal a small number of very poor experiences.`,
      scenario:
        "A fictional office-supplies business accepts 40 orders in a week. Eight reach the warehouse without confirmed addresses, five invoices use a different price from the sales agreement and three customers receive duplicate collection reminders. Each department reports that it met its own activity target.",
      task: "Map the order-to-cash workflow. Specify the minimum information at each handoff, assign responsible and accountable roles, and create three shared measures. Draft a short handoff agreement between sales, operations and finance, including how incomplete requests are returned.",
      solution:
        "Use one order record with validated address, approved price, terms and delivery confirmation. Sales owns complete order entry, operations confirms fulfilment and finance invoices against the approved record. Assign a process owner to resolve cross-functional issues. Measure complete-first-time orders, order-to-delivery time and invoice corrections; review a sample of failed orders to find causes.",
    },
    {
      title: "Ethical procurement and an evidence trail",
      objective:
        "Apply conflict-of-interest controls and document a fair supplier decision.",
      deepening: `## Fairness must be observable

A procurement decision should be explainable to someone who was not in the room. Define the requirement and assessment criteria before reviewing offers. Comparable quotations should address the same scope, delivery expectations and quality requirements. The cheapest offer may carry higher total cost if reliability, support or replacement costs are poor.

Distinguish declaring an interest from managing it. A person can openly disclose a family connection and still influence the outcome unfairly if they score bids or pressure colleagues. Agree an independent reviewer and document any recusal. Gifts and hospitality should follow policy and be considered in their timing and context.

## Maintain proportionate controls

Retain the request, approval, offers, scoring rationale, decision and receipt evidence. Restrict access to commercial details and report concerns through appropriate channels. Do not invent accusations from a price difference alone. A sound control should prevent or reveal a specific risk, with an owner and a record of whether it operated.`,
      scenario:
        "A fictional training company needs printing for a new cohort. A procurement assistant's sibling owns one bidding firm. That firm's quotation is cheapest but omits delivery and reprint terms. The assistant says the relationship is harmless because the price is lower than the competitors' prices.",
      task: "Write a procurement decision memo. Identify the conflict, missing information, independent decision owner and records to retain. Propose a comparison using total cost, quality, reliability and delivery. Draft a neutral request asking all bidders to clarify the same missing requirements.",
      solution:
        "Disclose the relationship and remove the assistant from assessment and recommendation. Request comparable scope from every bidder before scoring. An independent approver reviews documented criteria and keeps the rationale with the quotations. The related firm is neither automatically selected nor automatically accused; a fair process manages the conflict and evaluates the actual offer.",
    },
    {
      title: "Negotiating scope, service and payment",
      objective:
        "Prepare a negotiation that considers several variables and records a workable agreement.",
      deepening: `## Expand the range of possible agreements

Price is only one part of a business agreement. Delivery timing, quantity, scope, payment schedule, service levels and cancellation conditions can matter just as much. Prepare by understanding which variables you can change, which require approval and which protect essential business needs.

List your target and minimum acceptable outcome for each important variable. Research objective criteria, such as comparable scope and service costs. Consider the other side's likely pressures without assuming you know their motives. Ask questions to test those assumptions. Your BATNA must be a realistic alternative, not a threat you cannot carry out.

## Make conditional proposals

Link concessions to commitments: a lower unit price could depend on a confirmed group size or a different delivery arrangement. Avoid granting discounts before you know whether the proposal solves the other party's problem. Summarise agreed terms, unresolved items and approval requirements. End with a written record, responsible people and a clear acceptance step.`,
      scenario:
        "A fictional client wants training for 30 staff at a 15% discount, delivery next week and payment after 60 days. The provider can deliver next month more efficiently and needs a deposit for venue costs. The client mainly needs to reserve the training before its budget review.",
      task: "Prepare three packages trading timing, group size, payment and scope. Define your BATNA and approval limits. Write opening questions, one conditional proposal and a follow-up email stating the agreed terms and outstanding decisions.",
      solution:
        "Ask which dates and budget commitments are essential. Offer a next-month cohort with a confirmed minimum group and staged payment, or a smaller urgent session at the standard rate. Check contribution and capacity before promising either. Record dates, deliverables, price, payment, cancellation terms and acceptance rather than relying on a friendly verbal understanding.",
    },
  ],
  [
    {
      title: "Contribution, pricing and cash timing",
      objective:
        "Evaluate a discount using contribution, capacity and the timing of cash receipts.",
      deepening: `## Calculate the effect of a decision

At a selling price of ₦15,000 and variable cost of ₦9,000, each unit contributes ₦6,000 towards fixed costs and profit. With fixed costs of ₦300,000, simple break-even volume is 50 units. A 10% discount reduces the price to ₦13,500 and contribution to ₦4,500. Break-even rises to 66.67 units, so at least 67 whole units are needed under these assumptions.

A discount therefore needs a reason stronger than 'more sales'. Examine whether additional volume is feasible, whether customers would otherwise buy at full price, and whether extra activity creates overtime, delivery or credit costs. Contribution is useful for short-term analysis but does not remove the need to cover long-term costs.

## Check the cash calendar

Compare when materials, staff and suppliers must be paid with when customers are expected to pay. A profitable order can create a funding gap. State assumptions about deposits, collection dates, capacity and bad debts before recommending a decision.`,
      scenario:
        "A fictional service business is offered an order for 70 units at a discounted price. It can produce 60 units with current capacity. Customers will pay 45 days after delivery, while suppliers require payment before production. The sales team calls the order an automatic success because its revenue is large.",
      task: "Calculate contribution before and after the 10% discount using the lesson figures. Explain the new break-even volume. Create a simple cash timeline, identify the capacity issue and propose two conditions that would make the offer more manageable.",
      solution:
        "The discounted unit contribution is ₦4,500 and break-even requires 67 units. The 70-unit order exceeds current capacity, and cash arrives after supplier payment. Investigate the cost of extra capacity and request a deposit or staged delivery. Recommend acceptance only after checking those costs and funding needs; revenue alone does not establish viability.",
    },
    {
      title: "Reading performance beyond a single ratio",
      objective:
        "Use financial statements and simple ratios to investigate operating performance.",
      deepening: `## Connect the statements

Consider a fictional business with ₦2 million revenue and ₦1.2 million cost of sales. Gross profit is ₦800,000 and gross margin is 40%. If operating expenses are ₦650,000, operating profit before other items is ₦150,000. These figures describe performance for a period, not cash available today.

Suppose current assets are ₦1.5 million and current liabilities ₦1 million. The current ratio is 1.5, but this may include overdue receivables and inventory that is difficult to sell. Examine ageing, stock condition and the timing of obligations. A loan can improve the bank balance while increasing liabilities; it does not create trading revenue.

## Make comparisons meaningful

Compare consistent periods and definitions. Investigate changes in prices, product mix, credit terms and one-off items. Ask whether growth is supported by collections and capacity. A useful analysis reports the calculation, its business implication, the limitations and the next evidence required. Avoid treating one ratio as a universal pass or fail.`,
      scenario:
        "A fictional distributor's revenue rises from ₦1.6 million to ₦2 million. Receivables rise from ₦300,000 to ₦800,000, while its bank balance falls. Management wants to expand immediately because sales grew by 25%.",
      task: "Calculate revenue growth and describe three questions for finance. Explain why sales growth and cash weakness can coexist. Recommend a short investigation using the income statement, financial position, cash flows and receivables ageing.",
      solution:
        "Revenue growth is (2.0 − 1.6) / 1.6 = 25%. The receivables increase suggests collections need investigation, but does not prove the cause alone. Check payment terms, overdue balances, stock purchases and other cash movements. Review reliable cash forecasts before expansion and distinguish a collection action from a profitability recommendation.",
    },
    {
      title: "Explaining budget variances fairly",
      objective:
        "Separate activity changes from cost changes and recommend proportionate budget actions.",
      deepening: `## Compare comparable activity

A workshop budget assumes 30 participants and catering at ₦4,000 each, giving ₦120,000. Actual attendance is 36 and catering costs ₦162,000. Comparing only with the original budget gives a ₦42,000 overrun. At the planned rate, 36 participants would cost ₦144,000, so ₦24,000 relates to extra volume and ₦18,000 to higher cost per participant.

This simple flexible comparison helps explain the result. It does not automatically establish whether the extra attendance was valuable or the price increase avoidable. Review approved changes, supplier terms, quality and the revenue or benefits associated with the event.

## Turn explanation into action

Give each important variance a cause, owner and response. Improve forecasts when demand assumptions were weak; improve purchasing when prices changed; fix rework when errors drove consumption. Do not cut every category equally. Protect essential quality and compliance, and distinguish savings that genuinely reduce spending from costs shifted to another team.`,
      scenario:
        "A fictional training team reports that catering exceeded budget by ₦42,000. Attendance increased by six people and the supplier raised its per-person price. Another manager proposes cutting all future catering budgets by 35% without examining the cause.",
      task: "Prepare a variance note using the lesson figures. Separate volume and price effects, explain what further information is needed and recommend two actions. Add a one-month cash forecast with an owner and review date for each major assumption.",
      solution:
        "Report a ₦24,000 volume effect and ₦18,000 additional price effect against the original ₦120,000 budget. Ask whether extra attendance was approved and whether supplier changes were anticipated. Improve attendance forecasts and price confirmation, then compare cost per participant and service quality rather than applying an arbitrary blanket cut.",
    },
    {
      title: "Building a tax-compliance evidence pack",
      objective:
        "Organise reliable records, review responsibilities and current-source checks for tax administration.",
      deepening: `## Distinguish calculation from administration

Before calculating an obligation, identify the entity, transaction, period and relevant authority. Similar-looking invoices can have different treatment because the nature of the supply or the parties differs. Do not treat an old invoice, a colleague's memory or a social-media post as the final authority for a current rule.

Build an evidence pack linking invoices, contracts, payroll schedules, ledger entries, payment records and reconciliation notes. Record the source checked, date, responsible preparer and reviewer. When an amount is collected or deducted on behalf of an authority, track the related liability and evidence of remittance separately from ordinary revenue.

## Manage exceptions explicitly

Use a calendar with confirmed due dates, reminders, review time and backup ownership. Resolve missing documents before the deadline becomes urgent. If a classification remains uncertain, escalate to the finance or tax adviser with the facts and questions. Keep corrections traceable. This workflow supports accurate compliance without inventing rates or giving an administrator authority they do not have.`,
      scenario:
        "A fictional business has inconsistent supplier descriptions, missing payment evidence and a payroll schedule that does not reconcile to the ledger. A filing deadline is approaching, but nobody has documented who reviews the return or which current rules were checked.",
      task: "Create an evidence-pack index and compliance calendar. Identify missing records, reconciliation differences, the preparer and reviewer, an escalation route and proof of filing/payment. Do not insert rates or deadlines until confirmed from current official guidance.",
      solution:
        "Group records by obligation and reporting period, reconcile ledger balances to supporting schedules and assign exceptions to named owners. Finance confirms treatment and due dates with current sources. Reserve review time, obtain approval and retain submission and payment acknowledgements. Track unresolved items rather than silently estimating them.",
    },
  ],
];
