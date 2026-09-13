"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAdmin } from "@/lib/library";
import { Logo } from "@/components/ui";
import AuthMenu from "@/components/AuthMenu";

export const NAV = [
  { href: "/", label: "Dashboard", emoji: "🏠", primary: true },
  { href: "/day", label: "My Day", emoji: "🗓️", primary: true },
  { href: "/tasks", label: "Tasks", emoji: "✅", primary: true },
  { href: "/focus", label: "Focus", emoji: "⏱️", primary: true },
  { href: "/notifications", label: "Notifications", emoji: "🔔" },
  { href: "/goals", label: "Goals", emoji: "🎯" },
  { href: "/english", label: "English skills", emoji: "🗣️" },
  { href: "/finance", label: "Money manager", emoji: "💰" },
  { href: "/attendance", label: "Attendance", emoji: "📋" },
  { href: "/docs", label: "College Docs", emoji: "📚" },
  { href: "/resources", label: "Resources", emoji: "🧠" },
  { href: "/games", label: "Games", emoji: "🎮" },
  { href: "/planner", label: "Syllabus Planner", emoji: "📐" },
  { href: "/liked", label: "Liked", emoji: "❤️" },
  { href: "/exams", label: "Deadlines", emoji: "⏳" },
  { href: "/profile", label: "Profile", emoji: "👤" },
];

const ADMIN_LINK = { href: "/admin", label: "Admin", emoji: "🛠️" };

function ThemeToggle() {
  const { state, dispatch } = useApp();
  const order = ["system", "light", "dark"];
  const icon = { system: "🖥️", light: "☀️", dark: "🌙" }[state.ui.theme];
  return (
    <button
      className="btn btn-ghost btn-sm"
      title={`Theme: ${state.ui.theme}`}
      onClick={() =>
        dispatch({
          type: "ui",
          payload: { theme: order[(order.indexOf(state.ui.theme) + 1) % order.length] },
        })
      }
    >
      <span aria-hidden>{icon}</span>
      <span className="sr-only">Switch theme</span>
    </button>
  );
}

export default function AppShell({ children }) {
  const { state, ready } = useApp();
  const { isAdmin } = useAdmin();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Setup is a once-per-student thing, so "not onboarded" has to mean the
  // account really hasn't done it — not just that this browser hasn't heard yet.
  // A signed-in student on a new device starts with an empty localStorage and
  // only learns otherwise when the first Firestore snapshot lands.

  // …but a dead connection must not leave anyone staring at a spinner.
  const loader = (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Logo size={44} />
      <div className="animate-pulse text-sm text-muted">Loading your day…</div>
    </div>
  );

  if (!ready) return loader;

  // The onboarding route renders straight away even while the account's copy is
  // still on its way: blanking it would throw away a half-filled form if the
  // student signs in on the last step. That page sends itself home instead.
  // Somewhere else, with no planner yet and the verdict still pending — showing
  // an empty dashboard now would only flash before the redirect.

  // The admin link is hidden from everyone else, but that's cosmetic — the page
  // and the Firestore rules both check admins/{uid} themselves.
  const nav = isAdmin ? [...NAV, ADMIN_LINK] : NAV;
  const primary = nav.filter((n) => n.primary);
  const rest = nav.filter((n) => !n.primary);
  const active = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface p-3 lg:flex">
        <div className="mb-4 flex items-center gap-2 px-2 pt-2">
          <Logo size={32} />
          <div>
            <div className="text-sm font-bold leading-tight">Campus Compass</div>
            <div className="text-[11px] text-muted">Student life planner</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition"
              style={
                active(n.href)
                  ? { background: "var(--accent-soft)", color: "var(--ink)", fontWeight: 600 }
                  : { color: "var(--muted)" }
              }
            >
              <span aria-hidden>{n.emoji}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        {/* The theme toggle lives in the header now, on every screen size. */}
        <div className="mt-auto truncate px-2 pb-2 text-xs text-muted">
          {state.profile.name ? `Hi, ${state.profile.name}` : "Welcome"}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* header — the brand half is only needed where the sidebar is hidden */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-surface/85 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2 lg:hidden">
            <Logo size={24} />
            <span className="text-sm font-bold">Campus Compass</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <AuthMenu />
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 lg:px-8 lg:pb-10">
          {children}
        </main>

        {/* mobile bottom bar */}
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-stretch">
            {primary.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]"
                style={{
                  color: active(n.href) ? "var(--accent)" : "var(--muted)",
                  fontWeight: active(n.href) ? 700 : 500,
                }}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {n.emoji}
                </span>
                {n.label}
              </Link>
            ))}
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]"
              style={{
                color: rest.some((n) => active(n.href)) || moreOpen ? "var(--accent)" : "var(--muted)",
              }}
            >
              <span className="text-lg leading-none" aria-hidden>
                ⋯
              </span>
              More
            </button>
          </div>
          <div style={{ height: "env(safe-area-inset-bottom)" }} />
        </nav>

        {moreOpen ? (
          <div className="no-print fixed inset-0 z-40 lg:hidden">
            <button className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
            <div className="card fade-up absolute inset-x-2 bottom-20 z-10 grid grid-cols-2 gap-2 p-3">
              {rest.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-line px-3 py-3 text-sm"
                >
                  <span aria-hidden>{n.emoji}</span>
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
