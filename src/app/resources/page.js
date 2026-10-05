"use client";

// Resources: everything an admin has published, narrowed down to what this
// student actually needs. Branch and semester come from their profile, so the
// default view is already correct and the pickers are only there for when they
// want to look at someone else's semester.

import { useMemo, useState } from "react";
import { Card, Empty, Field, PageHeader, Pill, Segmented } from "@/components/ui";
import {
  BranchSelector,
  CloudNote,
  HobbySelector,
  LibraryItem,
  ReactionBar,
  SemesterSelector,
} from "@/components/library";
import { HOBBIES, RESOURCE_KINDS, UNITS, hobbyById, subjectsFor } from "@/lib/catalog";
import { GAME_TAGS, gameItemsFor, tagById } from "@/lib/games";
import { useApp } from "@/lib/store";
import { groupBySubject, useHobbyResources, useReactions, useSubjectResources } from "@/lib/library";

const TABS = [
  { value: "subject", label: "By Subject", emoji: "📚" },
  { value: "videos", label: "Videos", emoji: "🎥" },
  { value: "games", label: "Coding Games", emoji: "🎮" },
  { value: "hobby", label: "Hobbies", emoji: "🎨" },
];

export default function Resources() {
  const [tab, setTab] = useState("subject");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Resources"
        emoji="📚"
        subtitle="Notes, PYQs, important questions, lab manuals, books, videos and hobby material — filtered to your branch and semester."
      />

      <Segmented options={TABS} value={tab} onChange={setTab} />

      {tab === "subject" ? (
        <SubjectTab />
      ) : tab === "videos" ? (
        <VideosTab />
      ) : tab === "games" ? (
        <GamesTab />
      ) : (
        <HobbyTab />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- games --

function GamesTab() {
  const { state, dispatch } = useApp();
  const reactions = useReactions(state, dispatch);
  const [tag, setTag] = useState("");
  const games = useMemo(() => gameItemsFor(tag), [tag]);

  return (
    <div className="space-y-3">
      <Segmented
        value={tag}
        onChange={setTag}
        options={[
          { value: "", label: "All", emoji: "🎮" },
          ...GAME_TAGS.map((t) => ({ value: t.id, label: t.label, emoji: t.emoji })),
        ]}
      />

      <p className="text-xs text-muted">
        Practice that doesn&rsquo;t feel like practice. Everything here is free to start;
        &ldquo;paid parts&rdquo; means the first levels are open and the rest isn&rsquo;t.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((g) => (
          <div key={g.id} className="card flex flex-col gap-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-2xl leading-none" aria-hidden>
                  {g.emoji}
                </span>
                <p className="min-w-0 font-medium leading-snug">{g.title}</p>
              </div>
              <ReactionBar item={g} reactions={reactions} />
            </div>
            <p className="text-sm text-muted">{g.description}</p>
            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
              {g.tags.map((t) => {
                const meta = tagById(t);
                return meta ? (
                  <Pill key={t} color="#6366f1">
                    {meta.emoji} {meta.label}
                  </Pill>
                ) : null;
              })}
              {g.free === true ? (
                <Pill color="#22c55e">Free</Pill>
              ) : (
                <Pill color="#f59e0b">Free + paid parts</Pill>
              )}
              <a className="btn btn-sm" href={g.url} target="_blank" rel="noopener noreferrer">
                ▶ Play
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Branch + semester pickers, seeded from the profile. Shared by two tabs. */
function useScope() {
  const { state, dispatch } = useApp();
  const [branch, setBranch] = useState(state.profile.branch);
  const [semester, setSemester] = useState(state.profile.semester);
  const reactions = useReactions(state, dispatch);
  const query = useSubjectResources(branch, semester);
  return { branch, setBranch, semester, setSemester, reactions, ...query };
}

function ScopeCard({ branch, setBranch, semester, setSemester, children }) {
  return (
    <Card className="grid gap-3 sm:grid-cols-2">
      <Field label="Branch">
        <BranchSelector value={branch} onChange={setBranch} />
      </Field>
      <Field label="Semester">
        <SemesterSelector value={semester} onChange={setSemester} />
      </Field>
      {children}
    </Card>
  );
}

// ------------------------------------------------------------- subjects --

function SubjectTab() {
  const { branch, setBranch, semester, setSemester, reactions, items, status, error } = useScope();
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [kind, setKind] = useState("");

  const subjects = useMemo(() => subjectsFor(branch, Number(semester)), [branch, semester]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          i.kind !== "syllabus" &&
          (!subject || i.subject === subject) &&
          (!unit || i.unit === Number(unit)) &&
          (!kind || i.kind === kind),
      ),
    [items, subject, unit, kind],
  );

  const groups = useMemo(() => groupBySubject(filtered, subjects), [filtered, subjects]);

  return (
    <div className="space-y-3">
      <ScopeCard
        branch={branch}
        setBranch={(v) => {
          setBranch(v);
          setSubject(""); // subject lists differ per branch — a stale pick shows nothing
        }}
        semester={semester}
        setSemester={(v) => {
          setSemester(v);
          setSubject("");
        }}
      >
        <Field label="Subject">
          <select className="select" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unit">
          <select className="select" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="">All units</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                Unit {u}
              </option>
            ))}
          </select>
        </Field>
      </ScopeCard>

      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: "", label: "Everything" },
          ...RESOURCE_KINDS.filter((k) => k.subject).map((k) => ({
            value: k.id,
            label: k.label,
            emoji: k.emoji,
          })),
        ]}
      />

      <CloudNote status={status} error={error} />

      {groups.length ? (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.subject} className="space-y-2">
              <h2 className="section-title">{g.subject}</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {g.items.map((item) => (
                  <LibraryItem key={item.id} item={item} reactions={reactions} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            emoji="📚"
            title="Nothing matches that filter"
            hint="Starter material is tagged to the whole subject, so picking a single unit only shows what your admin uploaded."
          />
        </Card>
      )}
    </div>
  );
}

// --------------------------------------------------------------- videos --

function VideosTab() {
  const { branch, setBranch, semester, setSemester, reactions, items, status, error } = useScope();
  const hobbyQuery = useHobbyResources();
  const [source, setSource] = useState("subject");

  const videos = useMemo(() => {
    const list = source === "subject" ? items : hobbyQuery.items;
    return list.filter((i) => i.kind === "video");
  }, [source, items, hobbyQuery.items]);

  const active = source === "subject" ? { status, error } : hobbyQuery;

  return (
    <div className="space-y-3">
      <Segmented
        value={source}
        onChange={setSource}
        options={[
          { value: "subject", label: "Course videos", emoji: "🎓" },
          { value: "hobby", label: "Hobby videos", emoji: "🎨" },
        ]}
      />

      {source === "subject" ? (
        <ScopeCard
          branch={branch}
          setBranch={setBranch}
          semester={semester}
          setSemester={setSemester}
        />
      ) : null}

      <CloudNote status={active.status} error={active.error} />

      {videos.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((item) => (
            <LibraryItem key={item.id} item={item} reactions={reactions} />
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            emoji="🎥"
            title="No videos yet"
            hint="Admins add YouTube links per subject or hobby — they play right here."
          />
        </Card>
      )}
    </div>
  );
}

// -------------------------------------------------------------- hobbies --

function HobbyTab() {
  const { state, dispatch } = useApp();
  const reactions = useReactions(state, dispatch);
  const { items, status, error } = useHobbyResources();

  // The hobbies picked at onboarding, as ids.
  const mine = useMemo(() => (state.profile.hobbies || []).map((h) => h.id), [state.profile.hobbies]);
  const [hobby, setHobby] = useState("");
  const [onlyMine, setOnlyMine] = useState(mine.length > 0);

  const filtered = useMemo(() => {
    let list = items;
    if (hobby) list = list.filter((i) => i.hobby === hobby);
    else if (onlyMine && mine.length) list = list.filter((i) => mine.includes(i.hobby));
    return list;
  }, [items, hobby, onlyMine, mine]);

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((i) => {
      if (!map.has(i.hobby)) map.set(i.hobby, []);
      map.get(i.hobby).push(i);
    });
    return [...map.entries()].map(([id, list]) => ({
      hobby: hobbyById(id) || { id, label: "Other", emoji: "✨" },
      items: list,
    }));
  }, [filtered]);

  return (
    <div className="space-y-3">
      <Card className="space-y-3">
        <Field label="Hobby">
          <HobbySelector value={hobby} onChange={setHobby} includeAll />
        </Field>
        {mine.length ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyMine}
              disabled={!!hobby}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            Only show my hobbies (
            {mine.map((id) => hobbyById(id)?.label).filter(Boolean).join(", ")})
          </label>
        ) : (
          <p className="text-xs text-muted">
            Pick your hobbies in Profile and this page will filter itself for you.
          </p>
        )}
      </Card>

      <CloudNote status={status} error={error} />

      {groups.length ? (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.hobby.id} className="space-y-2">
              <h2 className="section-title">
                {g.hobby.emoji} {g.hobby.label}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {g.items.map((item) => (
                  <LibraryItem key={item.id} item={item} reactions={reactions} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            emoji="🎨"
            title="No hobby resources yet"
            hint={
              HOBBIES.length && onlyMine
                ? "Nothing for your hobbies yet — untick the filter to see everything."
                : "Admins publish tutorials and videos per hobby from the Admin panel."
            }
          />
        </Card>
      )}
    </div>
  );
}
