import { Suspense } from "react";
import Screen from "../../../screens/CourseDetailPage";
import { LoadingState } from "../../../components/ui";
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading course" />}>
      <Screen />
    </Suspense>
  );
}
