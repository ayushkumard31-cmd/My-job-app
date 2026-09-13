"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BRANCHES,
  CAREER_GOALS,
  HOBBIES,
  PRIORITIES,
  catColor,
  subjectsFor,
} from "@/lib/catalog";
import { generateDay } from "@/lib/generator";
import { seedFromGoal, uid as newId, useApp } from "@/lib/store";
import { academicYear, dateKey, fmtDuration, fmtTime, WEEKDAYS } from "@/lib/time";
import { isStorageConfigured, pdfError, uploadPdf } from "@/lib/library";
import { useAuth } from "@/lib/auth";
import { Card, Field, Logo, Segmented } from "@/components/ui";
import { CollegePicker, ErrorNote, PdfField } from "@/components/library";
import AuthMenu from "@/components/AuthMenu";
import SignInForm from "@/components/SignInForm";

const STEPS = [
  { id: "you", title: "About you", emoji: "👋" },
  { id: "college", title: "College & subjects", emoji: "🎓" },
  { id: "time", title: "Your day", emoji: "⏰" },
  { id: "goal", title: "Your goal", emoji: "🎯" },
  { id: "hobbies", title: "Your hobbies", emoji: "🎮" },
  { id: "preview", title: "Your routine", emoji: "✨" },
];

export default function Onboarding() {
  const { state, ready, dispatch } = useApp();
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Asked once, ever. Whoever already has a planner — this browser, or the
  // account whose copy has just arrived from Firestore — goes to their day
  // instead of being taken through setup a second time. (Reset, on the profile
  // page, clears the flag and so deliberately brings this back.)
  const done = ready && state.onboarded;
  useEffect(() => {
    if (done) router.replace("/");
  }, [done, router]);

  const [name, setName] = useState("");
  const [college, setCollege] = useState({ university: "makaut", college: "", collegeName: "" });
  const [branch, setBranch] = useState("cse");
  const [semester, setSemester] = useState(3);
  const [subjects, setSubjects] = useState(() => subjectsFor("cse", 3));
  const [newSubject, setNewSubject] = useState("");

  // Course PDFs are collected here but only uploaded when setup finishes: the
  // student may well sign in on the last step, and an upload needs an account.
  const [courseDocs, setCourseDocs] = useState([]); // { key, title, file, link }
  const uploaded = useRef({}); // doc key -> upload result, so a retry doesn't re-send
  const warned = useRef(false); // a document problem is only allowed to block once
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null); // { title, pct }
  const [problems, setProblems] = useState([]); // docs that couldn't be stored

  const [collegeStart, setCollegeStart] = useState("09:00");
  const [collegeEnd, setCollegeEnd] = useState("16:00");
  const [collegeDays, setCollegeDays] = useState([1, 2, 3, 4, 5]);
  const [wake, setWake] = useState("07:00");
  const [sleep, setSleep] = useState("23:30");
  const [lunch, setLunch] = useState("13:00");
  const [dinner, setDinner] = useState("20:00");

  const [careerGoal, setCareerGoal] = useState("software");
  const [goalMonths, setGoalMonths] = useState(8);
  const [priorities, setPriorities] = useState({
    academics: "high",
    career: "high",
    fitness: "medium",
    hobby: "low",
  });

  const [hobbies, setHobbies] = useState([]);

  const onBranchChange = (b, s = semester) => {
    setBranch(b);
    setSemester(s);
    setSubjects(subjectsFor(b, s));
  };

  const toggleHobby = (id) => {
    setHobbies((h) => {
      if (h.some((x) => x.id === id)) return h.filter((x) => x.id !== id);
      const meta = HOBBIES.find((m) => m.id === id);
      return [...h, { id, daysPerWeek: meta.days, minutes: meta.minutes, priority: "medium" }];
    });
  };

  const profile = useMemo(
    () => ({
      name: name.trim(),
      ...college,
      branch,
      semester,
      subjects,
      wake,
      sleep,
      collegeStart,
      collegeEnd,
      collegeDays,
      lunch,
      dinner,
      careerGoal,
      goalMonths,
      hobbies,
      priorities,
      customActivities: [],
    }),
    [
      name, college, branch, semester, subjects, wake, sleep, collegeStart, collegeEnd,
      collegeDays, lunch, dinner, careerGoal, goalMonths, hobbies, priorities,
    ],
  );

  const preview = useMemo(
    () => generateDay(profile, "college", dateKey()),
    [profile],
  );

  /**
   * Uploads every attached PDF and returns the docs worth saving. Anything that
   * can't be stored (no account, upload failed) comes back as a problem instead
   * of stopping the rest of setup.
   */
  const commitDocs = async () => {
    const docs = [];
    const failed = [];

    for (const d of courseDocs) {
      let up = uploaded.current[d.key] || null;
      let reason = "";

      if (d.file && !up) {
        if (!user?.uid) reason = "sign in to store the file";
        else if (!isStorageConfigured) reason = "file storage isn't set up on this project";
        else {
          try {
            setUploadingDoc({ title: d.title, pct: 0 });
            up = await uploadPdf(`users/${user.uid}/docs`, d.file, (pct) =>
              setUploadingDoc({ title: d.title, pct }),
            );
            uploaded.current[d.key] = up;
          } catch (e) {
            reason = e.message;
          }
        }
      }

      // A pasted link still stands in for a file that wouldn't upload.
      const url = up?.url || d.link;
      if (url) {
        docs.push({
          title: d.title,
          collegeName: "",
          branch,
          semester,
          academicYear: academicYear(),
          url,
          fileName: up?.fileName || "",
          storagePath: up?.storagePath || "",
        });
      } else {
        failed.push(`${d.title} — ${reason || "nothing attached"}`);
      }
    }

    setUploadingDoc(null);
    return { docs, failed };
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setProblems([]);

    if (!user?.uid) {
      setProblems(["Please log in once to save your planner and keep this setup from appearing again."]);
      setSaving(false);
      return;
    }

    const { docs, failed } = await commitDocs();

    // First time something wouldn't save, stop and say so — pressing again
    // continues without it. Already-uploaded PDFs aren't sent twice.
    if (failed.length && !warned.current) {
      warned.current = true;
      setProblems(failed);
      setSaving(false);
      return;
    }

    dispatch({ type: "onboard", payload: profile });
    subjects.forEach((s) =>
      dispatch({ type: "att.add", payload: { name: s, attended: 0, total: 0 } }),
    );
    docs.forEach((d) => dispatch({ type: "doc.add", payload: d }));
    const seed = seedFromGoal(profile);
    seed.tasks.forEach((t) => dispatch({ type: "task.add", payload: t }));
    seed.goals.forEach((g) => dispatch({ type: "goal.add", payload: g }));
    router.replace("/");
  };

  const canNext = step !== 0 || name.trim().length > 0;
  const pendingUploads = courseDocs.filter((d) => d.file).length;

  // Navigating away — don't flash question one on the way out.
  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-sm text-muted">Opening your planner…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6">
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Logo size={24} /> Campus Compass
          </div>
          {/* Top-right: log in, or continue as a guest. Hidden once signed in,
              and on the last step, which asks the same question properly. */}
          <div className="ml-auto">
            {step < STEPS.length - 1 ? <AuthMenu showProfileLink={false} /> : null}
          </div>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: i <= step ? "var(--accent)" : "var(--line)" }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Step {step + 1} of {STEPS.length} · {STEPS[step].title}
        </p>
      </div>

      <div className="flex-1 fade-up" key={step}>
        {step === 0 && (
          <section className="space-y-4">
            <h1 className="text-2xl font-bold">
              Let&apos;s build a day around who you want to become 👋
            </h1>
            <p className="text-sm text-muted">
              Six quick questions. Then you get a routine that fits your college hours, your goal
              and the things you actually enjoy — not a generic timetable.
            </p>
            <Field label="What should we call you?">
              <input
                className="input"
                autoFocus
                placeholder="e.g. Rahul"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <h1 className="text-xl font-bold">Where do you study?</h1>
            <CollegePicker value={college} onChange={(patch) => setCollege({ ...college, ...patch })} />

            <h2 className="text-lg font-bold">Which branch are you in?</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BRANCHES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onBranchChange(b.id)}
                  className="card p-3 text-left text-sm"
                  style={
                    branch === b.id
                      ? { borderColor: "var(--accent)", background: "var(--accent-soft)" }
                      : undefined
                  }
                >
                  <div className="text-lg">{b.emoji}</div>
                  <div className="font-medium leading-tight">{b.label}</div>
                </button>
              ))}
            </div>

            <Field label="Semester">
              <Segmented
                value={semester}
                onChange={(s) => onBranchChange(branch, s)}
                options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: `Sem ${n}` }))}
              />
            </Field>

            <div>
              <span className="label">Subjects this semester</span>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <span key={s} className="chip" data-on="true">
                    {s}
                    <button
                      className="text-muted"
                      onClick={() => setSubjects((list) => list.filter((x) => x !== s))}
                      aria-label={`Remove ${s}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {!subjects.length && <p className="text-sm text-muted">Add your subjects below.</p>}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = newSubject.trim();
                  if (!v) return;
                  setSubjects((l) => (l.includes(v) ? l : [...l, v]));
                  setNewSubject("");
                }}
              >
                <input
                  className="input"
                  placeholder="Add a subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
                <button className="btn" type="submit">
                  Add
                </button>
              </form>
            </div>

            <CourseDocs
              docs={courseDocs}
              signedIn={!!user}
              onAdd={(d) => setCourseDocs((l) => [...l, d])}
              onRemove={(key) => setCourseDocs((l) => l.filter((d) => d.key !== key))}
            />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h1 className="text-xl font-bold">When does your day run?</h1>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Wake up">
                <input type="time" className="input" value={wake} onChange={(e) => setWake(e.target.value)} />
              </Field>
              <Field label="Sleep">
                <input type="time" className="input" value={sleep} onChange={(e) => setSleep(e.target.value)} />
              </Field>
              <Field label="College starts">
                <input
                  type="time"
                  className="input"
                  value={collegeStart}
                  onChange={(e) => setCollegeStart(e.target.value)}
                />
              </Field>
              <Field label="College ends">
                <input
                  type="time"
                  className="input"
                  value={collegeEnd}
                  onChange={(e) => setCollegeEnd(e.target.value)}
                />
              </Field>
              <Field label="Lunch">
                <input type="time" className="input" value={lunch} onChange={(e) => setLunch(e.target.value)} />
              </Field>
              <Field label="Dinner">
                <input type="time" className="input" value={dinner} onChange={(e) => setDinner(e.target.value)} />
              </Field>
            </div>
            <div>
              <span className="label">College days</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => (
                  <button
                    key={d}
                    className="chip"
                    data-on={String(collegeDays.includes(i))}
                    onClick={() =>
                      setCollegeDays((list) =>
                        list.includes(i) ? list.filter((x) => x !== i) : [...list, i].sort(),
                      )
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <h1 className="text-xl font-bold">What are you working towards?</h1>
            <div className="grid gap-2 sm:grid-cols-2">
              {CAREER_GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setCareerGoal(g.id)}
                  className="card p-3 text-left"
                  style={
                    careerGoal === g.id
                      ? { borderColor: "var(--accent)", background: "var(--accent-soft)" }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span>{g.emoji}</span>
                    {g.label}
                  </div>
                  <p className="mt-1 text-xs text-muted">{g.tagline}</p>
                </button>
              ))}
            </div>

            <Field label="I want to get there in" hint="We'll split this into month-by-month milestones.">
              <Segmented
                value={goalMonths}
                onChange={setGoalMonths}
                options={[3, 6, 8, 12, 18, 24].map((m) => ({ value: m, label: `${m} months` }))}
              />
            </Field>

            <div>
              <span className="label">How important is each part of your life?</span>
              <div className="space-y-2">
                {[
                  ["academics", "📚 College studies"],
                  ["career", "💻 Career goal"],
                  ["fitness", "🏋️ Fitness"],
                  ["hobby", "🎮 Hobbies"],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{label}</span>
                    <Segmented
                      value={priorities[key]}
                      onChange={(v) => setPriorities((p) => ({ ...p, [key]: v }))}
                      options={Object.entries(PRIORITIES).map(([id, meta]) => ({
                        value: id,
                        label: meta.label,
                        emoji: meta.dot,
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4">
            <h1 className="text-xl font-bold">What do you enjoy?</h1>
            <p className="text-sm text-muted">
              Pick everything you actually do. Your goals will never delete these — the planner
              finds time for them instead.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HOBBIES.map((h) => (
                <button
                  key={h.id}
                  className="chip"
                  data-on={String(hobbies.some((x) => x.id === h.id))}
                  onClick={() => toggleHobby(h.id)}
                >
                  <span>{h.emoji}</span>
                  {h.label}
                </button>
              ))}
            </div>

            {hobbies.length > 0 && (
              <div className="space-y-2">
                <span className="label">How often?</span>
                {hobbies.map((h) => {
                  const meta = HOBBIES.find((m) => m.id === h.id);
                  return (
                    <div key={h.id} className="card flex flex-wrap items-center gap-2 p-3">
                      <span className="mr-auto text-sm font-medium">
                        {meta.emoji} {meta.label}
                      </span>
                      <select
                        className="select w-auto"
                        value={h.daysPerWeek}
                        onChange={(e) =>
                          setHobbies((list) =>
                            list.map((x) =>
                              x.id === h.id ? { ...x, daysPerWeek: Number(e.target.value) } : x,
                            ),
                          )
                        }
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                          <option key={n} value={n}>
                            {n} day{n > 1 ? "s" : ""}/week
                          </option>
                        ))}
                      </select>
                      <select
                        className="select w-auto"
                        value={h.minutes}
                        onChange={(e) =>
                          setHobbies((list) =>
                            list.map((x) =>
                              x.id === h.id ? { ...x, minutes: Number(e.target.value) } : x,
                            ),
                          )
                        }
                      >
                        {[20, 30, 45, 60, 75, 90, 120].map((n) => (
                          <option key={n} value={n}>
                            {fmtDuration(n)}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {step === 5 && (
          <section className="space-y-3">
            <h1 className="text-xl font-bold">Here&apos;s your day, {name || "friend"} ✨</h1>
            <p className="text-sm text-muted">
              This is a college day. Weekend, exam and vacation versions are built too — and you
              can drag anything around later.
            </p>
            <div className="card divide-y divide-line p-0">
              {preview.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="w-[68px] shrink-0 font-mono text-xs text-muted">
                    {fmtTime(b.start)}
                  </span>
                  <span
                    className="h-7 w-1 shrink-0 rounded-full"
                    style={{ background: catColor(b.category) }}
                  />
                  <span className="text-sm">
                    {b.emoji} {b.label}
                  </span>
                  {b.end > b.start && (
                    <span className="ml-auto text-xs text-muted">{fmtDuration(b.end - b.start)}</span>
                  )}
                </div>
              ))}
            </div>

            <FinishAccount pendingUploads={pendingUploads} />

            {problems.length ? (
              <ErrorNote>
                Couldn&apos;t save {problems.length === 1 ? "this document" : "these documents"}:{" "}
                {problems.join("; ")}. Press again to continue without{" "}
                {problems.length === 1 ? "it" : "them"} — you can add{" "}
                {problems.length === 1 ? "it" : "them"} later from College Documents.
              </ErrorNote>
            ) : null}
          </section>
        )}
      </div>

      <div className="sticky bottom-0 mt-6 flex gap-2 bg-bg/80 py-3 backdrop-blur">
        {step > 0 && (
          <button className="btn" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            className="btn btn-primary flex-1"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </button>
        ) : (
          <button className="btn btn-primary flex-1" onClick={finish} disabled={saving}>
            {uploadingDoc
              ? `Uploading ${uploadingDoc.title}… ${uploadingDoc.pct}%`
              : saving
                ? "Setting things up…"
                : problems.length
                  ? "Continue anyway 🚀"
                  : "Start my planner 🚀"}
          </button>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------- course documents --

const DOC_TYPES = [
  { value: "College Timetable", label: "Timetable", emoji: "📅" },
  { value: "Course Syllabus", label: "Syllabus", emoji: "📘" },
  { value: "Course Handbook", label: "Handbook", emoji: "📗" },
];

/**
 * Picks up the student's own course PDFs during setup. Nothing is uploaded
 * here — the parent does that on finish, once sign-in has had its chance.
 */
function CourseDocs({ docs, signedIn, onAdd, onRemove }) {
  const [title, setTitle] = useState(DOC_TYPES[0].value);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(0); // bumped to clear the file input after adding

  const add = () => {
    const url = link.trim();
    const bad = pdfError(file);
    if (bad) return setError(bad);
    if (!file && !url) return setError("Choose a PDF or paste a link to one.");
    setError("");
    onAdd({ key: newId("cdoc"), title: title.trim() || "Course document", file, link: url });
    setFile(null);
    setLink("");
    setSeq((n) => n + 1);
  };

  return (
    <div>
      <span className="label">Course documents (optional)</span>
      <p className="mb-2 text-xs text-muted">
        Your timetable, syllabus or course handbook — they land in College Documents, one tap
        away all semester.
      </p>

      {docs.length ? (
        <div className="mb-2 space-y-1.5">
          {docs.map((d) => (
            <div key={d.key} className="card flex items-center gap-2 p-2.5">
              <span aria-hidden>📄</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.title}</p>
                <p className="truncate text-xs text-muted">
                  {d.file
                    ? `${d.file.name} — ${(d.file.size / 1024 / 1024).toFixed(1)} MB`
                    : d.link}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-muted"
                onClick={() => onRemove(d.key)}
                aria-label={`Remove ${d.title}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="card space-y-3 p-3">
        <Segmented options={DOC_TYPES} value={title} onChange={setTitle} />

        <PdfField
          key={seq}
          file={file}
          onFile={(f) => {
            setFile(f);
            setError(pdfError(f));
          }}
          label="PDF file"
          hint={
            signedIn
              ? "PDF only, up to 20 MB. Uploads when you finish setup."
              : "PDF only, up to 20 MB. You'll be asked to sign in at the last step so it can be stored."
          }
        />

        <Field label="…or paste a PDF link" hint="Google Drive, your college portal — anything public.">
          <input
            className="input"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
          />
        </Field>

        <ErrorNote>{error}</ErrorNote>

        <button type="button" className="btn w-full" onClick={add}>
          ＋ Add document
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------- last step: account --

/** Log in before finishing so the planner can be remembered and never shown again. */
function FinishAccount({ pendingUploads }) {
  const { user, ready, available } = useAuth();
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);

  // No Firebase keys: there is no account to make, so don't raise the question.
  if (!available) return null;
  if (!ready) {
    return <div className="h-24 animate-pulse rounded-2xl" style={{ background: "var(--line)" }} />;
  }

  if (user) {
    return (
      <Card className="flex items-center gap-3">
        <span className="text-xl" aria-hidden>
          ✅
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Signed in as {user.name || user.email}</p>
          <p className="text-xs text-muted">
            Your planner{pendingUploads ? " and your PDFs" : ""} will be backed up and follow you
            to any device.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-medium">Log in to keep this planner safe</p>
        <p className="text-sm text-muted">
          Sign in once so this setup is saved to your account and never shown again on future
          visits.
          {pendingUploads
            ? ` You'll also need one to store the ${pendingUploads} PDF${pendingUploads > 1 ? "s" : ""} you added.`
            : ""}
        </p>
      </div>

      {open ? (
        <SignInForm onDone={() => setOpen(false)} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            Log in or sign up
          </button>
          {state.ui.guest ? null : (
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: "ui", payload: { guest: true } })}
            >
              Continue as guest
            </button>
          )}
        </div>
      )}

      {state.ui.guest && !open ? (
        <p className="text-xs text-muted">
          Guest mode is still available for browsing, but finishing setup needs a login so your
          planner does not keep coming back.
        </p>
      ) : null}
    </Card>
  );
}
