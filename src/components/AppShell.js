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
  const [notifOpen, setNotifOpen] = useState(false);

  // Compute pending alert count & items across deadlines, attendance, budget, tasks
  const { alertList, alertCount } = useMemo(() => {
    const list = [];
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    // Deadlines within 7 days
    (state.deadlines || [])
      .filter((d) => !d.done && d.date && d.date <= inSevenDays)
      .forEach((d) => {
        list.push({
          id: `deadline-${d.id}`,
          icon: "⏳",
          title: d.title,
          desc: `Due ${d.date}`,
          href: "/exams",
        });
      });

    // Low attendance below target
    const req = state.profile?.attendanceRequired ?? 75;
    (state.attendance || [])
      .filter((a) => a.total > 0 && Math.round((a.attended / a.total) * 100) < req)
      .forEach((a) => {
        list.push({
          id: `att-${a.id}`,
          icon: "📋",
          title: `Low Attendance: ${a.name}`,
          desc: `${Math.round((a.attended / a.total) * 100)}% (Target ${req}%)`,
          href: "/attendance",
        });
      });

    // Overdue or due today tasks
    (state.tasks || [])
      .filter((t) => !t.done && t.due && t.due <= todayStr)
      .forEach((t) => {
        list.push({
          id: `task-${t.id}`,
          icon: "✅",
          title: t.title,
          desc: t.due === todayStr ? "Due today" : `Overdue (${t.due})`,
          href: "/tasks",
        });
      });

    // Monthly budget alert
    const budget = state.ui?.budget || 0;
    if (budget > 0) {
      const curMonth = todayStr.slice(0, 7);
      const spent = (state.expenses || [])
        .filter((e) => e.date?.startsWith(curMonth))
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      if (spent >= budget * 0.8) {
        list.push({
          id: `budget-${curMonth}`,
          icon: spent > budget ? "⚠️" : "💰",
          title: spent > budget ? "Budget Exceeded!" : "Approaching Budget",
          desc: `Spent ₹${spent} of ₹${budget}`,
          href: "/finance",
        });
      }
    }

    return { alertList: list, alertCount: list.length };
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
    <div className="relative flex min-h-screen">
      {/* Ambient background wallpaper & crimson glowing gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={{
          backgroundColor: "#07090e",
          backgroundImage: `
            radial-gradient(ellipse 70% 50% at 85% 12%, rgba(220, 38, 38, 0.16) 0%, rgba(136, 19, 55, 0.08) 40%, transparent 70%),
            radial-gradient(ellipse 55% 45% at 15% 85%, rgba(159, 18, 57, 0.10) 0%, transparent 60%),
            url('/bg-mesh.jpg')
          `,
          backgroundPosition: "top right, bottom left, center center",
          backgroundSize: "100% 100%, 100% 100%, cover",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* desktop sidebar */}
      <aside className="no-print sticky top-0 z-20 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface/80 backdrop-blur-xl p-3 lg:flex">
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

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-surface/80 px-4 py-2.5 backdrop-blur-xl">
          <div className="flex items-center gap-2 lg:hidden">
            <Logo size={24} />
            <span className="text-sm font-bold">Campus Compass</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Header Notification Sign with Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="btn btn-ghost btn-sm relative p-2"
                title={alertCount > 0 ? `${alertCount} unread alert${alertCount === 1 ? '' : 's'}` : "Notifications"}
                aria-label="View notifications"
              >
                <span className="text-base leading-none">🔔</span>
                {alertCount > 0 && (
                  <>
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow">
                      {alertCount > 9 ? "9+" : alertCount}
                    </span>
                  </>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 card p-3 shadow-2xl fade-up"
                    style={{
                      background: "rgba(16, 20, 32, 0.95)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs uppercase tracking-wider text-ink">Notifications</span>
                        {alertCount > 0 && (
                          <span className="rounded-full bg-red-500/20 text-red-400 px-1.5 py-0.2 text-[10px] font-bold">
                            {alertCount} unread
                          </span>
                        )}
                      </div>
                      <Link
                        href="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-[11px] font-semibold text-accent hover:underline"
                      >
                        All alerts →
                      </Link>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
                      {alertList.length ? (
                        alertList.slice(0, 5).map((item) => (
                          <Link
                            key={item.id}
                            href={item.href || "/notifications"}
                            onClick={() => setNotifOpen(false)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface2 transition border border-transparent hover:border-line"
                          >
                            <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-ink truncate">{item.title}</p>
                              <p className="text-[11px] text-muted">{item.desc}</p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-muted">
                          <span className="text-2xl block mb-1">🎉</span>
                          All caught up! No active alerts.
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-line">
                      <Link
                        href="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="btn btn-sm w-full text-center text-xs justify-center"
                      >
                        Go to Notifications Center →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

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
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/85 backdrop-blur-xl lg:hidden">
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
