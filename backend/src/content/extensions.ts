import { lesson } from "./helpers.js";
import { businessExtensions } from "./extensions-business.js";
import { operationsExtensions } from "./extensions-operations.js";
import { peopleExtensions } from "./extensions-people.js";
import { growthExtensions } from "./extensions-growth.js";
import type { CourseDocument } from "../learning/validation.js";
export type ModuleExtension = {
  title: string;
  objective: string;
  deepening: string;
  scenario: string;
  task: string;
  solution: string;
};
export const extensions: ModuleExtension[][] = [
  ...businessExtensions,
  ...operationsExtensions,
  ...peopleExtensions,
  ...growthExtensions,
];
export function expandCourses(courses: CourseDocument[]) {
  return courses.map((course, ci) => ({
    ...course,
    modules: course.modules.map((module, mi) => {
      const e = extensions[ci][mi];
      const caseLesson = lesson(
        e.title,
        e.objective,
        e.deepening,
        e.scenario,
        "Before reading the workshop solution, write down the decision you would make, the evidence you would request and who should be involved. Identify a likely downside of your preferred option. Compare your reasoning with the workshop in the next lesson.",
        "Explain the reasoning behind your recommendation. A useful business decision connects the objective, evidence, responsibilities and consequences.",
      );
      const workshop = lesson(
        "Workshop: " + e.title,
        "Apply this module to a realistic workplace decision and produce a practical work product.",
        "## Your brief\n\n" +
          e.task +
          "\n\n## Worked approach\n\n" +
          e.solution +
          "\n\n## Check your work\n\nCheck that your response addresses the actual problem, distinguishes facts from assumptions and assigns an owner to the next action. Include a measure and review date. If your assumptions change, explain which part of your recommendation you would revisit.",
        e.scenario,
        "Complete the brief using a fictional organisation or an authorised example from your workplace. Keep your reasoning in your lesson notes. Compare it with the worked approach, then improve one weak point. Your answer can differ when it uses sound evidence and explains the trade-offs.",
        "A finished work product should help another person understand what to do, why it matters and how the result will be checked.",
      );
      return {
        ...module,
        lessons: [
          ...module.lessons,
          {
            ...caseLesson,
            id: "c" + (ci + 1) + "-l" + (mi + 1) + "-case",
            duration: 20,
          },
          {
            ...workshop,
            id: "c" + (ci + 1) + "-l" + (mi + 1) + "-workshop",
            duration: 25,
          },
        ],
      };
    }),
  }));
}
