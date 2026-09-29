"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
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
import {
  CATEGORIES,
  catColor,
  PRIORITIES,
} from "@/lib/catalog";
import {
  dateKey,
  fmtDuration,
  fmtTime,
  greeting,
  longDate,
  nowMin,
  weekKeys,
} from "@/lib/time";
import { Card, Empty, ProgressBar, Ring, SectionHeader } from "@/components/ui";

/* ─────────────────────────────────────────────
   Helper: Catmull-Rom to Cubic Bezier Spline
───────────────────────────────────────────── */
function buildSplineAreaPath(points, height, bottomPadding) {
  if (!points || points.length === 0) return { linePath: "", areaPath: "" };
  if (points.length === 1) {
    const p = points[0];
    return {
      linePath: `M ${p.x} ${p.y}`,
      areaPath: `M ${p.x} ${p.y} L ${p.x} ${height - bottomPadding} Z`,
    };
  }

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x} ${height - bottomPadding} L ${firstPoint.x} ${height - bottomPadding} Z`;

  return { linePath, areaPath };
}

/* ─────────────────────────────────────────────
   Component: Digital Wellbeing Growth Graph
───────────────────────────────────────────── */
function GrowthGraph({ growth, week }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Summary metrics
  const avgScore = useMemo(() => {
    if (!growth.length) return 0;
    return Math.round(growth.reduce((sum, g) => sum + g.score, 0) / growth.length);
  }, [growth]);

  const peakScore = useMemo(() => {
    if (!growth.length) return 0;
    return Math.max(...growth.map((g) => g.score));
  }, [growth]);

  const todayScore = useMemo(() => {
    return growth.find((g) => g.isToday)?.score || 0;
  }, [growth]);

  // SVG Chart Geometry
  const width = 540;
  const height = 180;
  const padX = 36;
  const padTop = 26;
  const padBottom = 30;

  const points = useMemo(() => {
    if (!growth.length) return [];
    const stepX = (width - padX * 2) / Math.max(1, growth.length - 1);
    const usableH = height - padTop - padBottom;

    return growth.map((g, idx) => {
      const x = padX + idx * stepX;
      // Clamp between 4% and 96% for aesthetic curve
      const normalizedScore = Math.max(4, Math.min(100, g.score));
      const y = height - padBottom - (normalizedScore / 100) * usableH;
      return { x, y, ...g, idx };
    });
  }, [growth]);

  const { linePath, areaPath } = useMemo(() => {
    return buildSplineAreaPath(points, height, padBottom);
  }, [points]);

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points.find((p) => p.isToday) || points[points.length - 1];

  return (
    <div
      className="card relative flex flex-col justify-between overflow-hidden p-4 sm:p-5"
      style={{
        background: "rgba(14, 18, 28, 0.78)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Ambient background glow matching crimson silk wallpaper */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(244, 63, 94, 0.22) 0%, rgba(99, 102, 241, 0.08) 60%, transparent 80%)",
          filter: "blur(32px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)",
          filter: "blur(28px)",
        }}
      />

      {/* Header Row */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
              Digital Wellbeing Growth
            </h2>
          </div>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              {todayScore}%
            </span>
            <span className="text-xs text-muted font-medium">today&apos;s score</span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: todayScore >= 70 ? "rgba(16, 185, 129, 0.18)" : "rgba(244, 63, 94, 0.18)",
                color: todayScore >= 70 ? "#34d399" : "#fb7185",
                border: todayScore >= 70 ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(244, 63, 94, 0.3)",
              }}
            >
              {todayScore >= 70 ? "🔥 High Consistency" : todayScore >= 40 ? "⚡ Steady Pace" : "🌱 Building Pace"}
            </span>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="flex items-center gap-2 sm:gap-3 text-right">
          <div className="rounded-xl border border-line bg-surface/60 px-2.5 py-1.5 backdrop-blur-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Peak</div>
            <div className="text-xs font-bold text-rose-400">{peakScore}%</div>
          </div>
          <div className="rounded-xl border border-line bg-surface/60 px-2.5 py-1.5 backdrop-blur-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Weekly Avg</div>
            <div className="text-xs font-bold text-indigo-400">{avgScore}%</div>
          </div>
        </div>
      </div>

      {/* Interactive Active Day Badge */}
      {activePoint && (
        <div className="relative z-10 flex items-center justify-between py-1 px-3 mb-2 rounded-lg bg-surface2/70 border border-line/60 text-xs">
          <span className="text-muted font-medium">
            <strong className="text-ink">{activePoint.dayName}</strong> ({activePoint.date})
            {activePoint.isToday ? " · Today" : ""}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted">
              ⏱️ <strong className="text-ink">{fmtDuration(activePoint.focusMins)}</strong>
            </span>
            <span className="text-[11px] text-muted">
              ✅ <strong className="text-ink">{activePoint.routinesDone}</strong> routines
            </span>
            <span className="text-[11px] font-bold text-rose-400">
              Score: {activePoint.score}%
            </span>
          </div>
        </div>
      )}

      {/* Main SVG Curve Area Chart */}
      <div className="relative z-10 my-1 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 sm:h-44 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Area gradient */}
            <linearGradient id="growthAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#e11d48" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#6366f1" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>

            {/* Neon stroke gradient */}
            <linearGradient id="growthStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="45%" stopColor="#f43f5e" />
              <stop offset="85%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            {/* Neon Drop Shadow Filter */}
            <filter id="neonGrowthGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#f43f5e" floodOpacity="0.65" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line
            x1={padX}
            y1={padTop}
            x2={width - padX}
            y2={padTop}
            stroke="rgba(255, 255, 255, 0.07)"
            strokeDasharray="4 4"
          />
          <line
            x1={padX}
            y1={height / 2}
            x2={width - padX}
            y2={height / 2}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1={padX}
            y1={height - padBottom}
            x2={width - padX}
            y2={height - padBottom}
            stroke="rgba(255, 255, 255, 0.09)"
          />

          {/* Glowing Area Fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#growthAreaGrad)"
              className="transition-all duration-300"
            />
          )}

          {/* Neon Spline Curve */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#growthStrokeGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonGrowthGlow)"
            />
          )}

          {/* Data Points on Curve */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            const isToday = p.isToday;

            return (
              <g
                key={p.date}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Active/Today Pulsing Halo */}
                {(isToday || isHovered) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 11 : 9}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Outer ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : isToday ? 5.5 : 4.5}
                  fill="#07090e"
                  stroke={isToday ? "#fb7185" : isHovered ? "#38bdf8" : "#f43f5e"}
                  strokeWidth="2.5"
                  className="transition-all duration-150"
                />

                {/* Center dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 2.5 : 2}
                  fill="#ffffff"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* 7-Day Day Selector Bar */}
      <div className="relative z-10 grid grid-cols-7 gap-1 pt-1 border-t border-line/60">
        {points.map((p, idx) => {
          const isSelected = (hoveredIdx === null && p.isToday) || hoveredIdx === idx;
          return (
            <button
              key={p.date}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setHoveredIdx(idx)}
              className={`flex flex-col items-center py-1.5 px-1 rounded-lg transition text-center ${
                isSelected
                  ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm"
                  : "text-muted hover:bg-surface2/60 hover:text-ink"
              }`}
            >
              <span className="text-[10px] uppercase font-semibold leading-tight">
                {p.dayName}
              </span>
              <span className="text-[11px] leading-tight mt-0.5">
                {p.date.slice(-2)}
              </span>
              <span
                className="mt-1 h-1 w-3 rounded-full"
                style={{
                  background:
                    p.score >= 70
                      ? "#10b981"
                      : p.score >= 35
                      ? "#f43f5e"
                      : "rgba(255,255,255,0.15)",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Footer Metrics */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-line flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
        <span>⏱️ Focus: <strong className="text-ink">{fmtDuration(week.focusMins)}</strong></span>
        <span>✅ Tasks: <strong className="text-ink">{week.tasksDone} done</strong></span>
        <span className="text-accent font-semibold">
          Daily routines & skills count toward wellbeing growth
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component: Today's Schedule Card
───────────────────────────────────────────── */
function TodayScheduleCard({ blocks, doneSet, now, today, dispatch, progress, upNext }) {
  return (
    <div
      className="card relative flex flex-col justify-between overflow-hidden p-4 sm:p-5"
      style={{
        background: "rgba(14, 18, 28, 0.78)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">🗓️</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                Today&apos;s Schedule
              </h2>
            </div>
            <p className="text-lg font-bold text-ink mt-0.5">
              {progress.completed} of {progress.total} blocks completed
            </p>
          </div>
          <Link
            href="/day"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            <span>Edit My Day</span>
            <span>→</span>
          </Link>
        </div>

        {/* Active Now Spotlight Banner */}
        {upNext && (
          <div
            className="mb-3 rounded-xl p-3 border transition"
            style={{
              background: `color-mix(in srgb, ${catColor(upNext.category)} 12%, rgba(14, 18, 28, 0.9))`,
              borderColor: `color-mix(in srgb, ${catColor(upNext.category)} 40%, transparent)`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0">{upNext.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        background: catColor(upNext.category),
                        color: "#ffffff",
                      }}
                    >
                      {now >= upNext.start && now < upNext.end ? "Happening Now" : "Next Up"}
                    </span>
                    <span className="text-[11px] text-muted">
                      {fmtTime(upNext.start)} – {fmtTime(upNext.end)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-ink truncate mt-0.5">
                    {upNext.label}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary shrink-0"
                onClick={() =>
                  dispatch({
                    type: "toggleDone",
                    payload: { date: today, id: upNext.id },
                  })
                }
              >
                ✓ Mark Done
              </button>
            </div>
          </div>
        )}

        {/* Schedule Blocks Timeline */}
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {blocks.length ? (
            blocks.map((b) => {
              const isDone = doneSet.has(b.id);
              const isNow = now >= b.start && now < b.end;

              return (
                <div
                  key={b.id}
                  onClick={() =>
                    dispatch({
                      type: "toggleDone",
                      payload: { date: today, id: b.id },
                    })
                  }
                  className={`group flex items-center gap-2.5 p-2 rounded-xl cursor-pointer border transition ${
                    isNow
                      ? "bg-accent/15 border-accent/40 shadow-sm"
                      : isDone
                      ? "bg-surface/30 border-transparent opacity-60 hover:opacity-90"
                      : "bg-surface/50 border-line hover:border-accent/30"
                  }`}
                >
                  <span className="text-xs font-mono text-muted w-14 shrink-0">
                    {fmtTime(b.start)}
                  </span>
                  <span
                    className="h-6 w-1 rounded-full shrink-0"
                    style={{ background: catColor(b.category) }}
                  />
                  <span className="text-base shrink-0">{b.emoji}</span>
                  <span
                    className={`flex-1 text-xs font-medium truncate ${
                      isDone ? "line-through text-muted" : "text-ink"
                    }`}
                  >
                    {b.label}
                  </span>
                  {b.end > b.start && (
                    <span className="text-[10px] text-muted shrink-0">
                      {fmtDuration(b.end - b.start)}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`h-5 w-5 rounded-md flex items-center justify-center text-xs shrink-0 border transition ${
                      isDone
                        ? "bg-accent border-accent text-white"
                        : "border-line text-transparent group-hover:text-muted"
                    }`}
                  >
                    ✓
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center">
              <span className="text-3xl block mb-1">🗓️</span>
              <p className="text-xs font-semibold text-ink">No blocks scheduled for today</p>
              <p className="text-[11px] text-muted mt-0.5 mb-3">Add daily routine blocks in My Day</p>
              <Link href="/day" className="btn btn-sm btn-primary">
                + Plan Your Day
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar Footer */}
      <div className="mt-3 pt-2.5 border-t border-line flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={progress.pct} />
        </div>
        <span className="text-xs font-bold text-ink shrink-0">
          {progress.pct}%
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component: Goals Section (ONLY Daily and Weekly Goals)
───────────────────────────────────────────── */
function GoalsSection({ state, today }) {
  const dailyGoals = useMemo(
    () => state.goals.filter((g) => g.type === "daily"),
    [state.goals],
  );

  const weeklyGoals = useMemo(
    () => state.goals.filter((g) => g.type === "weekly"),
    [state.goals],
  );

  const dailyDone = useMemo(
    () => dailyGoals.filter((g) => (g.log[today] || 0) >= g.target).length,
    [dailyGoals, today],
  );

  const weeklyDone = useMemo(
    () => weeklyGoals.filter((g) => (g.log[today] || 0) >= g.target).length,
    [weeklyGoals, today],
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="section-title">Goals & Targets</h2>
          <p className="text-xs text-muted">Daily commitments and weekly milestones</p>
        </div>
        <Link href="/goals" className="text-xs font-semibold text-accent hover:underline">
          Manage all goals →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Goals Card */}
        <div
          className="card relative flex flex-col justify-between p-4 sm:p-5 overflow-hidden"
          style={{
            background: "rgba(14, 18, 28, 0.78)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Daily Goals
                </span>
              </div>
              <span className="text-xs text-muted font-medium">
                {dailyDone}/{dailyGoals.length} completed today
              </span>
            </div>

            <p className="text-lg font-extrabold text-ink mb-3">Today&apos;s Targets</p>

            <div className="space-y-2.5">
              {dailyGoals.length ? (
                dailyGoals.slice(0, 4).map((g) => {
                  const p = goalProgress(g, today);
                  return (
                    <div key={g.id} className="p-2.5 rounded-xl border border-line bg-surface/50">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-ink truncate">
                          {g.emoji} {g.label}
                        </span>
                        <span className="text-[11px] font-mono text-muted shrink-0">
                          {p.value} / {p.target}
                        </span>
                      </div>
                      <ProgressBar value={p.pct} color="#f43f5e" />
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-muted">
                  <span className="text-2xl block mb-1">🎯</span>
                  No daily goals set yet.
                  <Link href="/goals" className="block text-accent font-semibold mt-1">
                    + Set daily goals
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-xs">
            <span className="text-muted">Resets every night</span>
            <Link href="/goals" className="font-semibold text-accent hover:underline">
              View daily progress →
            </Link>
          </div>
        </div>

        {/* Weekly Goals Card */}
        <div
          className="card relative flex flex-col justify-between p-4 sm:p-5 overflow-hidden"
          style={{
            background: "rgba(14, 18, 28, 0.78)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Weekly Goals
                </span>
              </div>
              <span className="text-xs text-muted font-medium">
                {weeklyDone}/{weeklyGoals.length} completed this week
              </span>
            </div>

            <p className="text-lg font-extrabold text-ink mb-3">This Week&apos;s Milestones</p>

            <div className="space-y-2.5">
              {weeklyGoals.length ? (
                weeklyGoals.slice(0, 4).map((g) => {
                  const p = goalProgress(g, today);
                  return (
                    <div key={g.id} className="p-2.5 rounded-xl border border-line bg-surface/50">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-ink truncate">
                          {g.emoji} {g.label}
                        </span>
                        <span className="text-[11px] font-mono text-muted shrink-0">
                          {p.value} / {p.target}
                        </span>
                      </div>
                      <ProgressBar value={p.pct} color="#6366f1" />
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-muted">
                  <span className="text-2xl block mb-1">📅</span>
                  No weekly goals set yet.
                  <Link href="/goals" className="block text-accent font-semibold mt-1">
                    + Set weekly goals
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-xs">
            <span className="text-muted">Resets on Sunday</span>
            <Link href="/goals" className="font-semibold text-accent hover:underline">
              View weekly roadmap →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────── */
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

  const openTasks = useMemo(() => {
    return state.tasks
      .filter((t) => !t.done)
      .sort(
        (a, b) =>
          PRIORITIES[a.priority].rank - PRIORITIES[b.priority].rank ||
          String(a.due || "9999").localeCompare(String(b.due || "9999")),
      )
      .slice(0, 5);
  }, [state.tasks]);

  const week = weekStats(state);
  const balance = balanceScore(blocks, done, state.profile);

  // 7-day growth scores
  const growth = useMemo(() => {
    return weekKeys().map((date) => {
      const skillHit = Object.values(state.english.skills).filter(
        (s) => (s.log[date] || 0) >= s.target,
      ).length;
      const goalHit = state.goals.filter(
        (g) => (g.log[date] || 0) >= g.target,
      ).length;
      const routinesDone = (state.done[date] || []).length;
      const focusMins = focusMinutes(state, date);
      const score = Math.min(
        100,
        skillHit * 15 + goalHit * 20 + routinesDone * 6 + focusMins / 3,
      );
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        new Date(date + "T00:00:00").getDay()
      ];

      return {
        date,
        dayName,
        score: Math.round(score),
        skillHit,
        goalHit,
        routinesDone,
        focusMins,
        isToday: date === today,
      };
    });
  }, [state, today]);

  const todaySkills = Object.values(state.english.skills).filter(
    (s) => (s.log[today] || 0) >= s.target,
  ).length;

  const monthSpent = state.expenses
    .filter((e) => e.date?.slice(0, 7) === today.slice(0, 7))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* ══════════════════════════════════════
          1. HEADER — Greeting & Date
      ══════════════════════════════════════ */}
      <header className="pb-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">
          {greeting(now)},
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-ink mb-1">
          {state.profile.name ? state.profile.name : "Still up"} 👋
        </h1>
        <p className="text-xs sm:text-sm text-muted mb-2">
          {longDate()}
        </p>
        <div className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-7 rounded bg-gradient-to-r from-rose-500 to-indigo-500" />
          <p className="text-xs text-muted italic">
            Small steps every day lead to big dreams.
          </p>
        </div>
      </header>

      {/* ══════════════════════════════════════
          2. TOP-MOST SECTION — ONLY Today's Schedule & Growth Graph
      ══════════════════════════════════════ */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Today's Schedule */}
          <TodayScheduleCard
            blocks={blocks}
            doneSet={doneSet}
            now={now}
            today={today}
            dispatch={dispatch}
            progress={progress}
            upNext={upNext}
          />

          {/* Growth Graph (Centerpiece - Most Attractive) */}
          <GrowthGraph
            growth={growth}
            week={week}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. GOAL OPTION — ONLY Daily and Weekly Goal
      ══════════════════════════════════════ */}
      <GoalsSection state={state} today={today} />

      {/* ══════════════════════════════════════
          4. SECONDARY SECTION — Urgent Tasks & Quick Stats
      ══════════════════════════════════════ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Open Tasks Card */}
        <div
          className="card md:col-span-2 p-4 sm:p-5"
          style={{
            background: "rgba(14, 18, 28, 0.78)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="section-title">Priority Tasks</h2>
              <p className="text-xs text-muted">Tasks needing your attention today</p>
            </div>
            <Link href="/tasks" className="text-xs font-semibold text-accent hover:underline">
              All tasks ({state.tasks.filter((t) => !t.done).length}) →
            </Link>
          </div>

          <div className="space-y-2">
            {openTasks.length ? (
              openTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() =>
                    dispatch({
                      type: "task.update",
                      payload: { id: t.id, patch: { done: true } },
                    })
                  }
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-line bg-surface/50 hover:border-accent/40 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: PRIORITIES[t.priority].color }}
                    />
                    <span className="text-xs font-medium text-ink truncate">
                      {t.title}
                    </span>
                  </div>
                  {t.due && (
                    <span className="text-[11px] text-muted font-mono shrink-0">
                      {t.due}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted">
                <span className="text-2xl block mb-1">✅</span>
                All tasks completed for today!
              </div>
            )}
          </div>
        </div>

        {/* Quick Snapshot Card */}
        <div
          className="card p-4 sm:p-5 flex flex-col justify-between gap-3"
          style={{
            background: "rgba(14, 18, 28, 0.78)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <h2 className="section-title mb-2">Snapshot</h2>
            <div className="space-y-2">
              <Link
                href="/leaderboard"
                className="flex items-center justify-between p-2 rounded-xl border border-line bg-surface/40 hover:bg-surface2 transition"
              >
                <span className="text-xs text-muted flex items-center gap-1.5">
                  <span>🏆</span> Experience
                </span>
                <span className="text-xs font-bold text-accent">{state.xp || 0} XP</span>
              </Link>
              <Link
                href="/english"
                className="flex items-center justify-between p-2 rounded-xl border border-line bg-surface/40 hover:bg-surface2 transition"
              >
                <span className="text-xs text-muted flex items-center gap-1.5">
                  <span>🗣️</span> English Practice
                </span>
                <span className="text-xs font-bold text-ink">{todaySkills}/4 targets</span>
              </Link>
              <Link
                href="/finance"
                className="flex items-center justify-between p-2 rounded-xl border border-line bg-surface/40 hover:bg-surface2 transition"
              >
                <span className="text-xs text-muted flex items-center gap-1.5">
                  <span>💰</span> Spent This Month
                </span>
                <span className="text-xs font-bold text-ink">₹{monthSpent.toLocaleString("en-IN")}</span>
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-line">
            <div className="flex items-center justify-between text-xs text-muted mb-1">
              <span>Life Balance</span>
              <strong className="text-ink">{balance.overall}%</strong>
            </div>
            <ProgressBar value={balance.overall} color="#8b5cf6" />
          </div>
        </div>
      </section>
    </div>
  );
}
