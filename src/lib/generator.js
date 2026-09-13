// The routine engine.
//
// Given a student's profile (college hours, sleep window, career goal, hobbies,
// priorities) and a day mode, it lays out a full day:
//   1. anchor the fixed blocks — sleep, meals, college, wind-down
//   2. collect every activity the student *wants* (goal blocks, subjects, hobbies)
//   3. scale them to the free time actually available
//   4. pour them into the gaps, respecting each activity's preferred time of day
//
// It is deterministic: the same profile + date always produces the same day, so
// "done" ticks survive a page reload or a regenerate.

import { toMin, clamp } from "./time";
import { goalById, hobbyById, modeById, PRIORITIES, subjectsFor } from "./catalog";

const PREF_WINDOWS = {
  morning: [5 * 60, 12 * 60],
  afternoon: [12 * 60, 17 * 60],
  evening: [17 * 60, 21 * 60],
  night: [21 * 60, 25 * 60],
  any: [0, 24 * 60],
};

const MIN_BLOCK = 20;
const SLOT = 5;

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Simple stable hash so subject rotation differs per student but never per render. */
function hash(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) | 0;
  return Math.abs(h);
}

function overlaps(aS, aE, bS, bE) {
  return aS < bE && bS < aE;
}

function overlapLen(aS, aE, bS, bE) {
  return Math.max(0, Math.min(aE, bE) - Math.max(aS, bS));
}

/** Spread `count` sessions across the week, offset so two hobbies don't stack up. */
function hobbyRunsToday(daysPerWeek, weekday, offset) {
  const n = clamp(daysPerWeek, 0, 7);
  if (n <= 0) return false;
  if (n >= 7) return true;
  // n evenly spaced weekdays starting from Saturday (so weekends keep their
  // hobbies), rotated so hobby #2 lands on hobby #1's rest days
  const picked = new Set();
  for (let i = 0; i < n; i++) picked.add((6 + Math.round((i * 7) / n) + offset) % 7);
  return picked.has(weekday);
}

/** Anything below this once priorities and mode weights are applied isn't worth a slot. */
const STUB_MINUTES = 30;

/**
 * @returns {Array<{id,label,emoji,start,end,category,fixed,source}>}
 */
export function generateDay(profile, mode, dateStr) {
  const p = profile || {};
  const m = modeById(mode);
  const date = new Date(`${dateStr}T00:00:00`);
  const weekday = date.getDay();

  const wake = toMin(p.wake || "07:00");
  const sleepRaw = toMin(p.sleep || "23:30");
  const sleep = sleepRaw <= wake ? sleepRaw + 1440 : sleepRaw;

  const blocks = [];
  const used = [];
  let seq = 0;

  const place = (label, emoji, start, minutes, category, opts = {}) => {
    let s = Math.round(start / SLOT) * SLOT;
    const dur = minutes;
    // nudge later (max 2h) if something already sits there
    let tries = 0;
    while (used.some((u) => overlaps(s, s + dur, u.start, u.end)) && tries < 24) {
      s += 15;
      tries++;
    }
    if (used.some((u) => overlaps(s, s + dur, u.start, u.end))) return null;
    if (s < wake || s + dur > sleep + (opts.allowPastSleep ? 60 : 0)) return null;
    const b = {
      id: `${dateStr}-${slugify(label)}-${seq++}`,
      label,
      emoji,
      start: s,
      end: s + dur,
      category,
      fixed: !!opts.fixed,
      source: opts.source || "generated",
    };
    blocks.push(b);
    used.push({ start: b.start, end: b.end });
    return b;
  };

  // ---------------------------------------------------------- fixed anchors --
  place("Wake up & freshen up", "🌅", wake, 30, "rest", { fixed: true });
  place("Breakfast", "🍳", wake + 30, 30, "meal", { fixed: true });

  const collegeDays = p.collegeDays?.length ? p.collegeDays : [1, 2, 3, 4, 5];
  const hasCollege = m.college && collegeDays.includes(weekday);
  let collegeEnd = null;
  if (hasCollege) {
    const cs = toMin(p.collegeStart || "09:00");
    let ce = toMin(p.collegeEnd || "16:00");
    if (ce <= cs) ce = cs + 6 * 60;
    collegeEnd = ce;
    place(m.id === "exam" ? "College / Exam" : "College", "🎓", cs, ce - cs, "college", {
      fixed: true,
    });
    // nobody teleports to campus — keep the half hour before class free
    place("Get ready & travel", "🎒", cs - 30, 30, "rest", { fixed: true });
    place("Rest & refresh", "☕", ce + 15, 30, "rest", { fixed: true });
  }

  const lunch = toMin(p.lunch || "13:00");
  const lunchClash = used.some((u) => overlaps(lunch, lunch + 45, u.start, u.end));
  if (!lunchClash) place("Lunch", "🍛", lunch, 45, "meal", { fixed: true });

  const dinner = toMin(p.dinner || "20:00");
  place("Dinner", "🍽️", dinner, 45, "meal", { fixed: true });

  place("Plan tomorrow & wind down", "🌙", sleep - 30, 30, "rest", { fixed: true });

  // ------------------------------------------------------------ free windows --
  let windows = freeWindows(used, wake + 30, sleep - 30);

  // --------------------------------------------------------------- wishlist --
  const prio = p.priorities || { academics: "high", career: "high", fitness: "medium", hobby: "low" };
  const goal = goalById(p.careerGoal);
  const wishlist = [];

  // career goal activities
  goal.blocks.forEach((b, i) => {
    wishlist.push({
      ...b,
      key: `goal-${i}`,
      priority: prio.career || "high",
      weight: m.weights.career,
      source: "goal",
    });
  });

  // academics — rotate subjects so every subject comes around
  const subjects = (p.subjects?.length ? p.subjects : subjectsFor(p.branch, p.semester || 1)).map(
    (s) => (typeof s === "string" ? s : s.name),
  );
  if (subjects.length) {
    const dayIndex = Math.floor(date.getTime() / 86400000) + hash(p.name || "student");
    const count = m.id === "exam" ? 2 : 1;
    for (let k = 0; k < count; k++) {
      const subject = subjects[(dayIndex + k) % subjects.length];
      wishlist.push({
        key: `subject-${k}`,
        label: `Study ${subject}`,
        emoji: "📚",
        minutes: 60,
        pref: k === 0 ? "evening" : "night",
        category: "academics",
        priority: prio.academics || "high",
        weight: m.weights.academics,
        source: "academics",
      });
    }
  }
  wishlist.push({
    key: "revision",
    label: m.id === "exam" ? "Revision & Mock Test" : "Revision",
    emoji: "🔁",
    minutes: m.id === "exam" ? 60 : 30,
    pref: "night",
    category: "academics",
    priority: prio.academics || "high",
    weight: m.weights.academics,
    source: "academics",
  });

  // hobbies — the point of the whole app: they get real time, not leftovers
  (p.hobbies || []).forEach((h, i) => {
    const meta = hobbyById(h.id);
    if (!meta) return;
    const days = h.daysPerWeek ?? meta.days;
    if (!hobbyRunsToday(days, weekday, i * 3)) return;
    wishlist.push({
      key: `hobby-${h.id}`,
      label: meta.label,
      emoji: meta.emoji,
      minutes: h.minutes || meta.minutes,
      pref: meta.pref,
      category: meta.category,
      priority: h.priority || prio[meta.category === "fitness" ? "fitness" : "hobby"] || "medium",
      weight: m.weights[meta.category === "fitness" ? "fitness" : "hobby"] ?? 1,
      source: "hobby",
    });
  });

  // student-defined activities (GATE class, gym coaching, tuition, anything)
  (p.customActivities || []).forEach((c, i) => {
    wishlist.push({
      key: `custom-${i}`,
      label: c.label,
      emoji: c.emoji || "✨",
      minutes: c.minutes || 45,
      pref: c.pref || "any",
      category: c.category || "custom",
      priority: c.priority || "medium",
      weight: 1,
      source: "custom",
    });
  });

  // On a day with no college the whole timetable is free, so study and career
  // work spread from morning to night instead of piling into the evening.
  if (!hasCollege) {
    const spread = ["morning", "morning", "afternoon", "afternoon", "evening", "evening", "night"];
    wishlist
      .filter((w) => w.source === "goal" || w.source === "academics")
      .forEach((w, i) => {
        w.pref = spread[i % spread.length];
      });
  }

  // ------------------------------------------------------- scale to reality --
  const freeTotal = windows.reduce((a, w) => a + (w.end - w.start), 0);
  const seenStub = new Set();
  const scaled = wishlist
    .map((w) => {
      const raw = w.minutes * w.weight * PRIORITIES[w.priority].factor;
      return { ...w, raw, minutes: Math.max(MIN_BLOCK, Math.round(raw / SLOT) * SLOT) };
    })
    // Exam mode squeezes career and hobbies hard. Rather than litter the day with
    // 20-minute stubs, keep one token block per category and drop the rest.
    .filter((w) => {
      if (w.raw >= STUB_MINUTES) return true;
      if (seenStub.has(w.category)) return false;
      seenStub.add(w.category);
      return true;
    });
  const wanted = scaled.reduce((a, w) => a + w.minutes, 0);
  if (wanted > freeTotal && wanted > 0) {
    const f = Math.max(0.55, freeTotal / wanted);
    scaled.forEach((w) => {
      w.minutes = Math.max(MIN_BLOCK, Math.round((w.minutes * f) / SLOT) * SLOT);
    });
  }

  // High priority first; within a tier, the pickiest (narrow preference) first.
  scaled.sort((a, b) => {
    const pr = PRIORITIES[a.priority].rank - PRIORITIES[b.priority].rank;
    if (pr) return pr;
    const aw = PREF_WINDOWS[a.pref] || PREF_WINDOWS.any;
    const bw = PREF_WINDOWS[b.pref] || PREF_WINDOWS.any;
    return aw[1] - aw[0] - (bw[1] - bw[0]);
  });

  // ---------------------------------------------------------------- fitting --
  for (const item of scaled) {
    const placed = fit(item, windows, { wake, sleep, collegeEnd });
    if (!placed) continue;
    blocks.push({
      id: `${dateStr}-${slugify(item.label)}-${seq++}`,
      label: item.label,
      emoji: item.emoji,
      start: placed.start,
      end: placed.start + placed.minutes,
      category: item.category,
      fixed: false,
      source: item.source,
      priority: item.priority,
    });
    windows = splitWindows(windows, placed.start, placed.start + placed.minutes);
  }

  // Long leftover gaps are real free time — show them instead of leaving a hole.
  const timed = blocks.filter((b) => b.end > b.start).sort((a, b) => a.start - b.start);
  for (let i = 1; i < timed.length; i++) {
    const gap = timed[i].start - timed[i - 1].end;
    if (gap >= 45) {
      blocks.push({
        id: `${dateStr}-free-${i}`,
        label: "Free time",
        emoji: "🙌",
        start: timed[i - 1].end,
        end: timed[i].start,
        category: "rest",
        fixed: false,
        source: "free",
      });
    }
  }

  blocks.push({
    id: `${dateStr}-sleep`,
    label: "Sleep",
    emoji: "😴",
    start: sleep,
    end: sleep,
    category: "rest",
    fixed: true,
    source: "generated",
  });

  return blocks.sort((a, b) => a.start - b.start || a.end - b.end);
}

function freeWindows(used, from, to) {
  const sorted = [...used].sort((a, b) => a.start - b.start);
  const out = [];
  let cursor = from;
  for (const u of sorted) {
    if (u.start > cursor) out.push({ start: cursor, end: Math.min(u.start, to) });
    cursor = Math.max(cursor, u.end);
  }
  if (cursor < to) out.push({ start: cursor, end: to });
  return out.filter((w) => w.end - w.start >= MIN_BLOCK);
}

function splitWindows(windows, s, e) {
  const out = [];
  for (const w of windows) {
    if (!overlaps(s, e, w.start, w.end)) {
      out.push(w);
      continue;
    }
    if (s - w.start >= MIN_BLOCK) out.push({ start: w.start, end: s });
    if (w.end - e >= MIN_BLOCK) out.push({ start: e, end: w.end });
  }
  return out;
}

/** Find the best window for an activity, shrinking it a little if that's what it takes. */
function fit(item, windows, ctx) {
  const [ps, pe] = PREF_WINDOWS[item.pref] || PREF_WINDOWS.any;
  // "evening" for a student whose college ends at 6pm has to mean "after college"
  const prefStart = Math.max(ps, item.pref === "evening" && ctx.collegeEnd ? ctx.collegeEnd : ps);
  const prefEnd = Math.max(prefStart + 30, pe);

  // Prefer a shorter session in a good window over a 20-minute scrap in a bad one.
  const sizes = [];
  for (let s = item.minutes; s >= 30; s -= 15) sizes.push(s);
  sizes.push(MIN_BLOCK);

  for (const minutes of sizes) {
    let best = null;
    for (const w of windows) {
      const len = w.end - w.start;
      if (len < minutes) continue;
      // slide the block to the preferred zone inside this window
      let start = clamp(prefStart, w.start, w.end - minutes);
      start = Math.round(start / SLOT) * SLOT;
      start = clamp(start, w.start, w.end - minutes);
      const score = overlapLen(start, start + minutes, prefStart, prefEnd) - Math.abs(start - prefStart) / 60;
      if (!best || score > best.score) best = { start, minutes, score };
    }
    if (best) return best;
  }
  return null;
}

/**
 * Spread a career goal's stages over the student's horizon so "8 months" and
 * "4 months" both produce a sensible month-by-month roadmap.
 */
export function buildRoadmap(goalId, months = 8, startedAt) {
  const goal = goalById(goalId);
  const total = Math.max(1, Number(months) || 8);
  const stages = goal.stages;
  const startDate = startedAt ? new Date(startedAt) : new Date();
  return stages.map((stage, i) => {
    const from = Math.floor((i * total) / stages.length);
    const to = Math.max(from, Math.ceil(((i + 1) * total) / stages.length) - 1);
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + from, 1);
    return {
      id: `${goalId}-stage-${i}`,
      index: i,
      title: stage.title,
      items: stage.items,
      fromMonth: from,
      toMonth: to,
      label: from === to ? `Month ${from + 1}` : `Month ${from + 1}–${to + 1}`,
      date: d,
    };
  });
}

/** Which roadmap stage should the student be on right now. */
export function currentStage(roadmap, startedAt) {
  const start = startedAt ? new Date(startedAt) : new Date();
  const now = new Date();
  const elapsed =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return roadmap.find((s) => elapsed >= s.fromMonth && elapsed <= s.toMonth) || roadmap[0];
}

/** Minutes per category for a day's blocks. */
export function categoryMinutes(blocks) {
  const out = {};
  for (const b of blocks) out[b.category] = (out[b.category] || 0) + (b.end - b.start);
  return out;
}

const BALANCE_TARGETS = {
  academics: 120,
  career: 90,
  fitness: 45,
  hobby: 60,
};

/** Life-balance score from what was actually completed today. */
export function balanceScore(blocks, doneIds, profile) {
  const done = new Set(doneIds || []);
  const mins = categoryMinutes(blocks.filter((b) => done.has(b.id)));
  const rows = Object.entries(BALANCE_TARGETS).map(([key, target]) => ({
    key,
    value: Math.round(clamp(((mins[key] || 0) / target) * 100, 0, 100)),
  }));

  const wake = toMin(profile?.wake || "07:00");
  const sleepRaw = toMin(profile?.sleep || "23:30");
  const sleepMins = 1440 - ((sleepRaw <= wake ? sleepRaw + 1440 : sleepRaw) - wake);
  rows.push({ key: "sleep", value: Math.round(clamp((sleepMins / 450) * 100, 0, 100)) });

  const overall = Math.round(rows.reduce((a, r) => a + r.value, 0) / rows.length);
  return { rows, overall };
}

/** Default mode for a date: weekend on non-college days, college otherwise. */
export function defaultMode(profile, dateStr) {
  const weekday = new Date(`${dateStr}T00:00:00`).getDay();
  const collegeDays = profile?.collegeDays?.length ? profile.collegeDays : [1, 2, 3, 4, 5];
  return collegeDays.includes(weekday) ? "college" : "weekend";
}
