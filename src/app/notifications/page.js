"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, Empty, Pill, SectionHeader } from "@/components/ui";
import { deadlineType } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { countdownLabel, daysUntil, shortDate } from "@/lib/time";

export default function NotificationsPage() {
  const { state } = useApp();

  const items = useMemo(() => {
    const exams = state.deadlines
      .filter((d) => !d.done)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        key: `deadline-${d.id}`,
        icon: "⏳",
        title: d.title,
        meta: `${deadlineType(d.type).label} · ${shortDate(d.date)}`,
        pill: countdownLabel(d.date),
        color: daysUntil(d.date) <= 2 ? "#ef4444" : daysUntil(d.date) <= 7 ? "#f59e0b" : "#22c55e",
      }));

    const schedule = state.docs.map((d) => ({
      key: `doc-${d.id}`,
      icon: "📅",
      title: d.title || "College schedule",
      meta: d.academicYear ? `${d.academicYear} · schedule` : "College schedule",
      pill: "Saved",
      color: "#6366f1",
    }));

    const remaining = state.tasks
      .filter((t) => !t.done)
      .slice(0, 5)
      .map((t) => ({
        key: `task-${t.id}`,
        icon: "✅",
        title: t.title,
        meta: "Remaining task",
        pill: t.priority,
        color: "#8b5cf6",
      }));

    return [...exams, ...schedule, ...remaining].slice(0, 10);
  }, [state.deadlines, state.docs, state.tasks]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted">Exams, college schedule updates, and leftover tasks.</p>
        </div>
        <Link href="/exams" className="text-sm font-medium text-accent">
          Manage deadlines
        </Link>
      </header>

      <SectionHeader title="Alerts" />
      <Card className="space-y-2.5">
        {items.length ? (
          items.map((item) => (
            <div key={item.key} className="flex items-start gap-3 rounded-xl border border-line p-3">
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted">{item.meta}</p>
              </div>
              <Pill color={item.color}>{item.pill}</Pill>
            </div>
          ))
        ) : (
          <Empty emoji="🔔" title="All quiet" hint="Your exam and schedule reminders will show up here." />
        )}
      </Card>
    </div>
  );
}
