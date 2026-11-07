"use client";
import { Lock } from "lucide-react";
import Admin from "../components/Admin";
import { Empty } from "../components/ui";

import { useAcademy } from "../providers/AcademyProvider";

export default function AdminPage() {
  const {
    data,
    busy,
    courses,
    user,
    go,
    action,
    upload,
    path,
    refresh,
    refreshing,
    setToast,
  } = useAcademy();
  return user?.role === "admin" ? (
    <>
      <Admin
        path={path}
        data={data}
        courses={courses}
        action={action}
        upload={upload}
        busy={busy}
        go={go}
        refresh={refresh}
        refreshing={refreshing}
        setToast={setToast}
      />
    </>
  ) : (
    <Empty icon={Lock} title="Administrator access required">
      Your account has learner access. Contact the academy owner if you manage
      this program.
    </Empty>
  );
}
