"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { useAdmin } from "@/lib/library";
import { Logo } from "@/components/ui";
import AuthMenu from "@/components/AuthMenu";

export const NAV = [
  { href: "/", label: "Dashboard", emoji: "🏠", primary: true },
  { href: "/day", label: "My Day", emoji: "🗓️", primary: true },
  { href: "/tasks", label: "Tasks", emoji: "✅", primary: true },
  { href: "/focus", label: "Focus", emoji: "⏱️", primary: true },
  { href: "/leaderboard", label: "Leaderboard", emoji: "🏆", primary: true },
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

  // Compute pending alert count across deadlines, attendance, budget, tasks
  const alertCount = useMemo(() => {
    let count = 0;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    // Deadlines within 7 days
    count += (state.deadlines || []).filter((d) => !d.done && d.date && d.date <= inSevenDays).length;

    // Low attendance below target
    const req = state.profile?.attendanceRequired ?? 75;
    count += (state.attendance || []).filter(
      (a) => a.total > 0 && Math.round((a.attended / a.total) * 100) < req
    ).length;

    // Overdue or due today tasks
    count += (state.tasks || []).filter((t) => !t.done && t.due && t.due <= todayStr).length;

    // Monthly budget alert
    const budget = state.ui?.budget || 0;
    if (budget > 0) {
      const curMonth = todayStr.slice(0, 7);
      const spent = (state.expenses || [])
        .filter((e) => e.date?.startsWith(curMonth))
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      if (spent >= budget * 0.8) count += 1;
    }

    return count;
  }, [
    state.deadlines,
    state.attendance,
    state.tasks,
    state.expenses,
    state.ui?.budget,
    state.profile?.attendanceRequired,
  ]);

  const loader = (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Logo size={44} />
      <div className="animate-pulse text-sm text-muted">Loading your day…</div>
    </div>
  );

  if (!ready) return loader;

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
        <nav className="flex flex-col gap-0.5 overflow-y-auto pr-1">
          {nav.map((n) => {
            const isNotif = n.href === "/notifications";
            return (
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
                <span>{n.label}</span>
                {isNotif && alertCount > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.2 text-[10px] font-bold text-white leading-tight">
                    {alertCount}
                  </span>
                )}
                {n.href === "/leaderboard" && (
                  <span
                    className="ml-auto text-[9px] font-semibold px-1.5 py-0.2 rounded-full uppercase"
                    style={{ background: "color-mix(in srgb, var(--accent) 20%, transparent)", color: "var(--accent)" }}
                  >
                    XP
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        {/* Profile indicator */}
        <div className="mt-auto truncate px-2 pb-2 text-xs text-muted flex items-center justify-between border-t border-line pt-2">
          <span>{state.profile.name ? `Hi, ${state.profile.name}` : "Welcome"}</span>
          <span className="font-semibold text-accent">{state.xp || 0} XP</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-surface/85 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2 lg:hidden">
            <Logo size={24} />
            <span className="text-sm font-bold">Campus Compass</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Header Notification Bell */}
            <Link
              href="/notifications"
              className="btn btn-ghost btn-sm relative p-2"
              title={`${alertCount} unread alert${alertCount === 1 ? '' : 's'}`}
              aria-label="View notifications"
            >
              <span className="text-base leading-none">🔔</span>
              {alertCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </Link>

            {/* XP Badge in header */}
            <Link
              href="/leaderboard"
              className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition hover:scale-105"
              style={{
                background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)",
                border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
              title="View Leaderboard & XP"
            >
              <span>🏆</span>
              <span>{state.xp || 0} XP</span>
            </Link>

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
                className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] relative"
                style={{
                  color: active(n.href) ? "var(--accent)" : "var(--muted)",
                  fontWeight: active(n.href) ? 700 : 500,
                }}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {n.emoji}
                </span>
                <span className="truncate max-w-[56px] text-center">{n.label}</span>
              </Link>
            ))}
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] relative"
              style={{
                color: rest.some((n) => active(n.href)) || moreOpen ? "var(--accent)" : "var(--muted)",
              }}
            >
              <span className="text-lg leading-none" aria-hidden>
                ⋯
              </span>
              <span>More</span>
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-4 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface" />
              )}
            </button>
          </div>
          <div style={{ height: "env(safe-area-inset-bottom)" }} />
        </nav>

        {moreOpen ? (
          <div className="no-print fixed inset-0 z-40 lg:hidden">
            <button className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
            <div className="card fade-up absolute inset-x-2 bottom-20 z-10 grid grid-cols-2 gap-2 p-3 max-h-[70vh] overflow-y-auto">
              {rest.map((n) => {
                const isNotif = n.href === "/notifications";
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-between rounded-xl border border-line px-3 py-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{n.emoji}</span>
                      <span>{n.label}</span>
                    </span>
                    {isNotif && alertCount > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                        {alertCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
