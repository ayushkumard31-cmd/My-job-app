"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Empty, SectionHeader, Stat } from "@/components/ui";
import { useApp } from "@/lib/store";

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

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>Campus Leaderboard</span>
            <span className="text-xl">🏆</span>
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Compete with batchmates · Complete daily blocks & focus sessions to climb the ranks
          </p>
        </div>
        <Link href="/day" className="btn btn-primary btn-sm">
          + Earn XP in My Day
        </Link>
      </header>

      {/* User's Current Rank Card */}
      <Card
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, transparent), transparent)",
          borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                color: "#fff",
              }}
            >
              #{userRanking.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">{userName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--accent-soft)", color: "var(--ink)" }}>
                  {userLvl.badge} Level {userLvl.level}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {userLvl.rank} · {userBranch}
              </p>
              <div className="flex items-center gap-3 text-xs mt-1 font-medium">
                <span style={{ color: "var(--accent)" }}>✨ {userXp} Total XP</span>
                <span style={{ color: "#f59e0b" }}>🔥 {userRanking.streak} Day Streak</span>
                <span style={{ color: "#10b981" }}>⏱️ {userFocusMins}m Focused</span>
              </div>
            </div>
          </div>

          <div className="min-w-[180px] flex-1 sm:max-w-xs space-y-1">
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--muted)" }}>Level Progress</span>
              <span className="font-semibold">{userLvl.progress} / {userLvl.needed} XP</span>
            </div>
            <div className="bar" style={{ height: "0.55rem" }}>
              <i
                style={{
                  width: `${userLvl.needed > 0 ? Math.min(100, (userLvl.progress / userLvl.needed) * 100) : 100}%`,
                  background: "linear-gradient(90deg, var(--accent), #8b5cf6)",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <p className="text-[11px] text-right" style={{ color: "var(--muted)" }}>
              {Math.max(0, userLvl.needed - userLvl.progress)} XP to Level {userLvl.level + 1}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs & Branch Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl p-1 border border-line bg-surface">
          {[
            { id: "all-time", label: "All-Time XP" },
            { id: "weekly", label: "This Week" },
            { id: "today", label: "Focus Hours" },
          ].map((t) => (
            <button
              key={t.id}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
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

        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "var(--muted)" }}>Branch:</span>
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

      {/* Podium Top 3 */}
      {topThree.length >= 3 && (
        <div>
          <SectionHeader title="Top Performers 🌟" />
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
            {/* Rank 2 (Silver) */}
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl mb-1">{topThree[1].avatar}</span>
              <div className="text-xs font-bold truncate max-w-full">{topThree[1].name}</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>{topThree[1].branch}</div>
              <div
                className="w-full mt-2 rounded-t-2xl flex flex-col items-center justify-center p-3 border border-line shadow-sm"
                style={{
                  height: "120px",
                  background: "linear-gradient(180deg, color-mix(in srgb, #94a3b8 20%, transparent), transparent)",
                  borderColor: "#94a3b8",
                }}
              >
                <span className="text-2xl">🥈</span>
                <span className="text-xs font-bold mt-1">#2</span>
                <span className="text-xs font-bold text-accent">
                  {tab === "weekly" ? `${topThree[1].weeklyXp} XP` : tab === "today" ? `${topThree[1].focusMins}m` : `${topThree[1].xp} XP`}
                </span>
              </div>
            </div>

            {/* Rank 1 (Gold) */}
            <div className="flex flex-col items-center text-center">
              <span className="text-3xl mb-1">{topThree[0].avatar}</span>
              <div className="text-sm font-extrabold truncate max-w-full text-accent">{topThree[0].name}</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>{topThree[0].branch}</div>
              <div
                className="w-full mt-2 rounded-t-2xl flex flex-col items-center justify-center p-4 border border-line shadow-md"
                style={{
                  height: "150px",
                  background: "linear-gradient(180deg, color-mix(in srgb, #f59e0b 25%, transparent), transparent)",
                  borderColor: "#f59e0b",
                }}
              >
                <span className="text-3xl">🥇</span>
                <span className="text-sm font-extrabold mt-1 text-amber-400">#1 Champion</span>
                <span className="text-sm font-extrabold" style={{ color: "var(--accent)" }}>
                  {tab === "weekly" ? `${topThree[0].weeklyXp} XP` : tab === "today" ? `${topThree[0].focusMins}m` : `${topThree[0].xp} XP`}
                </span>
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl mb-1">{topThree[2].avatar}</span>
              <div className="text-xs font-bold truncate max-w-full">{topThree[2].name}</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>{topThree[2].branch}</div>
              <div
                className="w-full mt-2 rounded-t-2xl flex flex-col items-center justify-center p-3 border border-line shadow-sm"
                style={{
                  height: "95px",
                  background: "linear-gradient(180deg, color-mix(in srgb, #d97706 20%, transparent), transparent)",
                  borderColor: "#d97706",
                }}
              >
                <span className="text-2xl">🥉</span>
                <span className="text-xs font-bold mt-1">#3</span>
                <span className="text-xs font-bold text-accent">
                  {tab === "weekly" ? `${topThree[2].weeklyXp} XP` : tab === "today" ? `${topThree[2].focusMins}m` : `${topThree[2].xp} XP`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <section>
        <SectionHeader title="All Campus Rankings" />
        <Card className="divide-y divide-line p-0 overflow-hidden">
          {allEntries.map((student) => {
            const isUser = student.isUser;
            return (
              <div
                key={student.id}
                className={`flex items-center gap-3 p-3 transition ${
                  isUser ? "bg-accent/10 font-semibold" : "hover:bg-surface-elevated"
                }`}
                style={isUser ? { background: "color-mix(in srgb, var(--accent) 12%, transparent)" } : {}}
              >
                {/* Rank number */}
                <div className="w-8 text-center font-bold text-sm shrink-0">
                  {student.rank === 1 ? "🥇" : student.rank === 2 ? "🥈" : student.rank === 3 ? "🥉" : `#${student.rank}`}
                </div>

                {/* Avatar */}
                <div className="text-xl shrink-0">{student.avatar}</div>

                {/* Student Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{student.name}</span>
                    {isUser && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-accent text-white shrink-0">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                    <span>{student.branch}</span>
                    <span>·</span>
                    <span>🔥 {student.streak}d streak</span>
                  </div>
                </div>

                {/* Score / XP */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold" style={{ color: "var(--accent)" }}>
                    {tab === "weekly" ? `${student.weeklyXp} XP` : tab === "today" ? `${student.focusMins}m focus` : `${student.xp} XP`}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--muted)" }}>
                    {student.badge} Tier
                  </div>
                </div>

                {/* Cheer button */}
                {!isUser && (
                  <button
                    className="btn btn-ghost btn-sm shrink-0 text-xs px-2"
                    title="Send a cheer!"
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

      {/* Badges & Achievements Section */}
      <section>
        <SectionHeader title="Your Badges & Achievements 🎖️" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <Card
              key={a.title}
              className="flex items-start gap-3 relative overflow-hidden"
              style={
                a.unlocked
                  ? { borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)" }
                  : { opacity: 0.7 }
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
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                    style={{
                      background: a.unlocked ? "#10b98120" : "var(--line)",
                      color: a.unlocked ? "#10b981" : "var(--muted)",
                    }}
                  >
                    {a.unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{a.desc}</p>
                <div className="mt-2">
                  <div className="bar" style={{ height: "0.35rem" }}>
                    <i
                      style={{
                        width: `${Math.min(100, Math.round((a.current / a.max) * 100))}%`,
                        background: a.unlocked ? "#10b981" : "var(--accent)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--muted)" }}>
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
