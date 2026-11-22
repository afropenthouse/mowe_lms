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
  "course-4": {
    src: "/courses/Operations.png",
    alt: "Business operations illustrated with processes, reports, and automation",
    width: 615,
    height: 335,
    fit: "cover",
    background: "#20569b",
  },
  "course-5": {
    src: "/courses/Leadership.png",
    alt: "A business leader standing with his team",
    width: 621,
    height: 267,
    fit: "cover",
    background: "#ffffff",
  },
  "course-6": {
    src: "/courses/Business Technology.png",
    alt: "Digital business tools displaying analytics and connected information",
    width: 620,
    height: 345,
    fit: "cover",
    background: "#153550",
  },
  "course-7": {
    src: "/courses/Project Planning.png",
    alt: "A team reviewing a project plan together",
    width: 624,
    height: 323,
    fit: "cover",
    background: "#e8e8e6",
  },
  "course-8": {
    src: "/courses/Networking.png",
    alt: "Professionals meeting and shaking hands at a networking event",
    width: 621,
    height: 342,
    fit: "cover",
    background: "#ddd6ca",
  },
};
