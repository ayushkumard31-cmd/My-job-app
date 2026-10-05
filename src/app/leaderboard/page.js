"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Empty, ProgressBar, SectionHeader } from "@/components/ui";
import { useApp } from "@/lib/store";
import { Trophy, Flame, Timer, Zap, ChevronRight } from "lucide-react";

function xpToLevel(xp = 0) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const current = Math.pow(level - 1, 2) * 50;
  const next = Math.pow(level, 2) * 50;
  const rankNames = [
    "Freshman Scout",
    "Campus Explorer",
    "Study Warrior",
    "Focus Champion",
    "Academic Prodigy",
    "Campus Legend",
    "Grandmaster Scholar"
  ];
  const rank = rankNames[Math.min(level - 1, rankNames.length - 1)];
  const badges = ["🌱", "🧭", "⚔️", "🏆", "⚡", "👑", "✨"];
  const badge = badges[Math.min(level - 1, badges.length - 1)];
  return { level, rank, badge, current, next, progress: xp - current, needed: next - current };
}

// Simulated active peers for campus competition
const CAMPUS_PEERS = [
  { id: "peer_1", name: "Rohan Sharma", branch: "CSE · Sem 5", xp: 1420, weeklyXp: 380, streak: 14, focusMins: 450, avatar: "👨‍💻", badge: "👑" },
  { id: "peer_2", name: "Ananya Iyer", branch: "IT · Sem 3", xp: 1180, weeklyXp: 340, streak: 12, focusMins: 390, avatar: "👩‍🔬", badge: "⚡" },
  { id: "peer_3", name: "Priya Mukherjee", branch: "CSE · Sem 3", xp: 950, weeklyXp: 290, streak: 9, focusMins: 320, avatar: "👩‍💻", badge: "🏆" },
  { id: "peer_4", name: "Vikram Das", branch: "ECE · Sem 5", xp: 780, weeklyXp: 210, streak: 7, focusMins: 260, avatar: "⚡", badge: "⚔️" },
  { id: "peer_5", name: "Sneha Sen", branch: "CSE · Sem 3", xp: 620, weeklyXp: 180, streak: 5, focusMins: 210, avatar: "🎨", badge: "⚔️" },
  { id: "peer_6", name: "Arjun Verma", branch: "ME · Sem 5", xp: 480, weeklyXp: 150, streak: 4, focusMins: 180, avatar: "🚀", badge: "🧭" },
  { id: "peer_7", name: "Tanvi Patel", branch: "IT · Sem 3", xp: 350, weeklyXp: 110, streak: 3, focusMins: 140, avatar: "📚", badge: "🧭" },
];

function getDisplayValue(entry, tab) {
  if (tab === "weekly") return `${entry.weeklyXp} XP`;
  if (tab === "today") return `${entry.focusMins}m focus`;
  return `${entry.xp} XP`;
}

/* ─────────────────────────────────────────────
   Podium card for top 3
───────────────────────────────────────────── */
function PodiumCard({ entry, position, tab }) {
  const isChampion = position === 1;
  const medalEmoji = position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉";
  const borderColor = position === 1 ? "#f59e0b" : position === 2 ? "#94a3b8" : "#d97706";
  const heights = { 1: "h-36 sm:h-40", 2: "h-28 sm:h-32", 3: "h-24 sm:h-28" };

  return (
    <div className="flex flex-col items-center text-center">
      <span className={`${isChampion ? "text-3xl" : "text-2xl"} mb-1.5`}>{entry.avatar}</span>
      <div className={`${isChampion ? "text-sm font-bold text-accent" : "text-xs font-semibold text-ink"} truncate max-w-full`}>
        {entry.name}
      </div>
      <div className="text-[10px] text-muted mb-1">{entry.branch}</div>

      {/* Podium block */}
      <div
        className={`w-full mt-1 rounded-t-2xl flex flex-col items-center justify-center p-3 border transition-all ${heights[position]}`}
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${borderColor} ${isChampion ? "22%" : "15%"}, transparent), transparent)`,
          borderColor: `color-mix(in srgb, ${borderColor} 50%, transparent)`,
        }}
      >
        <span className={isChampion ? "text-3xl" : "text-2xl"}>{medalEmoji}</span>
        <span className={`${isChampion ? "text-sm font-bold text-amber-400" : "text-xs font-bold text-ink"} mt-1`}>
          {isChampion ? "#1 Champion" : `#${position}`}
        </span>
        <span className="text-xs font-bold text-accent mt-0.5">
          {getDisplayValue(entry, tab)}
        </span>
        {/* Supporting stats */}
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted">
          <span>🔥 {entry.streak}d</span>
          <span>·</span>
          <span>{Math.round(entry.focusMins / 60)}h focus</span>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { state } = useApp();
  const [tab, setTab] = useState("all-time"); // all-time | weekly | today
  const [filterBranch, setFilterBranch] = useState("all");
  const [cheers, setCheers] = useState({});

  const userXp = state.xp || 0;
  const userName = state.profile?.name?.trim() || "You (Scholar)";
  const userBranch = `${(state.profile?.branch || "CSE").toUpperCase()} · Sem ${state.profile?.semester || 3}`;
  const userLvl = xpToLevel(userXp);

  // Focus time from sessions
  const userFocusMins = useMemo(() => {
    return state.focus?.sessions?.reduce((sum, s) => sum + (s.minutes || 0), 0) || 0;
  }, [state.focus]);

  // Combine user into leaderboard
  const allEntries = useMemo(() => {
    const userEntry = {
      id: "current_user",
      name: `${userName} (You)`,
      branch: userBranch,
      xp: userXp,
      weeklyXp: Math.round(userXp * 0.4),
      streak: Math.max(1, Math.min(30, Math.floor(userXp / 50) + 1)),
      focusMins: userFocusMins,
      avatar: "🎓",
      badge: userLvl.badge,
      isUser: true,
    };

    let list = [userEntry, ...CAMPUS_PEERS];

    if (filterBranch !== "all") {
      list = list.filter((p) => p.isUser || p.branch.toLowerCase().includes(filterBranch.toLowerCase()));
    }

    // Sort according to tab
    list.sort((a, b) => {
      if (tab === "weekly") return b.weeklyXp - a.weeklyXp;
      if (tab === "today") return (b.focusMins || 0) - (a.focusMins || 0);
      return b.xp - a.xp;
    });

    return list.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }, [userName, userBranch, userXp, userFocusMins, userLvl.badge, filterBranch, tab]);

  const userRanking = allEntries.find((e) => e.isUser) || { rank: 1, xp: userXp };

  const topThree = allEntries.slice(0, 3);
  const remainingList = allEntries.slice(3);

  const handleCheer = (id) => {
    setCheers((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  // Achievements
  const achievements = [
    { title: "First Step", desc: "Earn your first 10 XP", icon: "🌱", unlocked: userXp >= 10, current: Math.min(10, userXp), max: 10 },
    { title: "Century Club", desc: "Reach 100 total XP", icon: "💯", unlocked: userXp >= 100, current: Math.min(100, userXp), max: 100 },
    { title: "Focus Warrior", desc: "Log 60+ minutes of focus", icon: "⏱️", unlocked: userFocusMins >= 60, current: Math.min(60, userFocusMins), max: 60 },
    { title: "Budget Guardian", desc: "Track expenses with a budget", icon: "🛡️", unlocked: (state.ui?.budget || 0) > 0, current: (state.ui?.budget || 0) > 0 ? 1 : 0, max: 1 },
    { title: "Prodigy Scholar", desc: "Reach Level 5 (900 XP)", icon: "⚡", unlocked: userXp >= 900, current: Math.min(900, userXp), max: 900 },
    { title: "Campus Legend", desc: "Reach 1500 XP", icon: "👑", unlocked: userXp >= 1500, current: Math.min(1500, userXp), max: 1500 },
  ];

  const levelProgressPct = userLvl.needed > 0 ? Math.min(100, (userLvl.progress / userLvl.needed) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 tracking-tight">
            <span>Campus Leaderboard</span>
            <Trophy className="text-accent" size={22} />
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Compete with batchmates · Complete daily blocks & focus sessions to climb the ranks
          </p>
        </div>
        <Link href="/day" className="btn btn-primary btn-sm">
          <Zap size={14} />
          Earn XP in My Day
        </Link>
      </header>

      {/* ── User's Current Rank Card ── */}
      <Card
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent)",
          borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Rank + Info */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                color: "#fff",
              }}
            >
              #{userRanking.rank}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-bold truncate">{userName}</span>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium leading-none shrink-0"
                  style={{ background: "var(--accent-soft)", color: "var(--ink)" }}
                >
                  {userLvl.badge} Level {userLvl.level}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {userLvl.rank} · {userBranch}
              </p>
              <div className="flex items-center gap-3 text-xs mt-1.5 font-medium flex-wrap">
                <span className="flex items-center gap-1" style={{ color: "var(--accent)" }}>
                  <Zap size={12} /> {userXp} Total XP
                </span>
                <span className="flex items-center gap-1" style={{ color: "#f59e0b" }}>
                  <Flame size={12} /> {userRanking.streak} Day Streak
                </span>
                <span className="flex items-center gap-1" style={{ color: "#10b981" }}>
                  <Timer size={12} /> {userFocusMins}m Focused
                </span>
              </div>
            </div>
          </div>

          {/* Right: Level Progress */}
          <div className="min-w-[160px] sm:max-w-xs space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Level Progress</span>
              <span className="font-semibold">{userLvl.progress} / {userLvl.needed} XP</span>
            </div>
            <ProgressBar value={levelProgressPct} color="linear-gradient(90deg, var(--accent), #8b5cf6)" />
            <p className="text-[11px] text-right text-muted">
              {Math.max(0, userLvl.needed - userLvl.progress)} XP to Level {userLvl.level + 1}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Tabs & Branch Filter ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl p-1 border border-line bg-surface/80 backdrop-blur-sm">
          {[
            { id: "all-time", label: "All-Time XP" },
            { id: "weekly", label: "This Week" },
            { id: "today", label: "Focus Hours" },
          ].map((t) => (
            <button
              key={t.id}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={
                tab === t.id
                  ? { background: "var(--accent)", color: "#fff" }
                  : { color: "var(--muted)" }
              }
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted">Branch:</span>
          {["all", "CSE", "IT", "ECE"].map((b) => (
            <button
              key={b}
              className="chip text-xs"
              data-on={String(filterBranch === b)}
              onClick={() => setFilterBranch(b)}
            >
              {b === "all" ? "All Branches" : b}
            </button>
          ))}
        </div>
      </div>

      {/* ── Podium Top 3 ── */}
      {topThree.length >= 3 && (
        <div>
          <SectionHeader title="Top Performers" />

          {/* Desktop Podium */}
          <div className="hidden sm:grid grid-cols-3 gap-3 items-end pt-4 pb-2">
            <PodiumCard entry={topThree[1]} position={2} tab={tab} />
            <PodiumCard entry={topThree[0]} position={1} tab={tab} />
            <PodiumCard entry={topThree[2]} position={3} tab={tab} />
          </div>

          {/* Mobile: Stacked cards */}
          <div className="sm:hidden space-y-2">
            {topThree.map((entry, idx) => (
              <div
                key={entry.id}
                className="card p-3 flex items-center gap-3"
                style={
                  idx === 0
                    ? { borderColor: "color-mix(in srgb, #f59e0b 40%, transparent)" }
                    : {}
                }
              >
                <span className="text-2xl shrink-0">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                </span>
                <span className="text-xl shrink-0">{entry.avatar}</span>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold truncate ${idx === 0 ? "text-accent" : "text-ink"}`}>
                    {entry.name}
                  </div>
                  <div className="text-[10px] text-muted">{entry.branch}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted">
                    <span>🔥 {entry.streak}d</span>
                    <span>{Math.round(entry.focusMins / 60)}h focus</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-accent">{getDisplayValue(entry, tab)}</div>
                  <div className="text-[10px] text-muted">{entry.badge} Tier</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Full Leaderboard Table ── */}
      <section>
        <SectionHeader title="All Campus Rankings" />
        <Card className="divide-y divide-line p-0 overflow-hidden">
          {allEntries.map((student) => {
            const isUser = student.isUser;
            return (
              <div
                key={student.id}
                className={`flex items-center gap-3 px-3 py-3 sm:px-4 transition ${
                  isUser ? "font-semibold" : "hover:bg-surface2/50"
                }`}
                style={isUser ? { background: "color-mix(in srgb, var(--accent) 10%, transparent)" } : {}}
              >
                {/* Rank number */}
                <div className="w-7 text-center font-bold text-sm shrink-0">
                  {student.rank === 1 ? "🥇" : student.rank === 2 ? "🥈" : student.rank === 3 ? "🥉" : `#${student.rank}`}
                </div>

                {/* Avatar */}
                <div className="text-xl shrink-0">{student.avatar}</div>

                {/* Student Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{student.name}</span>
                    {isUser && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-accent text-white shrink-0 leading-none">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <span>{student.branch}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Flame size={10} /> {student.streak}d streak
                    </span>
                  </div>
                </div>

                {/* Score / XP */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-accent">
                    {getDisplayValue(student, tab)}
                  </div>
                  <div className="text-[10px] text-muted">
                    {student.badge} Tier
                  </div>
                </div>

                {/* Cheer button */}
                {!isUser && (
                  <button
                    className="btn btn-ghost btn-sm shrink-0 text-xs px-2"
                    title="Send a cheer!"
                    aria-label={`Cheer for ${student.name}`}
                    onClick={() => handleCheer(student.id)}
                  >
                    🙌 {cheers[student.id] ? `+${cheers[student.id]}` : ""}
                  </button>
                )}
              </div>
            );
          })}
        </Card>
      </section>

      {/* ── Badges & Achievements Section ── */}
      <section>
        <SectionHeader title="Your Badges & Achievements 🎖️" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <Card
              key={a.title}
              className="flex items-start gap-3 relative overflow-hidden"
              style={
                a.unlocked
                  ? { borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)" }
                  : { opacity: 0.6 }
              }
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background: a.unlocked
                    ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                    : "var(--line)",
                }}
              >
                {a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold truncate">{a.title}</h3>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase leading-none shrink-0"
                    style={{
                      background: a.unlocked ? "rgba(16, 185, 129, 0.15)" : "var(--line)",
                      color: a.unlocked ? "#10b981" : "var(--muted)",
                    }}
                  >
                    {a.unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <p className="text-xs mt-0.5 text-muted">{a.desc}</p>
                <div className="mt-2">
                  <div className="bar" style={{ height: "0.3rem" }}>
                    <i
                      style={{
                        width: `${Math.min(100, Math.round((a.current / a.max) * 100))}%`,
                        background: a.unlocked ? "#10b981" : "var(--accent)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1 text-muted">
                    <span>Progress</span>
                    <span>{a.current} / {a.max}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
