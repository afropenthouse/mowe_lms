import { redirect } from "next/navigation";
import { requireUser } from "../../../../lib/serverAuth";
import {
  courseActivityPath,
  readCourseActivity,
} from "../../../../lib/courseActivity";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const [{ courseId, lessonId }, { tab }] = await Promise.all([
    params,
    searchParams,
  ]);
  const destination = courseActivityPath(
    courseId,
    lessonId,
    readCourseActivity(typeof tab === "string" ? tab : undefined),
  );
  await requireUser(destination);
  redirect(destination);
}
