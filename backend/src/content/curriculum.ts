import { business } from "./business.js";
import { finance } from "./finance.js";
import { marketing } from "./marketing.js";
import { operations } from "./operations.js";
import { leadership } from "./leadership.js";
import { technology } from "./technology.js";
import { projects } from "./projects.js";
import { career } from "./career.js";
import { interactiveLessons } from "./interactive-lessons.js";
import type { CourseDocument } from "../learning/validation.js";

export const curriculum: CourseDocument[] = [
  business,
  finance,
  marketing,
  operations,
  leadership,
  technology,
  projects,
  career,
].map((course, index) => ({
  ...course,
  modules: interactiveLessons[index].map(
    ([title, presentationId], lessonIndex) => {
      const module = course.modules[lessonIndex];
      const lesson = module.lessons[0];
      return {
        ...module,
        title,
        lessons: [
          {
            ...lesson,
            title,
            content: "",
            videoUrl: "",
            resourceUrl: "",
            embedUrl: `https://view.genially.com/${presentationId}`,
          },
        ],
      };
    },
  ),
}));

export const programCourseIds = curriculum.map(({ id }) => id);
export const program = {
  name: "Certified Business Administrator",
  introduction:
    "Welcome to the Certified Business Administrator (CBA) Program. Designed for early-career professionals with 2–5 years of experience, the programme connects foundational business knowledge with practical workplace decisions, operational improvement and career growth.",
  objective:
    "Develop a foundation in core business principles and the operational, communication and problem-solving skills needed to make confident decisions. Apply each topic through a workplace example, a practice activity, a course quiz and an assignment.",
};
