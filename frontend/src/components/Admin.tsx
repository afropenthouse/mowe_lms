"use client";

import LearnerDirectory from "./admin/LearnerDirectory";
import type { Course } from "../lib/types";
import Editor from "./CourseEditor";
import ContentLibrary from "./admin/ContentLibrary";
import AdminOverview from "./admin/AdminOverview";
import MediaLibrary from "./admin/MediaLibrary";
import { Empty } from "./ui";
export default function Admin({
  path,
  refresh,
  refreshing,
  setToast,
  data,
  courses,
  action,
  upload,
  busy,
  go,
}: any) {
  const a = data.admin;
  if (path === "/admin/students") return <LearnerDirectory />;
  const id = path.split("/")[3];
  if (path === "/admin/media")
    return (
      <MediaLibrary
        media={a.media}
        nextCursor={a.mediaCursor}
        busy={busy}
        upload={upload}
        refresh={refresh}
        setToast={setToast}
      />
    );
  if (path === "/admin")
    return (
      <AdminOverview
        overview={a.overview}
        refresh={refresh}
        refreshing={refreshing}
      />
    );
  if (path === "/admin/courses") return <ContentLibrary courses={courses} />;
  const blank: Course = {
    id: crypto.randomUUID(),
    title: "New course",
    description: "",
    order: courses.length,
    status: "draft",
    version: 0,
    difficulty: "Foundational",
    instructor: "MOWE Global",
    modules: [
      {
        id: crypto.randomUUID(),
        title: "New module",
        lessons: [
          {
            id: crypto.randomUUID(),
            title: "New lesson",
            type: "text",
            duration: 15,
            content: "",
            videoUrl: "",
            resourceUrl: "",
            placeholder: true,
          },
        ],
      },
    ],
    quiz: {
      passScore: 70,
      attemptLimit: 3,
      timeLimit: 0,
      questions: [
        {
          id: crypto.randomUUID(),
          type: "multiple",
          prompt: "New question",
          options: ["Option 1", "Option 2"],
          answer: 0,
          explanation: "",
        },
      ],
    },
    assignment: { title: "Apply your learning", prompt: "" },
  };
  if (path.startsWith("/admin/courses/") && id) {
    const c = id === "new" ? blank : courses.find((c: Course) => c.id === id);
    return c ? (
      <Editor
        key={id}
        initial={c}
        media={a.media}
        busy={busy}
        action={action}
        upload={upload}
        go={go}
      />
    ) : (
      <Empty title="Course not found">
        Choose a course from the content library.
      </Empty>
    );
  }
  return null;
}
