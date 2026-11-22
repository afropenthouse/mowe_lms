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
  if (path.startsWith("/admin/courses/") && id) {
    const c = courses.find((c: Course) => c.id === id);
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
