// Small time / date helpers. All schedule math is done in "minutes since midnight".

export function toMin(hhmm) {
  if (typeof hhmm !== "string") return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function toHHMM(min) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** 490 -> "8:10 AM" */
export function fmtTime(min) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  let h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  const ampm = h < 12 ? "AM" : "PM";
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${mm} ${ampm}`;
}

/** 95 -> "1h 35m" */
export function fmtDuration(min) {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}m`;
  if (!r) return `${h}h`;
  return `${h}h ${r}m`;
}

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function parseKey(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(d, n) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Whole days from today until a YYYY-MM-DD date. Negative = past. */
export function daysUntil(key) {
  const target = parseKey(key);
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / 86400000);
}

export function countdownLabel(key) {
  const d = daysUntil(key);
  if (d < 0) return `${Math.abs(d)} days ago`;
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return `${d} days`;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "Saturday, 8 August" */
export function longDate(d = new Date()) {
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function shortDate(key) {
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function monthLabel(d) {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function greeting(min = new Date().getHours() * 60 + new Date().getMinutes()) {
  if (min < 5 * 60) return "Still up";
  if (min < 12 * 60) return "Good Morning";
  if (min < 17 * 60) return "Good Afternoon";
  if (min < 21 * 60) return "Good Evening";
  return "Good Night";
}

/** Monday-first start of the week containing `d`. */
export function startOfWeek(d = new Date()) {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (c.getDay() + 6) % 7;
  c.setDate(c.getDate() - diff);
  return c;
}

export function weekKeys(d = new Date()) {
  const s = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(s, i)));
}

/** "2026-2027" — academic years here run July–June. */
export function academicYear(d = new Date()) {
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function nowMin() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}
