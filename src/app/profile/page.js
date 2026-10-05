"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AccountCard from "@/components/AccountCard";
import { Card, Field, PageHeader, SectionHeader, Segmented } from "@/components/ui";
import { X, Plus, Download, Upload, Trash2, RefreshCw } from "lucide-react";
import { CollegePicker } from "@/components/library";
import { ACCENTS, BRANCHES, CAREER_GOALS, HOBBIES, PRIORITIES, subjectsFor } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { WEEKDAYS } from "@/lib/time";

export default function Profile() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const p = state.profile;
  const [newSubject, setNewSubject] = useState("");
  const fileRef = useRef(null);

  const set = (patch) => dispatch({ type: "profile", payload: patch });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campus-compass-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        dispatch({ type: "hydrate", payload: JSON.parse(String(reader.result)) });
        alert("Backup restored.");
      } catch {
        alert("That file doesn't look like a Campus Compass backup.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Profile & Settings"
        emoji="⚙️"
        subtitle="Change anything here and your routine rebuilds around it."
      />

      <Card className="space-y-3">
        <SectionHeader title="You" />
        <Field label="Name">
          <input className="input" value={p.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <CollegePicker value={p} onChange={set} />
        <Field label="Branch">
          <select className="select" value={p.branch} onChange={(e) => set({ branch: e.target.value })}>
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.emoji} {b.label}
              </option>
            ))}
          </select>
        </Field>
        <div>
          <span className="label">Semester</span>
          <Segmented
            value={p.semester}
            onChange={(s) => set({ semester: s })}
            options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: `Sem ${n}` }))}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="label">Subjects</span>
            <button
              className="btn btn-sm"
              onClick={() => set({ subjects: subjectsFor(p.branch, p.semester) })}
            >
              Load defaults
            </button>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(p.subjects || []).map((s) => (
              <span key={s} className="chip" data-on="true">
                {s}
                <button
                  className="hover:text-rose-500 transition-colors"
                  onClick={() => set({ subjects: p.subjects.filter((x) => x !== s) })}
                  aria-label={`Remove ${s}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = newSubject.trim();
              if (!v) return;
              if (!p.subjects.includes(v)) set({ subjects: [...p.subjects, v] });
              setNewSubject("");
            }}
          >
            <input
              className="input"
              placeholder="Add subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              <Plus size={16} /> Add
            </button>
          </form>
        </div>
      </Card>

      <Card className="space-y-3">
        <SectionHeader title="Your day" />
        <div className="grid grid-cols-2 gap-3">
          {[
            ["wake", "Wake up"],
            ["sleep", "Sleep"],
            ["collegeStart", "College starts"],
            ["collegeEnd", "College ends"],
            ["lunch", "Lunch"],
            ["dinner", "Dinner"],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                type="time"
                className="input"
                value={p[key]}
                onChange={(e) => set({ [key]: e.target.value })}
              />
            </Field>
          ))}
        </div>
        <div>
          <span className="label">College days</span>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d, i) => (
              <button
                key={d}
                className="chip"
                data-on={String(p.collegeDays.includes(i))}
                onClick={() =>
                  set({
                    collegeDays: p.collegeDays.includes(i)
                      ? p.collegeDays.filter((x) => x !== i)
                      : [...p.collegeDays, i].sort(),
                  })
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <SectionHeader title="Goal & priorities" />
        <Field label="Career goal">
          <select
            className="select"
            value={p.careerGoal}
            onChange={(e) => set({ careerGoal: e.target.value })}
          >
            {CAREER_GOALS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.label}
              </option>
            ))}
          </select>
        </Field>
        <div>
          <span className="label">Timeline</span>
          <Segmented
            value={p.goalMonths}
            onChange={(v) => set({ goalMonths: v })}
            options={[3, 6, 8, 12, 18, 24].map((m) => ({ value: m, label: `${m} mo` }))}
          />
        </div>
        <div className="space-y-2">
          {[
            ["academics", "📚 College studies"],
            ["career", "💻 Career goal"],
            ["fitness", "🏋️ Fitness"],
            ["hobby", "🎮 Hobbies"],
          ].map(([key, label]) => (
            <div key={key} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">{label}</span>
              <Segmented
                value={p.priorities[key]}
                onChange={(v) => set({ priorities: { ...p.priorities, [key]: v } })}
                options={Object.entries(PRIORITIES).map(([id, m]) => ({
                  value: id,
                  label: m.label,
                  emoji: m.dot,
                }))}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <SectionHeader title="Hobbies" />
        <div className="flex flex-wrap gap-1.5">
          {HOBBIES.map((h) => {
            const on = p.hobbies.some((x) => x.id === h.id);
            return (
              <button
                key={h.id}
                className="chip"
                data-on={String(on)}
                onClick={() =>
                  set({
                    hobbies: on
                      ? p.hobbies.filter((x) => x.id !== h.id)
                      : [...p.hobbies, { id: h.id, daysPerWeek: h.days, minutes: h.minutes, priority: "medium" }],
                  })
                }
              >
                <span>{h.emoji}</span>
                {h.label}
              </button>
            );
          })}
        </div>
        {p.hobbies.map((h) => {
          const meta = HOBBIES.find((m) => m.id === h.id);
          if (!meta) return null;
          return (
            <div key={h.id} className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
              <span className="mr-auto text-sm">
                {meta.emoji} {meta.label}
              </span>
              <select
                className="select w-auto"
                value={h.daysPerWeek}
                onChange={(e) =>
                  set({
                    hobbies: p.hobbies.map((x) =>
                      x.id === h.id ? { ...x, daysPerWeek: Number(e.target.value) } : x,
                    ),
                  })
                }
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}/week
                  </option>
                ))}
              </select>
              <select
                className="select w-auto"
                value={h.minutes}
                onChange={(e) =>
                  set({
                    hobbies: p.hobbies.map((x) =>
                      x.id === h.id ? { ...x, minutes: Number(e.target.value) } : x,
                    ),
                  })
                }
              >
                {[20, 30, 45, 60, 75, 90, 120].map((n) => (
                  <option key={n} value={n}>
                    {n} min
                  </option>
                ))}
              </select>
              <select
                className="select w-auto"
                value={h.priority}
                onChange={(e) =>
                  set({
                    hobbies: p.hobbies.map((x) =>
                      x.id === h.id ? { ...x, priority: e.target.value } : x,
                    ),
                  })
                }
              >
                {Object.entries(PRIORITIES).map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </Card>

      <Card className="space-y-3">
        <SectionHeader title="Appearance" />
        <div>
          <span className="label">Theme</span>
          <Segmented
            value={state.ui.theme}
            onChange={(v) => dispatch({ type: "ui", payload: { theme: v } })}
            options={[
              { value: "system", label: "System", emoji: "🖥️" },
              { value: "light", label: "Light", emoji: "☀️" },
              { value: "dark", label: "Dark", emoji: "🌙" },
            ]}
          />
        </div>
        <div>
          <span className="label">Accent colour</span>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => dispatch({ type: "ui", payload: { accent: a.id } })}
                className="h-8 w-8 rounded-full border-2"
                style={{
                  background: a.value,
                  borderColor: state.ui.accent === a.id ? "var(--ink)" : "transparent",
                }}
                aria-label={a.label}
              />
            ))}
          </div>
        </div>
      </Card>

      <AccountCard />

      <Card className="space-y-3">
        <SectionHeader title="Data" />
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-sm"
            onClick={() => {
              Object.keys(state.plans).forEach((mode) =>
                dispatch({ type: "clearPlan", payload: { mode } }),
              );
            }}
          >
            <RefreshCw size={14} /> Rebuild all day templates
          </button>
          <button className="btn btn-sm" onClick={exportData}>
            <Download size={14} /> Export backup
          </button>
          <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
          <button
            className="btn btn-sm hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-colors"
            onClick={() => {
              if (confirm("Erase everything and start over? This cannot be undone.")) {
                dispatch({ type: "reset" });
                router.replace("/");
              }
            }}
          >
            <Trash2 size={14} /> Reset everything
          </button>
        </div>
        <p className="text-xs text-muted">
          Without an account everything is stored in this browser only — export a backup before
          clearing site data or switching devices. Signed in, these actions sync too, so a reset
          clears your other devices as well.
        </p>
      </Card>
    </div>
  );
}
