import { course, lesson } from "./helpers.js";
export const projects = course(
  7,
  "Project Planning & Risk Management",
  "Plan a defined piece of change, coordinate delivery, manage uncertainty and choose suitable ways of working. Build practical scope, schedule, risk and communication plans.",
  [
    lesson(
      "Introduction to Project Management",
      "Distinguish a project from ongoing operations and define a clear outcome and scope.",
      `## A temporary effort with an outcome

A project is a temporary effort to create a defined product, service or result. Operations delivers recurring work. Implementing a new customer-support system is a project; answering customer requests through it is ongoing operations. A clear distinction helps determine ownership, funding and the point at which a project hands over.

Start with a problem or opportunity and a business outcome. A deliverable is an output, such as a configured system; a benefit is the improvement it enables, such as shorter response times. Define both so delivery does not stop at producing documents nobody uses.

## Agree the boundaries

A simple project charter states purpose, objectives, sponsor, scope, major deliverables, constraints, assumptions and success criteria. Include what is out of scope. The sponsor supports direction and key decisions; the project manager coordinates work; workstream owners deliver defined outputs. Stakeholders include people affected by the change as well as decision-makers.

## Balance constraints

Scope, time, cost, quality, resources and risk influence one another. Adding a feature without adjusting resources or dates can harm delivery. Record requests, evaluate effects and seek approval from the right authority. A baseline is an agreed reference for comparison, not a promise that change will never be necessary.`,
      "A business wants a new onboarding system within six weeks. The charter specifies a pilot for one team, required records, training and acceptance criteria. A request for a separate mobile app is evaluated as a scope change.",
      "Write a one-page charter for a small office project. Include the problem, measurable objective, deliverables, exclusions, sponsor, constraints and acceptance criteria. Identify one assumption that needs checking.",
      "Define success and boundaries before organising tasks. Deliverables matter because they support a business benefit.",
    ),
    lesson(
      "Stages of the Project Management Lifecycle",
      "Describe initiation, planning, execution, monitoring and closure, including handover responsibilities.",
      `## From approval to adoption

Initiation confirms the need, feasibility, stakeholders and authority to proceed. Planning defines scope, work, responsibilities, schedule, resources, risks and communication. Execution produces deliverables and supports the people doing the work. Monitoring and controlling compares performance with the plan and manages issues and changes throughout delivery.

Closure verifies acceptance, resolves or hands over remaining obligations, records lessons and transitions ownership. These activities can overlap. A phased project may revisit planning at each stage rather than completing every detail at the beginning.

## Control delivery with evidence

Use short status reports stating progress against milestones, risks, issues, decisions needed and next actions. Distinguish a risk, which may happen, from an issue, which is happening or has happened. Escalate when the team lacks authority or capacity to resolve the impact.

## Plan the handover

An operational owner needs instructions, access, training, support contacts and known limitations. Acceptance should be based on agreed criteria, not the project team's confidence alone. Record who will measure benefits after delivery and when. Closing the project before people can use the outcome simply transfers unresolved work to operations.`,
      "A team installs a booking tool but does not train reception staff. The technical deliverable exists, yet the intended service improvement fails. A revised handover adds training, ownership and acceptance testing.",
      "Create a lifecycle checklist for the project in your charter. Specify evidence required before moving to delivery, the acceptance test, the operational owner and a benefits review date.",
      "A project is not finished when tasks disappear from a board. Acceptance, handover and ownership make delivery usable.",
    ),
    lesson(
      "Project Management Methodologies",
      "Compare predictive, agile and hybrid approaches and recognise the basic accountabilities and events in Scrum.",
      `## Match the approach to uncertainty

A predictive approach plans significant work in advance and manages changes against a baseline. It can suit stable requirements and activities with clear dependencies. Agile approaches use short feedback cycles to inspect results and adapt. They can help when learning and changing requirements are central. Agile does not mean no planning or unlimited change.

A hybrid approach combines elements intentionally, such as fixed compliance gates with iterative development. Choose based on uncertainty, risk, stakeholders, delivery constraints and the team's ability to work in the approach. A label alone does not improve results.

## Scrum at an introductory level

The Scrum Guide describes a small Scrum Team with a Product Owner, Scrum Master and Developers. The Product Owner is accountable for maximising value and effective Product Backlog management. The Scrum Master is accountable for establishing Scrum and the team's effectiveness. Developers create a usable Increment that meets the Definition of Done.

A Sprint provides a consistent timebox. Sprint Planning establishes a Sprint Goal and plan; the Daily Scrum inspects progress towards that goal; the Sprint Review inspects the outcome with stakeholders; the Retrospective improves the team's effectiveness. The Definition of Done creates shared quality expectations. These are introductory distinctions; use the official guide for the complete framework.`,
      "A team exploring a new learner portal uses short iterations to test navigation. The payment-compliance review remains a formal gate. This hybrid arrangement is explicit rather than an excuse to skip either feedback or controls.",
      "Compare two projects: replacing a known office device and discovering a new customer-facing service. Recommend an approach for each. Write a sample Sprint Goal and two conditions for a usable, finished increment.",
      "Select an approach that fits the work. Regular feedback and clear quality expectations matter more than terminology.",
      "https://scrumguides.org/scrum-guide.html",
    ),
    lesson(
      "Risk Management in Projects",
      "Write clear risks, assess likelihood and impact, and assign responses and triggers.",
      `## Make uncertainty specific

A risk is an uncertain event or condition that could affect an objective. Write it as cause, event and effect: because a supplier has limited capacity, equipment may arrive late, delaying training. 'Supplier problem' is too vague to guide action. An issue is something already occurring and needs an immediate response.

Identify risks with the people doing the work and affected stakeholders. Consider schedule, cost, quality, people, suppliers, security and adoption. Record likelihood and impact using agreed scales. A simple matrix supports prioritisation, but scores are judgement aids rather than precise probabilities.

## Choose a response

Avoid a threat by changing the plan so it no longer applies. Mitigate it by reducing likelihood or impact. Transfer some exposure through suitable contractual arrangements or insurance, recognising that responsibility is not always fully transferred. Accept a risk deliberately when appropriate and prepare a contingency where needed. Opportunities can also be managed by increasing the chance of a beneficial outcome.

## Assign ownership and review

Each important risk needs an owner, planned response, review date and trigger. The trigger tells the team when to activate a contingency. Track residual risk after controls and avoid reporting an unchanged register while circumstances evolve. Escalate risks beyond the team's authority or tolerance.`,
      "A training project depends on one facilitator. The risk owner confirms availability and prepares an approved backup. If confirmation is missing two weeks before launch, the contingency is activated.",
      "Create five risks for your project using cause-event-effect statements. Assign likelihood, impact, owner, response and trigger. Convert one simulated risk that has occurred into an issue with an immediate action.",
      "A risk register is useful when it drives ownership and action, not merely when every row has a score.",
    ),
    lesson(
      "Project Planning Tools and Techniques",
      "Break down deliverables, identify dependencies and produce a realistic schedule and communication plan.",
      `## Break outcomes into manageable work

A work breakdown structure decomposes scope into manageable deliverables and work packages. It helps the team check completeness and assign ownership. Define acceptance criteria for each important output, then identify activities needed to produce it. Avoid a task list that includes many activities but misses a required deliverable.

## Estimate and sequence

Estimate effort with the people doing the work, document assumptions and distinguish effort from elapsed duration. A task requiring eight hours of effort may span three days because of reviews and availability. Identify dependencies and realistic resource constraints.

A Gantt chart shows activities against time. A milestone marks a significant event with no duration. The critical path is the longest-duration dependent path under the schedule assumptions; delaying it delays completion unless the plan changes. Adding people cannot always shorten a task, especially when specialist review or external waiting is involved.

## Keep the plan usable

A task board supports daily visibility; a schedule supports dependencies and dates; a responsibility map supports ownership. Use a communication plan identifying who needs which information, how often and who provides it. Update the plan when approved changes occur and keep the previous baseline available for comparison. Plans should help decisions rather than become reports maintained only for appearances.`,
      "A workshop requires a venue before invitations can confirm the location. Materials need approval before printing. Mapping these dependencies reveals that printing is not the first priority even though it is the most visible task.",
      "Build an eight-activity schedule for your project with owners, durations, dependencies and two milestones. Identify the longest dependent path and one resource conflict. Draft a weekly status update with a decision request.",
      "A useful plan connects deliverables, dependencies, people and decisions. Keep estimates and assumptions visible.",
    ),
  ],
  [
    [
      "Which activity is a project?",
      "Implementing a new onboarding system with a defined handover.",
      "Answering the same support queue every day indefinitely.",
      "Routine monthly payroll processing.",
      "Daily stock counting as an ongoing service.",
      "Projects are temporary efforts with defined outcomes; operations is recurring work.",
    ],
    [
      "What is a benefit rather than a deliverable?",
      "Reduced customer response time after a system is adopted.",
      "A completed configuration document.",
      "An installed device.",
      "A training slide deck.",
      "Benefits describe improvements enabled by outputs, rather than the outputs themselves.",
    ],
    [
      "What should a scope-change request trigger?",
      "An impact assessment and approval by the appropriate authority.",
      "Automatic acceptance with no date change.",
      "Deletion of the baseline.",
      "A promise to absorb every request silently.",
      "Changes can affect time, cost, resources, quality and risk.",
    ],
    [
      "What is essential at project closure?",
      "Acceptance, operational handover and ownership of remaining obligations.",
      "Only announcing that the team is finished.",
      "Removing every record.",
      "Ignoring training and support.",
      "Usable delivery requires agreed acceptance and a prepared operational owner.",
    ],
    [
      "When can an iterative approach be useful?",
      "When requirements need learning and regular feedback.",
      "When nobody is willing to plan.",
      "When quality standards should be ignored.",
      "When stakeholders must never see progress.",
      "Iterative delivery supports inspection and adaptation under uncertainty.",
    ],
    [
      "Who is accountable for effective Product Backlog management in Scrum?",
      "Product Owner",
      "Every supplier independently",
      "The customer-support queue",
      "The finance approver by default",
      "The Scrum Guide assigns this accountability to the Product Owner.",
    ],
    [
      "Which statement describes a project risk?",
      "A supplier may deliver late and delay training.",
      "The equipment already arrived damaged.",
      "A confirmed missed deadline.",
      "An invoice already paid.",
      "A risk is uncertain; an event already occurring is an issue.",
    ],
    [
      "What is mitigation?",
      "Reducing a threat's likelihood or impact.",
      "Pretending the risk does not exist.",
      "Declaring every risk impossible.",
      "Waiting without ownership.",
      "Mitigation changes exposure through preventive or impact-reducing action.",
    ],
    [
      "What does a risk trigger indicate?",
      "When to activate an agreed response or contingency.",
      "Who should be blamed.",
      "That a risk register can be deleted.",
      "The project's logo colour.",
      "Triggers make contingency decisions timely and explicit.",
    ],
    [
      "What is the critical path?",
      "The longest-duration dependent path under the schedule assumptions.",
      "The task with the largest budget only.",
      "Every activity running in parallel.",
      "The first item on a to-do list.",
      "The critical path determines the shortest completion time implied by the dependency model.",
    ],
  ],
  "Create a practical project starter pack",
  "Choose a small fictional project and write a charter, deliverables, exclusions and acceptance criteria. Add an eight-activity schedule, dependencies, owners and milestones; justify a delivery approach; create five cause-event-effect risks with responses; and describe handover and communication. Submit 800–1,100 words. Criteria: scope and outcomes (25%), schedule and ownership (25%), risk and methodology judgement (30%), communication and handover (20%).",
);
