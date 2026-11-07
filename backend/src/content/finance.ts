import { course, lesson } from "./helpers.js";
export const finance = course(
  2,
  "Financial Literacy for Professionals",
  "Build the financial understanding needed to interpret performance, manage budgets and allocate resources. Practise cash-flow reasoning, simple analysis and responsible tax administration.",
  [
    lesson(
      "Financial Acumen",
      "Distinguish revenue, profit and cash; calculate margins and a simple break-even point.",
      `## The numbers behind a decision

Revenue is income earned from selling goods or services. Expenses are costs recognised in earning that income. Profit is the difference between income and expenses for a period. Cash flow records actual movements of money. A profitable business can still struggle to pay bills when customers pay late or cash is tied up in stock.

Distinguish fixed costs, which stay broadly stable within a relevant activity range, from variable costs, which change with activity. Office rent may be fixed in the short term; materials used for each unit are variable. Some costs contain both elements. Avoid assuming every cost changes immediately when sales change.

## Contribution, margin and break-even

Contribution per unit equals selling price minus variable cost per unit. For a simple single-product example, break-even units equal fixed costs divided by contribution per unit. With a price of ₦10,000, variable cost of ₦6,000 and fixed costs of ₦400,000, contribution is ₦4,000 and break-even is 100 units. This model assumes constant prices and costs within the relevant range.

A margin expresses profit as a percentage of revenue. Markup expresses an addition relative to cost; they are different denominators. Before recommending a discount, consider contribution, capacity, collection timing and the effect on customers who pay the standard price.`,
      "A service team reports ₦2 million of revenue but has collected only ₦800,000. Staff still need paying. The administrator tracks due dates and follows up invoices instead of treating reported revenue as available cash.",
      "For a product priced at ₦15,000 with variable cost ₦9,000 and fixed costs ₦300,000, calculate contribution and break-even units. Then explain why selling those units on credit may not immediately fund next month's expenses.",
      "Profit measures performance; cash supports payment obligations. Use contribution and realistic collection assumptions together.",
    ),
    lesson(
      "Understanding Financial Statements & Basic Analysis",
      "Read the purpose of the main financial statements and calculate basic liquidity and profitability measures.",
      `## Three connected views

The statement of financial position shows assets, liabilities and equity at a date. Assets are resources controlled by the business; liabilities are obligations; equity is the residual interest. The basic equation is assets = liabilities + equity.

The income statement summarises income and expenses over a period. The cash flow statement explains cash movements from operating, investing and financing activities. These statements answer different questions and should be read together. Borrowing can increase cash without creating sales revenue; buying equipment can reduce cash without making its full purchase price an immediate operating expense.

## Start with comparable figures

Check the reporting period, currency, accounting basis and whether figures are actual, budgeted or estimated. Compare like periods and look for unusual one-off items. An increase in sales is less reassuring if receivables rise much faster because invoices remain unpaid.

Gross margin = gross profit / revenue × 100. Current ratio = current assets / current liabilities. For current assets of ₦900,000 and current liabilities of ₦600,000, the current ratio is 1.5. This does not guarantee cash availability: inventory may be slow-moving and receivables difficult to collect.

## Turn analysis into questions

Investigate trends and context rather than declaring a business healthy from one ratio. Ask what changed, whether the data is reliable, how performance compares with relevant expectations and what operational action could improve it.`,
      "Sales grow 20% while cash collections barely move. Reviewing receivables ageing reveals that a large customer is overdue. A payment follow-up and revised credit controls address the underlying issue.",
      "A business has revenue of ₦1,000,000, cost of sales of ₦650,000, current assets of ₦800,000 and current liabilities of ₦400,000. Calculate gross margin and current ratio, then write two questions you would ask before recommending expansion.",
      "Financial statements are complementary. Use ratios to prompt investigation, not replace judgement.",
    ),
    lesson(
      "Budgeting, Cost Control & Resource Allocation",
      "Prepare an operational budget, interpret variances and prioritise spending against measurable outcomes.",
      `## Build a budget from activities

A budget translates objectives into expected income, costs and resource needs for a defined period. Start with the outcome, expected activity and assumptions. Identify staffing, materials, technology, travel and contingency requirements. Name owners and separate approved commitments from estimates.

Create a cash forecast as well as an expense budget. Payment timing matters: an annual software bill may fall in one month while the related expense is recognised over time. Document assumptions about collections, supplier terms and expected demand.

## Monitor and explain variances

Variance is the difference between actual and planned performance. State your sign convention clearly. A cost overrun may be unfavourable, but the reason matters: higher volume, a price increase, rework or a wrong assumption require different responses. Compare costs at comparable activity levels where possible.

For a ₦200,000 event budget and ₦230,000 actual spending, the overrun is ₦30,000, or 15% of budget. If attendance rose significantly, investigate cost per participant before assuming waste. Record the cause, owner and corrective action.

## Allocate limited resources

Prioritise essential obligations, customer impact and measurable benefits. Compare options using total cost, capacity and risk. Set approval thresholds and review dates. Cost control should remove unnecessary spending and rework while protecting safety, quality and the ability to deliver.`,
      "A team has ₦500,000 for service improvements. Rather than buying new devices immediately, it compares training, process changes and equipment against response time, reliability and total cost.",
      "Prepare a one-month budget for a 30-person workshop. Include quantities, unit costs, payment dates and a contingency assumption. After a simulated 10% cost increase, propose what to adjust and explain the effect on quality.",
      "A useful budget makes assumptions visible and supports timely action. Spend against outcomes, not habit.",
    ),
    lesson(
      "Introduction to Business Taxation",
      "Recognise common tax-administration responsibilities and maintain records that support accurate professional review.",
      `## Understand the obligation before calculating

Tax administration involves identifying applicable obligations, maintaining records, calculating with approved rules, filing returns and paying on time. Obligations depend on entity type, transactions, location and current legislation. This introductory lesson deliberately does not prescribe Nigerian tax rates, thresholds or filing deadlines: check current official guidance and your organisation's tax adviser before applying them.

Distinguish tax on income or profits, tax associated with taxable supplies, deductions withheld from certain payments and payroll-related obligations. A collected tax amount is not automatically business income. Similarly, a deduction from a supplier payment is not simply a discount that the business may keep.

## Build an evidence trail

Retain invoices, receipts, payroll records, contracts, payment evidence and reconciliations using the organisation's retention policy. Record supplier and customer details accurately. Reconcile tax-related ledger balances to supporting schedules and investigate differences before submission.

## Work with a compliance calendar

Assign an owner, a reviewer and evidence requirements for each obligation. Record the official source used to confirm the applicable rule and the date checked. Use reminders and approval steps, and restrict access to personal information. Escalate uncertainty rather than copying a rate from an old invoice or an unverified online post. Corrections should leave a clear audit trail.

For current Nigerian federal tax information, consult the Nigeria Revenue Service; payroll or other local obligations may involve other relevant authorities.`,
      "An administrator notices different deductions on similar supplier invoices. Instead of applying a remembered percentage, they collect the contracts, classify the transactions and ask finance to confirm current treatment before payment.",
      "Create a compliance checklist with columns for obligation, authority, source checked, responsible owner, reviewer, due date and evidence of filing/payment. Use blank dates until confirmed from current official guidance.",
      "Good tax administration depends on current rules, accurate classification and reliable records, with professional review where needed.",
      "https://www.nrs.gov.ng/",
    ),
  ],
  [
    [
      "What distinguishes cash from revenue?",
      "Revenue can be earned before cash is collected.",
      "They always arrive on the same day.",
      "Borrowing is always sales revenue.",
      "Cash excludes customer payments.",
      "Credit sales can create revenue before the corresponding money is received.",
    ],
    [
      "A price is ₦10,000 and variable cost is ₦6,000. What is unit contribution?",
      "₦4,000",
      "₦16,000",
      "₦6,000",
      "₦10,000",
      "Contribution is selling price minus variable cost: ₦10,000 − ₦6,000.",
    ],
    [
      "Fixed costs are ₦400,000 and unit contribution is ₦4,000. What is break-even volume?",
      "100 units",
      "10 units",
      "1,000 units",
      "400 units",
      "Fixed costs divided by contribution per unit gives 100 units.",
    ],
    [
      "Which statement shows assets and liabilities at a particular date?",
      "Statement of financial position",
      "Meeting agenda",
      "Cash collection reminder",
      "Sales forecast only",
      "The statement of financial position is a snapshot at a reporting date.",
    ],
    [
      "Revenue is ₦1,000,000 and cost of sales ₦650,000. What is gross margin?",
      "35%",
      "65%",
      "53.85%",
      "350%",
      "Gross profit is ₦350,000, divided by revenue gives 35%.",
    ],
    [
      "Why might a current ratio of 2 still require investigation?",
      "Current assets may include slow stock and overdue receivables.",
      "It guarantees unlimited cash.",
      "It means there are no liabilities.",
      "It proves every customer pays on time.",
      "Asset quality and collection timing affect actual liquidity.",
    ],
    [
      "A budget is ₦200,000 and actual cost ₦230,000. What is the overrun as a percentage of budget?",
      "15%",
      "30%",
      "13.04%",
      "115%",
      "₦30,000 divided by the ₦200,000 budget equals 15%.",
    ],
    [
      "What is the best response to an unfavourable cost variance?",
      "Investigate price, volume and process causes before taking action.",
      "Cut every cost equally.",
      "Hide the actual result.",
      "Assume fraud without evidence.",
      "Different causes require different corrective actions and comparable activity levels.",
    ],
    [
      "How should an unfamiliar tax deduction be handled?",
      "Confirm current treatment with official guidance and finance before applying it.",
      "Copy an old rate without checking.",
      "Treat it as a supplier discount.",
      "Delete the invoice.",
      "Tax treatment depends on current rules and the specific transaction.",
    ],
    [
      "Why keep payment evidence and reconciliations?",
      "They support accurate reporting and an auditable compliance trail.",
      "They remove the need to file returns.",
      "They guarantee no tax is payable.",
      "They allow estimates to replace records.",
      "Reliable records support review, reconciliation and evidence of compliance.",
    ],
  ],
  "Build a budget and explain the numbers",
  "Prepare a budget for a small workplace project using fictional figures. Show quantities, unit costs, fixed/variable assumptions and payment timing. Calculate one contribution or margin measure, compare budget with a simulated actual result, explain two variances and recommend actions. Add a tax-record checklist without inventing rates. Submit 600–900 words with your calculations. Criteria: arithmetic (30%), interpretation and cash awareness (30%), practical controls (25%), presentation (15%).",
);
