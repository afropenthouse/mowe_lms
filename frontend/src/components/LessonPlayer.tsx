"use client";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Lock,
  MessageSquare,
  Save,
} from "lucide-react";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import CourseOutline, {
  OutlineToggle,
  useCourseOutline,
} from "./courses/CourseOutline";
import { lessons } from "../lib/curriculum";
import type { Course, Lesson } from "../lib/types";
import Quiz from "./Quiz";
import { Button, Empty, RichText } from "./ui";
import FileUpload, { type UploadedFile } from "./FileUpload";
export default function LessonView({
  course,
  lessonId,
  data,
  busy,
  go,
  action,
  upload,
  completed,
  allLessons,
  courses,
}: any) {
  const lesson: Lesson | undefined = lessons(course).find(
    (l) => l.id === lessonId,
  );
  const requestedTab = useSearchParams().get("tab");
  const outline = useCourseOutline();
  const [tab, setTab] = useState(
      ["assessment", "assignment", "notes", "discussion"].includes(
        requestedTab || "",
      )
        ? requestedTab!
        : "lesson",
    ),
    [note, setNote] = useState(
      data.progress?.find((p: any) => p.lesson_id === lessonId)?.note || "",
    ),
    [response, setResponse] = useState(
      data.submissions?.find((s: any) => s.course_id === course.id)?.content ||
        "",
    ),
    [comment, setComment] = useState("");
  const lastSavedSecond = useRef(0);
  const [attachment, setAttachment] = useState<UploadedFile | null>(
    data.submissions?.find((s: any) => s.course_id === course.id)?.attachment ||
      null,
  );
  const index = allLessons.findIndex((l: Lesson) => l.id === lessonId);
  const locked =
    index > 0 &&
    !completed.has(allLessons[index - 1].id) &&
    !completed.has(lessonId);
  if (!lesson)
    return (
      <Empty title="Lesson not found">
        Choose a lesson from your curriculum.
      </Empty>
    );
  if (!data.enrolled)
    return (
      <Empty icon={Lock} title="Join the program to begin">
        Enroll from the program page to unlock your learning space.
      </Empty>
    );
  const submission = data.submissions?.find(
    (s: any) => s.course_id === course.id,
  );
  const nextLesson: Lesson | undefined = allLessons[index + 1];
  const nextCourse = courses.find((c: Course) =>
    lessons(c).some((l) => l.id === nextLesson?.id),
  );
  const lastLessonInCourse = nextCourse?.id !== course.id;
  const lessonCompleted = completed.has(lessonId);
  const assessmentSubmitted = data.attempts?.some(
    (attempt: { course_id: string; status: string; score: number }) =>
      attempt.course_id === course.id &&
      (attempt.status === "pending" ||
        (attempt.status === "graded" &&
          attempt.score >= course.quiz.passScore)),
  );
  const assignmentNeeded =
    Boolean(course.assignment.prompt.trim()) &&
    (!submission || submission.status === "revision");
  const nextLabel = nextLesson
    ? "Continue to next course"
    : "View certificates";

  function next() {
    if (nextLesson && nextCourse)
      go(`/learn/${nextCourse.id}/${nextLesson.id}`);
    else go("/certificates");
  }

  function continueAfterLesson() {
    if (lastLessonInCourse && !assessmentSubmitted) setTab("assessment");
    else if (lastLessonInCourse && assignmentNeeded) setTab("assignment");
    else next();
  }

  const continueLabel = !lastLessonInCourse
    ? "Continue to next lesson"
    : !assessmentSubmitted
      ? "Continue to assessment"
      : assignmentNeeded
        ? "Continue to assignment"
        : nextLabel;
  const embed = () => {
    try {
      const u = new URL(lesson.videoUrl);
      if (u.hostname.includes("youtube.com"))
        return `https://www.youtube-nocookie.com/embed/${u.searchParams.get("v") || u.pathname.split("/").pop()}`;
      if (u.hostname === "youtu.be")
        return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
      if (u.hostname === "vimeo.com")
        return `https://player.vimeo.com/video/${u.pathname.slice(1)}`;
    } catch {}
    return "";
  };
  return (
    <>
      <div className="lesson-breadcrumb">
        <button onClick={() => go("/courses")}>My courses</button>
        <ChevronRight size={15} />
        <span>{course.title}</span>
        <OutlineToggle open={outline.open} onClick={outline.toggle} />
      </div>
      <div
        className={`lesson-layout ${outline.open ? "" : "outline-is-closed"}`}
      >
        <section className="lesson-main">
          <div className="lesson-heading">
            <div className="eyebrow red">LEARN. APPLY. GROW.</div>
            <h1>{lesson.title}</h1>
            <p>
              <Clock size={16} />
              {lesson.duration} min · {course.instructor}
            </p>
          </div>
          <div className="tabs lesson-tabs">
            {[
              ["lesson", "Lesson"],
              ["notes", "My notes"],
              ["assessment", "Assessment"],
              ["assignment", "Assignment"],
              ["discussion", "Discussion"],
            ].map(([v, l]) => (
              <button
                key={v}
                className={tab === v ? "active" : ""}
                onClick={() => setTab(v)}
              >
                {l}
              </button>
            ))}
          </div>
          {locked ? (
            <Empty icon={Lock} title="One step at a time.">
              Complete the previous lesson to unlock this part of your learning
              path.
            </Empty>
          ) : (
            <>
              {tab === "lesson" && (
                <>
                  <div className="lesson-content">
                    {lesson.placeholder && (
                      <div className="content-notice">
                        <Clock size={20} />
                        <div>
                          <strong>
                            Your faculty is preparing this lesson.
                          </strong>
                          <p>
                            You can explore the curriculum now. This placeholder
                            cannot count toward completion.
                          </p>
                        </div>
                      </div>
                    )}
                    {lesson.type === "video" &&
                      lesson.videoUrl &&
                      (embed() ? (
                        <iframe
                          className="video-player"
                          src={embed()}
                          allow="fullscreen; picture-in-picture"
                          allowFullScreen
                          title={lesson.title}
                        />
                      ) : (
                        <video
                          className="video-player"
                          controls
                          preload="metadata"
                          playsInline
                          src={lesson.videoUrl}
                          onTimeUpdate={(e) => {
                            const el = e.currentTarget;
                            const seconds = Math.floor(el.currentTime);
                            if (
                              seconds > 0 &&
                              Math.abs(seconds - lastSavedSecond.current) >= 30
                            ) {
                              lastSavedSecond.current = seconds;
                              action(
                                "progress",
                                {
                                  lessonId,
                                  seconds,
                                },
                                "",
                              );
                            }
                          }}
                        />
                      ))}
                    <RichText text={lesson.content} />
                    {lesson.resourceUrl && (
                      <a
                        className="btn secondary"
                        href={lesson.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download size={17} />
                        Open learning resource
                      </a>
                    )}
                  </div>
                  <div className="lesson-controls">
                    <Button
                      secondary
                      onClick={() =>
                        index > 0 &&
                        go(
                          `/learn/${courses.find((c: Course) => lessons(c).some((x) => x.id === allLessons[index - 1].id)).id}/${allLessons[index - 1].id}`,
                        )
                      }
                      disabled={index === 0}
                    >
                      <ArrowLeft size={17} />
                      Previous
                    </Button>
                    <Button
                      disabled={busy || lesson.placeholder}
                      onClick={async () => {
                        const r = await action(
                          "progress",
                          { lessonId, completed: true, note },
                          "Lesson completed. Keep growing.",
                        );
                        if (r) continueAfterLesson();
                      }}
                    >
                      <CheckCircle2 size={17} />
                      {lessonCompleted
                        ? continueLabel
                        : "Mark complete & continue"}
                    </Button>
                  </div>
                </>
              )}
              {tab === "notes" && (
                <div className="panel">
                  <h2>Make it your own.</h2>
                  <p>
                    Capture an insight, a question, or a way you’ll apply what
                    you learn.
                  </p>
                  <textarea
                    rows={12}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Your private lesson notes…"
                  />
                  <Button
                    disabled={busy}
                    onClick={() =>
                      action(
                        "progress",
                        { lessonId, note },
                        "Your notes are saved",
                      )
                    }
                  >
                    <Save size={17} />
                    Save notes
                  </Button>
                </div>
              )}
              {tab === "assessment" && (
                <div className="panel">
                  <h2>Put your knowledge to the test.</h2>
                  <p>Course assessment · {course.title}</p>
                  <Quiz
                    courseId={course.id}
                    quiz={course.quiz}
                    data={data}
                    action={action}
                    busy={busy}
                  />
                  {lastLessonInCourse &&
                    lessonCompleted &&
                    assessmentSubmitted && (
                      <div className="button-row">
                        <Button
                          disabled={busy}
                          onClick={() =>
                            assignmentNeeded ? setTab("assignment") : next()
                          }
                        >
                          {assignmentNeeded
                            ? "Continue to assignment"
                            : nextLabel}{" "}
                          <ChevronRight size={17} />
                        </Button>
                      </div>
                    )}
                </div>
              )}
              {tab === "assignment" && (
                <div className="panel">
                  <span className="pill">
                    {submission?.status || "NOT SUBMITTED"}
                  </span>
                  <h2>{course.assignment.title}</h2>
                  <p>{course.assignment.prompt}</p>
                  {submission?.feedback && (
                    <div className="feedback success">
                      <h3>Instructor feedback</h3>
                      <p>{submission.feedback}</p>
                    </div>
                  )}
                  <label>
                    Your response
                    <textarea
                      rows={9}
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Connect your learning to a real workplace challenge…"
                    />
                  </label>
                  <FileUpload
                    purpose="assignment"
                    courseId={course.id}
                    busy={busy}
                    upload={upload}
                    onUploaded={setAttachment}
                  />
                  {attachment && (
                    <div className="uploaded-file">
                      <a href={attachment.url} target="_blank" rel="noreferrer">
                        {attachment.name}
                      </a>
                      <button type="button" onClick={() => setAttachment(null)}>
                        Remove attachment
                      </button>
                    </div>
                  )}
                  <div className="button-row">
                    <Button
                      disabled={busy}
                      onClick={() =>
                        action(
                          "assignment",
                          {
                            courseId: course.id,
                            content: response,
                            file: attachment?.id || null,
                          },
                          "Your assignment is submitted",
                        )
                      }
                    >
                      <Check size={17} />
                      Submit assignment
                    </Button>
                    {lastLessonInCourse &&
                      lessonCompleted &&
                      assessmentSubmitted &&
                      !assignmentNeeded && (
                        <Button secondary disabled={busy} onClick={next}>
                          {nextLabel} <ChevronRight size={17} />
                        </Button>
                      )}
                  </div>
                </div>
              )}
              {tab === "discussion" && (
                <div className="panel">
                  <h2>Learn together.</h2>
                  <p>
                    Share a question or a practical insight with your course
                    community.
                  </p>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Start a thoughtful conversation…"
                  />
                  <Button
                    disabled={busy || !comment.trim()}
                    onClick={async () => {
                      if (
                        await action(
                          "comment",
                          { courseId: course.id, content: comment },
                          "Your comment is posted",
                        )
                      )
                        setComment("");
                    }}
                  >
                    <MessageSquare size={17} />
                    Post comment
                  </Button>
                  <div className="discussion-list">
                    {data.discussion
                      ?.filter((d: any) => d.course_id === course.id)
                      .map((d: any) => (
                        <article key={d.id}>
                          <span className="avatar">{d.name[0]}</span>
                          <div>
                            <strong>{d.name}</strong>
                            <small>{d.created.slice(0, 10)}</small>
                            <p>{d.body}</p>
                          </div>
                        </article>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
        <CourseOutline
          course={course}
          completed={completed}
          activeId={lessonId}
          open={outline.open}
          onClose={outline.close}
          onLesson={(id) => go(`/learn/${course.id}/${id}`)}
          onOverview={() => go(`/course/${course.id}`)}
          onAssessment={() => setTab("assessment")}
          onAssignment={() => setTab("assignment")}
        />
      </div>
    </>
  );
}
