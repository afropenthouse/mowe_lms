// Keep artwork tied to course identity, even when the curriculum is reordered.
export const courseImages: Record<
  string,
  {
    src: string;
    alt: string;
    width: number;
    height: number;
    fit: "cover" | "contain";
    background: string;
  }
> = {
  "course-1": {
    src: "/courses/business-fundamentals.png",
    alt: "A professional placing a brick in a business foundation",
    width: 623,
    height: 447,
    fit: "cover",
    background: "#e9eef6",
  },
  "course-2": {
    src: "/courses/financial-literacy.jpeg",
    alt: "Financial literacy illustrated with budgeting, savings, and tax symbols",
    width: 1080,
    height: 719,
    fit: "contain",
    background: "#00938f",
  },
  "course-3": {
    src: "/courses/marketing-crm.png",
    alt: "Marketing and customer relationships illustrated with messaging and audience tools",
    width: 627,
    height: 409,
    fit: "contain",
    background: "#42afdc",
  },
};
