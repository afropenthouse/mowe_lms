"use client";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Lock,
  MessageSquare,
} from "lucide-react";
import { useRef, useState } from "react";
import { activityLabels, type CourseActivity } from "../lib/courseActivity";
import { lessons } from "../lib/curriculum";
import type { Lesson } from "../lib/types";
import Quiz from "./Quiz";
import LessonNotes from "./LessonNotes";
import { Button, Empty, RichText } from "./ui";
import FileUpload, { type UploadedFile } from "./FileUpload";
export default function LessonView({
  course,
  lessonId,
  tab,
  setTab,
  onLesson,
  data,
  busy,
  go,
  action,
  upload,
  completed,
  courseComplete,
  courseWorkDone,
  learningLink,
  refresh,
}: any) {
  const entries = lessons(course);
  const index = entries.findIndex((l) => l.id === lessonId);
  const lesson = entries[index];
  const [response, setResponse] = useState(
      data.submissions?.find((s: any) => s.course_id === course.id)?.content ||
        "",
    ),
    [comment, setComment] = useState("");
  const lastSavedSecond = useRef(0);
  const [attachment, setAttachment] = useState<UploadedFile | null>(
    data.submissions?.find((s: any) => s.course_id === course.id)?.attachment ||
      null,
  );
  const locked =
    !data.openCourseAccess &&
    index > 0 &&
    !completed.has(entries[index - 1].id) &&
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
        <Button
          disabled={busy}
          onClick={() => action("enroll", {}, "You’re enrolled.")}
        >
          Join the program
        </Button>
      </Empty>
    );
  const submission = data.submissions?.find(
    (s: any) => s.course_id === course.id,
  );
  const nextLesson: Lesson | undefined = entries[index + 1];
  const lastLessonInCourse = !nextLesson;
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
  const awaitingAssignment =
    data.certificateSettings?.requireAssignments &&
    Boolean(course.assignment.prompt.trim()) &&
    submission?.status !== "graded";
  const nextLabel = courseWorkDone
    ? "View certificates"
    : learningLink === "/payments"
      ? "Pay for the next course"
      : "Continue to next course";

  function nextCourseOrCertificate() {
    go(learningLink);
  }

  function continueAfterLesson() {
    if (nextLesson) onLesson(nextLesson.id);
    else if (courseComplete) nextCourseOrCertificate();
    else if (assessmentSubmitted && (assignmentNeeded || awaitingAssignment))
      setTab("assignment");
    else setTab("assessment");
  }

  const continueLabel = !lastLessonInCourse
    ? "Continue to next lesson"
    : courseComplete
      ? nextLabel
      : assessmentSubmitted && (assignmentNeeded || awaitingAssignment)
        ? "Continue to assignment"
        : "Continue to assessment";
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
    <section className="lesson-main" aria-label="Course activity">
      <div className="lesson-heading">
        <h1>
          {tab === "assessment"
            ? activityLabels.assessment
            : tab === "assignment"
              ? activityLabels.assignment
              : lesson.title}
        </h1>
        {tab === "lesson" && !lesson.embedUrl && (
          <p>
            <Clock size={16} />
            {lesson.duration} min · {course.instructor}
          </p>
        )}
      </div>
      <div
        className="tabs lesson-tabs"
        role="group"
        aria-label="Course activities"
      >
        {(Object.keys(activityLabels) as CourseActivity[]).map((activity) => (
          <button
            key={activity}
            className={tab === activity ? "active" : ""}
            aria-pressed={tab === activity}
            onClick={() => setTab(activity)}
          >
            {activityLabels[activity]}
          </button>
        ))}
      </div>
      {locked && tab !== "assessment" && tab !== "assignment" ? (
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
                      <strong>Your faculty is preparing this lesson.</strong>
                      <p>
                        You can explore the curriculum now. This placeholder
                        cannot count toward completion.
                      </p>
                    </div>
                  </div>
                )}
                {lesson.embedUrl ? (
                  <div className="lesson-presentation">
                    <iframe
                      className="video-player"
                      title={lesson.title}
                      src={lesson.embedUrl}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                    <a
                      className="text-link"
                      href={lesson.embedUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open lesson in a new tab <ArrowUpRight size={15} />
                    </a>
                  </div>
                ) : (
                  lesson.type === "video" &&
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
                  ))
                )}
                {!lesson.embedUrl && <RichText text={lesson.content} />}
                {!lesson.embedUrl && lesson.resourceUrl && (
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
                  onClick={() => index > 0 && onLesson(entries[index - 1].id)}
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
                      { lessonId, completed: true },
                      "Lesson completed. Keep growing.",
                    );
                    if (r) continueAfterLesson();
                  }}
                >
                  <CheckCircle2 size={17} />
                  {lessonCompleted ? continueLabel : "Mark complete & continue"}
                </Button>
              </div>
            </>
          )}
          <LessonNotes
            key={data.user.id + ":" + lessonId}
            userId={data.user.id}
            lessonId={lessonId}
            savedNote={
              data.progress?.find((entry: any) => entry.lesson_id === lessonId)
                ?.note ?? ""
            }
            hidden={tab !== "notes"}
            onSaved={refresh}
          />
          {tab === "assessment" && (
            <div className="panel">
              <Quiz
                courseId={course.id}
                quiz={course.quiz}
                data={data}
                action={action}
                busy={busy}
              />
              {(courseComplete ||
                (lastLessonInCourse &&
                  lessonCompleted &&
                  assessmentSubmitted &&
                  (assignmentNeeded || awaitingAssignment))) && (
                <div className="button-row">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      courseComplete
                        ? nextCourseOrCertificate()
                        : setTab("assignment")
                    }
                  >
                    {courseComplete ? nextLabel : "Continue to assignment"}{" "}
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
              {awaitingAssignment && submission?.status === "submitted" && (
                <p className="course-review-notice">
                  Your assignment is awaiting review. It must be graded to
                  complete this course.
                </p>
              )}
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
                {courseComplete && (
                  <Button
                    secondary
                    disabled={busy}
                    onClick={nextCourseOrCertificate}
                  >
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
  );
}
