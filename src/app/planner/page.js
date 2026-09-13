"use client";

// Syllabus Planner: drop in the PDF your department handed out, get back an
// honest answer to "how long will this actually take me, and what do I do
// tomorrow" — plus the videos, notes and past papers for each unit.
//
// The PDF never leaves the browser: pdf.js reads it locally and only the text
// is kept, in this page's state. Nothing is uploaded and nothing is saved
// unless you press "Add to Tasks".
//
// All the thinking lives in @/lib/syllabus; this file is the form around it.

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card, Empty, Field, Pill, Segmented, Stat } from "@/components/ui";
import { ErrorNote, LibraryItem, PdfField } from "@/components/library";
import { useApp } from "@/lib/store";
import { packForSubject } from "@/lib/starter";
import { webSearch, ytSearch } from "@/lib/links";
import { dateKey, shortDate } from "@/lib/time";
import {
  DEPTHS,
  FAMILIARITY,
  estimate,
  fmtH,
  parseSyllabus,
  phaseMeta,
  readPdf,
  schedule,
  syllabusFileError,
} from "@/lib/syllabus";

export default function Planner() {
  const { dispatch } = useApp();

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const [subjectOverride, setSubjectOverride] = useState("");
  const [depth, setDepth] = useState("exam");
  const [familiarity, setFamiliarity] = useState("new");
  const [daily, setDaily] = useState(120);
  const [daysPerWeek, setDaysPerWeek] = useState(6);
  const [examDate, setExamDate] = useState("");
  const [allDays, setAllDays] = useState(false);
  const [openUnit, setOpenUnit] = useState(null);
  const [added, setAdded] = useState("");

  const parsed = useMemo(() => parseSyllabus(text), [text]);
  const subject = subjectOverride || parsed.subject;
  const est = useMemo(
    () => estimate(parsed.units, { depth, familiarity }),
    [parsed.units, depth, familiarity],
  );
  const plan = useMemo(
    () => schedule(est, { dailyMinutes: daily, daysPerWeek, examDate }),
    [est, daily, daysPerWeek, examDate],
  );

  const ready = parsed.units.length > 0;

  const onFile = async (file) => {
    setError("");
    setAdded("");
    if (!file) return;
    const bad = syllabusFileError(file);
    if (bad) return setError(bad);

    setFileName(file.name);
    setProgress(0);
    try {
      const raw = await readPdf(file, setProgress);
      setProgress(null);
      const found = parseSyllabus(raw);
      setText(raw);
      setSubjectOverride("");
      if (!found.units.length) {
        setError(
          raw.trim().length < 40
            ? "No text in that PDF — it's probably a scan or photo. Type or paste the syllabus below instead."
            : "Read the PDF, but couldn't find any units in it. Check the text below and fix it by hand.",
        );
        setEditing(true);
      }
    } catch (e) {
      setProgress(null);
      setError(`Couldn't read that PDF: ${e.message}`);
    }
  };

  const addToTasks = () => {
    est.units.forEach((u) => {
      const last = [...plan.days].reverse().find((d) => d.blocks.some((b) => b.unit === u.n));
      dispatch({
        type: "task.add",
        payload: {
          title: `${subject ? `${subject}: ` : ""}Finish ${u.title}`,
          due: last?.date || dateKey(),
          category: "academics",
          priority: "high",
          subject,
        },
      });
    });
    if (examDate) {
      dispatch({
        type: "deadline.add",
        payload: { title: `${subject || "Subject"} exam`, type: "exam", date: examDate, subject, stages: {} },
      });
    }
    setAdded(
      `Added ${est.units.length} task${est.units.length === 1 ? "" : "s"}${examDate ? " and the exam deadline" : ""}.`,
    );
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Syllabus Planner</h1>
        <p className="text-sm text-muted">
          Give it your subject&rsquo;s syllabus PDF. It works out how long the subject really takes,
          spreads it over your days, and pulls the videos, notes and past papers for every unit.
        </p>
      </header>

      <SourceCard
        fileName={fileName}
        progress={progress}
        onFile={onFile}
        text={text}
        setText={(v) => {
          setText(v);
          setAdded("");
        }}
        editing={editing}
        setEditing={setEditing}
        error={error}
        parsed={parsed}
      />

      {ready ? (
        <>
          <SettingsCard
            subject={subject}
            setSubject={setSubjectOverride}
            depth={depth}
            setDepth={setDepth}
            familiarity={familiarity}
            setFamiliarity={setFamiliarity}
            daily={daily}
            setDaily={setDaily}
            daysPerWeek={daysPerWeek}
            setDaysPerWeek={setDaysPerWeek}
            examDate={examDate}
            setExamDate={setExamDate}
          />

          <Summary est={est} plan={plan} daily={daily} />

          <Units est={est} subject={subject} open={openUnit} setOpen={setOpenUnit} />

          <Days plan={plan} all={allDays} setAll={setAllDays} />

          <Card className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" onClick={addToTasks}>
              ＋ Add units to Tasks
            </button>
            <button className="btn" onClick={() => window.print()}>
              🖨️ Print the plan
            </button>
            <Link className="btn" href="/focus">
              ⏱️ Start a focus session
            </Link>
            {added ? <span className="text-sm" style={{ color: "var(--accent)" }}>{added}</span> : null}
          </Card>

          <SubjectResources subject={subject} />
        </>
      ) : null}

      {!ready && text ? (
        <Card>
          <Empty
            emoji="🤔"
            title="Nothing recognisable in there yet"
            hint="Paste the unit-wise syllabus text above — the parser looks for lines like “Unit 3”, “Module-II” or a bulleted topic list."
          />
        </Card>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------- source --

function SourceCard({ fileName, progress, onFile, text, setText, editing, setEditing, error, parsed }) {
  const ref = useRef(null);

  return (
    <Card className="space-y-3">
      <PdfField
        file={null}
        onFile={onFile}
        progress={progress}
        label="Syllabus PDF"
        hint="Read in your browser — the file is never uploaded anywhere."
      />

      <ErrorNote>{error}</ErrorNote>

      {parsed.units.length ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {fileName ? <Pill color="#64748b">📄 {fileName}</Pill> : null}
          <Pill color="#22c55e">
            ✅ {parsed.units.length} unit{parsed.units.length === 1 ? "" : "s"}
          </Pill>
          <Pill color="#0ea5e9">
            {parsed.units.reduce((a, u) => a + u.topics.length, 0)} topics
          </Pill>
          {parsed.code ? <Pill color="#8b5cf6">{parsed.code}</Pill> : null}
          {parsed.source === "flat" ? (
            <span className="text-xs text-muted">
              No unit headings found, so it&rsquo;s been split into equal parts.
            </span>
          ) : null}
        </div>
      ) : null}

      <button
        className="btn btn-ghost btn-sm"
        onClick={() => {
          setEditing((v) => !v);
          setTimeout(() => ref.current?.focus(), 0);
        }}
      >
        {editing ? "Hide the text" : text ? "✏️ Wrong? Edit the text" : "⌨️ Or paste the syllabus text"}
      </button>

      {editing ? (
        <Field
          label="Syllabus text"
          hint="Edit freely — the plan below rebuilds as you type. Keep the “Unit 1 / Module-II” headings if there are any."
        >
          <textarea
            ref={ref}
            className="textarea font-mono text-xs"
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Unit 1: Introduction [8L]\nTopic one, topic two, topic three\n\nUnit 2: ..."}
          />
        </Field>
      ) : null}
    </Card>
  );
}

// ------------------------------------------------------------ settings --

const WEEK_OPTIONS = [
  { value: 4, label: "4 days" },
  { value: 5, label: "5 days" },
  { value: 6, label: "6 days" },
  { value: 7, label: "Every day" },
];

function SettingsCard({
  subject,
  setSubject,
  depth,
  setDepth,
  familiarity,
  setFamiliarity,
  daily,
  setDaily,
  daysPerWeek,
  setDaysPerWeek,
  examDate,
  setExamDate,
}) {
  const d = DEPTHS.find((x) => x.id === depth);
  return (
    <Card className="space-y-3">
      <Field label="Subject" hint="Used for the video, notes and past-paper searches below.">
        <input
          className="input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Data Structures & Algorithms"
        />
      </Field>

      <div>
        <span className="label">How well do you want to know it?</span>
        <Segmented
          value={depth}
          onChange={setDepth}
          options={DEPTHS.map((x) => ({ value: x.id, label: x.label, emoji: x.emoji }))}
        />
        <p className="mt-1 text-xs text-muted">{d?.hint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Where you're starting from">
          <select
            className="select"
            value={familiarity}
            onChange={(e) => setFamiliarity(e.target.value)}
          >
            {FAMILIARITY.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Study days per week">
          <select
            className="select"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
          >
            {WEEK_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={`Time for this subject each day — ${fmtH(daily)}`}>
        <input
          type="range"
          min={30}
          max={300}
          step={15}
          value={daily}
          onChange={(e) => setDaily(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field label="Exam date" hint="Optional — it tells you whether this plan actually lands in time.">
        <input
          type="date"
          className="input"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
        />
      </Field>
    </Card>
  );
}

// ------------------------------------------------------------- summary --

function Summary({ est, plan, daily }) {
  const v = plan.verdict;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total time" value={fmtH(plan.scheduled)} emoji="⏳" />
        <Stat label="Study days" value={plan.totalDays} sub={`at ${fmtH(daily)}/day`} emoji="📆" />
        <Stat label="Finish on" value={shortDate(plan.finish)} emoji="🏁" />
        <Stat label="Topics" value={est.topics} sub={`${est.units.length} units`} emoji="📚" />
      </div>

      <Card className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Pill color="#0ea5e9">📖 Learn {fmtH(est.study)}</Pill>
          <Pill color="#8b5cf6">✏️ Practice {fmtH(est.practice)}</Pill>
          <Pill color="#f59e0b">🔁 Revise {fmtH(est.revision)}</Pill>
          <Pill color="#ef4444">🗂️ Papers + mock {fmtH(plan.scheduled - est.total)}</Pill>
        </div>
        <p className="text-xs text-muted">
          Worked out from the topics in your PDF and the lecture hours it declares — at least 45
          minutes of self-study per lecture hour. It&rsquo;s a planning number, not a promise: log a
          few days on the Focus page and adjust the slider to match how you actually work.
        </p>
        {v ? (
          <p
            className="rounded-xl px-3 py-2 text-sm"
            style={{
              background: `color-mix(in srgb, ${v.ok ? "#22c55e" : "#ef4444"} 12%, transparent)`,
              color: v.ok ? "#22c55e" : "#ef4444",
            }}
          >
            {v.ok ? "✅ " : "⚠️ "}
            {v.text}
          </p>
        ) : null}
      </Card>
    </div>
  );
}

// --------------------------------------------------------------- units --

function Units({ est, subject, open, setOpen }) {
  return (
    <section className="space-y-2">
      <h2 className="section-title">Unit by unit</h2>
      {est.units.map((u) => {
        const isOpen = open === u.n;
        const q = `${subject} ${u.title}`.trim();
        return (
          <Card key={u.n} className="space-y-2">
            <button
              className="flex w-full items-start justify-between gap-3 text-left"
              onClick={() => setOpen(isOpen ? null : u.n)}
            >
              <div className="min-w-0">
                <p className="font-medium leading-snug">
                  Unit {u.n} — {u.title}
                </p>
                <p className="text-xs text-muted">
                  {u.topics.length} topics
                  {u.hours ? ` • ${u.hours} lecture hours` : ""} • {fmtH(u.total)} of work
                </p>
              </div>
              <span className="shrink-0 text-muted" aria-hidden>
                {isOpen ? "▾" : "▸"}
              </span>
            </button>

            <div className="flex flex-wrap gap-1.5">
              <LinkBtn href={ytSearch(`${q} full lecture`)}>🎥 Videos</LinkBtn>
              <LinkBtn href={ytSearch(`${q} one shot revision`)}>⚡ One-shot</LinkBtn>
              <LinkBtn href={webSearch(`${q} notes pdf`)}>📄 Notes</LinkBtn>
              <LinkBtn href={webSearch(`${subject} previous year question paper pdf`)}>🗂️ PYQs</LinkBtn>
              <LinkBtn href={webSearch(`${q} important questions`)}>⭐ Important Qs</LinkBtn>
            </div>

            {isOpen ? (
              <ul className="space-y-1 border-t border-line pt-2 text-sm">
                {u.topics.map((t, i) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <span className="min-w-0">{t}</span>
                    <a
                      className="shrink-0 text-xs text-muted underline"
                      href={ytSearch(`${subject} ${t}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      video
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        );
      })}
    </section>
  );
}

function LinkBtn({ href, children }) {
  return (
    <a className="btn btn-sm" href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

// ---------------------------------------------------------------- days --

const SHOWN = 10;

function Days({ plan, all, setAll }) {
  const days = all ? plan.days : plan.days.slice(0, SHOWN);
  return (
    <section className="space-y-2">
      <h2 className="section-title">Day by day</h2>
      <div className="space-y-2">
        {days.map((d, i) => (
          <Card key={d.date} className="flex items-start gap-3">
            <div className="w-14 shrink-0 text-center">
              <div className="text-xs text-muted">{d.day}</div>
              <div className="text-sm font-semibold">{shortDate(d.date)}</div>
              <div className="text-[11px] text-muted">{fmtH(d.minutes)}</div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1">
              {d.blocks.map((b, j) => {
                const meta = phaseMeta(b.type);
                return (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span aria-hidden>{meta.emoji}</span>
                    <span className="min-w-0 flex-1">
                      {b.label}
                      {b.part ? (
                        <span className="text-muted"> (part {b.part.i}/{b.part.of})</span>
                      ) : null}
                      {b.carry ? <span className="text-muted"> ↻</span> : null}
                      {b.unit ? <span className="text-xs text-muted"> · Unit {b.unit}</span> : null}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{b.minutes}m</span>
                  </li>
                );
              })}
            </ul>
            {i === 0 ? <Pill color="#22c55e">Start here</Pill> : null}
          </Card>
        ))}
      </div>
      {plan.days.length > SHOWN ? (
        <button className="btn btn-sm w-full" onClick={() => setAll(!all)}>
          {all ? "Show fewer days" : `Show all ${plan.days.length} days`}
        </button>
      ) : null}
    </section>
  );
}

// ----------------------------------------------------------- resources --

function SubjectResources({ subject }) {
  const items = useMemo(() => packForSubject(subject), [subject]);
  if (!subject || !items.length) return null;

  const videos = items.filter((i) => i.kind === "video");
  const rest = items.filter((i) => i.kind !== "video");

  return (
    <section className="space-y-3">
      <h2 className="section-title">Everything else for {subject}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {videos.map((item) => (
          <LibraryItem key={item.id} item={item} />
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {rest.map((item) => (
          <LibraryItem key={item.id} item={item} />
        ))}
      </div>
      <p className="text-xs text-muted">
        These aren&rsquo;t saved anywhere — the same material, likeable and filtered to your
        semester, lives on the{" "}
        <Link href="/resources" className="underline">
          Resources
        </Link>{" "}
        page.
      </p>
    </section>
  );
}
