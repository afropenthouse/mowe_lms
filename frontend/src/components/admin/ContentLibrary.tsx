"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownUp,
  ArrowRight,
  BookOpen,
  ExternalLink,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Course } from "../../lib/types";
import { lessons } from "../../lib/curriculum";
import { courseImages } from "../../lib/courseImages";
export default function ContentLibrary({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [sort, setSort] = useState("order");
  const published = courses.filter((c) => c.status === "published").length;
  const term = query.trim().toLowerCase();
  const visible = courses
    .filter(
      (c) =>
        (filter === "all" || c.status === filter) &&
        (c.title + " " + c.instructor).toLowerCase().includes(term),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "lessons"
          ? lessons(b).length - lessons(a).length || a.order - b.order
          : a.order - b.order,
    );
  return (
    <div className="content-library">
      <div className="library-breadcrumb">
        <Link href="/admin">Academy</Link>
        <span>/</span>
        <span>Content library</span>
      </div>
      <header className="library-heading">
        <div>
          <h1>Content library</h1>
          <p>Manage your courses, lessons and assessments.</p>
        </div>
        <Link className="library-primary" href="/admin/courses/new">
          <Plus size={17} />
          Create course
        </Link>
      </header>
      <section className="library-surface" aria-label="Course list">
        <div className="library-toolbar">
          <div
            className="library-filters"
            role="group"
            aria-label="Filter by course status"
          >
            {[
              ["all", "All courses", courses.length],
              ["published", "Published", published],
              ["draft", "Drafts", courses.length - published],
            ].map(([value, label, count]) => (
              <button
                key={value}
                aria-pressed={filter === value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(String(value))}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>
          <label className="library-search">
            <Search size={17} />
            <input
              aria-label="Search courses"
              placeholder="Search courses…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear course search"
                onClick={() => setQuery("")}
              >
                <X size={15} />
              </button>
            )}
          </label>
        </div>
        <div className="library-list-heading">
          <span>
            {visible.length} {visible.length === 1 ? "course" : "courses"}
            {filter !== "all" || term ? " found" : ""}
          </span>
          <label>
            <ArrowDownUp size={13} />
            <span className="library-sort-label">Sort by</span>
            <select
              aria-label="Sort courses"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="order">Course order</option>
              <option value="title">Course title</option>
              <option value="lessons">Lesson count</option>
            </select>
          </label>
        </div>
        {visible.length ? (
          <div className="library-table-scroll">
            <table className="library-table">
              <caption className="library-sr-only">
                Courses in the content library
              </caption>
              <thead>
                <tr>
                  <th scope="col">Course</th>
                  <th scope="col">Content</th>
                  <th scope="col" className="library-assessment-cell">
                    Assessment
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="library-sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const image = courseImages[c.id],
                    count = lessons(c).length;
                  const code = c.title
                    .split(/[^a-zA-Z]+/)
                    .filter(
                      (w) =>
                        w.length > 2 &&
                        !["and", "the", "for", "with"].includes(
                          w.toLowerCase(),
                        ),
                    )
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();
                  return (
                    <tr key={c.id}>
                      <td className="library-course-cell">
                        <div className="library-course-info">
                          <span className="library-thumbnail">
                            {image ? (
                              <Image
                                src={image.src}
                                width={52}
                                height={52}
                                alt=""
                                sizes="52px"
                              />
                            ) : (
                              <span aria-hidden="true">{code || "C"}</span>
                            )}
                          </span>
                          <div>
                            <Link
                              className="library-course-title"
                              href={`/admin/courses/${c.id}`}
                            >
                              {c.title}
                            </Link>
                            <p>{c.instructor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="library-content-cell">
                        <strong>{c.modules.length} modules</strong>
                        <span>{count} lessons</span>
                      </td>
                      <td className="library-assessment-cell">
                        <strong>{c.quiz.questions.length} questions</strong>
                        <span>
                          {c.assignment.prompt.trim()
                            ? "Assignment included"
                            : "No assignment"}
                        </span>
                      </td>
                      <td className="library-status-cell">
                        <span className={`library-status ${c.status}`}>
                          <i className={`library-dot ${c.status}`} />
                          {c.status === "published" ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="library-actions-cell">
                        <div>
                          <Link
                            className="library-edit"
                            href={`/admin/courses/${c.id}`}
                            aria-label={`Edit ${c.title}`}
                          >
                            Edit
                            <ArrowRight size={14} />
                          </Link>
                          {c.status === "published" && (
                            <Link
                              className="library-preview"
                              href={`/course/${c.id}`}
                              target="_blank"
                              aria-label={`Preview ${c.title}`}
                              title="Open learner view"
                            >
                              <ExternalLink size={15} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="library-empty">
            <BookOpen size={27} strokeWidth={1.4} />
            <h2>
              {courses.length ? "No matching courses" : "Your library is empty"}
            </h2>
            <p>
              {courses.length
                ? "Try another search or choose a different status."
                : "Create a course to start adding lessons and assessments."}
            </p>
            {courses.length ? (
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>
            ) : (
              <Link href="/admin/courses/new">
                Create your first course
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        )}
        <footer className="library-list-footer">
          <span>
            {visible.length} of {courses.length} courses
          </span>
          <span>
            Listed in{" "}
            {sort === "title"
              ? "alphabetical order"
              : sort === "lessons"
                ? "order of lesson count"
                : "learning-path order"}
          </span>
        </footer>
      </section>
    </div>
  );
}
