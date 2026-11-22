export const activityLabels = {
  lesson: "Lesson",
  notes: "My notes",
  assessment: "Course quiz",
  assignment: "Assignment",
  discussion: "Discussion",
} as const;

export type CourseActivity = keyof typeof activityLabels;

export function readCourseActivity(value?: string | null): CourseActivity {
  return value && Object.hasOwn(activityLabels, value)
    ? (value as CourseActivity)
    : "lesson";
}

export function courseActivityPath(
  courseId: string,
  lessonId?: string,
  activity: CourseActivity = "lesson",
) {
  const path = `/course/${encodeURIComponent(courseId)}`;
  if (!lessonId) return path;
  const params = new URLSearchParams({ lesson: lessonId });
  if (activity !== "lesson") params.set("tab", activity);
  return `${path}?${params}`;
}
