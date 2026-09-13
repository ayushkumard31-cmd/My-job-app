"use client";

// Whole-app state in one reducer, persisted to localStorage. localStorage is
// still the source of truth: signing in (see ./auth) only adds a Firestore
// mirror on top, so the app works exactly the same with no account.

import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { dateKey, weekKeys } from "./time";
import { defaultMode, generateDay } from "./generator";
import { goalById, hobbyById } from "./catalog";
import { useCloudSync } from "./cloud";

const KEY = "student-planner-state-v1";

export function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const initialState = {
  v: 1,
  hydrated: false, // flipped once localStorage has been read, so SSR and the
  onboarded: true, // setup is optional; new accounts open directly on the dashboard
  onboardingSeen: true,
  updatedAt: 0,     // stamped on every edit; cloud sync uses it to pick a winner
  profile: {
    name: "",
    // Which university's paperwork to show on College Docs. `college` is an id
    // from ./colleges; `collegeName` is what to display, and is the only field
    // set when someone types a college that isn't in the list.
    university: "makaut",
    college: "",
    collegeName: "",
    branch: "cse",
    semester: 3,
    subjects: [],
    wake: "07:00",
    sleep: "23:30",
    collegeStart: "09:00",
    collegeEnd: "16:00",
    collegeDays: [1, 2, 3, 4, 5],
    lunch: "13:00",
    dinner: "20:00",
    careerGoal: "software",
    goalMonths: 8,
    goalStartedAt: null,
    hobbies: [],
    customActivities: [],
    priorities: { academics: "high", career: "high", fitness: "medium", hobby: "low" },
  },
  plans: {},        // mode -> template blocks (null/absent = auto-generated)
  dayMode: {},      // dateKey -> mode id
  done: {},         // dateKey -> [blockId]
  tasks: [],
  attendance: [],
  deadlines: [],
  goals: [],
  xp: 0,
  expenses: [],
  english: {
    xp: 0,
    skills: {
      reading: { target: 20, unit: "minutes", log: {} },
      listening: { target: 20, unit: "minutes", log: {} },
      writing: { target: 1, unit: "piece", log: {} },
      speaking: { target: 15, unit: "minutes", log: {} },
    },
  },
  roadmap: {},      // stage/item key -> true
  focus: { settings: { focus: 25, short: 5, long: 15 }, sessions: [] },
  // The student's own college documents (timetable, hall ticketâ€¦). Only the
  // metadata lives here; the PDF itself sits in Firebase Storage, or is a link.
  docs: [],
  // Reactions to shared library content. Just id lists, so they ride along on
  // the existing planner sync and keep working while signed out.
  library: { likes: [], saves: [], watched: [] },
  // Dark by default; the header toggle still cycles system â†’ light â†’ dark, and a
  // saved choice always wins over this (see the `hydrate` merge).
  ui: { theme: "dark", accent: "indigo" },
};

function toggleId(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function withoutIds(blocks) {
  return blocks.map((b) => ({
    uid: b.uid || uid("b"),
    label: b.label,
    emoji: b.emoji,
    start: b.start,
    end: b.end,
    category: b.category,
    fixed: !!b.fixed,
    source: b.source || "custom",
    priority: b.priority || null,
  }));
}

function baseReducer(state, action) {
  const p = action.payload;
  switch (action.type) {
    // Loading a whole state from somewhere else: localStorage, a JSON backup, or
    // Firestore. Rebuilt on top of the defaults so an older or partial payload
    // can't leave a slice missing.
    case "hydrate":
      return {
        ...initialState,
        ...p,
        hydrated: true,
        updatedAt: p.updatedAt || 0,
        xp: p.xp || 0,
        profile: { ...initialState.profile, ...(p.profile || {}) },
        focus: { ...initialState.focus, ...(p.focus || {}) },
        expenses: p.expenses || [],
        english: {
          ...initialState.english,
          ...(p.english || {}),
          skills: { ...initialState.english.skills, ...(p.english?.skills || {}) },
        },
        library: { ...initialState.library, ...(p.library || {}) },
        docs: p.docs || [],
        ui: { ...initialState.ui, ...(p.ui || state.ui) },
      };

    case "reset":
      return { ...initialState, hydrated: true, ui: state.ui };

    case "onboard":
      return {
        ...state,
        onboarded: true,
        onboardingSeen: true,
        profile: { ...state.profile, ...p, goalStartedAt: p.goalStartedAt || new Date().toISOString() },
      };

    case "profile":
      return { ...state, profile: { ...state.profile, ...p }, plans: p.resetPlans ? {} : state.plans };

    case "mode":
      return { ...state, dayMode: { ...state.dayMode, [p.date]: p.mode } };

    case "toggleDone": {
      const list = state.done[p.date] || [];
      const next = list.includes(p.id) ? list.filter((x) => x !== p.id) : [...list, p.id];
      return { ...state, done: { ...state.done, [p.date]: next } };
    }

    case "savePlan":
      return { ...state, plans: { ...state.plans, [p.mode]: withoutIds(p.blocks) } };

    case "clearPlan": {
      const plans = { ...state.plans };
      delete plans[p.mode];
      return { ...state, plans };
    }

    // ------------------------------------------------------------- tasks --
    case "task.add":
      return {
        ...state,
        tasks: [
          { id: uid("t"), done: false, createdAt: new Date().toISOString(), priority: "medium", ...p },
          ...state.tasks,
        ],
      };
    case "task.toggle":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === p.id
            ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : null }
            : t,
        ),
      };
    case "task.update":
      return { ...state, tasks: state.tasks.map((t) => (t.id === p.id ? { ...t, ...p.patch } : t)) };
    case "task.delete":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== p.id) };

    // -------------------------------------------------------- attendance --
    case "att.add":
      return {
        ...state,
        attendance: [...state.attendance, { id: uid("a"), attended: 0, total: 0, ...p }],
      };
    case "att.update":
      return {
        ...state,
        attendance: state.attendance.map((a) =>
          a.id === p.id
            ? {
                ...a,
                ...p.patch,
                attended: Math.max(0, p.patch.attended ?? a.attended),
                total: Math.max(0, p.patch.total ?? a.total),
              }
            : a,
        ),
      };
    case "att.mark":
      return {
        ...state,
        attendance: state.attendance.map((a) =>
          a.id === p.id
            ? { ...a, attended: a.attended + (p.present ? 1 : 0), total: a.total + 1 }
            : a,
        ),
      };
    case "att.delete":
      return { ...state, attendance: state.attendance.filter((a) => a.id !== p.id) };

    // --------------------------------------------------------- deadlines --
    case "deadline.add":
      return { ...state, deadlines: [...state.deadlines, { id: uid("d"), done: false, ...p }] };
    case "deadline.toggle":
      return {
        ...state,
        deadlines: state.deadlines.map((d) => (d.id === p.id ? { ...d, done: !d.done } : d)),
      };
    case "deadline.update":
      return {
        ...state,
        deadlines: state.deadlines.map((d) => (d.id === p.id ? { ...d, ...p.patch } : d)),
      };
    case "deadline.delete":
      return { ...state, deadlines: state.deadlines.filter((d) => d.id !== p.id) };

    // ------------------------------------------------- goals / habits --
    case "goal.add":
      return {
        ...state,
        goals: [...state.goals, { id: uid("g"), type: "daily", target: 1, unit: "times", log: {}, ...p }],
      };
    case "goal.log": {
      return {
        ...state,
        xp: Math.max(0, state.goals.reduce((xp, g) => {
          if (g.id !== p.id) return xp;
          const cur = g.log[p.date] || 0;
          const next = Math.max(0, p.set != null ? p.set : cur + (p.delta || 0));
          const week = g.type === "weekly" ? weekKeys(new Date(`${p.date}T00:00:00`)) : [p.date];
          const before = week.reduce((sum, key) => sum + (g.log[key] || 0), 0);
          const after = before - cur + next;
          return xp + (before < g.target && after >= g.target ? 10 : before >= g.target && after < g.target ? -10 : 0);
        }, state.xp)),
        goals: state.goals.map((g) => {
          if (g.id !== p.id) return g;
          const cur = g.log[p.date] || 0;
          const next = Math.max(0, p.set != null ? p.set : cur + (p.delta || 0));
          return { ...g, log: { ...g.log, [p.date]: next } };
        }),
      };
    }
    case "goal.update":
      return { ...state, goals: state.goals.map((g) => (g.id === p.id ? { ...g, ...p.patch } : g)) };
    case "goal.delete":
      return { ...state, goals: state.goals.filter((g) => g.id !== p.id) };

    // -------------------------------------------------------- money / XP --
    case "expense.add":
      return { ...state, expenses: [{ id: uid("exp"), date: dateKey(), ...p }, ...state.expenses] };
    case "expense.delete":
      return { ...state, expenses: state.expenses.filter((e) => e.id !== p.id) };
    case "xp.add":
      return { ...state, xp: Math.max(0, (state.xp || 0) + (p.amount || 0)) };
    case "xp.deduct":
      return { ...state, xp: Math.max(0, (state.xp || 0) - (p.amount || 0)) };
    case "xp.set":
      return { ...state, xp: Math.max(0, p.amount || 0) };
    case "english.log": {
      const skill = state.english.skills[p.skill];
      if (!skill) return state;
      const cur = skill.log[p.date] || 0;
      const next = Math.max(0, p.set != null ? p.set : cur + (p.delta || 0));
      const wasComplete = cur >= skill.target;
      const isComplete = next >= skill.target;
      const xpChange = !wasComplete && isComplete ? 10 : wasComplete && !isComplete ? -10 : 0;
      return {
        ...state,
        english: {
          ...state.english,
          xp: Math.max(0, (state.xp || 0) + xpChange),
          skills: { ...state.english.skills, [p.skill]: { ...skill, log: { ...skill.log, [p.date]: next } } },
        },
      };
    }
    case "english.target":
      return {
        ...state,
        english: { ...state.english, skills: { ...state.english.skills, [p.skill]: { ...state.english.skills[p.skill], ...p.patch } } },
      };

    case "roadmap.toggle": {
      const next = { ...state.roadmap };
      if (next[p.key]) delete next[p.key];
      else next[p.key] = true;
      return { ...state, roadmap: next };
    }

    // ------------------------------------------------------------- focus --
    case "focus.log":
      return {
        ...state,
        focus: {
          ...state.focus,
          sessions: [
            { id: uid("f"), date: dateKey(), at: new Date().toISOString(), ...p },
            ...state.focus.sessions,
          ].slice(0, 500),
        },
      };
    case "focus.settings":
      return { ...state, focus: { ...state.focus, settings: { ...state.focus.settings, ...p } } };

    // ------------------------------------------------- college documents --
    case "doc.add":
      return {
        ...state,
        docs: [{ id: uid("doc"), addedAt: new Date().toISOString(), ...p }, ...state.docs],
      };
    case "doc.update":
      return { ...state, docs: state.docs.map((d) => (d.id === p.id ? { ...d, ...p.patch } : d)) };
    case "doc.delete":
      return { ...state, docs: state.docs.filter((d) => d.id !== p.id) };

    // ------------------------------------------------------------ library --
    case "lib.like":
      return { ...state, library: { ...state.library, likes: toggleId(state.library.likes, p.id) } };
    case "lib.save":
      return { ...state, library: { ...state.library, saves: toggleId(state.library.saves, p.id) } };
    case "lib.watched":
      return {
        ...state,
        library: { ...state.library, watched: toggleId(state.library.watched, p.id) },
      };

    case "ui":
      return { ...state, ui: { ...state.ui, ...p } };

    default:
      return state;
  }
}

// Every real edit gets a timestamp. `hydrate` is exempt: it carries the stamp of
// whichever copy it came from, which is exactly what cloud sync compares.
function reducer(state, action) {
  const next = baseReducer(state, action);
  if (next === state || action.type === "hydrate") return next;
  return { ...next, updatedAt: Date.now() };
}

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const loaded = useRef(false);
  const ready = state.hydrated;

  useEffect(() => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      // corrupted storage â€” start fresh rather than crash
    }
    dispatch({ type: "hydrate", payload: saved });
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode â€” ignore */
    }
  }, [state]);

  // theme
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = state.ui.theme === "dark" || (state.ui.theme === "system" && mq.matches);
      root.classList.toggle("dark", dark);
      root.dataset.accent = state.ui.accent;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [state.ui.theme, state.ui.accent]);

  // Mirrors state to Firestore while signed in; a no-op otherwise.
  const sync = useCloudSync({ state, dispatch, ready });

  const value = useMemo(() => ({ state, dispatch, ready, sync }), [state, ready, sync]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

// ------------------------------------------------------------- selectors --

export function modeFor(state, date = dateKey()) {
  return state.dayMode[date] || defaultMode(state.profile, date);
}

/** Today's blocks: the saved template for this mode, or a freshly generated day. */
export function blocksFor(state, date = dateKey()) {
  const mode = modeFor(state, date);
  const plan = state.plans[mode];
  if (plan?.length) {
    return plan
      .map((b) => ({ ...b, id: `${date}#${b.uid}` }))
      .sort((a, b) => a.start - b.start || a.end - b.end);
  }
  return generateDay(state.profile, mode, date);
}

export function doneFor(state, date = dateKey()) {
  return state.done[date] || [];
}

export function dayProgress(state, date = dateKey()) {
  const blocks = blocksFor(state, date).filter((b) => b.end > b.start && b.category !== "rest");
  const done = new Set(doneFor(state, date));
  const total = blocks.length;
  const completed = blocks.filter((b) => done.has(b.id)).length;
  return { total, completed, pct: total ? Math.round((completed / total) * 100) : 0 };
}

export function nextBlock(state, minutesNow, date = dateKey()) {
  const done = new Set(doneFor(state, date));
  return (
    blocksFor(state, date).find((b) => b.end > minutesNow && b.end > b.start && !done.has(b.id)) ||
    null
  );
}

export function attendancePct(a) {
  if (!a.total) return null;
  return Math.round((a.attended / a.total) * 100);
}

/** How many classes can be skipped (or must be attended) to hold `required`%. */
export function attendanceAdvice(a, required = 75) {
  const r = required / 100;
  if (!a.total) return { text: "No classes recorded yet", tone: "muted" };
  const pct = a.attended / a.total;
  if (pct >= r) {
    const canSkip = Math.floor((a.attended - r * a.total) / r);
    return canSkip > 0
      ? { text: `You can skip ${canSkip} more class${canSkip > 1 ? "es" : ""}`, tone: "ok" }
      : { text: "Right on the line â€” don't skip", tone: "warn" };
  }
  const need = Math.ceil((r * a.total - a.attended) / (1 - r));
  return { text: `Attend ${need} more in a row to reach ${required}%`, tone: "bad" };
}

export function goalProgress(goal, date = dateKey()) {
  if (goal.type === "weekly") {
    const keys = weekKeys(new Date(`${date}T00:00:00`));
    const value = keys.reduce((a, k) => a + (goal.log[k] || 0), 0);
    return { value, target: goal.target, pct: Math.min(100, Math.round((value / goal.target) * 100)) };
  }
  const value = goal.log[date] || 0;
  return { value, target: goal.target, pct: Math.min(100, Math.round((value / goal.target) * 100)) };
}

export function focusMinutes(state, date = dateKey()) {
  return state.focus.sessions.filter((s) => s.date === date).reduce((a, s) => a + s.minutes, 0);
}

export function weekStats(state, ref = new Date()) {
  const keys = weekKeys(ref);
  const focusMins = state.focus.sessions
    .filter((s) => keys.includes(s.date))
    .reduce((a, s) => a + s.minutes, 0);
  const tasksDone = state.tasks.filter(
    (t) => t.done && t.doneAt && keys.includes(dateKey(new Date(t.doneAt))),
  ).length;
  const perDay = keys.map((k) => ({
    date: k,
    minutes: state.focus.sessions.filter((s) => s.date === k).reduce((a, s) => a + s.minutes, 0),
    done: (state.done[k] || []).length,
  }));
  return { keys, focusMins, tasksDone, perDay };
}

/** Starter tasks + goals seeded from the chosen career goal at onboarding. */
export function seedFromGoal(profile) {
  const goal = goalById(profile.careerGoal);
  const tasks = goal.tasks.map((title) => ({
    id: uid("t"),
    title,
    priority: "high",
    due: dateKey(),
    category: "career",
    done: false,
    createdAt: new Date().toISOString(),
  }));
  const goals = [
    { id: uid("g"), label: goal.tasks[0], emoji: goal.emoji, type: "daily", target: 1, unit: "times", log: {} },
  ];
  (profile.hobbies || []).forEach((h) => {
    const meta = hobbyById(h.id);
    if (!meta) return;
    goals.push({
      id: uid("g"),
      label: meta.label,
      emoji: meta.emoji,
      type: "weekly",
      target: h.daysPerWeek ?? meta.days,
      unit: "days",
      log: {},
    });
  });
  return { tasks, goals };
}

