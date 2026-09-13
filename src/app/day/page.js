"use client";

import { useState } from "react";
import SortableList, { reorder } from "@/components/SortableList";
import { Card, Field, Modal, SectionHeader, Segmented } from "@/components/ui";
import { CATEGORIES, DAY_MODES, catColor, modeById } from "@/lib/catalog";
import { blocksFor, doneFor, modeFor, uid, useApp } from "@/lib/store";
import {
  addDays,
  dateKey,
  fmtDuration,
  fmtTime,
  longDate,
  parseKey,
  toHHMM,
  toMin,
} from "@/lib/time";

/** Re-lay-out a reordered day: keep the original start, durations and gaps. */
function repack(original, next) {
  const gaps = [];
  for (let i = 1; i < original.length; i++) {
    gaps.push(Math.max(0, original[i].start - original[i - 1].end));
  }
  let t = original[0]?.start ?? 7 * 60;
  return next.map((b, i) => {
    const dur = b.end - b.start;
    const block = { ...b, start: t, end: t + dur };
    t = block.end + (gaps[i] ?? 0);
    return block;
  });
}

const EMOJIS = ["📚", "💻", "🧩", "🏋️", "🎮", "🎸", "🍽️", "☕", "🎓", "🔬", "✍️", "🧘", "⚽", "📖", "🛠️", "🌙"];

export default function MyDay() {
  const { state, dispatch } = useApp();
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState(null);

  const date = dateKey(addDays(new Date(), offset));
  const mode = modeFor(state, date);
  const modeMeta = modeById(mode);
  const blocks = blocksFor(state, date);
  const done = new Set(doneFor(state, date));
  const isCustom = !!state.plans[mode]?.length;

  const save = (next) =>
    dispatch({
      type: "savePlan",
      payload: { mode, blocks: next.sort((a, b) => a.start - b.start) },
    });

  const onReorder = (from, to) => save(repack(blocks, reorder(blocks, from, to)));

  const upsert = (block) => {
    const exists = blocks.some((b) => b.id === block.id);
    save(exists ? blocks.map((b) => (b.id === block.id ? block : b)) : [...blocks, block]);
    setEditing(null);
  };

  const remove = (id) => {
    save(blocks.filter((b) => b.id !== id));
    setEditing(null);
  };

  const totalPlanned = blocks.reduce((a, b) => a + (b.end - b.start), 0);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">My Day</h1>
          <p className="text-sm text-muted">{longDate(parseKey(date))}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn btn-sm" onClick={() => setOffset((o) => o - 1)}>
            ←
          </button>
          <button className="btn btn-sm" onClick={() => setOffset(0)} disabled={offset === 0}>
            Today
          </button>
          <button className="btn btn-sm" onClick={() => setOffset((o) => o + 1)}>
            →
          </button>
        </div>
      </header>

      <Card>
        <SectionHeader title="Day mode" />
        <Segmented
          value={mode}
          onChange={(m) => dispatch({ type: "mode", payload: { date, mode: m } })}
          options={DAY_MODES.map((m) => ({ value: m.id, label: m.label, emoji: m.emoji }))}
        />
        <p className="mt-2 text-xs text-muted">{modeMeta.note}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-xs text-muted">
            {blocks.length} blocks · {fmtDuration(totalPlanned)} planned ·{" "}
            {isCustom ? "custom layout" : "auto-generated"}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              className="btn btn-sm"
              onClick={() =>
                setEditing({
                  id: `new-${uid("b")}`,
                  uid: uid("b"),
                  label: "",
                  emoji: "✨",
                  start: 18 * 60,
                  end: 19 * 60,
                  category: "custom",
                  fixed: false,
                  source: "custom",
                  isNew: true,
                })
              }
            >
              + Add block
            </button>
            <button
              className="btn btn-sm"
              onClick={() => dispatch({ type: "clearPlan", payload: { mode } })}
              disabled={!isCustom}
              title="Rebuild this day from your goals and hobbies"
            >
              ↻ Regenerate
            </button>
          </div>
        </div>
      </Card>

      <p className="text-xs text-muted">
        Drag the ⠿ handle to move an activity. Changes are saved to your{" "}
        <strong>{modeMeta.label}</strong> template, so every {modeMeta.label.toLowerCase()} uses it.
      </p>

      <SortableList
        items={blocks}
        getKey={(b) => b.id}
        onReorder={onReorder}
        renderItem={(b, i, { dragging, handleProps }) => (
          <div
            className="card flex items-center gap-2 p-2.5"
            style={dragging ? { borderColor: "var(--accent)" } : undefined}
          >
            <button
              {...handleProps}
              className="px-1 text-lg text-muted"
              aria-label={`Move ${b.label}`}
            >
              ⠿
            </button>
            <span className="w-[62px] shrink-0 font-mono text-xs text-muted">{fmtTime(b.start)}</span>
            <span
              className="h-8 w-1 shrink-0 rounded-full"
              style={{ background: catColor(b.category) }}
            />
            <button className="min-w-0 flex-1 text-left" onClick={() => setEditing({ ...b })}>
              <span className={`block truncate text-sm ${done.has(b.id) ? "text-muted line-through" : ""}`}>
                {b.emoji} {b.label}
              </span>
              <span className="text-[11px] text-muted">
                {b.end > b.start
                  ? `${fmtTime(b.start)} – ${fmtTime(b.end)} · ${fmtDuration(b.end - b.start)}`
                  : "End of day"}
              </span>
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => dispatch({ type: "toggleDone", payload: { date, id: b.id } })}
              aria-label="Toggle done"
            >
              {done.has(b.id) ? "✅" : "○"}
            </button>
          </div>
        )}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.isNew ? "Add activity" : "Edit activity"}
        footer={
          <>
            {!editing?.isNew && (
              <button className="btn" onClick={() => remove(editing.id)}>
                Delete
              </button>
            )}
            <button
              className="btn btn-primary"
              disabled={!editing?.label?.trim()}
              onClick={() => {
                const { isNew, ...rest } = editing;
                upsert({ ...rest, label: rest.label.trim() });
              }}
            >
              Save
            </button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <Field label="What is it?">
              <input
                className="input"
                autoFocus
                placeholder="e.g. DSA Practice"
                value={editing.label}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              />
            </Field>
            <div>
              <span className="label">Icon</span>
              <div className="flex flex-wrap gap-1">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    className="chip"
                    data-on={String(editing.emoji === e)}
                    onClick={() => setEditing({ ...editing, emoji: e })}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts">
                <input
                  type="time"
                  className="input"
                  value={toHHMM(editing.start)}
                  onChange={(e) => {
                    const s = toMin(e.target.value);
                    const dur = Math.max(5, editing.end - editing.start);
                    setEditing({ ...editing, start: s, end: s + dur });
                  }}
                />
              </Field>
              <Field label="Duration">
                <select
                  className="select"
                  value={editing.end - editing.start}
                  onChange={(e) =>
                    setEditing({ ...editing, end: editing.start + Number(e.target.value) })
                  }
                >
                  {[15, 20, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300, 420].map((n) => (
                    <option key={n} value={n}>
                      {fmtDuration(n)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div>
              <span className="label">Category</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CATEGORIES).map(([id, c]) => (
                  <button
                    key={id}
                    className="chip"
                    data-on={String(editing.category === id)}
                    onClick={() => setEditing({ ...editing, category: id })}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: c.color }}
                    />
                    {c.label}
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
