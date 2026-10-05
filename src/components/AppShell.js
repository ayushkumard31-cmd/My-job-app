"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { useAdmin } from "@/lib/library";
import { Logo } from "@/components/ui";
import AuthMenu from "@/components/AuthMenu";
import {
  LayoutDashboard, CalendarDays, CheckSquare, Timer,
  Trophy, Target, Languages, Wallet, ClipboardList,
  FileText, BookOpen, Gamepad2, BookMarked, Heart,
  Hourglass, User, Shield, Menu, X, Bell,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Navigation Items with Lucide icons & grouping
───────────────────────────────────────────── */
export const NAV = [
  { href: "/", label: "Dashboard", emoji: "🏠", icon: LayoutDashboard, primary: true, group: "core" },
  { href: "/day", label: "My Day", emoji: "🗓️", icon: CalendarDays, primary: true, group: "core" },
  { href: "/tasks", label: "Tasks", emoji: "✅", icon: CheckSquare, primary: true, group: "core" },
  { href: "/focus", label: "Focus", emoji: "⏱️", icon: Timer, primary: true, group: "core" },
  { href: "/leaderboard", label: "Leaderboard", emoji: "🏆", icon: Trophy, primary: true, group: "growth" },
  { href: "/goals", label: "Goals", emoji: "🎯", icon: Target, group: "growth" },
  { href: "/english", label: "English Skills", emoji: "🗣️", icon: Languages, group: "growth" },
  { href: "/finance", label: "Money Manager", emoji: "💰", icon: Wallet, group: "student" },
  { href: "/docs", label: "College Docs", emoji: "📚", icon: FileText, group: "student" },
  { href: "/resources", label: "Resources", emoji: "🧠", icon: BookOpen, group: "student" },
  { href: "/games", label: "Games", emoji: "🎮", icon: Gamepad2, group: "extras" },
  { href: "/planner", label: "Syllabus Planner", emoji: "📐", icon: BookMarked, group: "extras" },
  { href: "/liked", label: "Liked", emoji: "❤️", icon: Heart, group: "extras" },
  { href: "/exams", label: "Deadlines", emoji: "⏳", icon: Hourglass, group: "extras" },
  { href: "/profile", label: "Profile", emoji: "👤", icon: User, group: "extras" },
];

const ADMIN_LINK = { href: "/admin", label: "Admin", emoji: "🛠️", icon: Shield, group: "extras" };

const GROUP_LABELS = {
  core: "Core",
  growth: "Growth",
  student: "Student Life",
  extras: "Extras",
};

/* ─────────────────────────────────────────────
   Theme toggle
───────────────────────────────────────────── */
function ThemeToggle() {
  const { state, dispatch } = useApp();
  const order = ["system", "light", "dark"];
  const icon = { system: "🖥️", light: "☀️", dark: "🌙" }[state.ui.theme];
  return (
    <button
      className="btn btn-ghost btn-sm"
      title={`Theme: ${state.ui.theme}`}
      aria-label={`Switch theme — current: ${state.ui.theme}`}
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

/* ─────────────────────────────────────────────
   Sidebar nav item
───────────────────────────────────────────── */
function NavItem({ item, isActive, alertCount, onClick }) {
  const Icon = item.icon;
  const isNotif = item.href === "/notifications";

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl px-3 py-2 text-[0.8125rem] transition-all duration-150"
      style={
        isActive
          ? {
              background: "var(--accent-soft)",
              color: "var(--ink)",
              fontWeight: 600,
            }
          : { color: "var(--muted)" }
      }
    >
      {Icon && (
        <Icon
          size={18}
          strokeWidth={isActive ? 2.2 : 1.8}
          className="shrink-0 transition-colors"
          style={isActive ? { color: "var(--accent)" } : {}}
          aria-hidden
        />
      )}
      <span className="truncate">{item.label}</span>
      {isNotif && alertCount > 0 && (
        <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
          {alertCount}
        </span>
      )}
      {item.href === "/leaderboard" && (
        <span
          className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase leading-none"
          style={{ background: "color-mix(in srgb, var(--accent) 20%, transparent)", color: "var(--accent)" }}
        >
          XP
        </span>
      )}
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Grouped nav list
───────────────────────────────────────────── */
function GroupedNav({ nav, active, alertCount, onNavClick }) {
  const groups = useMemo(() => {
    const grouped = {};
    nav.forEach((item) => {
      const g = item.group || "extras";
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(item);
    });
    return grouped;
  }, [nav]);

  const groupOrder = ["core", "growth", "student", "extras"];

  return (
    <nav className="flex flex-col gap-0.5 overflow-y-auto pr-1 flex-1">
      {groupOrder.map((groupKey) => {
        const items = groups[groupKey];
        if (!items || items.length === 0) return null;
        return (
          <div key={groupKey}>
            <div className="nav-group-label">{GROUP_LABELS[groupKey]}</div>
            {items.map((n) => (
              <NavItem
                key={n.href}
                item={n}
                isActive={active(n.href)}
                alertCount={alertCount}
                onClick={onNavClick}
              />
            ))}
          </div>
        );
      })}
    </nav>
  );
}

/* ─────────────────────────────────────────────
   Main AppShell
───────────────────────────────────────────── */
export default function AppShell({ children }) {
  const { state, ready } = useApp();
  const { isAdmin } = useAdmin();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const drawerRef = useRef(null);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

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
            linear-gradient(180deg, rgba(7, 9, 14, 0.72) 0%, rgba(7, 9, 14, 0.55) 40%, rgba(7, 9, 14, 0.70) 100%),
            radial-gradient(ellipse 70% 50% at 85% 12%, rgba(220, 38, 38, 0.12) 0%, rgba(136, 19, 55, 0.06) 40%, transparent 70%),
            radial-gradient(ellipse 55% 45% at 15% 85%, rgba(159, 18, 57, 0.07) 0%, transparent 60%),
            url('/bg-mesh.jpg')
          `,
          backgroundPosition: "center, top right, bottom left, center center",
          backgroundSize: "cover, 100% 100%, 100% 100%, cover",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* ══════════════════════════════════════
          Desktop sidebar
      ══════════════════════════════════════ */}
      <aside className="no-print sticky top-0 z-20 hidden h-screen w-[15.5rem] shrink-0 flex-col border-r border-line bg-surface/85 backdrop-blur-2xl lg:flex">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
          <Logo size={30} />
          <div>
            <div className="text-sm font-bold leading-tight tracking-tight">Campus Compass</div>
            <div className="text-[10px] text-muted font-medium">Student Life Planner</div>
          </div>
        </div>

        {/* Grouped Navigation */}
        <GroupedNav nav={nav} active={active} alertCount={alertCount} />

        {/* Profile indicator at bottom */}
        <div className="mt-auto border-t border-line px-4 py-3 flex items-center justify-between">
          <span className="truncate text-xs text-muted">
            {state.profile.name ? `Hi, ${state.profile.name}` : "Welcome"}
          </span>
          <span className="text-xs font-semibold text-accent">{state.xp || 0} XP</span>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          Mobile drawer sidebar
      ══════════════════════════════════════ */}
      {drawerOpen && (
        <>
          <div
            className="drawer-backdrop lg:hidden"
            onClick={closeDrawer}
            aria-hidden
          />
          <div className="drawer-panel lg:hidden" ref={drawerRef}>
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <Logo size={28} />
                <div>
                  <div className="text-sm font-bold leading-tight">Campus Compass</div>
                  <div className="text-[10px] text-muted font-medium">Student Life Planner</div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm p-1.5"
                onClick={closeDrawer}
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grouped Nav */}
            <div className="px-2 py-2">
              <GroupedNav
                nav={nav}
                active={active}
                alertCount={alertCount}
                onNavClick={closeDrawer}
              />
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-line px-4 py-3 flex items-center justify-between">
              <span className="truncate text-xs text-muted">
                {state.profile.name ? `Hi, ${state.profile.name}` : "Welcome"}
              </span>
              <span className="text-xs font-semibold text-accent">{state.xp || 0} XP</span>
            </div>
          </div>
        </>
      )}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* ══════════════════════════════════════
            Header
        ══════════════════════════════════════ */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-surface/80 px-4 py-2.5 backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            {/* Hamburger for mobile/tablet */}
            <button
              className="btn btn-ghost btn-sm p-1.5 lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <Logo size={24} />
              <span className="text-sm font-bold tracking-tight">Campus Compass</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* Header Notification Sign with Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="btn btn-ghost btn-sm relative p-2"
                title={alertCount > 0 ? `${alertCount} unread alert${alertCount === 1 ? '' : 's'}` : "Notifications"}
                aria-label="View notifications"
              >
                <Bell size={18} className="text-muted" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
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
                      background: "rgba(14, 18, 28, 0.96)",
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs uppercase tracking-wider text-ink">Notifications</span>
                        {alertCount > 0 && (
                          <span className="rounded-full bg-red-500/20 text-red-400 px-1.5 py-0.5 text-[10px] font-bold leading-none">
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
              className="hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition hover:scale-[1.03]"
              style={{
                background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)",
                border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
              }}
              title="View Leaderboard & XP"
            >
              <Trophy size={14} />
              <span>{state.xp || 0} XP</span>
            </Link>

            <AuthMenu />
            <ThemeToggle />
          </div>
        </header>

        <main className="page-enter mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 sm:px-5 md:px-6 lg:px-8 lg:pb-10 lg:pt-6">
          {children}
        </main>

        {/* ══════════════════════════════════════
            Mobile bottom bar
        ══════════════════════════════════════ */}
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur-2xl lg:hidden">
          <div className="mx-auto flex max-w-lg items-stretch">
            {primary.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] relative"
                  style={{
                    color: active(n.href) ? "var(--accent)" : "var(--muted)",
                    fontWeight: active(n.href) ? 700 : 500,
                  }}
                >
                  {Icon && <Icon size={20} strokeWidth={active(n.href) ? 2.2 : 1.6} aria-hidden />}
                  <span className="truncate max-w-[56px] text-center">{n.label}</span>
                  {active(n.href) && (
                    <span
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] relative"
              style={{
                color: rest.some((n) => active(n.href)) || moreOpen ? "var(--accent)" : "var(--muted)",
              }}
            >
              <Menu size={20} strokeWidth={1.6} aria-hidden />
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
            <button className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setMoreOpen(false)} />
            <div className="card fade-up absolute inset-x-3 bottom-20 z-10 grid grid-cols-2 gap-2 p-3 max-h-[70vh] overflow-y-auto">
              {rest.map((n) => {
                const Icon = n.icon;
                const isNotif = n.href === "/notifications";
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center justify-between rounded-xl border border-line px-3 py-3 text-sm hover:border-accent/30 transition"
                  >
                    <span className="flex items-center gap-2">
                      {Icon && <Icon size={16} strokeWidth={1.8} className="text-muted" aria-hidden />}
                      <span>{n.label}</span>
                    </span>
                    {isNotif && alertCount > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
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
