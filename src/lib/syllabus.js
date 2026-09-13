// Reads a syllabus PDF and turns it into a plan you can actually follow.
//
// Three separate jobs, kept apart so each can be wrong on its own:
//
//   1. readPdf   — PDF → plain text, in the browser. Nothing is uploaded.
//   2. parseSyllabus — text → units and topics. Heuristic, and honest about it:
//      Indian university syllabi are wildly inconsistent ("Module-II", "UNIT 3",
//      "[8L]", "(9 hrs)"), so the parser aims to be right most of the time and
//      always editable afterwards, never to be clever.
//   3. estimate + schedule — topics → minutes → dated day-by-day sessions.
//
// The estimate is a working number, not a promise: it says how long the syllabus
// takes at the depth and daily hours you chose, so you can see today whether the
// exam date is reachable — and what to change if it isn't.

import { addDays, dateKey, WEEKDAYS } from "./time";

// ------------------------------------------------------------------ pdf --

/**
 * Extracts text from a PDF entirely client-side. pdf.js is imported on demand
 * (it's ~1 MB) and its worker is served from /public, so no bundler-specific
 * URL magic is involved — see scripts/copy-pdf-worker.mjs.
 */
export async function readPdf(file, onProgress) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer, isEvalSupported: false }).promise;

  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    pages.push(joinItems(content.items));
    onProgress?.(Math.round((n / doc.numPages) * 100));
  }
  await doc.destroy?.();
  return pages.join("\n");
}

/**
 * pdf.js hands back positioned fragments, not lines. `hasEOL` marks a real line
 * break; without it a heading and its first topic would run together and the
 * unit title would swallow half the syllabus.
 */
function joinItems(items) {
  let out = "";
  items.forEach((it) => {
    if (typeof it.str !== "string") return;
    out += it.str;
    if (it.hasEOL) out += "\n";
    else if (it.str && !/\s$/.test(it.str)) out += " ";
  });
  return out;
}

export const MAX_PDF_BYTES = 20 * 1024 * 1024;

export function syllabusFileError(file) {
  if (!file) return "";
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return "That isn't a PDF.";
  if (file.size > MAX_PDF_BYTES) return "That PDF is larger than 20 MB.";
  return "";
}

// ---------------------------------------------------------------- parse --

const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 };

// Where a unit's topic list stops and the boilerplate starts.
const TAIL =
  /^\s*(text\s?books?|reference\s?books?|references|suggested readings?|books? recommended|course outcomes?|learning outcomes?|outcomes?|evaluation|assessment|marks distribution|total\b|note\s*:|prerequisite)/i;

// Lines that are page furniture rather than syllabus.
const NOISE =
  /^\s*(page\s*\d+|\d+\s*\|\s*page|scanned by|www\.|https?:\/\/|maulana abul|university of|department of\b.*syllabus)/i;

const HOURS = /\[?\(?\s*(\d{1,3})\s*(?:l\b|hrs?\b|hours?\b|lectures?\b|periods?\b|classes\b)\s*\)?\]?/i;

// "UNIT-I INTRODUCTION (9)" — a bare number in brackets at the end of a unit
// heading is lecture hours too; nothing else is ever written there.
const BARE_HOURS = /[[(]\s*(\d{1,2})\s*[\])]\s*$/;

/** Straightens what a PDF does to text: split words, odd dashes, silly spacing. */
export function normalise(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/•/g, "\n• ")
    // a word broken across a line by a hyphen
    .replace(/([a-z])-\n([a-z])/g, "$1$2")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .filter((l) => !NOISE.test(l))
    .join("\n")
    .trim();
}

/**
 * Splits a syllabus into units and topics.
 *
 * Returns `{ subject, code, units, source }`. `source` says which strategy hit,
 * because "we couldn't find any units so this is one big list" is something the
 * screen has to be able to tell the student.
 */
export function parseSyllabus(text) {
  const clean = normalise(text);
  if (!clean) return { subject: "", code: "", units: [], source: "empty" };

  const headers = [...clean.matchAll(/(?:^|\n)[ \t]*(unit|module|chapter|part)[ \t]*[-–—.:#]?[ \t]*(\d{1,2}|[ivx]{1,5})\b[.):\-]?/gi)]
    // "Part A" style headers with no number are matched as roman "a" — drop those
    .filter((m) => /^\d+$/.test(m[2]) || ROMAN[m[2].toLowerCase()] !== undefined);

  const subject = findSubject(clean, headers[0]?.index ?? clean.length);
  const code = findCode(clean.slice(0, headers[0]?.index ?? 400));

  if (headers.length >= 1) {
    const units = headers.map((m, i) => {
      const start = m.index + m[0].length;
      const end = i + 1 < headers.length ? headers[i + 1].index : clean.length;
      const n = /^\d+$/.test(m[2]) ? Number(m[2]) : ROMAN[m[2].toLowerCase()];
      return buildUnit(n || i + 1, clean.slice(start, end));
    });
    const kept = units.filter((u) => u.topics.length);
    if (kept.length) return { subject, code, units: kept, source: "units" };
  }

  // No unit headings — treat numbered or bulleted lines as one flat list, then
  // chop it into parts of roughly seven topics so the plan still has a shape.
  const flat = topicsFrom(clean).filter((t) => t.toLowerCase() !== subject.toLowerCase());
  if (!flat.length) return { subject, code, units: [], source: "none" };
  const per = Math.ceil(flat.length / Math.min(5, Math.max(1, Math.ceil(flat.length / 7))));
  const units = [];
  for (let i = 0; i < flat.length; i += per) {
    units.push({
      n: units.length + 1,
      title: `Part ${units.length + 1}`,
      hours: null,
      topics: flat.slice(i, i + per),
    });
  }
  return { subject, code, units, source: "flat" };
}

function buildUnit(n, body) {
  const firstBreak = body.indexOf("\n");
  const head = (firstBreak === -1 ? body : body.slice(0, firstBreak)).trim();
  const rest = firstBreak === -1 ? "" : body.slice(firstBreak + 1);

  const hoursMatch = head.match(HOURS) || head.match(BARE_HOURS) || body.slice(0, 200).match(HOURS);
  const hours = hoursMatch ? Number(hoursMatch[1]) : null;

  // A heading like "Trees [8L]" is a title; "Arrays, Stacks, Queues" on the
  // header line is already the topic list, and there's no title to be had.
  const headClean = head
    .replace(HOURS, "")
    .replace(BARE_HOURS, "")
    .replace(/^[-–:.\s]+/, "")
    .trim();
  const isTitle = headClean.length > 0 && headClean.length <= 60 && !headClean.includes(",");

  const topics = topicsFrom(isTitle ? rest : `${headClean}\n${rest}`);
  return {
    n,
    title: isTitle ? headClean : `Unit ${n}`,
    hours: hours && hours > 0 && hours <= 60 ? hours : null,
    topics,
  };
}

/** Pulls a clean topic list out of a block of syllabus prose. */
function topicsFrom(block) {
  const out = [];
  const seen = new Set();

  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (TAIL.test(line)) break; // textbooks and outcomes — the unit is over

    for (const piece of line.split(/[;•·]|,(?![^(]*\))/)) {
      const topic = cleanTopic(piece);
      if (!topic) continue;
      const key = topic.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(topic);
      if (out.length >= 40) return out; // a unit with 40 topics is a parse gone wrong
    }
  }
  return out;
}

function cleanTopic(piece) {
  const t = piece
    .replace(HOURS, "")
    .replace(/^[\s\-–—•·*.)\]]+/, "")
    .replace(/^\d+(\.\d+)*[.)]?\s*/, "") // "3.2 " numbering
    .replace(/[\s.:;,-]+$/, "")
    .trim();
  if (t.length < 4 || t.length > 120) return "";
  if (!/[a-z]/i.test(t)) return "";
  if (/^\d+$/.test(t)) return "";
  return t;
}

function findSubject(text, limit) {
  const head = text.slice(0, limit);
  const labelled = head.match(
    /(?:course|subject|paper|module)\s*(?:name|title)?\s*[:\-]\s*([^\n]{4,80})/i,
  );
  if (labelled) return tidyName(labelled[1]);

  // Otherwise the first line that reads like a title rather than a letterhead.
  for (const line of head.split("\n").slice(0, 12)) {
    const l = line.trim();
    if (l.length < 5 || l.length > 70) continue;
    if (/university|college|department|faculty|syllabus|curriculum|semester|regulation|b\.?\s?tech/i.test(l)) continue;
    if (!/[a-z]/.test(l)) continue;
    return tidyName(l);
  }
  return "";
}

function tidyName(s) {
  return s
    .replace(/\(.*?\)/g, "")
    .replace(/\b(code|credits?|l-?t-?p)\b.*$/i, "")
    .replace(/[\s:,-]+$/, "")
    .trim();
}

// "PCC-CS501", "CSE 402", "18CS44". The spaced form is only trusted after an
// explicit "Course Code:" label — unlabelled, it would happily read "MAKAUT
// 2024" off the letterhead as a course code.
const CODE_SPACED = /\b([A-Z]{2,4}[ -]?[A-Z]{0,3}[ -]?\d{2,5}[A-Z]?)\b/;
const CODE_TIGHT = /\b([A-Z]{2,4}-?[A-Z]{0,3}\d{2,5}[A-Z]?|\d{2}[A-Z]{2,4}\d{2,3})\b/;

function findCode(head) {
  const labelled = head.match(/(?:course|subject|paper)\s*code\s*[:\-]?\s*([^\n]{2,24})/i);
  const inLabel = labelled?.[1].match(CODE_SPACED);
  if (inLabel) return inLabel[1].trim();
  const loose = head.match(CODE_TIGHT);
  return loose ? loose[1].trim() : "";
}

// ------------------------------------------------------------- estimate --

/** How thoroughly you intend to learn it. Drives every multiplier below. */
export const DEPTHS = [
  {
    id: "pass",
    label: "Just pass",
    emoji: "🎯",
    hint: "Cover everything once, drill the repeated questions.",
    study: 0.75,
    practice: 0.25,
    revision: 0.2,
  },
  {
    id: "exam",
    label: "Score well",
    emoji: "📈",
    hint: "Full syllabus, solved problems and two revision passes.",
    study: 1,
    practice: 0.45,
    revision: 0.3,
  },
  {
    id: "master",
    label: "Master it",
    emoji: "🏆",
    hint: "For a subject you'll be interviewed on, or that carries into next year.",
    study: 1.45,
    practice: 0.7,
    revision: 0.4,
  },
];

export const depthById = (id) => DEPTHS.find((d) => d.id === id) || DEPTHS[1];

/** How much of it you already know. */
export const FAMILIARITY = [
  { id: "new", label: "Brand new to me", factor: 1 },
  { id: "some", label: "Sat through the classes", factor: 0.8 },
  { id: "revising", label: "Revising it", factor: 0.55 },
];

export const familiarityById = (id) => FAMILIARITY.find((f) => f.id === id) || FAMILIARITY[0];

// Topics are not equal, and the words in them say which kind they are.
const HEAVY = /derivation|theorem|proof|numerical|algorithm|complexity|analysis|design of|design and|circuit|transform|equation|matrix|integral|differential|optimi[sz]|architecture|protocol|scheduling|synthesis|modelling|simulation/i;
const LIGHT = /introduction|overview|history|basics?|definition|classification|need for|scope|terminology|advantages|applications|types of|characteristics|features/i;
const PRACTICAL = /implement|program|code|lab|experiment|practical|hands.?on|tool|software|case study|project/i;

/** Minutes of first-pass study for one topic. */
export function topicMinutes(topic) {
  let m = 30;
  if (HEAVY.test(topic)) m += 20;
  if (PRACTICAL.test(topic)) m += 15;
  if (LIGHT.test(topic)) m -= 12;
  // Longer topic strings usually mean several ideas glued together by a comma
  // that the parser had no way to split.
  if (topic.length > 60) m += 10;
  return Math.max(12, Math.min(75, m));
}

/**
 * Minutes per unit, split into study / practice / revision.
 *
 * Declared lecture hours act as a floor: a unit the university gives 10
 * lectures to is not a 40-minute unit, however few topics the PDF lists.
 */
export function estimate(units, { depth = "exam", familiarity = "new" } = {}) {
  const d = depthById(depth);
  const f = familiarityById(familiarity).factor;

  const perUnit = units.map((u) => {
    const topicSum = u.topics.reduce((a, t) => a + topicMinutes(t), 0);
    const floor = u.hours ? u.hours * 45 : 0; // 45 min of self-study per lecture hour
    const study = Math.round(Math.max(topicSum, floor) * d.study * f);
    const practice = Math.round(study * d.practice);
    const revision = Math.round(study * d.revision);
    return { ...u, study, practice, revision, total: study + practice + revision };
  });

  const sum = (k) => perUnit.reduce((a, u) => a + u[k], 0);
  return {
    units: perUnit,
    study: sum("study"),
    practice: sum("practice"),
    revision: sum("revision"),
    total: sum("total"),
    topics: units.reduce((a, u) => a + u.topics.length, 0),
    depth: d,
  };
}

// ------------------------------------------------------------- schedule --

const PHASES = {
  study: { label: "Learn", emoji: "📖" },
  practice: { label: "Practice", emoji: "✏️" },
  revision: { label: "Revise", emoji: "🔁" },
  pyq: { label: "Past papers", emoji: "🗂️" },
  mock: { label: "Mock exam", emoji: "⏰" },
};

export const phaseMeta = (id) => PHASES[id] || PHASES.study;

/**
 * Lays the estimate out on real dates.
 *
 * Learn each unit (topics, then problems on them), then revise every unit, then
 * past papers and a timed mock — the order students actually revise in, rather
 * than a spaced-repetition schedule nobody follows past week two.
 *
 * Topics are never split across days unless one topic is longer than a whole
 * day; a session you can finish is the point.
 */
export function schedule(est, { dailyMinutes = 120, daysPerWeek = 6, start = new Date(), examDate = "" } = {}) {
  // Nothing parsed means nothing to plan — a two-day "revise and mock" schedule
  // for an empty syllabus would just be noise.
  if (!est.units.length) {
    return { days: [], finish: dateKey(start), totalDays: 0, weeks: [], verdict: null };
  }

  const queue = [];

  est.units.forEach((u) => {
    const topicTotal = u.topics.reduce((a, t) => a + topicMinutes(t), 0) || 1;
    // Share the unit's (already adjusted) study minutes across its topics in
    // proportion to the raw estimate, so depth and familiarity carry through.
    // The last topic absorbs the rounding, so the plan adds up to exactly the
    // total shown on the summary card — two numbers that disagree by nine
    // minutes just look like a bug.
    const shares = u.topics.map((t) => Math.max(10, Math.round((topicMinutes(t) / topicTotal) * u.study)));
    // Hand the rounding back topic by topic from the end, never taking a topic
    // below ten minutes — dumping it all on the last topic would just hit that
    // floor and leave the drift in place.
    let drift = u.study - shares.reduce((a, m) => a + m, 0);
    for (let i = shares.length - 1; i >= 0 && drift !== 0; i--) {
      const give = drift > 0 ? drift : Math.max(10 - shares[i], drift);
      shares[i] += give;
      drift -= give;
    }

    u.topics.forEach((t, i) => {
      queue.push({ unit: u.n, unitTitle: u.title, type: "study", label: t, minutes: shares[i] });
    });
    if (u.practice > 0) {
      queue.push({
        unit: u.n,
        unitTitle: u.title,
        type: "practice",
        label: `Solve problems & past questions — ${u.title}`,
        minutes: u.practice,
      });
    }
  });

  est.units.forEach((u) => {
    if (u.revision > 0) {
      queue.push({
        unit: u.n,
        unitTitle: u.title,
        type: "revision",
        label: `Revise ${u.title} from your own notes`,
        minutes: u.revision,
      });
    }
  });

  // Nobody studies one topic for 90 unbroken minutes, and a 90-minute block
  // also wastes the tail of a day it doesn't fit into. Split anything long into
  // sessions of at most SESSION_MAX before anything is placed on a date.
  const sessions = queue.flatMap(chunk);

  const finishing = Math.max(dailyMinutes, 60);
  // Not chunked: a past paper solved in three sittings isn't a past paper.
  sessions.push({ type: "pyq", label: "Solve one full previous-year paper", minutes: finishing });
  sessions.push({ type: "mock", label: "Timed mock: full paper in exam conditions", minutes: finishing });
  queue.length = 0;
  queue.push(...sessions);

  // Days off. daysPerWeek 6 means one rest day — Sunday first, then Saturday.
  const restDays = [0, 6, 3, 5, 2, 4, 1].slice(0, Math.max(0, 7 - daysPerWeek));
  const days = [];
  let cursor = new Date(start);
  let guard = 0;

  while (queue.length && guard++ < 730) {
    if (restDays.includes(cursor.getDay())) {
      cursor = addDays(cursor, 1);
      continue;
    }
    const blocks = [];
    let left = dailyMinutes;

    while (queue.length && left > 0) {
      // Normally this takes the next session in syllabus order. When that one
      // won't fit the time left, it looks a little way down the queue for one
      // that does — without the lookahead, every day ends with a 20-minute hole
      // and the plan runs a fifth longer than it needs to.
      const i = queue.findIndex((q, j) => j < LOOKAHEAD && q.minutes <= left);
      if (i >= 0) {
        const [work] = queue.splice(i, 1);
        blocks.push(work);
        left -= work.minutes;
        continue;
      }
      // Nothing fits whole. Start the next session anyway and carry the rest
      // into tomorrow — stopping instead would leave ~20 minutes unused every
      // single day, which adds a week to a two-month plan.
      const next = queue[0];
      if (left >= MIN_SESSION) {
        blocks.push({ ...next, minutes: left, carry: true });
        next.minutes -= left;
        left = 0;
        continue;
      }
      break;
    }

    if (blocks.length) {
      days.push({
        date: dateKey(cursor),
        day: WEEKDAYS[cursor.getDay()],
        minutes: blocks.reduce((a, b) => a + b.minutes, 0),
        blocks,
      });
    }
    cursor = addDays(cursor, 1);
  }

  const finish = days.length ? days[days.length - 1].date : dateKey(start);
  const verdict = examVerdict(examDate, finish, est.total, start, daysPerWeek, dailyMinutes);
  // Counted off the placed sessions rather than the estimate, so the number on
  // the summary card is the number the plan actually asks of you.
  const scheduled = days.reduce((a, d) => a + d.minutes, 0);

  return { days, finish, totalDays: days.length, weeks: groupWeeks(days), verdict, scheduled };
}

const SESSION_MAX = 50; // one sitting, near enough to a long Pomodoro
const MIN_SESSION = 20; // shorter than this and it isn't worth opening the book
const LOOKAHEAD = 6;

/** One work item → one or more sittings of at most SESSION_MAX minutes. */
function chunk(work) {
  if (work.minutes <= SESSION_MAX) return [work];
  const parts = Math.ceil(work.minutes / SESSION_MAX);
  const each = Math.round(work.minutes / parts);
  return Array.from({ length: parts }, (_, i) => ({
    ...work,
    minutes: i === parts - 1 ? work.minutes - each * (parts - 1) : each,
    part: { i: i + 1, of: parts },
  }));
}

function groupWeeks(days) {
  const weeks = [];
  days.forEach((d, i) => {
    if (i % 7 === 0) weeks.push({ n: weeks.length + 1, days: [] });
    weeks[weeks.length - 1].days.push(d);
  });
  return weeks;
}

/** Does this plan actually land before the exam — and if not, what would? */
function examVerdict(examDate, finish, totalMinutes, start, daysPerWeek, dailyMinutes) {
  if (!examDate) return null;
  const exam = new Date(`${examDate}T00:00:00`);
  if (Number.isNaN(exam.getTime())) return null;

  const spare = Math.round((exam - new Date(`${finish}T00:00:00`)) / 86400000);
  if (spare >= 0) {
    return {
      ok: true,
      spare,
      text:
        spare === 0
          ? "You finish on the day of the exam — no slack at all. Add 15 minutes a day for a safety margin."
          : `You finish ${spare} day${spare === 1 ? "" : "s"} before the exam.`,
    };
  }

  const calendarDays = Math.max(1, Math.round((exam - new Date(dateKey(start) + "T00:00:00")) / 86400000));
  const studyDays = Math.max(1, Math.round((calendarDays * daysPerWeek) / 7));
  const needed = Math.ceil(totalMinutes / studyDays / 5) * 5;
  return {
    ok: false,
    short: -spare,
    needed,
    text: `This plan overshoots the exam by ${-spare} day${spare === -1 ? "" : "s"}. You'd need about ${fmtH(needed)} a day instead of ${fmtH(dailyMinutes)} — or drop to a lighter depth.`,
  };
}

export function fmtH(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
