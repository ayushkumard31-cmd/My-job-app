"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  attendanceAdvice,
  attendancePct,
  blocksFor,
  dayProgress,
  doneFor,
  focusMinutes,
  goalProgress,
  modeFor,
  nextBlock,
  useApp,
  weekStats,
} from "@/lib/store";
import { balanceScore } from "@/lib/generator";
import { CATEGORIES, catColor, deadlineType, goalById, modeById, PRIORITIES } from "@/lib/catalog";
import {
  countdownLabel,
  dateKey,
  daysUntil,
  fmtDuration,
  fmtTime,
  greeting,
  longDate,
  nowMin,
  monthLabel,
  weekKeys,
} from "@/lib/time";
import { Card, Empty, Pill, ProgressBar, Ring, SectionHeader } from "@/components/ui";

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const [now, setNow] = useState(() => nowMin());
  const today = dateKey();

  useEffect(() => {
    const t = setInterval(() => setNow(nowMin()), 30000);
    return () => clearInterval(t);
  }, []);

  const blocks = useMemo(() => blocksFor(state, today), [state, today]);
  const done = doneFor(state, today);
  const doneSet = useMemo(() => new Set(done), [done]);
  const progress = dayProgress(state, today);
  const upNext = nextBlock(state, now, today);
  const mode = modeById(modeFor(state, today));
  const balance = balanceScore(blocks, done, state.profile);
  const week = weekStats(state);
  const goal = goalById(state.profile.careerGoal);
  const growth = useMemo(() => weekKeys().map((date) => {
    const skillHit = Object.values(state.english.skills).filter((s) => (s.log[date] || 0) >= s.target).length;
    const goalHit = state.goals.filter((g) => (g.log[date] || 0) >= g.target).length;
    return { date, score: Math.min(100, skillHit * 15 + goalHit * 20 + (state.done[date] || []).length * 5 + focusMinutes(state, date) / 3) };
  }), [state]);
  const todaySkills = Object.values(state.english.skills).filter((s) => (s.log[today] || 0) >= s.target).length;

  const openTasks = state.tasks
    .filter((t) => !t.done)
    .sort(
      (a, b) =>
        PRIORITIES[a.priority].rank - PRIORITIES[b.priority].rank ||
        String(a.due || "9999").localeCompare(String(b.due || "9999")),
    );

  const upcoming = state.deadlines
    .filter((d) => !d.done && daysUntil(d.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const attendance = state.attendance.filter((a) => a.total > 0).slice(0, 5);
  const goalBuckets = useMemo(() => {
    const nowDate = new Date();
    const quarterStart = new Date(nowDate.getFullYear(), Math.floor(nowDate.getMonth() / 3) * 3, 1);
    const halfStart = new Date(nowDate.getFullYear(), nowDate.getMonth() < 6 ? 0 : 6, 1);
    return [
      {
        key: "daily",
        label: "Daily goal",
        period: "Today",
        items: state.goals.filter((g) => g.type === "daily").slice(0, 3),
      },
      {
        key: "monthly",
        label: "Month goal",
        period: monthLabel(nowDate),
        items: state.goals.filter((g) => g.type === "daily" || g.type === "weekly").slice(0, 3),
      },
      {
        key: "quarterly",
        label: "Quarter goal",
        period: `${quarterStart.toLocaleDateString(undefined, { month: "short" })} quarter`,
        items: state.goals.filter((g) => g.target >= 3).slice(0, 3),
      },
      {
        key: "halfyear",
        label: "Half-year goal",
        period: `${halfStart.getFullYear()} half`,
        items: state.goals.slice(0, 3),
      },
    ];
  }, [state.goals]);
  const notifications = useMemo(() => {
    const alerts = [];

    // Deadlines
    (state.deadlines || [])
      .filter((d) => !d.done)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
      .forEach((d) => {
        alerts.push({
          key: `deadline-${d.id}`,
          icon: "⏳",
          title: d.title,
          meta: `${deadlineType(d.type).label} · ${countdownLabel(d.date)}`,
        });
      });

    // Low Attendance warning
    const reqAtt = state.profile?.attendanceRequired ?? 75;
    (state.attendance || []).forEach((a) => {
      if (a.total > 0 && Math.round((a.attended / a.total) * 100) < reqAtt) {
        alerts.push({
          key: `att-${a.id}`,
          icon: "📋",
          title: `Low Attendance: ${a.name} (${Math.round((a.attended / a.total) * 100)}%)`,
          meta: `Target ${reqAtt}% required`,
        });
      }
    });

    // Budget warning
    const budget = state.ui?.budget || 0;
    if (budget > 0) {
      const curMonth = today.slice(0, 7);
      const spent = (state.expenses || []).filter((e) => e.date?.startsWith(curMonth)).reduce((s, e) => s + Number(e.amount || 0), 0);
      if (spent >= budget * 0.8) {
        alerts.push({
          key: `budget-${curMonth}`,
          icon: spent > budget ? "⚠️" : "💰",
          title: spent > budget ? "Monthly Budget Exceeded!" : "Approaching Budget Limit",
          meta: `Spent ₹${spent.toLocaleString("en-IN")} of ₹${budget.toLocaleString("en-IN")}`,
        });
      }
    }

    // Tasks due
    (state.tasks || [])
      .filter((t) => !t.done && (!t.due || t.due <= today))
      .slice(0, 2)
      .forEach((t) => {
        alerts.push({
          key: `task-${t.id}`,
          icon: "✅",
          title: t.title,
          meta: t.due ? `Task · ${countdownLabel(t.due)}` : "Daily task reminder",
        });
      });

    return alerts.slice(0, 5);
  }, [state.deadlines, state.attendance, state.expenses, state.ui?.budget, state.profile?.attendanceRequired, state.tasks, today]);

  return (
    <div className="space-y-5">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting(now)} {state.profile.name ? state.profile.name : ""} 👋
          </h1>
          <p className="text-sm text-muted">{longDate()}</p>
        </div>
        <Link href="/day" className="chip" data-on="true">
          {mode.emoji} {mode.label}
        </Link>
      </header>

      {/* progress + next up */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <Ring value={progress.pct} sub="of today" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Today&apos;s progress</p>
            <p className="text-xs text-muted">
              {progress.completed} of {progress.total} blocks done
            </p>
            <p className="mt-1 text-xs text-muted">
              ⏱️ {fmtDuration(focusMinutes(state, today))} focused ·{" "}
              {openTasks.length} task{openTasks.length === 1 ? "" : "s"} left
            </p>
          </div>
        </Card>

        <Card className="sm:col-span-2">
          <SectionHeader title="Next up" />
          {upNext ? (
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ background: `color-mix(in srgb, ${catColor(upNext.category)} 18%, transparent)` }}
              >
                {upNext.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{upNext.label}</p>
                <p className="text-sm text-muted">
                  {fmtTime(upNext.start)}
                  {upNext.end > upNext.start ? ` – ${fmtTime(upNext.end)}` : ""} ·{" "}
                  {upNext.start > now
                    ? `in ${fmtDuration(upNext.start - now)}`
                    : "happening now"}
                </p>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => dispatch({ type: "toggleDone", payload: { date: today, id: upNext.id } })}
              >
                Done
              </button>
            </div>
          ) : (
            <p className="py-2 text-sm text-muted">
              Nothing left today — you&apos;re clear. Rest well 🌙
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wide text-muted">XP points</p><p className="mt-1 text-2xl font-bold">⭐ {state.xp || 0}</p><p className="text-xs text-muted">Earn 10 XP per target</p></div><Link href="/english" className="text-xs font-medium text-accent">Track skills →</Link></Card>
        <Card className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wide text-muted">English today</p><p className="mt-1 text-2xl font-bold">{todaySkills}/4</p><p className="text-xs text-muted">skills at target</p></div><Link href="/english" className="text-xs font-medium text-accent">Practice →</Link></Card>
        <Card className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wide text-muted">This month spent</p><p className="mt-1 text-2xl font-bold">₹{state.expenses.filter((e) => e.date?.slice(0, 7) === today.slice(0, 7)).reduce((sum, e) => sum + Number(e.amount || 0), 0)}</p><p className="text-xs text-muted">{state.expenses.filter((e) => e.date?.slice(0, 7) === today.slice(0, 7)).length} entries</p></div><Link href="/finance" className="text-xs font-medium text-accent">Manage →</Link></Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {goalBuckets.map((bucket) => (
          <Card key={bucket.key} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">{bucket.label}</p>
                <p className="text-sm font-semibold">{bucket.period}</p>
              </div>
              <Link href="/goals" className="text-xs font-medium text-accent">
                Open
              </Link>
            </div>
            {bucket.items.length ? (
              <div className="space-y-2">
                {bucket.items.map((g) => {
                  const p = goalProgress(g, today);
                  return (
                    <div key={g.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="truncate">
                          {g.emoji} {g.label}
                        </span>
                        <span className="text-muted">
                          {p.value}/{p.target}
                        </span>
                      </div>
                      <ProgressBar value={p.pct} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty emoji="🎯" title="No goals yet" hint="Add one from the Goals page." />
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* schedule */}
        <section>
          <SectionHeader
            title="Today's schedule"
            action={
              <Link href="/day" className="text-xs font-medium text-accent">
                Edit day →
              </Link>
            }
          />
          <Card className="p-0">
            <div className="divide-y divide-line">
              {blocks.map((b) => {
                const isDone = doneSet.has(b.id);
                const isNow = now >= b.start && now < b.end;
                return (
                  <button
                    key={b.id}
                    onClick={() => dispatch({ type: "toggleDone", payload: { date: today, id: b.id } })}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface2"
                    style={isNow ? { background: "var(--accent-soft)" } : undefined}
                  >
                    <span className="w-[66px] shrink-0 font-mono text-xs text-muted">
                      {fmtTime(b.start)}
                    </span>
                    <span
                      className="h-7 w-1 shrink-0 rounded-full"
                      style={{ background: catColor(b.category), opacity: isDone ? 0.35 : 1 }}
                    />
                    <span className={`min-w-0 flex-1 text-sm ${isDone ? "text-muted line-through" : ""}`}>
                      {b.emoji} {b.label}
                    </span>
                    {b.end > b.start && (
                      <span className="shrink-0 text-[11px] text-muted">
                        {fmtDuration(b.end - b.start)}
                      </span>
                    )}
                    <span className="w-4 shrink-0 text-center text-xs">{isDone ? "✓" : ""}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        <section>
          <SectionHeader
            title="Notifications"
            action={
              <Link href="/notifications" className="text-xs font-medium text-accent">
                All alerts →
              </Link>
            }
          />
          <Card className="space-y-2.5">
            {notifications.length ? (
              notifications.map((n) => (
                <div key={n.key} className="flex items-start gap-3 rounded-xl border border-line p-3">
                  <span className="text-lg leading-none" aria-hidden>
                    {n.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted">{n.meta}</p>
                  </div>
                </div>
              ))
            ) : (
              <Empty emoji="🔔" title="Nothing urgent" hint="Exams and schedule reminders will appear here." />
            )}
          </Card>
        </section>

        <div className="space-y-5">
          {/* tasks */}
          <section>
            <SectionHeader
              title="Tasks"
              action={
                <Link href="/tasks" className="text-xs font-medium text-accent">
                  All tasks →
                </Link>
              }
            />
            <Card className="p-0">
              {openTasks.length ? (
                <div className="divide-y divide-line">
                  {openTasks.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center gap-2.5 px-3 py-2.5">
                      <button
                        className="h-4 w-4 shrink-0 rounded border border-line"
                        onClick={() => dispatch({ type: "task.toggle", payload: { id: t.id } })}
                        aria-label="Complete task"
                        style={{ borderColor: PRIORITIES[t.priority].color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                      {t.due && (
                        <span
                          className="shrink-0 text-[11px]"
                          style={{
                            color: daysUntil(t.due) <= 0 ? "#ef4444" : "var(--muted)",
                          }}
                        >
                          {countdownLabel(t.due)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty emoji="🎉" title="No pending tasks" hint="Add one from the Tasks page." />
              )}
            </Card>
          </section>

          <section>
            <SectionHeader
              title="Games"
              action={
                <Link href="/games" className="text-xs font-medium text-accent">
                  Play →
                </Link>
              }
            />
            <Card>
              <p className="text-sm font-semibold">Quick brain break</p>
              <p className="mt-1 text-xs text-muted">
                Coding games and logic puzzles are now in the main menu too.
              </p>
              <Link href="/games" className="mt-3 inline-flex text-xs font-medium text-accent">
                Open games →
              </Link>
            </Card>
          </section>

          {/* today's goals */}
          <section>
            <SectionHeader
              title="Today's goals"
              action={
                <Link href="/goals" className="text-xs font-medium text-accent">
                  Goals →
                </Link>
              }
            />
            <Card className="space-y-3">
              {state.goals.length ? (
                state.goals.slice(0, 4).map((g) => {
                  const p = goalProgress(g, today);
                  return (
                    <div key={g.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>
                          {g.emoji} {g.label}
                        </span>
                        <span className="text-xs text-muted">
                          {p.value}/{p.target} {g.unit}
                        </span>
                      </div>
                      <ProgressBar value={p.pct} />
                    </div>
                  );
                })
              ) : (
                <Empty emoji="🎯" title="No goals yet" hint="Set daily and weekly goals to track streaks." />
              )}
            </Card>
          </section>
        </div>

        {/* attendance */}
        <section>
          <SectionHeader
            title="Attendance"
            action={
              <Link href="/attendance" className="text-xs font-medium text-accent">
                Manage →
              </Link>
            }
          />
          <Card className="space-y-2.5">
            {attendance.length ? (
              attendance.map((a) => {
                const pct = attendancePct(a);
                const advice = attendanceAdvice(a);
                const color = pct >= 75 ? "#22c55e" : pct >= 65 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={a.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{a.name}</span>
                      <span className="font-semibold" style={{ color }}>
                        {pct}%
                      </span>
                    </div>
                    <ProgressBar value={pct} color={color} />
                    <p className="mt-0.5 text-[11px] text-muted">{advice.text}</p>
                  </div>
                );
              })
            ) : (
              <Empty
                emoji="📋"
                title="No attendance yet"
                hint="Mark a class present or absent to start tracking."
              />
            )}
          </Card>
        </section>

        {/* upcoming */}
        <section>
          <SectionHeader
            title="Upcoming"
            action={
              <Link href="/exams" className="text-xs font-medium text-accent">
                All deadlines →
              </Link>
            }
          />
          <Card className="p-0">
            {upcoming.length ? (
              <div className="divide-y divide-line">
                {upcoming.map((d) => {
                  const type = deadlineType(d.type);
                  const days = daysUntil(d.date);
                  return (
                    <div key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="text-lg">{type.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.title}</p>
                        <p className="text-[11px] text-muted">{type.label}</p>
                      </div>
                      <Pill color={days <= 2 ? "#ef4444" : days <= 7 ? "#f59e0b" : "#22c55e"}>
                        {countdownLabel(d.date)}
                      </Pill>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty emoji="🗓️" title="Nothing due" hint="Add exams, assignments and submissions." />
            )}
          </Card>
        </section>
      </div>

      {/* balance + week */}
      <div className="grid gap-3 lg:grid-cols-2">
        <section>
          <SectionHeader title="Growth graph" action={<span className="text-xs text-muted">7-day activity</span>} />
          <Card><div className="flex h-28 items-end gap-2">{growth.map((d) => <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] text-muted">{Math.round(d.score)}</span><div className="w-full rounded-t-md" style={{ height: `${Math.max(5, d.score)}%`, background: "linear-gradient(180deg, var(--accent), #22c55e)" }} /><span className="text-[10px] text-muted">{d.date.slice(-2)}</span></div>)}</div><p className="mt-3 text-[11px] text-muted">Completed routines, focus, goals and English practice.</p></Card>
        </section>
        <section>
          <SectionHeader title={`Life balance · ${balance.overall}%`} />
          <Card className="space-y-2">
            {balance.rows.map((r) => (
              <div key={r.key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-muted">
                  {(CATEGORIES[r.key] || { label: "Sleep" }).label}
                </span>
                <ProgressBar
                  className="flex-1"
                  value={r.value}
                  color={(CATEGORIES[r.key] || {}).color || "#64748b"}
                />
                <span className="w-9 shrink-0 text-right text-xs text-muted">{r.value}%</span>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted">
              Based on what you ticked off today — study, career work, fitness, hobbies and sleep.
            </p>
          </Card>
        </section>

        <section>
          <SectionHeader title="This week" />
          <Card>
            <div className="flex items-end gap-2">
              {week.perDay.map((d) => {
                const h = Math.min(100, (d.minutes / 240) * 100);
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-20 w-full items-end rounded-md bg-surface2">
                      <div
                        className="w-full rounded-md"
                        style={{ height: `${Math.max(4, h)}%`, background: "var(--accent)" }}
                      />
                    </div>
                    <span className="text-[10px] text-muted">{d.date.slice(-2)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>⏱️ {fmtDuration(week.focusMins)} focused</span>
              <span>✅ {week.tasksDone} tasks done</span>
              <Link href="/goals" className="text-accent">
                {goal.emoji} {goal.label}
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
