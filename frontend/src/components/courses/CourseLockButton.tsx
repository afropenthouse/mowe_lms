"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Course } from "../../lib/types";
import { useAcademy } from "../../providers/AcademyProvider";
import AccountDialog from "../admin/AccountDialog";

export default function CourseLockButton({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const { courses, courseAccess } = useAcademy();
  const access = courseAccess[course.id];
  const prerequisite = courses.find(
    ({ id }) => access?.status === "locked" && id === access.prerequisiteId,
  );

  return (
    <>
      <button
        type="button"
        className="text-link"
        aria-label={`See why ${course.title} is locked`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        See why it’s locked <ChevronRight size={17} aria-hidden="true" />
      </button>
      {open && (
        <AccountDialog title="Course locked" onClose={() => setOpen(false)}>
          <p className="account-dialog-description">
            {course.title} opens once you finish the earlier courses. Your next
            step is to complete{" "}
            <strong>{prerequisite?.title ?? "the previous course"}</strong>.
          </p>
          <div className="account-dialog-actions">
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(false)}
            >
              Got it
            </button>
          </div>
        </AccountDialog>
      )}
    </>
  );
}
