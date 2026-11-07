"use client";
import { ArrowRight, ArrowUpRight, Printer, GraduationCap } from "lucide-react";
import Quiz from "../components/Quiz";
import { Button } from "../components/ui";
import { lessons } from "../lib/curriculum";

import { useAcademy } from "../providers/AcademyProvider";

export default function CertificatesPage() {
  const {
    data,
    busy,
    courses,
    allLessons,
    completed,
    go,
    action,
    learningLink,
  } = useAcademy();
  const settings = data.certificateSettings;
  const passed = (courseId: string, passScore: number) =>
    data.attempts?.some(
      (attempt: { course_id: string; status: string; score: number }) =>
        attempt.course_id === courseId &&
        attempt.status === "graded" &&
        attempt.score >= passScore,
    );
  const lessonsDone =
    allLessons.length > 0 &&
    allLessons.every((lesson) => completed.has(lesson.id));
  const pendingQuiz = courses.find(
    (course) => !passed(course.id, course.quiz.passScore),
  );
  const pendingAssignment =
    settings?.requireAssignments &&
    courses.find(
      (course) =>
        course.assignment.prompt.trim() &&
        !data.submissions?.some(
          (submission: { course_id: string; status: string }) =>
            submission.course_id === course.id &&
            submission.status === "graded",
        ),
    );
  const courseWorkDone =
    data.enrolled && lessonsDone && !pendingQuiz && !pendingAssignment;
  const needsFinal = settings?.requireFinalAssessment && !passed("program", 70);
  let continueTo = data.enrolled ? learningLink : "/dashboard";
  const nextCourse = pendingQuiz || pendingAssignment;
  if (data.enrolled && lessonsDone && nextCourse) {
    const firstLesson = lessons(nextCourse)[0];
    if (firstLesson)
      continueTo = `/learn/${nextCourse.id}/${firstLesson.id}?tab=${pendingQuiz ? "assessment" : "assignment"}`;
  }
  return (
    <>
      <div className="page-title">
        <h1>Certificates</h1>
      </div>
      {data.certificates?.length ? (
        data.certificates.map((c: any) => (
          <div className="certificate-preview" key={c.id}>
            <GraduationCap size={44} />
            <div className="eyebrow">
              {c.issuer} · CERTIFICATE OF COMPLETION
            </div>
            <h2>{c.name}</h2>
            <p>{c.programName}</p>
            <small>
              Issued {c.created.slice(0, 10)} · {c.id}
            </small>
            <div>
              <a
                className="btn"
                href={`/verify/${c.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <Printer size={17} />
                Print / Save PDF
              </a>
              <button
                className="btn secondary"
                onClick={() => go(`/verify/${c.id}`)}
              >
                Verify certificate <ArrowUpRight size={17} />
              </button>
              <a
                className="text-link"
                target="_blank"
                rel="noreferrer"
                href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(c.programName)}&organizationName=${encodeURIComponent(c.issuer)}&certUrl=${encodeURIComponent(location.origin + "/verify/" + c.id)}&certId=${c.id}`}
              >
                Add to LinkedIn <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        ))
      ) : courseWorkDone && needsFinal ? (
        <div className="panel">
          <h2>Program final assessment</h2>
          <Quiz
            courseId="program"
            quiz={{
              passScore: 70,
              attemptLimit: 3,
              timeLimit: 30,
              questions: courses.flatMap((course) => course.quiz.questions),
            }}
            data={data}
            action={action}
            busy={busy}
          />
        </div>
      ) : (
        <div className="certificate-empty">
          {courseWorkDone ? (
            <Button
              disabled={busy || settings?.enabled === false}
              onClick={() => action("certificate", {}, "Certificate issued")}
            >
              {settings?.enabled === false
                ? "Certificate issuance is paused"
                : "Claim free certificate"}
            </Button>
          ) : (
            <Button onClick={() => go(continueTo)}>
              Continue your journey <ArrowRight size={17} />
            </Button>
          )}
        </div>
      )}
    </>
  );
}
