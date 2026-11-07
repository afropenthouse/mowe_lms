import type { ModuleExtension } from "./extensions.js";
export const peopleExtensions: ModuleExtension[][] = [
  [
    {
      title: "Adapting leadership without losing accountability",
      objective:
        "Choose appropriate direction, coaching and delegation for different tasks and experience levels.",
      deepening: `## Diagnose the task and support needed

Someone can be experienced in one responsibility and unfamiliar with another. Assess the task, risk, urgency and available support instead of assigning a permanent label to the person. Clear direction is useful when a process is new or tightly controlled. Coaching helps someone reason through a challenge. Delegation gives a capable person discretion within agreed boundaries.

Define the result, constraints, decision authority, resources and check-in points. Too many approvals can undermine delegated ownership; too few can leave a new colleague unsupported. Ask what information the person needs and how they will flag a problem. Review actual outcomes before changing the level of oversight.

## Lead through your own behaviour

Keep commitments, explain decisions and acknowledge mistakes. If a deadline is missed, understand whether the cause was unclear expectations, capability, capacity or an avoidable action. Give specific feedback and agree a correction. Accountability means owning the result and learning; it does not require public blame or constant surveillance.`,
      scenario:
        "A fictional supervisor assigns monthly reporting to a new team member and an experienced analyst. Both receive the same vague instruction: 'Handle the report.' The new colleague omits a reconciliation, while the analyst is frustrated by repeated requests for minor approvals.",
      task: "Write two delegation briefs for the same outcome. Specify support, authority, checkpoints and acceptance criteria appropriate to each person. Add a feedback conversation and a personal leadership behaviour to practise during the next month.",
      solution:
        "Provide the new colleague with a worked example, checklist, training and an early review. Give the experienced analyst a clear outcome, approved boundaries and exception triggers, with fewer routine approvals. Use the same quality standard while varying support. Review whether the briefs reduced errors and unnecessary intervention.",
    },
    {
      title: "Resolving a cross-team disagreement",
      objective:
        "Move a work conflict from blame to agreed actions while recognising issues needing formal escalation.",
      deepening: `## Establish the facts and the shared outcome

Begin with specific events and their effects. 'The last two requests arrived without approved figures' gives the discussion a testable starting point. 'Your team is always careless' makes a judgement about people and encourages defensiveness. Ask each side to explain constraints and listen without assuming the first account is complete.

Separate interests from proposed solutions. One team may need speed while another needs reliable evidence. A shared objective can accommodate both through complete inputs, clear turnaround times and defined exceptions. Agree who decides when priorities conflict.

## Close with a working agreement

Record the action, owner, expected date and review measure. Check whether both teams can actually carry it out. Follow up rather than assuming that a calm conversation resolved the underlying process. Use formal reporting and support for serious misconduct, threats or harassment. Ordinary task conflict can often be discussed collaboratively; serious personal risk should not be treated as a routine compromise exercise.`,
      scenario:
        "A fictional sales team calls finance obstructive because quotations take two days to approve. Finance says urgent requests often omit cost assumptions. Customers are waiting and both teams have started copying senior managers into accusatory emails.",
      task: "Prepare an opening statement using observation and impact. Write questions for both teams, propose a complete-request standard and escalation route, and draft the resulting working agreement. Identify a situation that would require formal handling instead.",
      solution:
        "Restate the shared need for timely, accurate quotations. Inspect a sample of delays and agree required cost inputs, a turnaround for complete requests and an urgent exception owner. Track incomplete submissions and approval time. Ask participants to challenge the process without personal accusations and schedule a review using actual cases.",
    },
    {
      title: "Making informal workplace systems more inclusive",
      objective:
        "Recognise information gaps and design meeting and decision practices that support participation.",
      deepening: `## Notice who receives context

Formal reporting lines do not show every source of influence. Decisions may begin in corridor conversations, informal chats or long-standing relationships. These can help coordination, but create exclusion when essential information never reaches remote staff, new colleagues or people outside a social group.

Observe how ideas are raised, questions are handled and credit is assigned. Ask whether an unwritten norm supports the work or simply rewards familiarity. Avoid treating one communication style as evidence of competence. Make necessary expectations explicit so people do not have to guess how to succeed.

## Improve everyday routines

Circulate an agenda and relevant material, invite input through more than one channel and record decisions with owners. Rotate suitable meeting roles and allow preparation time. Distinguish consultation from the final decision authority so participation does not become a false promise of consensus. Review whether colleagues can access the information they need and whether decisions still move efficiently.`,
      scenario:
        "A fictional hybrid team agrees priorities in an office conversation every Monday. Two remote colleagues only hear about changes when their work is rejected on Thursday. The team describes itself as open because anyone physically present can join the conversation.",
      task: "Identify the cultural and process causes of the exclusion. Design a meeting routine and decision log, state who decides priorities and propose a way to gather input from absent colleagues. Add two indicators to review after four weeks.",
      solution:
        "Publish priorities and rationale in a shared place, provide a short input window and name the decision owner. Record changes, affected work and required acknowledgements. Track rework caused by missed context and ask whether colleagues can explain current priorities. Keep informal discussion while ensuring essential decisions become accessible records.",
    },
  ],
  [
    {
      title: "Turning an operational dataset into a decision",
      objective:
        "Clean a small dataset, choose a meaningful measure and communicate a justified recommendation.",
      deepening: `## Define the unit of analysis

Before counting, decide what each row represents: a customer, application, invoice or interaction. Multiple messages from one customer are not necessarily duplicate customers. Use a suitable identifier and retain the original dataset so cleaning choices can be checked.

Validate dates, units, missing values and categories. An average turnaround can be distorted if incomplete requests are counted as finished or calendar days are mixed with working days. State the population and exclusions. A median can sometimes complement an average when a few long cases distort the picture.

## Ask what the evidence supports

Group the data by relevant stage, team or period and compare like with like. A slower team may receive more complex cases, so investigate before assigning blame. Summarise the finding, limitations, recommended action and evidence needed next. If automating a report, define refresh timing, access, exception checks and a responsible owner. A colourful chart cannot repair an unreliable definition.`,
      scenario:
        "A fictional onboarding sheet contains 120 rows, including repeated contact messages, applications with missing completion dates and mixed date formats. A manager wants a ranking of team performance based on a simple average of every row.",
      task: "Create a cleaning plan and define an application-level turnaround measure. Explain how to handle missing completion dates without inventing them. Choose a chart, outline a cautious finding and propose an operational test rather than an unsupported staff ranking.",
      solution:
        "Separate interactions from unique applications, standardise dates and distinguish open cases from completed cases. Report completion times alongside the open-case backlog and relevant complexity differences. Keep a log of exclusions. Recommend investigating the stage with consistent delay, then test a process change while monitoring accuracy.",
    },
    {
      title: "Responding to a suspicious payment request",
      objective:
        "Apply independent verification, least privilege and prompt incident reporting to a realistic threat.",
      deepening: `## Trust the process rather than the display name

A convincing message can copy a familiar signature, refer to a real invoice or appear in an existing conversation. Evaluate the requested action and verify changes through an established channel. Unexpected urgency, secrecy or pressure to bypass approval is a reason to pause, not evidence that normal checks are unnecessary.

For bank-detail changes, use the approved verification and authorisation workflow. Confirm using contact information already held, and document the result. Do not send passwords or one-time codes to a person claiming to provide support.

## Reduce exposure and report early

Separate routine work from administrative privileges. Limit access to payment and customer records, review permissions when roles change and use strong account protections supported by the system. If a suspicious link or attachment was opened, report through the incident process with time, message and actions taken. Follow the security team's containment instructions and preserve relevant evidence rather than attempting an improvised investigation.`,
      scenario:
        "A fictional administrator receives a director's urgent message asking for a supplier payment to a new account. The message says the director is in a meeting and the normal finance approver must not be disturbed. It includes a phone number to 'confirm' the change.",
      task: "Write a decision checklist, a neutral response and a short incident report. Identify the independent verification route, required approval, access safeguards and details to preserve. Explain what changes if a colleague has already clicked the attachment.",
      solution:
        "Pause payment and verify through the director's established internal contact and the supplier's approved record, not the supplied number. Follow normal bank-change approval and report suspected impersonation. If an attachment was opened, promptly tell the security contact what happened and follow instructions. Do not conceal the event or distribute the suspicious file.",
    },
  ],
];
