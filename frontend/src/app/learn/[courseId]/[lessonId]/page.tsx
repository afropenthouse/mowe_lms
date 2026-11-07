import { requireUser } from "../../../../lib/serverAuth";
import Screen from "../../../../screens/LessonPage";
export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  await requireUser(
    "/learn/" +
      encodeURIComponent(courseId) +
      "/" +
      encodeURIComponent(lessonId),
  );
  return <Screen />;
}
