"use client";

import { Card, Field, ProgressBar, SectionHeader } from "@/components/ui";
import { dateKey } from "@/lib/time";
import { useApp } from "@/lib/store";

const META = { reading: ["📖", "Reading"], listening: ["🎧", "Listening"], writing: ["✍️", "Writing"], speaking: ["🗣️", "Speaking"] };

export default function EnglishPage() {
  const { state, dispatch } = useApp(); const today = dateKey();
  return <div className="space-y-5"><header><h1 className="text-2xl font-bold">English & communication</h1><p className="text-sm text-muted">Build reading, listening, writing and speaking confidence every day.</p></header><Card className="flex items-center justify-between" style={{ background: "var(--accent-soft)" }}><div><p className="text-xs text-muted">YOUR XP</p><p className="text-3xl font-black">⭐ {state.xp || 0}</p></div><p className="max-w-52 text-right text-xs text-muted">Reach a target to earn 10 XP. Drop below a reached target and 10 XP is removed.</p></Card><section><SectionHeader title="Today's practice" /><div className="grid gap-3 md:grid-cols-2">{Object.entries(state.english.skills).map(([id, skill]) => { const value = skill.log[today] || 0; const pct = Math.min(100, value / skill.target * 100); const [emoji, label] = META[id]; return <Card key={id} className="space-y-3"><div className="flex items-center justify-between"><div><p className="font-semibold">{emoji} {label}</p><p className="text-xs text-muted">{value}/{skill.target} {skill.unit}</p></div><span className="text-xs font-semibold" style={{ color: pct >= 100 ? "#22c55e" : "var(--muted)" }}>{pct >= 100 ? "+10 XP" : `${Math.round(pct)}%`}</span></div><ProgressBar value={pct} color={pct >= 100 ? "#22c55e" : undefined} /><div className="flex gap-2"><button className="btn btn-sm" onClick={() => dispatch({ type: "english.log", payload: { skill: id, date: today, delta: -1 } })}>−</button><button className="btn btn-primary btn-sm flex-1" onClick={() => dispatch({ type: "english.log", payload: { skill: id, date: today, delta: 1 } })}>Log practice +1</button></div><Field label="Daily target"><input className="input" type="number" min="1" value={skill.target} onChange={(e) => dispatch({ type: "english.target", payload: { skill: id, patch: { target: Math.max(1, Number(e.target.value) || 1) } } })} /></Field></Card> })}</div></section></div>;
}
