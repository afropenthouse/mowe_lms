"use client";
import { ArrowRight, Clock, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui";

export default function Quiz({
  courseId,
  quiz: configuredQuiz,
  data,
  action,
  busy,
}: any) {
  const [active, setActive] = useState<any>(null),
    [answers, setAnswers] = useState<Record<string, any>>({}),
    [result, setResult] = useState<any>(null),
    [remaining, setRemaining] = useState(0);
  const quiz = active?.quiz || configuredQuiz;
  const attempts = (data.attempts || []).filter(
    (a: any) => a.course_id === courseId,
  );
  useEffect(() => {
    const started = attempts.find((a: any) => a.status === "started");
    if (started)
      setActive({
        attemptId: started.id,
        started: started.started,
        quiz: started.quiz,
      });
  }, [data.attempts, courseId]);
  useEffect(() => {
    if (!active || !quiz.timeLimit) return;
    const tick = () =>
      setRemaining(
        Math.max(
          0,
          Math.ceil(
            (Date.parse(active.started) + quiz.timeLimit * 60000 - Date.now()) /
              1000,
          ),
        ),
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [active, quiz.timeLimit]);
  async function submit() {
    const r = await action(
      "quizSubmit",
      { attemptId: active.attemptId, answers },
      "Assessment submitted",
    );
    if (r) {
      setResult(r);
      setActive(null);
    }
  }
  return (
    <div className="quiz">
      <div className="quiz-meta">
        <span>
          <Target size={16} />
          Pass mark {quiz.passScore}%
        </span>
        <span>
          {attempts.length} / {quiz.attemptLimit} attempts
        </span>
        <span>
          <Clock size={16} />
          {quiz.timeLimit ? `${quiz.timeLimit} minutes` : "Untimed"}
        </span>
      </div>
      {attempts
        .filter((a: any) => a.status !== "started")
        .map((a: any) => (
          <div className="quiz-result-row" key={a.id}>
            <span>
              {a.status === "pending"
                ? "Awaiting instructor review"
                : `Score: ${a.score}%`}
            </span>
            <small>{a.created.slice(0, 10)}</small>
          </div>
        ))}
      {result && (
        <div
          className={`feedback ${result.score >= quiz.passScore ? "success" : ""}`}
        >
          <h3>
            {result.status === "pending"
              ? "Submitted for instructor review"
              : result.expired
                ? "Time limit exceeded"
                : `${result.score}% — ${result.score >= quiz.passScore ? "Well done!" : "Keep learning."}`}
          </h3>
          {result.feedback?.map((f: any) => (
            <p key={f.id}>
              {f.correct ? "✓ " : ""}
              {f.explanation}
            </p>
          ))}
        </div>
      )}
      {active ? (
        <>
          <div className="quiz-active-label">
            <strong>Assessment in progress</strong>
            {quiz.timeLimit > 0 && (
              <span role="timer">
                {Math.floor(remaining / 60)}:
                {String(remaining % 60).padStart(2, "0")} remaining
              </span>
            )}
          </div>
          {quiz.questions.map((q: any, i: number) => (
            <fieldset key={q.id}>
              <legend>
                {i + 1}. {q.prompt}
              </legend>
              {q.type === "short" ? (
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                  rows={4}
                />
              ) : (
                q.options.map((o: string, n: number) => (
                  <label
                    className={`answer ${String(answers[q.id]) === String(n) ? "selected" : ""}`}
                    key={n}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={String(answers[q.id]) === String(n)}
                      onChange={() => setAnswers({ ...answers, [q.id]: n })}
                    />
                    {o}
                  </label>
                ))
              )}
            </fieldset>
          ))}
          <Button disabled={busy} onClick={submit}>
            Submit assessment <ArrowRight size={17} />
          </Button>
        </>
      ) : (
        <Button
          secondary
          disabled={
            busy || !data.enrolled || attempts.length >= quiz.attemptLimit
          }
          onClick={async () => {
            const r = await action("quizStart", { courseId }, "");
            if (r) {
              setActive(r);
              setResult(null);
              setAnswers({});
            }
          }}
        >
          {attempts.length ? "Start another attempt" : "Start assessment"}
          <ArrowRight size={17} />
        </Button>
      )}
    </div>
  );
}
