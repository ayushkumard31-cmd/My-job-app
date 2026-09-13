"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Field, Ring, SectionHeader, Segmented, Stat } from "@/components/ui";
import { blocksFor, focusMinutes, useApp, weekStats } from "@/lib/store";
import { dateKey, fmtDuration } from "@/lib/time";

const PHASES = {
  focus: { label: "Focus", emoji: "🎯", color: "var(--accent)" },
  short: { label: "Short break", emoji: "☕", color: "#22c55e" },
  long: { label: "Long break", emoji: "🌿", color: "#0ea5e9" },
};

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.65);
    setTimeout(() => ctx.close(), 900);
  } catch {
    /* audio blocked — silent is fine */
  }
}

export default function Focus() {
  const { state, dispatch } = useApp();
  const settings = state.focus.settings;
  const today = dateKey();

  const [phase, setPhase] = useState("focus");
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(settings.focus * 60);
  const [round, setRound] = useState(0);
  const [label, setLabel] = useState("");
  const tick = useRef(null);
  const leftRef = useRef(left);
  const completeRef = useRef(null);

  const duration = settings[phase] * 60;

  const suggestions = useMemo(() => {
    const blocks = blocksFor(state, today)
      .filter((b) => ["academics", "career", "custom"].includes(b.category))
      .map((b) => `${b.emoji} ${b.label}`);
    const tasks = state.tasks.filter((t) => !t.done).slice(0, 5).map((t) => t.title);
    return [...new Set([...blocks, ...tasks])].slice(0, 8);
  }, [state, today]);

  const reset = useCallback(
    (next = phase) => {
      setRunning(false);
      setPhase(next);
      setLeft(settings[next] * 60);
    },
    [phase, settings],
  );

  const complete = useCallback(() => {
    beep();
    setRunning(false);
    if (phase === "focus") {
      dispatch({
        type: "focus.log",
        payload: { minutes: settings.focus, label: label || "Focus session", date: today },
      });
      const nextRound = round + 1;
      setRound(nextRound);
      const next = nextRound % 4 === 0 ? "long" : "short";
      setPhase(next);
      setLeft(settings[next] * 60);
    } else {
      setPhase("focus");
      setLeft(settings.focus * 60);
    }
  }, [phase, round, settings, dispatch, label, today]);

  // Keep the ticking logic in the interval callback (rather than reacting to
  // `left` hitting zero in an effect) so the phase change happens exactly once.
  useEffect(() => {
    leftRef.current = left;
  }, [left]);
  useEffect(() => {
    completeRef.current = complete;
  }, [complete]);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      const next = leftRef.current - 1;
      if (next <= 0) {
        setLeft(0);
        leftRef.current = 0;
        completeRef.current();
      } else {
        setLeft(next);
        leftRef.current = next;
      }
    }, 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  useEffect(() => {
    if (!running) {
      document.title = "Campus Compass — Student Life Planner";
      return;
    }
    const m = String(Math.floor(left / 60)).padStart(2, "0");
    const s = String(left % 60).padStart(2, "0");
    document.title = `${m}:${s} · ${PHASES[phase].label}`;
    return () => {
      document.title = "Campus Compass — Student Life Planner";
    };
  }, [left, running, phase]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pct = duration ? ((duration - left) / duration) * 100 : 0;

  const todaySessions = state.focus.sessions.filter((s) => s.date === today);
  const week = weekStats(state);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Focus timer</h1>
        <p className="text-sm text-muted">
          {settings.focus} minutes of work, {settings.short} minutes off. Four rounds earn a long break.
        </p>
      </header>

      <Card className="flex flex-col items-center gap-4 py-8">
        <Segmented
          value={phase}
          onChange={(p) => reset(p)}
          options={Object.entries(PHASES).map(([id, m]) => ({
            value: id,
            label: m.label,
            emoji: m.emoji,
          }))}
        />

        <Ring
          value={pct}
          size={220}
          stroke={14}
          color={PHASES[phase].color}
          label={`${mm}:${ss}`}
          sub={`Round ${round + 1} · ${PHASES[phase].label}`}
        />

        <div className="flex gap-2">
          <button className="btn btn-primary px-6" onClick={() => setRunning((r) => !r)}>
            {running ? "⏸ Pause" : left === duration ? "▶ Start" : "▶ Resume"}
          </button>
          <button className="btn" onClick={() => reset(phase)}>
            ↺ Reset
          </button>
          <button className="btn" onClick={complete} title="Skip to the next phase">
            ⏭ Skip
          </button>
        </div>

        <div className="w-full max-w-sm">
          <Field label="What are you working on?">
            <input
              className="input"
              placeholder="e.g. DSA — trees"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} className="chip" data-on={String(label === s)} onClick={() => setLabel(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-[11px] text-muted">Keep this tab open — the timer pauses if you close it.</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Focused today" value={fmtDuration(focusMinutes(state, today))} emoji="⏱️" />
        <Stat label="Sessions today" value={todaySessions.length} emoji="🔁" />
        <Stat label="This week" value={fmtDuration(week.focusMins)} emoji="📈" />
      </div>

      <Card>
        <SectionHeader title="Timer settings" />
        <div className="grid grid-cols-3 gap-3">
          {[
            ["focus", "Focus"],
            ["short", "Short break"],
            ["long", "Long break"],
          ].map(([key, lbl]) => (
            <Field key={key} label={lbl}>
              <input
                type="number"
                min="1"
                max="120"
                className="input"
                value={settings[key]}
                onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value) || 1);
                  dispatch({ type: "focus.settings", payload: { [key]: v } });
                  if (key === phase && !running) setLeft(v * 60);
                }}
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Today's sessions" />
        {todaySessions.length ? (
          <ul className="divide-y divide-line text-sm">
            {todaySessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span className="min-w-0 truncate">{s.label}</span>
                <span className="shrink-0 text-xs text-muted">{fmtDuration(s.minutes)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-sm text-muted">
            No sessions yet today. Start one — even 25 minutes counts.
          </p>
        )}
      </Card>
    </div>
  );
}
