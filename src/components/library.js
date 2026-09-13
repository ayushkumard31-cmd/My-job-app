"use client";

// Shared pieces for the College Docs / Resources / Liked / Admin screens.
// Grouped in one module for the same reason ./ui is: they're small, and they
// always travel together.

import { useState } from "react";
import { BRANCHES, HOBBIES, SEMESTERS, hobbyById, kindById } from "@/lib/catalog";
import { COLLEGES, UNIVERSITIES, collegeById } from "@/lib/colleges";
import { youtubeEmbed, youtubeThumb, youtubeWatch } from "@/lib/library";
import { Empty, Field, Pill } from "./ui";

export function BranchSelector({ value, onChange, includeAll = false, className = "" }) {
  return (
    <select className={`select ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {includeAll ? <option value="">All branches</option> : null}
      {BRANCHES.map((b) => (
        <option key={b.id} value={b.id}>
          {b.emoji} {b.label}
        </option>
      ))}
    </select>
  );
}

export function SemesterSelector({ value, onChange, includeAll = false, className = "" }) {
  return (
    <select
      className={`select ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
    >
      {includeAll ? <option value="">All semesters</option> : null}
      {SEMESTERS.map((s) => (
        <option key={s} value={s}>
          Semester {s}
        </option>
      ))}
    </select>
  );
}

/**
 * University + college in one control. The college list is a convenience, not a
 * register — MAKAUT alone affiliates far more institutes than are listed — so
 * "Other" is a first-class option that keeps whatever the student types.
 */
export function CollegePicker({ value, onChange }) {
  const university = value.university || "makaut";
  const colleges = COLLEGES.filter((c) => c.university === university);
  const known = !!collegeById(value.college);
  const [typing, setTyping] = useState(!known && !!value.collegeName);

  const pick = (id) => {
    if (id === "__other") {
      setTyping(true);
      onChange({ college: "", collegeName: value.collegeName || "" });
      return;
    }
    setTyping(false);
    onChange({ college: id, collegeName: collegeById(id)?.name || "" });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="University">
        <select
          className="select"
          value={university}
          onChange={(e) => {
            setTyping(false);
            onChange({ university: e.target.value, college: "", collegeName: "" });
          }}
        >
          {UNIVERSITIES.map((u) => (
            <option key={u.id} value={u.id}>
              {u.emoji} {u.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="College" hint={typing ? "Not in the list? Type it — everything still works." : undefined}>
        {typing ? (
          <div className="flex gap-2">
            <input
              className="input"
              value={value.collegeName || ""}
              onChange={(e) => onChange({ college: "", collegeName: e.target.value })}
              placeholder="Your college's name"
            />
            <button type="button" className="btn btn-sm" onClick={() => setTyping(false)}>
              List
            </button>
          </div>
        ) : (
          <select className="select" value={value.college || ""} onChange={(e) => pick(e.target.value)}>
            <option value="">— pick your college —</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.city ? ` — ${c.city}` : ""}
              </option>
            ))}
            <option value="__other">Other / not listed…</option>
          </select>
        )}
      </Field>
    </div>
  );
}

export function HobbySelector({ value, onChange, includeAll = false, className = "" }) {
  return (
    <select className={`select ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {includeAll ? <option value="">All hobbies</option> : null}
      {HOBBIES.map((h) => (
        <option key={h.id} value={h.id}>
          {h.emoji} {h.label}
        </option>
      ))}
    </select>
  );
}

export function KindPill({ kind }) {
  const k = kindById(kind);
  return (
    <Pill color={k.color}>
      <span aria-hidden>{k.emoji}</span>
      {k.label}
    </Pill>
  );
}

/**
 * Marks a built-in suggestion, so it's never mistaken for something the
 * student's own college published.
 */
export function StarterPill({ item }) {
  if (item.source !== "starter") return null;
  return <Pill color="#64748b">✨ Starter pack</Pill>;
}

/**
 * The cloud half's status, for screens that always have starter material to
 * show. LibraryState replaces the whole screen; this only adds a line above it,
 * because "Firebase is off" is no reason to hide 60 working resources.
 */
export function CloudNote({ status, error }) {
  if (status === "loading") {
    return <p className="animate-pulse text-xs text-muted">Loading your college&rsquo;s material…</p>;
  }
  if (status === "off") {
    return (
      <p className="text-xs text-muted">
        ☁️ Cloud library is off — showing the built-in starter pack. Add your Firebase keys to
        .env.local to see material your admin uploads.
      </p>
    );
  }
  if (status === "error") {
    return <p className="text-xs" style={{ color: "#ef4444" }}>⚠️ {error}</p>;
  }
  return null;
}

/** loading / error / empty, so no screen has to spell all three out again. */
export function LibraryState({ status, error, empty, children }) {
  if (status === "off") {
    return (
      <Empty
        emoji="☁️"
        title="Cloud library is off"
        hint="Add your Firebase keys to .env.local to load shared study material."
      />
    );
  }
  if (status === "loading") {
    return <div className="animate-pulse py-10 text-center text-sm text-muted">Loading…</div>;
  }
  if (status === "error") {
    return <Empty emoji="⚠️" title="Couldn't load that" hint={error} />;
  }
  if (!children) return empty ?? null;
  return children;
}

// --------------------------------------------------------------- cards --

function Reaction({ on, onClick, onIcon, offIcon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={label}
      className="btn btn-ghost btn-sm"
      style={on ? { color: "var(--accent)" } : { color: "var(--muted)" }}
    >
      <span aria-hidden>{on ? onIcon : offIcon}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function ReactionBar({ item, reactions, showWatched = false }) {
  if (!reactions) return null;
  return (
    <div className="flex items-center gap-0.5">
      {showWatched ? (
        <Reaction
          on={reactions.isWatched(item.id)}
          onClick={() => reactions.toggleWatched(item.id)}
          onIcon="✅"
          offIcon="⭕"
          label="Mark as watched"
        />
      ) : null}
      <Reaction
        on={reactions.isSaved(item.id)}
        onClick={() => reactions.toggleSave(item.id)}
        onIcon="🔖"
        offIcon="📑"
        label="Save for later"
      />
      <Reaction
        on={reactions.isLiked(item.id)}
        onClick={() => reactions.toggleLike(item.id)}
        onIcon="❤️"
        offIcon="🤍"
        label="Like"
      />
    </div>
  );
}

function Meta({ item }) {
  const branch = BRANCHES.find((b) => b.id === item.branch);
  const hobby = item.hobby ? hobbyById(item.hobby) : null;
  const bits = [
    hobby ? `${hobby.emoji} ${hobby.label}` : null,
    branch ? branch.label.replace(/\s*\(.*\)$/, "") : null,
    item.semester ? `Sem ${item.semester}` : null,
    item.subject || null,
    item.unit ? `Unit ${item.unit}` : null,
  ].filter(Boolean);
  return <p className="truncate text-xs text-muted">{bits.join(" • ")}</p>;
}

/** A non-video library item: PDF, link, notes, book… */
export function ResourceCard({ item, reactions, actions }) {
  const href = item.url;
  return (
    <div className="card flex items-start gap-3 p-3">
      <span className="text-2xl leading-none" aria-hidden>
        {kindById(item.kind).emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 font-medium leading-snug">{item.title}</p>
          <ReactionBar item={item} reactions={reactions} />
        </div>
        <Meta item={item} />
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <KindPill kind={item.kind} />
          <StarterPill item={item} />
          {href ? (
            <a className="btn btn-sm" href={href} target="_blank" rel="noopener noreferrer">
              {item.storagePath ? "📄 View PDF" : item.source === "starter" ? "🔎 Find" : "🔗 Open"}
            </a>
          ) : (
            <span className="text-xs text-muted">No link attached</span>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}

/**
 * A YouTube item: thumbnail until clicked, then an inline privacy-mode embed.
 *
 * Starter-pack videos have no id — they point at a YouTube search instead of one
 * fixed video (see @/lib/starter), so there's nothing to embed or thumbnail.
 * Those open out to YouTube from the same card rather than getting a second
 * layout of their own.
 */
export function VideoCard({ item, reactions, actions }) {
  const [playing, setPlaying] = useState(false);
  const id = item.youtubeId;
  const href = id ? youtubeWatch(id) : item.url;
  const watch = () => {
    if (!reactions?.isWatched(item.id)) reactions?.toggleWatched(item.id);
  };

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-video bg-surface2">
        {playing && id ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`${youtubeEmbed(id)}?autoplay=1&rel=0`}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : id ? (
          <button
            type="button"
            className="group absolute inset-0 flex items-center justify-center"
            onClick={() => {
              setPlaying(true);
              watch();
            }}
            aria-label={`Play ${item.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- youtube CDN, no optimiser needed */}
            <img
              src={youtubeThumb(id)}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="relative grid h-12 w-12 place-items-center rounded-full bg-black/60 text-xl text-white transition group-hover:scale-110">
              ▶
            </span>
          </button>
        ) : (
          <a
            className="group absolute inset-0 flex flex-col items-center justify-center gap-2"
            href={href || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={watch}
            aria-label={`Find ${item.title} on YouTube`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-xl text-white transition group-hover:scale-110">
              ▶
            </span>
            <span className="text-xs text-muted">Watch on YouTube</span>
          </a>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 font-medium leading-snug">{item.title}</p>
          <ReactionBar item={item} reactions={reactions} showWatched />
        </div>
        <Meta item={item} />
        {item.channel ? <p className="mt-0.5 text-xs text-muted">📺 {item.channel}</p> : null}
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {reactions?.isWatched(item.id) ? <Pill color="#22c55e">✅ Watched</Pill> : null}
          <StarterPill item={item} />
          {href ? (
            <a className="btn btn-sm" href={href} target="_blank" rel="noopener noreferrer">
              {id ? "Open on YouTube" : "Search on YouTube"}
            </a>
          ) : null}
          {actions}
        </div>
      </div>
    </div>
  );
}

/** Picks the right card for the item's kind. */
export function LibraryItem({ item, reactions, actions }) {
  return item.kind === "video" ? (
    <VideoCard item={item} reactions={reactions} actions={actions} />
  ) : (
    <ResourceCard item={item} reactions={reactions} actions={actions} />
  );
}

// -------------------------------------------------------------- upload --

/**
 * File input + progress bar. `progress` is null when idle, 0-100 while running.
 * Kept controlled so the parent owns the actual upload call.
 */
export function PdfField({ file, onFile, progress, label = "PDF file", hint }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="input file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-2 file:py-1 file:text-xs file:font-semibold"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
      {file ? (
        <span className="mt-1 block text-xs text-muted">
          {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
      {progress !== null && progress !== undefined ? (
        <span className="mt-2 block">
          <span className="bar">
            <i style={{ width: `${progress}%` }} />
          </span>
          <span className="mt-1 block text-xs text-muted">Uploading… {progress}%</span>
        </span>
      ) : null}
    </label>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p
      className="rounded-xl px-3 py-2 text-sm"
      style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444" }}
      role="alert"
    >
      {children}
    </p>
  );
}
