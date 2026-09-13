"use client";

import { useState } from "react";
import { Card, Empty, ProgressBar, Ring, Segmented, Stat } from "@/components/ui";
import { attendanceAdvice, attendancePct, useApp } from "@/lib/store";

const tone = (pct, required) =>
  pct >= required ? "#22c55e" : pct >= required - 10 ? "#f59e0b" : "#ef4444";

export default function Attendance() {
  const { state, dispatch } = useApp();
  const [name, setName] = useState("");
  const required = state.profile.attendanceRequired ?? 75;

  const rows = state.attendance;
  const totals = rows.reduce(
    (a, r) => ({ attended: a.attended + r.attended, total: a.total + r.total }),
    { attended: 0, total: 0 },
  );
  const overall = totals.total ? Math.round((totals.attended / totals.total) * 100) : 0;
  const atRisk = rows.filter((r) => r.total && attendancePct(r) < required).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-muted">
          Mark each class as you go — the maths for &ldquo;can I skip tomorrow?&rdquo; is done for you.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <Ring value={overall} color={tone(overall, required)} sub="overall" />
          <div>
            <p className="text-sm font-semibold">
              {totals.attended}/{totals.total} classes
            </p>
            <p className="text-xs text-muted">Target {required}%</p>
          </div>
        </Card>
        <Stat label="Subjects tracked" value={rows.length} emoji="📚" />
        <Stat
          label="Below target"
          value={atRisk}
          sub={atRisk ? "Attend these next" : "All good 🎉"}
          emoji="⚠️"
        />
      </div>

      <Card>
        <span className="label">Required attendance</span>
        <Segmented
          value={required}
          onChange={(v) => dispatch({ type: "profile", payload: { attendanceRequired: v } })}
          options={[60, 65, 70, 75, 80, 85].map((n) => ({ value: n, label: `${n}%` }))}
        />
      </Card>

      <div className="space-y-2">
        {rows.length ? (
          rows.map((a) => {
            const pct = attendancePct(a) ?? 0;
            const advice = attendanceAdvice(a, required);
            const color = tone(pct, required);
            return (
              <Card key={a.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">{a.name}</span>
                  <span className="text-lg font-bold" style={{ color }}>
                    {a.total ? `${pct}%` : "—"}
                  </span>
                </div>
                <ProgressBar value={pct} color={color} />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">{advice.text}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      className="btn btn-sm"
                      onClick={() => dispatch({ type: "att.mark", payload: { id: a.id, present: true } })}
                    >
                      ✅ Present
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => dispatch({ type: "att.mark", payload: { id: a.id, present: false } })}
                    >
                      ❌ Absent
                    </button>
                    <button
                      className="btn btn-ghost btn-sm text-muted"
                      onClick={() => dispatch({ type: "att.delete", payload: { id: a.id } })}
                      aria-label={`Remove ${a.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-line pt-2 text-xs text-muted">
                  <label className="flex items-center gap-1">
                    Attended
                    <input
                      type="number"
                      min="0"
                      className="input w-20 py-1"
                      value={a.attended}
                      onChange={(e) =>
                        dispatch({
                          type: "att.update",
                          payload: { id: a.id, patch: { attended: Number(e.target.value) } },
                        })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    Total
                    <input
                      type="number"
                      min="0"
                      className="input w-20 py-1"
                      value={a.total}
                      onChange={(e) =>
                        dispatch({
                          type: "att.update",
                          payload: { id: a.id, patch: { total: Number(e.target.value) } },
                        })
                      }
                    />
                  </label>
                </div>
              </Card>
            );
          })
        ) : (
          <Card>
            <Empty emoji="📋" title="No subjects yet" hint="Add the subjects you want to track." />
          </Card>
        )}
      </div>

      <Card>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = name.trim();
            if (!v) return;
            dispatch({ type: "att.add", payload: { name: v } });
            setName("");
          }}
        >
          <input
            className="input"
            placeholder="Add a subject to track"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Add
          </button>
        </form>
      </Card>
    </div>
  );
}
