"use client";
import {
  ArrowLeft,
  ArrowUpRight,
  CircleCheck,
  FileText,
  GripVertical,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Course, Lesson } from "../lib/types";
import { Button } from "./ui";
import FileUpload from "./FileUpload";
import AccountDialog from "./admin/AccountDialog";
import {
  deleteModule,
  deleteLesson,
  restoreContent,
  type RemovedContent,
} from "../lib/courseStructure";

export default function Editor({
  initial,
  busy,
  action,
  go,
  upload,
  media = [],
}: any) {
  const [c, setC] = useState<Course>(() => structuredClone(initial)),
    [tab, setTab] = useState("curriculum"),
    [drag, setDrag] = useState<number | null>(null),
    [moduleIndex, setModuleIndex] = useState(0),
    [lessonIndex, setLessonIndex] = useState(0);
  const [removed, setRemoved] = useState<RemovedContent | null>(null);
  const [error, setError] = useState("");
  const [published, setPublished] = useState(false);
  const mutate = (fn: (draft: Course) => void) =>
    setC((old) => {
      const draft = structuredClone(old);
      fn(draft);
      return draft;
    });
  const current = c.modules[moduleIndex];
  const lesson = current?.lessons[lessonIndex];
  const newLesson = (): Lesson => ({
    id: crypto.randomUUID(),
    title: "New lesson",
    type: "text",
    duration: 15,
    content: "",
    videoUrl: "",
    resourceUrl: "",
    placeholder: true,
  });
  function move(from: number, to: number) {
    if (to < 0 || to >= c.modules.length) return;
    mutate((d) => {
      const [m] = d.modules.splice(from, 1);
      d.modules.splice(to, 0, m);
    });
    setModuleIndex(to);
    setLessonIndex(0);
  }
  async function save(status: string) {
    setError("");
    if (
      status === "published" &&
      (!c.modules.length || c.modules.some((m) => !m.lessons.length))
    ) {
      setError(
        "Add at least one module and a lesson in each module before publishing. You can save an empty course as a draft.",
      );
      return;
    }
    if (status === "published" && !c.quiz.questions.length) {
      setError(
        "Add at least one quiz question before publishing. You can save an empty assessment as a draft.",
      );
      return;
    }
    const result = await action(
      "saveCourse",
      { course: { ...c, status } },
      status === "published" ? "" : "Draft saved",
    );
    if (result) {
      if (status === "published") setPublished(true);
      else go("/admin/courses");
    } else {
      setError("Your course could not be saved. Please try again.");
    }
  }
  function removeModule(index: number) {
    const result = deleteModule(c, index);
    setC(result.course);
    setRemoved(result.removed);
    setError("");
    setModuleIndex(
      index < moduleIndex
        ? moduleIndex - 1
        : index === moduleIndex
          ? Math.max(0, Math.min(index, result.course.modules.length - 1))
          : moduleIndex,
    );
    if (index === moduleIndex) setLessonIndex(0);
  }
  function removeLesson(index: number) {
    const result = deleteLesson(c, moduleIndex, index);
    setC(result.course);
    setRemoved(result.removed);
    setError("");
    setLessonIndex(
      index < lessonIndex
        ? lessonIndex - 1
        : index === lessonIndex
          ? Math.max(
              0,
              Math.min(
                index,
                result.course.modules[moduleIndex].lessons.length - 1,
              ),
            )
          : lessonIndex,
    );
  }
  return (
    <>
      {published && (
        <AccountDialog
          title="Course published"
          onClose={() => go("/admin/courses")}
        >
          <div className="publish-confirmation-icon" aria-hidden="true">
            <CircleCheck size={30} />
          </div>
          <p className="publish-confirmation-title">{c.title}</p>
          <p className="account-dialog-description">
            This course is now live and available to enrolled learners. Your
            latest lessons, resources and assessments are published.
          </p>
          <div className="account-dialog-actions">
            <Button secondary onClick={() => go(`/course/${c.id}`)}>
              View course <ArrowUpRight size={16} />
            </Button>
            <Button onClick={() => go("/admin/courses")}>
              Back to library
            </Button>
          </div>
        </AccountDialog>
      )}
      <button className="text-link" onClick={() => go("/admin/courses")}>
        <ArrowLeft size={17} />
        Content library
      </button>
      <div className="editor-title">
        <div>
          <div className="eyebrow red">COURSE BUILDER</div>
          <h1>{c.title}</h1>
          <span className={`status ${c.status}`}>{c.status}</span>
        </div>
        <div className="button-row">
          <Button secondary disabled={busy} onClick={() => save("draft")}>
            <Save size={16} />
            Save draft
          </Button>
          <Button disabled={busy} onClick={() => save("published")}>
            Publish course <ArrowUpRight size={17} />
          </Button>
        </div>
      </div>
      {error && (
        <div className="editor-validation" role="alert">
          {error}
        </div>
      )}
      <div className="tabs">
        {["details", "curriculum", "assessment", "assignment"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "details" && (
        <div className="panel profile-form">
          <label>
            Course title
            <input
              value={c.title}
              onChange={(e) => setC({ ...c, title: e.target.value })}
            />
          </label>
          <label>
            Course introduction
            <textarea
              rows={7}
              value={c.description}
              onChange={(e) => setC({ ...c, description: e.target.value })}
            />
          </label>
          <div className="form-row">
            <label>
              Instructor
              <input
                value={c.instructor}
                onChange={(e) => setC({ ...c, instructor: e.target.value })}
              />
            </label>
          </div>
          <label>
            Difficulty
            <select
              value={c.difficulty}
              onChange={(e) => setC({ ...c, difficulty: e.target.value })}
            >
              <option>Foundational</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          <button
            className="text-link danger"
            disabled={busy}
            onClick={async () => {
              if (
                window.confirm(
                  c.version === 0
                    ? "Discard this unsaved course?"
                    : "Delete this course? It will be removed from the catalogue.",
                )
              ) {
                if (c.version === 0) {
                  go("/admin/courses");
                  return;
                }
                const r = await action(
                  "deleteCourse",
                  { courseId: c.id },
                  "Course deleted",
                );
                if (r) go("/admin/courses");
              }
            }}
          >
            <Trash2 size={16} />
            {c.version === 0 ? "Discard course" : "Delete course"}
          </button>
        </div>
      )}
      {tab === "curriculum" && (
        <div className="editor-grid">
          <section className="panel module-builder">
            <h3>Course structure</h3>
            <p>Drag modules to reorder, or use the arrows.</p>
            {removed && (
              <div className="editor-undo" role="status">
                <span>
                  {removed.kind === "module" ? "Module" : "Lesson"} removed.
                  Save to apply.
                </span>
                <button
                  onClick={() => {
                    const result = restoreContent(c, removed);
                    setC(result.course);
                    setModuleIndex(result.moduleIndex);
                    setLessonIndex(result.lessonIndex);
                    setRemoved(null);
                    setError("");
                  }}
                >
                  Undo
                </button>
              </div>
            )}
            {!c.modules.length && (
              <p className="builder-empty">
                No modules yet. Add a module to start building your course.
              </p>
            )}
            {c.modules.map((m, i) => (
              <div
                draggable
                onDragStart={() => setDrag(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (drag !== null) move(drag, i);
                  setDrag(null);
                }}
                className={`builder-module ${moduleIndex === i ? "active" : ""}`}
                key={m.id}
              >
                <div className="module-title">
                  <GripVertical size={17} />
                  <button
                    onClick={() => {
                      setModuleIndex(i);
                      setLessonIndex(0);
                    }}
                  >
                    {m.title}
                  </button>
                  <button
                    aria-label="Move module up"
                    disabled={busy || i === 0}
                    onClick={() => move(i, i - 1)}
                  >
                    ↑
                  </button>
                  <button
                    aria-label="Move module down"
                    disabled={busy || i === c.modules.length - 1}
                    onClick={() => move(i, i + 1)}
                  >
                    ↓
                  </button>
                  <button
                    className="builder-delete"
                    aria-label={`Delete module: ${m.title}`}
                    title="Delete module"
                    disabled={busy}
                    onClick={() => removeModule(i)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {moduleIndex === i &&
                  m.lessons.map((l, n) => (
                    <div
                      className={`builder-lesson ${lessonIndex === n ? "selected" : ""}`}
                      key={l.id}
                    >
                      <button onClick={() => setLessonIndex(n)}>
                        <FileText size={15} />
                        {l.title}
                      </button>
                      <button
                        aria-label="Move lesson up"
                        disabled={n === 0}
                        onClick={() => {
                          mutate((d) => {
                            const arr = d.modules[i].lessons;
                            [arr[n - 1], arr[n]] = [arr[n], arr[n - 1]];
                          });
                          setLessonIndex(n - 1);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        aria-label="Move lesson down"
                        disabled={n === m.lessons.length - 1}
                        onClick={() => {
                          mutate((d) => {
                            const arr = d.modules[i].lessons;
                            [arr[n + 1], arr[n]] = [arr[n], arr[n + 1]];
                          });
                          setLessonIndex(n + 1);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        className="builder-delete"
                        aria-label={`Delete lesson: ${l.title}`}
                        title="Delete lesson"
                        disabled={busy}
                        onClick={() => removeLesson(n)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                {moduleIndex === i && (
                  <button
                    className="text-link"
                    onClick={() => {
                      mutate((d) => d.modules[i].lessons.push(newLesson()));
                      setLessonIndex(m.lessons.length);
                    }}
                  >
                    <Plus size={15} />
                    Add lesson
                  </button>
                )}
              </div>
            ))}
            <Button
              secondary
              onClick={() => {
                mutate((d) =>
                  d.modules.push({
                    id: crypto.randomUUID(),
                    title: "New module",
                    lessons: [newLesson()],
                  }),
                );
                setModuleIndex(c.modules.length);
                setLessonIndex(0);
              }}
            >
              <Plus size={17} />
              Add module
            </Button>
          </section>
          {!lesson && (
            <section className="panel lesson-editor builder-empty-editor">
              {current ? (
                <>
                  <h3>{current.title}</h3>
                  <label>
                    Module name
                    <input
                      value={current.title}
                      onChange={(e) =>
                        mutate((d) => {
                          d.modules[moduleIndex].title = e.target.value;
                        })
                      }
                    />
                  </label>
                  <p>
                    This module has no lessons. Add a lesson to write its
                    content.
                  </p>
                  <Button
                    secondary
                    onClick={() => {
                      mutate((d) =>
                        d.modules[moduleIndex].lessons.push(newLesson()),
                      );
                      setLessonIndex(0);
                    }}
                  >
                    <Plus size={16} />
                    Add lesson
                  </Button>
                </>
              ) : (
                <>
                  <h3>Build your course</h3>
                  <p>
                    Add your first module using the course structure panel. You
                    can save a draft at any stage.
                  </p>
                </>
              )}
            </section>
          )}
          {lesson && (
            <section className="panel lesson-editor">
              <div className="small-heading">
                <h3>Lesson editor</h3>
                <span className="pill">
                  {lesson.placeholder ? "PLACEHOLDER" : "CONTENT READY"}
                </span>
              </div>
              <label>
                Module name
                <input
                  value={current.title}
                  onChange={(e) =>
                    mutate((d) => {
                      d.modules[moduleIndex].title = e.target.value;
                    })
                  }
                />
              </label>
              <label>
                Lesson title
                <input
                  value={lesson.title}
                  onChange={(e) =>
                    mutate((d) => {
                      d.modules[moduleIndex].lessons[lessonIndex].title =
                        e.target.value;
                    })
                  }
                />
              </label>
              <div className="form-row">
                <label>
                  Content type
                  <select
                    value={lesson.type}
                    onChange={(e) =>
                      mutate((d) => {
                        d.modules[moduleIndex].lessons[lessonIndex].type =
                          e.target.value;
                      })
                    }
                  >
                    <option value="text">Text lesson</option>
                    <option value="video">Video lesson</option>
                  </select>
                </label>
                <label>
                  Duration (minutes)
                  <input
                    type="number"
                    min="1"
                    value={lesson.duration}
                    onChange={(e) =>
                      mutate((d) => {
                        d.modules[moduleIndex].lessons[lessonIndex].duration =
                          Number(e.target.value);
                      })
                    }
                  />
                </label>
              </div>
              {lesson.type === "video" && (
                <>
                  <label>
                    Video link
                    <input
                      type="text"
                      value={lesson.videoUrl}
                      onChange={(e) =>
                        mutate((d) => {
                          d.modules[moduleIndex].lessons[lessonIndex].videoUrl =
                            e.target.value;
                        })
                      }
                    />
                  </label>
                  <FileUpload
                    purpose="video"
                    busy={busy}
                    upload={upload}
                    onUploaded={(file) =>
                      mutate((d) => {
                        d.modules[moduleIndex].lessons[lessonIndex].videoUrl =
                          file.url;
                      })
                    }
                  />
                  {media.some((file: any) => file.purpose === "video") && (
                    <label>
                      Or choose an uploaded video
                      <select
                        value=""
                        onChange={(e) =>
                          mutate((d) => {
                            d.modules[moduleIndex].lessons[
                              lessonIndex
                            ].videoUrl = e.target.value;
                          })
                        }
                      >
                        <option value="">Select a video…</option>
                        {media
                          .filter((file: any) => file.purpose === "video")
                          .map((file: any) => (
                            <option key={file.id} value={file.url}>
                              {file.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                </>
              )}
              <label>Lesson content</label>
              <div className="editor-toolbar">
                <button
                  onClick={() =>
                    mutate((d) => {
                      d.modules[moduleIndex].lessons[lessonIndex].content +=
                        "\n\n## Section heading";
                    })
                  }
                >
                  Heading
                </button>
                <button
                  onClick={() =>
                    mutate((d) => {
                      d.modules[moduleIndex].lessons[lessonIndex].content +=
                        " **bold text**";
                    })
                  }
                >
                  <b>Bold</b>
                </button>
                <small>Headings and bold formatting supported</small>
              </div>
              <textarea
                rows={15}
                value={lesson.content}
                onChange={(e) =>
                  mutate((d) => {
                    d.modules[moduleIndex].lessons[lessonIndex].content =
                      e.target.value;
                  })
                }
              />
              <label>
                Learning resource
                <input
                  value={lesson.resourceUrl}
                  onChange={(e) =>
                    mutate((d) => {
                      d.modules[moduleIndex].lessons[lessonIndex].resourceUrl =
                        e.target.value;
                    })
                  }
                />
              </label>
              <small className="field-hint">
                Paste an HTTPS link, upload a file, or choose from the media
                library.
              </small>
              <FileUpload
                purpose="resource"
                busy={busy}
                upload={upload}
                onUploaded={(file) =>
                  mutate((d) => {
                    d.modules[moduleIndex].lessons[lessonIndex].resourceUrl =
                      file.url;
                  })
                }
              />
              {media.some((file: any) => file.purpose === "resource") && (
                <label>
                  Or choose an uploaded resource
                  <select
                    value=""
                    onChange={(e) =>
                      mutate((d) => {
                        d.modules[moduleIndex].lessons[
                          lessonIndex
                        ].resourceUrl = e.target.value;
                      })
                    }
                  >
                    <option value="">Select a resource…</option>
                    {media
                      .filter((file: any) => file.purpose === "resource")
                      .map((file: any) => (
                        <option key={file.id} value={file.url}>
                          {file.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {lesson.resourceUrl &&
                /^(https:\/\/|\/api\/files\/)/.test(lesson.resourceUrl) && (
                  <div className="uploaded-file">
                    <a
                      href={lesson.resourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {media.find(
                        (file: any) => file.url === lesson.resourceUrl,
                      )?.name || "Open learning resource"}
                    </a>
                    <button
                      onClick={() =>
                        mutate((d) => {
                          d.modules[moduleIndex].lessons[
                            lessonIndex
                          ].resourceUrl = "";
                        })
                      }
                    >
                      Remove link
                    </button>
                  </div>
                )}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!lesson.placeholder}
                  onChange={(e) =>
                    mutate((d) => {
                      d.modules[moduleIndex].lessons[lessonIndex].placeholder =
                        !e.target.checked;
                    })
                  }
                />
                Faculty content is ready for learners
              </label>
              <div className="button-row">
                <button
                  className="text-link danger"
                  disabled={busy}
                  onClick={() => removeLesson(lessonIndex)}
                >
                  <Trash2 size={15} />
                  Remove lesson
                </button>
                <button
                  className="text-link danger"
                  disabled={busy}
                  onClick={() => removeModule(moduleIndex)}
                >
                  Remove module
                </button>
              </div>
            </section>
          )}
        </div>
      )}
      {tab === "assessment" && (
        <>
          <div className="panel">
            <div className="form-row">
              <label>
                Pass mark (%)
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={c.quiz.passScore}
                  onChange={(e) =>
                    mutate((d) => {
                      d.quiz.passScore = Number(e.target.value);
                    })
                  }
                />
              </label>
              <label>
                Attempt limit
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={c.quiz.attemptLimit}
                  onChange={(e) =>
                    mutate((d) => {
                      d.quiz.attemptLimit = Number(e.target.value);
                    })
                  }
                />
              </label>
              <label>
                Time limit (minutes, 0 = untimed)
                <input
                  type="number"
                  min="0"
                  value={c.quiz.timeLimit}
                  onChange={(e) =>
                    mutate((d) => {
                      d.quiz.timeLimit = Number(e.target.value);
                    })
                  }
                />
              </label>
            </div>
          </div>
          {c.quiz.questions.map((q, i) => (
            <div className="panel question-editor" key={q.id}>
              <div className="small-heading">
                <h3>Question {i + 1}</h3>
                <button
                  aria-label="Remove question"
                  className="icon-btn danger"
                  disabled={busy}
                  onClick={() => mutate((d) => d.quiz.questions.splice(i, 1))}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <label>
                Question type
                <select
                  value={q.type}
                  onChange={(e) =>
                    mutate((d) => {
                      d.quiz.questions[i].type = e.target.value;
                      d.quiz.questions[i].answer = 0;
                      if (e.target.value === "boolean")
                        d.quiz.questions[i].options = ["True", "False"];
                    })
                  }
                >
                  <option value="multiple">Multiple choice</option>
                  <option value="boolean">True / false</option>
                  <option value="short">Short answer (manual review)</option>
                </select>
              </label>
              <label>
                Question prompt
                <textarea
                  rows={2}
                  value={q.prompt}
                  onChange={(e) =>
                    mutate((d) => {
                      d.quiz.questions[i].prompt = e.target.value;
                    })
                  }
                />
              </label>
              {q.type !== "short" && (
                <>
                  {q.options.map((o, n) => (
                    <div className="option-editor" key={n}>
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        aria-label={`Mark option ${n + 1} correct`}
                        checked={Number(q.answer) === n}
                        onChange={() =>
                          mutate((d) => {
                            d.quiz.questions[i].answer = n;
                          })
                        }
                      />
                      <input
                        value={o}
                        aria-label={`Option ${n + 1}`}
                        onChange={(e) =>
                          mutate((d) => {
                            d.quiz.questions[i].options[n] = e.target.value;
                          })
                        }
                      />
                    </div>
                  ))}
                  {q.type === "multiple" && (
                    <button
                      className="text-link"
                      onClick={() =>
                        mutate((d) =>
                          d.quiz.questions[i].options.push("New option"),
                        )
                      }
                    >
                      <Plus size={16} />
                      Add option
                    </button>
                  )}
                  <small>
                    Select the radio button next to the correct answer.
                  </small>
                </>
              )}
              <label>
                Feedback / explanation
                <textarea
                  rows={2}
                  value={q.explanation}
                  onChange={(e) =>
                    mutate((d) => {
                      d.quiz.questions[i].explanation = e.target.value;
                    })
                  }
                />
              </label>
            </div>
          ))}
          <Button
            secondary
            onClick={() =>
              mutate((d) =>
                d.quiz.questions.push({
                  id: crypto.randomUUID(),
                  type: "multiple",
                  prompt: "New question",
                  options: ["Option 1", "Option 2"],
                  answer: 0,
                  explanation: "",
                }),
              )
            }
          >
            <Plus size={17} />
            Add question
          </Button>
        </>
      )}
      {tab === "assignment" && (
        <div className="panel profile-form">
          <h2>Put learning into practice.</h2>
          <label>
            Assignment title
            <input
              value={c.assignment.title}
              onChange={(e) =>
                setC({
                  ...c,
                  assignment: { ...c.assignment, title: e.target.value },
                })
              }
            />
          </label>
          <label>
            Instructions
            <textarea
              rows={10}
              value={c.assignment.prompt}
              onChange={(e) =>
                setC({
                  ...c,
                  assignment: { ...c.assignment, prompt: e.target.value },
                })
              }
            />
          </label>
          <p>
            Learners can submit a written response. Instructor approval is
            required for program certification.
          </p>
        </div>
      )}
    </>
  );
}
