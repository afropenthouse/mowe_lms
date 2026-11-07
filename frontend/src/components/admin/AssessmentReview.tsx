"use client";

import { Check, ChevronDown, ClipboardCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAdminData } from "../../lib/useAdminData";
import { useAcademy } from "../../providers/AcademyProvider";
import { Button, Empty, LoadingState } from "../ui";

type ReviewItem = {
  id: string;
  learnerName: string;
  courseTitle: string;
  submittedAt: string;
};
type Assignment = ReviewItem & {
  updatedAt: string;
  status: string;
  content: string;
  feedback: string;
  hasAttachment: boolean;
  attachment: { name: string; size: number; url: string } | null;
};
type Quiz = ReviewItem & {
  questions: { id: string; prompt: string; response: string | null }[];
};
type ReviewPage = { page: number; pageSize: number; total: number } & (
  | { kind: "assignments"; items: Assignment[] }
  | { kind: "quizzes"; items: Quiz[] }
);
const queues = [
  ["assignments", "Assignments"],
  ["quizzes", "Short-answer quizzes"],
] as const;

export default function AssessmentReview() {
  const [kind, setKind] = useState<ReviewPage["kind"]>("assignments");
  return (
    <div className="people-page assessment-review">
      <header className="people-heading">
        <div>
          <h1>Assessments</h1>
          <p>Review written assignments and grade short-answer quizzes.</p>
        </div>
      </header>
      <div className="people-surface">
        <div className="library-filters" role="group" aria-label="Review queue">
          {queues.map(([key, label]) => (
            <button
              key={key}
              aria-pressed={kind === key}
              className={kind === key ? "active" : ""}
              onClick={() => setKind(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <ReviewQueue key={kind} kind={kind} />
      </div>
    </div>
  );
}

function ReviewQueue({ kind }: { kind: ReviewPage["kind"] }) {
  const [page, setPage] = useState(1);
  const { action, busy } = useAcademy();
  const { data, loading, error, refresh } = useAdminData<ReviewPage>(
    `/reviews?kind=${kind}&page=${page}`,
  );
  const current = data?.page === page ? data : null;
  const itemLabel = kind === "assignments" ? "submission" : "pending attempt";
  const lastPage = current
    ? Math.max(1, Math.ceil(current.total / current.pageSize))
    : 1;
  useEffect(() => {
    if (current && page > lastPage) setPage(lastPage);
  }, [current, lastPage, page]);

  async function grade(name: string, payload: object, message: string) {
    await action(name, payload, message);
    await refresh();
  }

  return (
    <section
      aria-label={
        kind === "assignments"
          ? "Assignment submissions"
          : "Pending short-answer quizzes"
      }
    >
      {error && (
        <div className="editor-validation" role="alert">
          {error}{" "}
          <button className="text-link" onClick={() => refresh()}>
            Try again
          </button>
        </div>
      )}
      {!current && !error && <LoadingState label="Loading review queue" />}
      {current && page <= lastPage && (
        <>
          {!current.items.length && (
            <Empty
              icon={ClipboardCheck}
              title={
                kind === "assignments"
                  ? "No assignments submitted"
                  : "No quizzes waiting for review"
              }
            >
              {kind === "assignments"
                ? "Learner submissions will appear here."
                : "Submitted short-answer quizzes will appear here."}
            </Empty>
          )}
          {current.kind === "assignments"
            ? current.items.map((item) => (
                <AssignmentReview
                  key={item.id}
                  item={item}
                  busy={busy || loading}
                  onGrade={(status, feedback) =>
                    grade(
                      "grade",
                      {
                        id: item.id,
                        status,
                        feedback,
                        expectedUpdatedAt: item.updatedAt,
                      },
                      status === "graded"
                        ? "Assignment graded"
                        : "Revision requested",
                    )
                  }
                />
              ))
            : current.items.map((item) => (
                <QuizReview
                  key={item.id}
                  item={item}
                  busy={busy || loading}
                  onGrade={(score) =>
                    grade(
                      "gradeQuiz",
                      { id: item.id, score },
                      "Assessment graded",
                    )
                  }
                />
              ))}
          {current.total > 0 && (
            <div className="people-pagination">
              <span>
                {current.total} {itemLabel}
                {current.total === 1 ? "" : "s"} · Page {page} of {lastPage}
              </span>
              <div>
                <button
                  className="people-secondary"
                  disabled={page <= 1 || busy || loading}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <button
                  className="people-secondary"
                  disabled={page >= lastPage || busy || loading}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ReviewCard({
  item,
  status,
  complete = false,
  children,
}: {
  item: ReviewItem;
  status: string;
  complete?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="review-card">
      <summary>
        <div>
          <strong>{item.learnerName}</strong>
          <span>
            {item.courseTitle} ·{" "}
            <time dateTime={item.submittedAt}>
              {new Date(item.submittedAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </span>
        </div>
        <span className={`status ${complete ? "published" : "draft"}`}>
          {status}
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </summary>
      <div className="review-card-body">{children}</div>
    </details>
  );
}

function AssignmentReview({
  item,
  busy,
  onGrade,
}: {
  item: Assignment;
  busy: boolean;
  onGrade: (status: "graded" | "revision", feedback: string) => Promise<void>;
}) {
  return (
    <ReviewCard
      item={item}
      status={
        item.status === "graded"
          ? "Graded"
          : item.status === "revision"
            ? "Revision requested"
            : "Needs review"
      }
      complete={item.status === "graded"}
    >
      {item.content && <p className="submitted-text">{item.content}</p>}
      {item.attachment ? (
        <div className="uploaded-file">
          <a href={item.attachment.url} target="_blank" rel="noreferrer">
            Download {item.attachment.name}
          </a>
          <span>{Math.ceil(item.attachment.size / 1024)} KB</span>
        </div>
      ) : (
        item.hasAttachment && (
          <p className="field-hint">Attachment unavailable</p>
        )
      )}
      <AssignmentFeedback
        key={item.updatedAt}
        feedback={item.feedback}
        busy={busy}
        onGrade={onGrade}
      />
    </ReviewCard>
  );
}

function AssignmentFeedback({
  feedback: initialFeedback,
  busy,
  onGrade,
}: {
  feedback: string;
  busy: boolean;
  onGrade: (status: "graded" | "revision", feedback: string) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState(initialFeedback);
  return (
    <>
      <label>
        Your feedback
        <textarea
          rows={3}
          maxLength={10000}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </label>
      <div className="button-row">
        <Button disabled={busy} onClick={() => onGrade("graded", feedback)}>
          Approve assignment <Check size={16} />
        </Button>
        <Button
          secondary
          disabled={busy}
          onClick={() => onGrade("revision", feedback)}
        >
          Request revision
        </Button>
      </div>
    </>
  );
}

function QuizReview({
  item,
  busy,
  onGrade,
}: {
  item: Quiz;
  busy: boolean;
  onGrade: (score: number) => Promise<void>;
}) {
  const [score, setScore] = useState("70");
  return (
    <ReviewCard item={item} status="Needs review">
      <ol className="review-questions">
        {item.questions.map((question) => (
          <li key={question.id}>
            <strong>{question.prompt}</strong>
            <p>{question.response ?? "No response"}</p>
          </li>
        ))}
      </ol>
      <form
        className="review-score"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) onGrade(Number(score));
        }}
      >
        <label>
          Overall score (0–100)
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            required
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={busy}>
          Save grade
        </Button>
      </form>
    </ReviewCard>
  );
}
