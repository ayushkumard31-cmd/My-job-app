"use client";

import { useMemo, useState } from "react";
import { Card, Empty, Field, Modal, ProgressBar, SectionHeader, Segmented } from "@/components/ui";
import { goalById } from "@/lib/catalog";
import { buildRoadmap, currentStage } from "@/lib/generator";
import { goalProgress, useApp } from "@/lib/store";
import { WEEKDAYS, dateKey, weekKeys } from "@/lib/time";

export default function Goals() {
  const { state, dispatch } = useApp();
  const today = dateKey();
  const profile = state.profile;
  const goal = goalById(profile.careerGoal);

  const roadmap = useMemo(
    () => buildRoadmap(profile.careerGoal, profile.goalMonths, profile.goalStartedAt),
    [profile.careerGoal, profile.goalMonths, profile.goalStartedAt],
  );
  const stageNow = currentStage(roadmap, profile.goalStartedAt);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const totalItems = roadmap.reduce((a, s) => a + s.items.length, 0);
  const doneItems = roadmap.reduce(
    (a, s) => a + s.items.filter((_, i) => state.roadmap[`${s.id}:${i}`]).length,
    0,
  );

  const submit = () => {
    if (!draft?.label.trim()) return;
    if (draft.id) dispatch({ type: "goal.update", payload: { id: draft.id, patch: draft } });
    else dispatch({ type: "goal.add", payload: { ...draft, label: draft.label.trim() } });
    setOpen(false);
    setDraft(null);
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-sm text-muted">
          The long-term plan, broken into months — and the small things you do every day.
        </p>
      </header>

      {/* career goal */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="text-3xl">{goal.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Main goal · {profile.goalMonths} months</p>
            <h2 className="text-lg font-bold">{goal.label}</h2>
            <p className="text-sm text-muted">{goal.tagline}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>Roadmap progress</span>
            <span>
              {doneItems}/{totalItems} milestones
            </span>
          </div>
          <ProgressBar value={totalItems ? (doneItems / totalItems) * 100 : 0} />
        </div>
      </Card>

      <section>
        <SectionHeader title="Your roadmap" />
        <div className="space-y-2">
          {roadmap.map((stage) => {
            const isNow = stage.id === stageNow?.id;
            const done = stage.items.filter((_, i) => state.roadmap[`${stage.id}:${i}`]).length;
            return (
              <Card
                key={stage.id}
                style={isNow ? { borderColor: "var(--accent)", background: "var(--accent-soft)" } : undefined}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: done === stage.items.length ? "#22c55e" : "var(--line)",
                      color: done === stage.items.length ? "#fff" : "var(--muted)",
                    }}
                  >
                    {done === stage.items.length ? "✓" : stage.index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{stage.title}</p>
                    <p className="text-[11px] text-muted">
                      {stage.label}
                      {isNow ? " · you are here" : ""}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 pl-9">
                  {stage.items.map((item, i) => {
                    const key = `${stage.id}:${i}`;
                    const checked = !!state.roadmap[key];
                    return (
                      <button
                        key={key}
                        onClick={() => dispatch({ type: "roadmap.toggle", payload: { key } })}
                        className="flex w-full items-center gap-2 text-left text-sm"
                      >
                        <span
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]"
                          style={{
                            borderColor: checked ? "#22c55e" : "var(--line)",
                            background: checked ? "#22c55e" : "transparent",
                            color: "#fff",
                          }}
                        >
                          {checked ? "✓" : ""}
                        </span>
                        <span className={checked ? "text-muted line-through" : ""}>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* daily & weekly goals */}
      <section>
        <SectionHeader
          title="Daily & weekly goals"
          action={
            <button
              className="btn btn-sm"
              onClick={() => {
                setDraft({ label: "", emoji: "🎯", type: "daily", target: 1, unit: "times" });
                setOpen(true);
              }}
            >
              + Add
            </button>
          }
        />
        <div className="space-y-2">
          {state.goals.length ? (
            state.goals.map((g) => {
              const p = goalProgress(g, today);
              const keys = weekKeys();
              return (
                <Card key={g.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{g.emoji}</span>
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        setDraft({ ...g });
                        setOpen(true);
                      }}
                    >
                      <p className="truncate text-sm font-medium">{g.label}</p>
                      <p className="text-[11px] text-muted">
                        {g.type === "daily" ? "Every day" : "Every week"} · {p.value}/{p.target} {g.unit}
                      </p>
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => dispatch({ type: "goal.log", payload: { id: g.id, date: today, delta: -1 } })}
                    >
                      −
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => dispatch({ type: "goal.log", payload: { id: g.id, date: today, delta: 1 } })}
                    >
                      +1
                    </button>
                    <button
                      className="btn btn-ghost btn-sm text-muted"
                      onClick={() => dispatch({ type: "goal.delete", payload: { id: g.id } })}
                      aria-label="Delete goal"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={p.pct} />
                  </div>
                  <div className="mt-2 flex gap-1">
                    {keys.map((k, i) => {
                      const hit = (g.log[k] || 0) > 0;
                      return (
                        <div key={k} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="h-6 w-full rounded"
                            style={{
                              background: hit ? "var(--accent)" : "var(--line)",
                              opacity: k === today ? 1 : hit ? 0.85 : 0.6,
                              outline: k === today ? "2px solid var(--accent)" : "none",
                              outlineOffset: 1,
                            }}
                            title={`${k}: ${g.log[k] || 0}`}
                          />
                          <span className="text-[9px] text-muted">{WEEKDAYS[(i + 1) % 7]}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })
          ) : (
            <Card>
              <Empty
                emoji="🎯"
                title="No daily goals yet"
                hint="e.g. Solve 3 DSA problems, Gym 4 days a week, Read 30 minutes."
              />
            </Card>
          )}
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={draft?.id ? "Edit goal" : "New goal"}
        footer={
          <button className="btn btn-primary" onClick={submit} disabled={!draft?.label?.trim()}>
            Save
          </button>
        }
      >
        {draft && (
          <div className="space-y-3">
            <Field label="Goal">
              <input
                className="input"
                autoFocus
                placeholder="e.g. Solve 3 DSA problems"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </Field>
            <div>
              <span className="label">Icon</span>
              <div className="flex flex-wrap gap-1">
                {["🎯", "💻", "🧩", "📚", "🏋️", "🎸", "📖", "🏃", "♟️", "✍️", "🎨", "🧘"].map((e) => (
                  <button
                    key={e}
                    className="chip"
                    data-on={String(draft.emoji === e)}
                    onClick={() => setDraft({ ...draft, emoji: e })}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Repeats</span>
              <Segmented
                value={draft.type}
                onChange={(v) => setDraft({ ...draft, type: v })}
                options={[
                  { value: "daily", label: "Daily", emoji: "📅" },
                  { value: "weekly", label: "Weekly", emoji: "🗓️" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target">
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={draft.target}
                  onChange={(e) => setDraft({ ...draft, target: Math.max(1, Number(e.target.value) || 1) })}
                />
              </Field>
              <Field label="Unit">
                <select
                  className="select"
                  value={draft.unit}
                  onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                >
                  {["times", "days", "problems", "pages", "minutes", "sessions"].map((u) => (
                    <option key={u} value={u}>
                      {u}
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
