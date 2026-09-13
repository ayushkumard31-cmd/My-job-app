"use client";

import { useMemo, useState } from "react";
import { Card, Empty, Field, Modal, Pill, Segmented } from "@/components/ui";
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

export default function Tasks() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState("urgent");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const subjects = state.profile.subjects || [];

  const blank = () => ({
    title: "",
    priority: "medium",
    due: dateKey(),
    category: "academics",
    subject: "",
  });

  const tasks = useMemo(() => {
    const open = state.tasks.filter((t) => !t.done);
    const byPriority = (a, b) =>
      PRIORITIES[a.priority].rank - PRIORITIES[b.priority].rank ||
      String(a.due || "9999").localeCompare(String(b.due || "9999"));
    switch (filter) {
      case "done":
        return state.tasks.filter((t) => t.done);
      case "today":
        return open.filter((t) => t.due && daysUntil(t.due) <= 0).sort(byPriority);
      case "week":
        return open.filter((t) => t.due && daysUntil(t.due) <= 7).sort(byPriority);
      case "all":
        return open.sort((a, b) => String(a.due || "9999").localeCompare(String(b.due || "9999")));
      default:
        return open.sort(byPriority);
    }
  }, [state.tasks, filter]);

  const counts = {
    open: state.tasks.filter((t) => !t.done).length,
    overdue: state.tasks.filter((t) => !t.done && t.due && daysUntil(t.due) < 0).length,
    today: state.tasks.filter((t) => !t.done && t.due && daysUntil(t.due) === 0).length,
  };

  const submit = () => {
    if (!draft?.title.trim()) return;
    if (draft.id) dispatch({ type: "task.update", payload: { id: draft.id, patch: draft } });
    else dispatch({ type: "task.add", payload: { ...draft, title: draft.title.trim() } });
    setOpen(false);
    setDraft(null);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted">
            {counts.open} open · {counts.today} due today
            {counts.overdue ? ` · ${counts.overdue} overdue` : ""}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setDraft(blank());
            setOpen(true);
          }}
        >
          + New task
        </button>
      </header>

      <Segmented value={filter} onChange={setFilter} options={FILTERS} />

      <Card className="p-0">
        {tasks.length ? (
          <div className="divide-y divide-line">
            {tasks.map((t) => {
              const overdue = !t.done && t.due && daysUntil(t.due) < 0;
              return (
                <div key={t.id} className="flex items-center gap-3 px-3 py-3">
                  <button
                    onClick={() => dispatch({ type: "task.toggle", payload: { id: t.id } })}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs"
                    style={{
                      borderColor: t.done ? "var(--line)" : PRIORITIES[t.priority].color,
                      background: t.done ? "var(--line)" : "transparent",
                    }}
                    aria-label={t.done ? "Mark as not done" : "Mark as done"}
                  >
                    {t.done ? "✓" : ""}
                  </button>

                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setDraft({ ...t });
                      setOpen(true);
                    }}
                  >
                    <p className={`truncate text-sm ${t.done ? "text-muted line-through" : ""}`}>
                      {t.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <Pill color={PRIORITIES[t.priority].color}>{PRIORITIES[t.priority].label}</Pill>
                      {t.subject ? (
                        <span className="text-[11px] text-muted">{t.subject}</span>
                      ) : (
                        <span className="text-[11px] text-muted">
                          {(CATEGORIES[t.category] || CATEGORIES.custom).label}
                        </span>
                      )}
                      {t.due && (
                        <span
                          className="text-[11px]"
                          style={{ color: overdue ? "#ef4444" : "var(--muted)" }}
                        >
                          · {countdownLabel(t.due)}
                        </span>
                      )}
                    </div>
                  </button>

                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ background: catColor(t.category) }}
                  />
                  <button
                    className="btn btn-ghost btn-sm text-muted"
                    onClick={() => dispatch({ type: "task.delete", payload: { id: t.id } })}
                    aria-label="Delete task"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            emoji={filter === "done" ? "🧹" : "🎉"}
            title={filter === "done" ? "Nothing completed yet" : "You're all caught up"}
            hint="Assignments, lab records, DSA problems, revision — put them all here."
          />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={draft?.id ? "Edit task" : "New task"}
        footer={
          <button className="btn btn-primary" onClick={submit} disabled={!draft?.title?.trim()}>
            Save task
          </button>
        }
      >
        {draft && (
          <div className="space-y-3">
            <Field label="Task">
              <input
                className="input"
                autoFocus
                placeholder="e.g. Complete Java assignment"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </Field>
            <div>
              <span className="label">Priority</span>
              <Segmented
                value={draft.priority}
                onChange={(v) => setDraft({ ...draft, priority: v })}
                options={Object.entries(PRIORITIES).map(([id, m]) => ({
                  value: id,
                  label: m.label,
                  emoji: m.dot,
                }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Due">
                <input
                  type="date"
                  className="input"
                  value={draft.due || ""}
                  onChange={(e) => setDraft({ ...draft, due: e.target.value })}
                />
              </Field>
              <Field label="Subject (optional)">
                <select
                  className="select"
                  value={draft.subject || ""}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                >
                  <option value="">—</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div>
              <span className="label">Category</span>
              <div className="flex flex-wrap gap-1.5">
                {["academics", "career", "fitness", "hobby", "custom"].map((id) => (
                  <button
                    key={id}
                    className="chip"
                    data-on={String(draft.category === id)}
                    onClick={() => setDraft({ ...draft, category: id })}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: catColor(id) }}
                    />
                    {CATEGORIES[id].label}
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
