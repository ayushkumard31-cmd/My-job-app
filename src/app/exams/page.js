"use client";

import { useMemo, useState } from "react";
import { Card, Empty, Field, Modal, PageHeader, Pill, ProgressBar, SectionHeader, Segmented } from "@/components/ui";
import { Plus, Trash2, CheckCircle2, Undo2 } from "lucide-react";
import { DEADLINE_TYPES, PROJECT_STAGES, deadlineType } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { countdownLabel, dateKey, daysUntil, shortDate } from "@/lib/time";

const urgency = (days) => (days <= 2 ? "#ef4444" : days <= 7 ? "#f59e0b" : "#22c55e");

export default function Deadlines() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const items = useMemo(() => {
    const list = state.deadlines
      .filter((d) => (filter === "done" ? d.done : !d.done))
      .filter((d) => filter === "all" || filter === "done" || d.type === filter);
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [state.deadlines, filter]);

  const nearest = state.deadlines
    .filter((d) => !d.done && daysUntil(d.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const submit = () => {
    if (!draft?.title.trim() || !draft.date) return;
    if (draft.id) dispatch({ type: "deadline.update", payload: { id: draft.id, patch: draft } });
    else dispatch({ type: "deadline.add", payload: { ...draft, title: draft.title.trim() } });
    setOpen(false);
    setDraft(null);
  };

  const toggleStage = (item, stage) => {
    const stages = { ...(item.stages || {}) };
    if (stages[stage]) delete stages[stage];
    else stages[stage] = true;
    dispatch({ type: "deadline.update", payload: { id: item.id, patch: { stages } } });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exams & Deadlines"
        emoji="⏳"
        subtitle="Exams, assignments, lab records, projects — one countdown."
        action={
          <button
            className="btn btn-primary"
            onClick={() => {
              setDraft({ title: "", type: "exam", date: dateKey(), subject: "", stages: {} });
              setOpen(true);
            }}
          >
            <Plus size={16} /> Add deadline
          </button>
        }
      />

      {nearest && (
        <Card
          className="flex items-center gap-4"
          style={{ borderColor: urgency(daysUntil(nearest.date)) }}
        >
          <div className="text-4xl">{deadlineType(nearest.type).emoji}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Next up</p>
            <p className="truncate text-lg font-bold">{nearest.title}</p>
            <p className="text-xs text-muted">
              {deadlineType(nearest.type).label} · {shortDate(nearest.date)}
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-3xl font-black leading-none"
              style={{ color: urgency(daysUntil(nearest.date)) }}
            >
              {Math.max(0, daysUntil(nearest.date))}
            </div>
            <div className="text-[11px] text-muted">days left</div>
          </div>
        </Card>
      )}

      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", emoji: "📌" },
          ...DEADLINE_TYPES.map((t) => ({ value: t.id, label: t.label, emoji: t.emoji })),
          { value: "done", label: "Completed", emoji: "✅" },
        ]}
      />

      <div className="space-y-2">
        {items.length ? (
          items.map((d) => {
            const type = deadlineType(d.type);
            const days = daysUntil(d.date);
            const isProject = d.type === "project";
            const doneStages = PROJECT_STAGES.filter((s) => d.stages?.[s]).length;
            return (
              <Card key={d.id} className="group space-y-2 transition hover:border-accent/30">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{type.emoji}</span>
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setDraft({ ...d });
                      setOpen(true);
                    }}
                  >
                    <p className={`font-medium ${d.done ? "text-muted line-through" : ""}`}>{d.title}</p>
                    <p className="text-xs text-muted">
                      {type.label}
                      {d.subject ? ` · ${d.subject}` : ""} · {shortDate(d.date)}
                    </p>
                  </button>
                  {!d.done && <Pill color={urgency(days)}>{countdownLabel(d.date)}</Pill>}
                  <button
                    className="btn btn-ghost btn-sm px-2 text-muted hover:text-ink transition-colors"
                    onClick={() => dispatch({ type: "deadline.toggle", payload: { id: d.id } })}
                    aria-label="Toggle complete"
                  >
                    {d.done ? <Undo2 size={16} /> : <CheckCircle2 size={16} />}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm px-2 text-muted opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    onClick={() => dispatch({ type: "deadline.delete", payload: { id: d.id } })}
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {isProject && (
                  <div>
                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                      {PROJECT_STAGES.map((s) => (
                        <button
                          key={s}
                          className="chip"
                          data-on={String(!!d.stages?.[s])}
                          onClick={() => toggleStage(d, s)}
                        >
                          {d.stages?.[s] ? "✓" : "○"} {s}
                        </button>
                      ))}
                    </div>
                    <ProgressBar value={(doneStages / PROJECT_STAGES.length) * 100} />
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <Card>
            <Empty
              emoji="🗓️"
              title="Nothing here yet"
              hint="Add your next exam, assignment or project submission to start the countdown."
            />
          </Card>
        )}
      </div>

      <Card>
        <SectionHeader title="Tip" />
        <p className="text-sm text-muted">
          Switch My Day to <strong>Exam Mode</strong> in the week before a paper — study and revision
          expand, hobbies shrink but never vanish.
        </p>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={draft?.id ? "Edit deadline" : "New deadline"}
        footer={
          <button className="btn btn-primary" onClick={submit} disabled={!draft?.title?.trim()}>
            Save
          </button>
        }
      >
        {draft && (
          <div className="space-y-3">
            <Field label="Title">
              <input
                className="input"
                autoFocus
                placeholder="e.g. Mathematics Unit Test"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>
            <div>
              <span className="label">Type</span>
              <Segmented
                value={draft.type}
                onChange={(v) => setDraft({ ...draft, type: v })}
                options={DEADLINE_TYPES.map((t) => ({ value: t.id, label: t.label, emoji: t.emoji }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  type="date"
                  className="input"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </Field>
              <Field label="Subject (optional)">
                <select
                  className="select"
                  value={draft.subject || ""}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                >
                  <option value="">—</option>
                  {(state.profile.subjects || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
