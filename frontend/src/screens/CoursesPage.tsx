"use client";
import { Bookmark, Search } from "lucide-react";
import CourseCard from "../components/courses/CourseCard";
import { Empty } from "../components/ui";
import { lessons } from "../lib/curriculum";

import { useAcademy } from "../providers/AcademyProvider";

export default function CoursesPage() {
  const {
    data,
    query,
    setQuery,
    filter,
    setFilter,
    saved,
    courses,
    completed,
    go,
    toggleSaved,
    path,
  } = useAcademy();
  const visible = courses.filter((course) => {
    const entries = lessons(course);
    const done = entries.filter((lesson) => completed.has(lesson.id)).length;
    const matches =
      `${course.title} ${entries.map((lesson) => lesson.title).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
    return (
      matches &&
      (!(filter === "saved" || path === "/saved") ||
        saved.includes(course.id)) &&
      (filter !== "complete" ||
        (entries.length > 0 && done === entries.length)) &&
      (filter !== "progress" || (done > 0 && done < entries.length))
    );
  });
  return (
    <>
      <div className="page-title">
        <div className="eyebrow red">YOUR BUSINESS TOOLKIT</div>
        <h1>
          {path === "/saved" ? "Saved for your next step." : "My courses"}
        </h1>
        <p>
          {courses.length} available{" "}
          {courses.length === 1 ? "course" : "courses"}. Pick up where you left
          off or explore something new.
        </p>
      </div>
      <div className="catalog-bar">
        <div className="tabs">
          {[
            ["all", "All courses"],
            ["progress", "In progress"],
            ["complete", "Completed"],
            ["saved", "Saved"],
          ].map(([v, l]) => (
            <button
              className={filter === v ? "active" : ""}
              aria-pressed={filter === v}
              key={v}
              onClick={() => setFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses and lessons"
            aria-label="Search courses and lessons"
          />
        </label>
      </div>
      <div className="course-grid catalog">
        {visible.map((c) => (
          <CourseCard
            completed={completed}
            saved={saved}
            toggleSaved={toggleSaved}
            go={go}
            enrolled={!!data.enrolled}
            key={c.id}
            c={c}
            i={courses.indexOf(c)}
          />
        ))}
      </div>
      {!visible.length && !(path === "/saved" && !saved.length) && (
        <Empty title="No courses found">
          Try another filter or search for a different course or lesson.
        </Empty>
      )}
      {path === "/saved" && !saved.length && (
        <Empty icon={Bookmark} title="Make space for what’s next.">
          Save a course using the bookmark icon to find it here.
        </Empty>
      )}
    </>
  );
}
