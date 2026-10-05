"use client";

import { useMemo, useState } from "react";

import {
  Card,
  Empty,
  Field,
  Modal,
  PageHeader,
  Pill,
  Segmented,
} from "@/components/ui";
import { CheckSquare, Plus, Trash2, X } from "lucide-react";

import { CATEGORIES, PRIORITIES, catColor } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { countdownLabel, dateKey, daysUntil } from "@/lib/time";

const FILTERS = [
  { value: "urgent", label: "Urgent first", emoji: "🔥" },
  { value: "today", label: "Today", emoji: "📅" },
  { value: "week", label: "This week", emoji: "🗓️" },
  { value: "all", label: "All open", emoji: "📋" },
  { value: "done", label: "Done", emoji: "✅" },
];

/* =========================================================
   GET SUBJECTS FROM COURSE SECTION
   ========================================================= */

function getCourseSubjects(state) {
  let subjects = [];

  /*
    Try different possible locations where your Course
    section may store subjects.
  */

  if (Array.isArray(state?.course?.subjects)) {
    subjects = state.course.subjects;
  } else if (Array.isArray(state?.courses?.subjects)) {
    subjects = state.courses.subjects;
  } else if (Array.isArray(state?.profile?.course?.subjects)) {
    subjects = state.profile.course.subjects;
  } else if (Array.isArray(state?.profile?.subjects)) {
    // Fallback to old subject location
    subjects = state.profile.subjects;
  }

  /*
    Convert subjects into simple names.

    Supports:
    ["Java", "DBMS"]

    OR

    [
      { name: "Java" },
      { name: "DBMS" }
    ]

    OR

    [
      { title: "Java" },
      { subject: "DBMS" }
    ]
  */

  const names = subjects
    .map((subject) => {
      if (typeof subject === "string") {
        return subject;
      }

      if (typeof subject === "object" && subject !== null) {
        return (
          subject.name ||
          subject.title ||
          subject.subject ||
          subject.label ||
          ""
        );
      }

      return "";
    })
    .map((name) => String(name).trim())
    .filter(Boolean);

  // Remove duplicate subjects
  return [...new Set(names)];
}

/* =========================================================
   TASK PAGE
   ========================================================= */

export default function Tasks() {
  const { state, dispatch } = useApp();

  const [filter, setFilter] = useState("urgent");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  /*
    SUBJECTS NOW COME FROM COURSE SECTION
  */
  const subjects = useMemo(() => {
    return getCourseSubjects(state);
  }, [state]);

  /* =======================================================
     BLANK TASK
     ======================================================= */

  const blank = () => ({
    title: "",
    priority: "medium",
    due: dateKey(),
    category: "academics",
    subject: "",
  });

  /* =======================================================
     TASK FILTERING
     ======================================================= */

  const tasks = useMemo(() => {
    const openTasks = state.tasks.filter((t) => !t.done);

    const byPriority = (a, b) =>
      PRIORITIES[a.priority].rank - PRIORITIES[b.priority].rank ||
      String(a.due || "9999").localeCompare(
        String(b.due || "9999")
      );

    switch (filter) {
      case "done":
        return state.tasks.filter((t) => t.done);

      case "today":
        return openTasks
          .filter(
            (t) =>
              t.due &&
              daysUntil(t.due) <= 0
          )
          .sort(byPriority);

      case "week":
        return openTasks
          .filter(
            (t) =>
              t.due &&
              daysUntil(t.due) <= 7
          )
          .sort(byPriority);

      case "all":
        return openTasks.sort((a, b) =>
          String(a.due || "9999").localeCompare(
            String(b.due || "9999")
          )
        );

      default:
        return openTasks.sort(byPriority);
    }
  }, [state.tasks, filter]);

  /* =======================================================
     COUNTS
     ======================================================= */

  const counts = {
    open: state.tasks.filter((t) => !t.done).length,

    overdue: state.tasks.filter(
      (t) =>
        !t.done &&
        t.due &&
        daysUntil(t.due) < 0
    ).length,

    today: state.tasks.filter(
      (t) =>
        !t.done &&
        t.due &&
        daysUntil(t.due) === 0
    ).length,
  };

  /* =======================================================
     SUBMIT TASK
     ======================================================= */

  const submit = () => {
    if (!draft?.title?.trim()) return;

    if (draft.id) {
      dispatch({
        type: "task.update",
        payload: {
          id: draft.id,
          patch: {
            ...draft,
            title: draft.title.trim(),
          },
        },
      });
    } else {
      dispatch({
        type: "task.add",
        payload: {
          ...draft,
          title: draft.title.trim(),
        },
      });
    }

    setOpen(false);
    setDraft(null);
  };

  /* =======================================================
     OPEN NEW TASK
     ======================================================= */

  const newTask = () => {
    setDraft(blank());
    setOpen(true);
  };

  /* =======================================================
     RETURN UI
     ======================================================= */

  return (
    <div className="space-y-4">

      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title="Tasks"
        emoji="✅"
        subtitle={`${counts.open} open · ${counts.today} due today${counts.overdue ? ` · ${counts.overdue} overdue` : ""}`}
        action={
          <button className="btn btn-primary" onClick={newTask}>
            <Plus size={16} /> New task
          </button>
        }
      />

      {/* =================================================
          FILTERS
      ================================================= */}

      <Segmented
        value={filter}
        onChange={setFilter}
        options={FILTERS}
      />

      {/* =================================================
          TASK LIST
      ================================================= */}

      <Card className="p-0">

        {tasks.length ? (

          <div className="divide-y divide-line">

            {tasks.map((t) => {

              const overdue =
                !t.done &&
                t.due &&
                daysUntil(t.due) < 0;

              return (
                <div
                  key={t.id}
                  className="group flex items-center gap-3 px-3 py-3 sm:px-4 hover:bg-surface2/50 transition-colors"
                >

                  {/* CHECKBOX */}

                  <button
                    onClick={() =>
                      dispatch({
                        type: "task.toggle",
                        payload: {
                          id: t.id,
                        },
                      })
                    }
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-all ${
                      t.done ? "text-muted border-line bg-surface2" : "bg-surface hover:bg-surface-elevated"
                    }`}
                    style={!t.done ? { borderColor: PRIORITIES[t.priority].color } : {}}
                    aria-label={
                      t.done
                        ? "Mark as not done"
                        : "Mark as done"
                    }
                  >
                    {t.done ? "✓" : ""}
                  </button>

                  {/* TASK CONTENT */}

                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setDraft({ ...t });
                      setOpen(true);
                    }}
                  >

                    <p
                      className={`truncate text-sm font-medium ${
                        t.done
                          ? "text-muted line-through"
                          : "text-ink group-hover:text-accent transition-colors"
                      }`}
                    >
                      {t.title}
                    </p>

                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">

                      {/* PRIORITY */}

                      <Pill
                        color={
                          PRIORITIES[t.priority].color
                        }
                      >
                        {PRIORITIES[t.priority].label}
                      </Pill>

                      {/* SUBJECT */}

                      {t.subject ? (
                        <span className="text-[11px] text-muted">
                          📚 {t.subject}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted">
                          {
                            (
                              CATEGORIES[t.category] ||
                              CATEGORIES.custom
                            ).label
                          }
                        </span>
                      )}

                      {/* DUE DATE */}

                      {t.due && (
                        <span
                          className="text-[11px]"
                          style={{
                            color: overdue
                              ? "#ef4444"
                              : "var(--muted)",
                          }}
                        >
                          · {countdownLabel(t.due)}
                        </span>
                      )}

                    </div>
                  </button>

                  {/* CATEGORY COLOR */}

                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{
                      background: catColor(
                        t.category
                      ),
                    }}
                  />

                  {/* DELETE */}

                  <button
                    className="btn btn-ghost btn-sm text-muted opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    onClick={() =>
                      dispatch({
                        type: "task.delete",
                        payload: {
                          id: t.id,
                        },
                      })
                    }
                    aria-label="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>

                </div>
              );
            })}

          </div>

        ) : (

          <Empty
            emoji={
              filter === "done"
                ? "🧹"
                : "🎉"
            }
            title={
              filter === "done"
                ? "Nothing completed yet"
                : "You're all caught up"
            }
            hint="Assignments, lab records, DSA problems, revision — put them all here."
          />

        )}

      </Card>

      {/* =================================================
          TASK MODAL
      ================================================= */}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setDraft(null);
        }}
        title={
          draft?.id
            ? "Edit task"
            : "New task"
        }
        footer={
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={!draft?.title?.trim()}
          >
            Save task
          </button>
        }
      >

        {draft && (

          <div className="space-y-3">

            {/* TASK NAME */}

            <Field label="Task">

              <input
                className="input"
                autoFocus
                placeholder="e.g. Complete Java assignment"
                value={draft.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    title: e.target.value,
                  })
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  submit()
                }
              />

            </Field>

            {/* PRIORITY */}

            <div>

              <span className="label">
                Priority
              </span>

              <Segmented
                value={draft.priority}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    priority: v,
                  })
                }
                options={Object.entries(
                  PRIORITIES
                ).map(([id, m]) => ({
                  value: id,
                  label: m.label,
                  emoji: m.dot,
                }))}
              />

            </div>

            {/* DUE + SUBJECT */}

            <div className="grid grid-cols-2 gap-3">

              {/* DUE */}

              <Field label="Due">

                <input
                  type="date"
                  className="input"
                  value={draft.due || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      due: e.target.value,
                    })
                  }
                />

              </Field>

              {/* SUBJECT FROM COURSE */}

              <Field label="Subject">

                <select
                  className="select"
                  value={draft.subject || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      subject: e.target.value,
                    })
                  }
                >

                  <option value="">
                    — Select subject —
                  </option>

                  {subjects.map(
                    (subject) => (
                      <option
                        key={subject}
                        value={subject}
                      >
                        {subject}
                      </option>
                    )
                  )}

                </select>

                {/* NO SUBJECT MESSAGE */}

                {subjects.length === 0 && (
                  <p className="mt-1 text-[11px] text-muted">
                    No subjects found in Course.
                    Add subjects there first.
                  </p>
                )}

              </Field>

            </div>

            {/* CATEGORY */}

            <div>

              <span className="label">
                Category
              </span>

              <div className="flex flex-wrap gap-1.5">

                {[
                  "academics",
                  "career",
                  "fitness",
                  "hobby",
                  "custom",
                ].map((id) => (

                  <button
                    key={id}
                    type="button"
                    className="chip"
                    data-on={String(
                      draft.category === id
                    )}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        category: id,
                      })
                    }
                  >

                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        background:
                          catColor(id),
                      }}
                    />

                    {
                      CATEGORIES[id].label
                    }

                  </button>

                ))}

              </div>

            </div>

          </div>

        )}

      </Modal>

    </div>
  );
}