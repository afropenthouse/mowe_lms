import { business } from "./business.js";
import { finance } from "./finance.js";
import { marketing } from "./marketing.js";
import { expandCourses } from "./extensions.js";
export const curriculum = expandCourses([business, finance, marketing]);
export const program = {
  name: "Certified Business Administrator",
  introduction:
    "Welcome to the Certified Business Administrator (CBA) Program. Designed for early-career professionals with 2–5 years of experience, the programme connects foundational business knowledge with practical workplace decisions, operational improvement and career growth.",
  objective:
    "Develop a foundation in core business principles and the operational, communication and problem-solving skills needed to make confident decisions. Apply each topic through a workplace example, a practice activity, a course quiz and an assignment.",
};
