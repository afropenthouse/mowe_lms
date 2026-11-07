"use client";
import LessonView from "../components/LessonPlayer";
import { Empty } from "../components/ui";

import { useAcademy } from "../providers/AcademyProvider";

export default function LessonPage() {
  const {
    data,
    busy,
    courses,
    allLessons,
    completed,
    go,
    action,
    upload,
    course,
    path,
  } = useAcademy();
  return course ? (
    <LessonView
      key={path}
      course={course}
      lessonId={path.split("/")[3]}
      data={data}
      busy={busy}
      go={go}
      action={action}
      upload={upload}
      completed={completed}
      allLessons={allLessons}
      courses={courses}
    />
  ) : (
    <Empty title="Lesson unavailable">
      Choose a lesson from your curriculum.
    </Empty>
  );
}
