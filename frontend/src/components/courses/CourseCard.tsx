"use client";

import Image from "next/image";
import { ArrowUpRight, Bookmark } from "lucide-react";
import { courseImages } from "../../lib/courseImages";
import { icons, summaries } from "../../lib/coursePresentation";
import { lessons } from "../../lib/curriculum";
import type { Course } from "../../lib/types";
export default function CourseCard({
  c,
  i,
  completed,
  saved,
  toggleSaved,
  go,
  enrolled,
}: {
  c: Course;
  i: number;
  completed: Set<string>;
  saved: string[];
  toggleSaved: (id: string) => void;
  go: (path: string) => void;
  enrolled: boolean;
}) {
  const Icon = icons[i % 8];
  const artwork = courseImages[c.id];
  const done = lessons(c).filter((l) => completed.has(l.id)).length;
  return (
    <article className="course-card">
      <div
        className={`card-art art-${i % 4} ${artwork ? "has-course-image" : ""}`}
        style={artwork ? { backgroundColor: artwork.background } : undefined}
      >
        {artwork ? (
          <Image
            sizes="(max-width: 760px) 50vw, 25vw"
            className="course-art-image"
            src={artwork.src}
            alt={artwork.alt}
            width={artwork.width}
            height={artwork.height}
            loading="lazy"
            decoding="async"
            style={{ objectFit: artwork.fit }}
          />
        ) : (
          <Icon size={66} strokeWidth={1} />
        )}
        <button
          className={`save-course ${saved.includes(c.id) ? "selected" : ""}`}
          aria-label={saved.includes(c.id) ? "Unsave course" : "Save course"}
          onClick={() => toggleSaved(c.id)}
        >
          <Bookmark size={17} />
        </button>
      </div>
      <div className="course-body">
        <div className="course-meta">
          <span>{c.difficulty}</span>
          <span>{c.modules.length} modules</span>
        </div>
        <h3>
          <button onClick={() => go(`/course/${c.id}`)}>{c.title}</button>
        </h3>
        <p>{summaries[i] || c.description}</p>
        {enrolled && (
          <div className="progress-track">
            <i style={{ width: `${(done / lessons(c).length) * 100}%` }} />
          </div>
        )}
        <button className="text-link" onClick={() => go(`/course/${c.id}`)}>
          {done ? "Continue course" : "Explore course"}{" "}
          <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}
