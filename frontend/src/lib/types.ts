export type Lesson = {
  id: string;
  title: string;
  type: string;
  duration: number;
  content: string;
  videoUrl: string;
  resourceUrl: string;
  embedUrl?: string;
  placeholder: boolean;
};
export type Question = {
  id: string;
  type: string;
  prompt: string;
  options: string[];
  answer: number | string;
  explanation: string;
};
export type Course = {
  id: string;
  title: string;
  description: string;
  order: number;
  status: string;
  version: number;
  difficulty: string;
  instructor: string;
  questionCount?: number;
  hasAssignment?: boolean;
  modules: { id: string; title: string; lessons: Lesson[] }[];
  quiz: {
    passScore: number;
    attemptLimit: number;
    timeLimit: number;
    questions: Question[];
  };
  assignment: { title: string; prompt: string };
};

export type CourseAccess =
  | { status: "locked"; prerequisiteId: string }
  | { status: "payment_required" }
  | { status: "completed" }
  | {
      status: "available";
      lessonId: string;
      activity: "lesson" | "assessment" | "assignment";
    };
