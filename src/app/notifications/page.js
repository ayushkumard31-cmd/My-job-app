"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, Empty, Pill, SectionHeader, Stat } from "@/components/ui";
import { deadlineType } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { countdownLabel, dateKey, daysUntil, shortDate } from "@/lib/time";

function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // AudioContext not allowed before user interaction
  }
}

export default function NotificationsPage() {
  const { state } = useApp();
  const [filter, setFilter] = useState("all");
  const [dismissed, setDismissed] = useState([]);
  const [permission, setPermission] = useState("default");
  const [testSent, setTestSent] = useState(false);

  // Sync browser notification permission state
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
    try {
      const saved = JSON.parse(localStorage.getItem("dismissed_alerts") || "[]");
      setDismissed(saved);
    } catch (e) {}
  }, []);

  const dismissAlert = (key) => {
    const next = [...dismissed, key];
    setDismissed(next);
    try {
      localStorage.setItem("dismissed_alerts", JSON.stringify(next));
    } catch (e) {}
  };

  const clearAllDismissed = () => {
    setDismissed([]);
    try {
      localStorage.removeItem("dismissed_alerts");
    } catch (e) {}
  };

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        if (res === "granted") {
          sendTestNotification();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const sendTestNotification = () => {
    playNotificationChime();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("Campus Compass 🔔", {
        body: "Notifications are active! You will receive timely alerts for deadlines, low attendance, and budget limits.",
        icon: "/favicon.ico",
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      alert("Please allow notification permissions in your browser to receive alerts!");
    }
  };

  // Compile all alerts across app state
  const allAlerts = useMemo(() => {
    const alerts = [];
    const today = dateKey();

    // 1. Deadlines & Exams
    state.deadlines
      .filter((d) => !d.done)
      .forEach((d) => {
        const days = daysUntil(d.date);
        const isUrgent = days <= 2;
        const isApproaching = days <= 7;
        alerts.push({
          key: `deadline-${d.id}`,
          category: "deadlines",
          priority: isUrgent ? "urgent" : isApproaching ? "warning" : "info",
          icon: "⏳",
          title: d.title,
          desc: `${deadlineType(d.type).label} · ${shortDate(d.date)}`,
          pill: countdownLabel(d.date),
          color: isUrgent ? "#ef4444" : isApproaching ? "#f59e0b" : "#22c55e",
          href: "/exams",
          actionText: "View Deadlines",
        });
      });


    // 3. Money / Budget alerts
    const currentMonth = today.slice(0, 7);
    const budget = state.ui?.budget || 0;
    if (budget > 0) {
      const monthExpenses = (state.expenses || []).filter((e) => e.date?.startsWith(currentMonth));
      const totalSpent = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      if (totalSpent > budget) {
        alerts.push({
          key: `budget-over-${currentMonth}`,
          category: "finance",
          priority: "urgent",
          icon: "⚠️",
          title: "Monthly Budget Exceeded!",
          desc: `You have spent ₹${totalSpent.toLocaleString("en-IN")} of your ₹${budget.toLocaleString("en-IN")} budget.`,
          pill: "Over Budget",
          color: "#ef4444",
          href: "/finance",
          actionText: "Review Expenses",
        });
      } else if (totalSpent >= budget * 0.8) {
        alerts.push({
          key: `budget-warn-${currentMonth}`,
          category: "finance",
          priority: "warning",
          icon: "💰",
          title: "Approaching Monthly Budget Limit",
          desc: `₹${totalSpent.toLocaleString("en-IN")} spent (${Math.round((totalSpent / budget) * 100)}% of ₹${budget.toLocaleString("en-IN")}).`,
          pill: "80%+ Used",
          color: "#f59e0b",
          href: "/finance",
          actionText: "Manage Money",
        });
      }
    }

    // 4. Overdue / Due Today Tasks
    (state.tasks || [])
      .filter((t) => !t.done && t.due && t.due <= today)
      .forEach((t) => {
        const isOverdue = t.due < today;
        alerts.push({
          key: `task-${t.id}`,
          category: "tasks",
          priority: isOverdue ? "urgent" : "warning",
          icon: "✅",
          title: t.title,
          desc: isOverdue ? `Overdue since ${shortDate(t.due)}` : "Due today",
          pill: isOverdue ? "Overdue" : "Due Today",
          color: isOverdue ? "#ef4444" : "#8b5cf6",
          href: "/tasks",
          actionText: "Complete Task",
        });
      });

    // 5. College schedule docs
    (state.docs || []).slice(0, 2).forEach((doc) => {
      alerts.push({
        key: `doc-${doc.id}`,
        category: "docs",
        priority: "info",
        icon: "📚",
        title: doc.title || "College Schedule",
        desc: doc.academicYear ? `${doc.academicYear} · Academic paperwork` : "Saved college document",
        pill: "Docs",
        color: "#6366f1",
        href: "/docs",
        actionText: "Open Docs",
      });
    });

    return alerts;
  }, [state.deadlines, state.attendance, state.expenses, state.ui?.budget, state.tasks, state.docs, state.profile?.attendanceRequired]);

  // Filter out dismissed alerts
  const activeAlerts = useMemo(() => {
    return allAlerts.filter((a) => !dismissed.includes(a.key));
  }, [allAlerts, dismissed]);

  const filteredAlerts = useMemo(() => {
    if (filter === "all") return activeAlerts;
    if (filter === "urgent") return activeAlerts.filter((a) => a.priority === "urgent");
    return activeAlerts.filter((a) => a.category === filter);
  }, [activeAlerts, filter]);

  const urgentCount = activeAlerts.filter((a) => a.priority === "urgent").length;
  const warningCount = activeAlerts.filter((a) => a.priority === "warning").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>Notifications & Alerts</span>
            <span className="text-xl">🔔</span>
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Real-time reminders for exams, low attendance, budget warnings, and daily tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dismissed.length > 0 && (
            <button className="btn btn-sm" onClick={clearAllDismissed}>
              ↺ Restore dismissed ({dismissed.length})
            </button>
          )}
          <button className="btn btn-sm btn-ghost" onClick={sendTestNotification}>
            🔔 Test Sound & Alert
          </button>
        </div>
      </header>

      {/* Browser Notification Status Banner */}
      <Card className="flex flex-wrap items-center justify-between gap-3 border-l-4" style={{ borderLeftColor: permission === "granted" ? "#10b981" : "#f59e0b" }}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {permission === "granted" ? "🟢" : permission === "denied" ? "🔴" : "🟡"}
          </div>
          <div>
            <div className="text-sm font-bold">
              {permission === "granted"
                ? "Desktop & mobile notifications are enabled"
                : permission === "denied"
                ? "Notifications are blocked by browser settings"
                : "Enable desktop & mobile notifications"}
            </div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {permission === "granted"
                ? "You will receive system reminders for exams, deadlines, and attendance alerts. To disable, click the button or change browser settings."
                : "Allow permissions so you never miss an upcoming exam or attendance warning."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {permission === "granted" ? (
            <button
              className="btn btn-sm"
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
              onClick={() => {
                alert("To disable notifications, go to your browser settings:\n\n• Click the lock/info icon in the address bar\n• Find 'Notifications' permission\n• Set it to 'Block' or 'Ask'\n\nThen refresh this page.");
              }}
            >
              🔕 Disable Notifications
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={requestPermission}>
              🔔 Enable Notifications
            </button>
          )}
        </div>
      </Card>

      {/* KPI Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          emoji="🚨"
          label="Urgent Alerts"
          value={urgentCount}
          sub={urgentCount > 0 ? "Requires immediate action" : "Everything on track"}
        />
        <Stat
          emoji="⚠️"
          label="Warnings"
          value={warningCount}
          sub="Deadlines & thresholds"
        />
        <Stat
          emoji="📬"
          label="Active Notifications"
          value={activeAlerts.length}
          sub={`${dismissed.length} dismissed`}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: "all", label: `All (${activeAlerts.length})` },
          { id: "urgent", label: `🚨 Urgent (${urgentCount})` },
          { id: "deadlines", label: "⏳ Deadlines" },

          { id: "finance", label: "💰 Budget" },
          { id: "tasks", label: "✅ Tasks" },
        ].map((f) => (
          <button
            key={f.id}
            className="chip text-xs"
            data-on={String(filter === f.id)}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <section>
        <SectionHeader
          title="Recent Alerts"
          action={
            activeAlerts.length > 0 && (
              <button
                className="text-xs font-medium"
                style={{ color: "var(--muted)" }}
                onClick={() => {
                  const allKeys = activeAlerts.map((a) => a.key);
                  const next = [...dismissed, ...allKeys];
                  setDismissed(next);
                  localStorage.setItem("dismissed_alerts", JSON.stringify(next));
                }}
              >
                Dismiss all
              </button>
            )
          }
        />
        <Card className="space-y-3">
          {filteredAlerts.length ? (
            filteredAlerts.map((item) => (
              <div
                key={item.key}
                className="flex items-start gap-3 rounded-xl border p-3.5 transition hover:shadow-sm"
                style={{
                  borderColor: item.priority === "urgent" ? "color-mix(in srgb, #ef4444 40%, var(--line))" : "var(--line)",
                  background: item.priority === "urgent" ? "color-mix(in srgb, #ef4444 5%, transparent)" : "transparent",
                }}
              >
                <span className="text-2xl shrink-0" aria-hidden>
                  {item.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <Pill color={item.color}>{item.pill}</Pill>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.desc}</p>

                  <div className="mt-2.5 flex items-center gap-2">
                    {item.href && (
                      <Link
                        href={item.href}
                        className="btn btn-sm btn-ghost text-xs py-0.5 px-2 font-medium"
                        style={{ color: "var(--accent)" }}
                      >
                        {item.actionText || "View"} →
                      </Link>
                    )}
                    <button
                      className="text-xs px-2 py-0.5 rounded text-muted hover:text-ink transition"
                      onClick={() => dismissAlert(item.key)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <Empty
              emoji="🎉"
              title="All caught up!"
              hint="You have no unread notifications or urgent alerts right now."
            />
          )}
        </Card>
      </section>
    </div>
  );
}
