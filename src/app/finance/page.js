"use client";

import { useMemo, useState } from "react";
import { Card, Empty, Field, Modal, SectionHeader, Stat } from "@/components/ui";
import { useApp } from "@/lib/store";
import { dateKey, monthLabel, addDays } from "@/lib/time";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const CATEGORIES = [
  { id: "Food", emoji: "🍔", color: "#f59e0b" },
  { id: "Travel", emoji: "🚌", color: "#6366f1" },
  { id: "Books", emoji: "📚", color: "#10b981" },
  { id: "Fees", emoji: "🏫", color: "#ef4444" },
  { id: "Shopping", emoji: "🛍️", color: "#8b5cf6" },
  { id: "Tech", emoji: "💻", color: "#06b6d4" },
  { id: "Other", emoji: "💸", color: "#64748b" },
];

const QUICK_PRESETS = [
  { title: "Chai & Snacks", amount: 20, category: "Food", emoji: "☕" },
  { title: "Canteen Lunch", amount: 80, category: "Food", emoji: "🍱" },
  { title: "Bus / Metro", amount: 40, category: "Travel", emoji: "🚌" },
  { title: "Printouts / Xerox", amount: 30, category: "Books", emoji: "🖨️" },
  { title: "Mobile Recharge", amount: 299, category: "Other", emoji: "📱" },
  { title: "Notebook & Pen", amount: 75, category: "Books", emoji: "📝" },
];

const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI / GPay", emoji: "📱" },
  { id: "Cash", label: "Cash", emoji: "💵" },
  { id: "Card", label: "Card", emoji: "💳" },
];

const catMeta = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(dateKey(addDays(new Date(), -i)));
  }
  return days;
}

function SpendingChart({ expenses }) {
  const days = lastNDays(14);
  const byDay = useMemo(() => {
    const map = {};
    for (const d of days) map[d] = 0;
    for (const e of expenses) {
      if (map[e.date] !== undefined) map[e.date] += Number(e.amount || 0);
    }
    return days.map((d) => ({ date: d, amount: map[d] }));
  }, [expenses, days]);

  const max = Math.max(...byDay.map((d) => d.amount), 1);

  return (
    <div>
      <SectionHeader title="Daily spending — last 14 days" />
      <Card>
        <div className="flex items-end gap-1 h-28 pt-4">
          {byDay.map(({ date, amount }) => {
            const pct = max ? (amount / max) * 100 : 0;
            const isToday = date === dateKey();
            return (
              <div
                key={date}
                className="flex-1 flex flex-col items-center gap-1 group relative"
                title={`${date}: ${money(amount)}`}
              >
                {amount > 0 && (
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow"
                    style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink)" }}
                  >
                    {money(amount)}
                  </div>
                )}
                <div
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${Math.max(pct, amount > 0 ? 8 : 2)}%`,
                    background: isToday
                      ? "var(--accent)"
                      : amount > 0
                      ? "color-mix(in srgb, var(--accent) 55%, transparent)"
                      : "var(--line)",
                    minHeight: "4px",
                  }}
                />
                <span
                  className="text-[8px] font-mono mt-1"
                  style={{ color: isToday ? "var(--accent)" : "var(--muted)", fontWeight: isToday ? 700 : 400 }}
                >
                  {date.slice(8)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: "var(--muted)" }}>
          <span>14 days ago</span>
          <span>Hover bar to preview amount · Today highlighted</span>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>Today</span>
        </div>
      </Card>
    </div>
  );
}

function BudgetSection({ monthExpenses, budget, onSetBudget }) {
  const total = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const remaining = budget - total;
  const pct = budget ? Math.min(100, (total / budget) * 100) : 0;
  const over = total > budget && budget > 0;

  return (
    <div>
      <SectionHeader
        title="Monthly budget"
        action={
          <button className="btn btn-sm" onClick={onSetBudget}>
            {budget ? "Edit budget" : "Set budget"}
          </button>
        }
      />
      <Card>
        {budget > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Spent: <strong>{money(total)}</strong></span>
              <span style={{ color: over ? "#ef4444" : pct > 80 ? "#f59e0b" : "#10b981", fontWeight: 600 }}>
                {over ? `Over by ${money(Math.abs(remaining))}` : `${money(remaining)} left`}
              </span>
            </div>
            <div className="bar" style={{ height: "0.55rem" }}>
              <i
                style={{
                  width: `${pct}%`,
                  background: over ? "#ef4444" : pct > 80 ? "#f59e0b" : "#10b981",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>0%</span>
              <span>{Math.round(pct)}% of {money(budget)}</span>
              <span>100%</span>
            </div>
            {over ? (
              <div className="rounded-lg p-2.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400">
                ⚠️ Budget exceeded! Look at high-spend categories below to cut unnecessary costs.
              </div>
            ) : pct > 80 ? (
              <div className="rounded-lg p-2.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400">
                ⚡ Approaching budget limit ({Math.round(pct)}% used). Be careful with discretionary expenses!
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm" style={{ color: "var(--muted)" }}>Set a monthly limit to prevent overspending</p>
            <button className="btn btn-sm btn-primary" onClick={onSetBudget}>Set budget limit</button>
          </div>
        )}
      </Card>
    </div>
  );
}

function SavingsSection({ monthExpenses, income, onSetIncome }) {
  const total = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const savings = income - total;
  const rate = income ? Math.max(0, Math.round((savings / income) * 100)) : 0;

  return (
    <div>
      <SectionHeader
        title="Income & Savings"
        action={
          <button className="btn btn-sm" onClick={onSetIncome}>
            {income ? "Edit income" : "Set income"}
          </button>
        }
      />
      <Card>
        {income > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Income: <strong>{money(income)}</strong></span>
              <span style={{ color: savings >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                {savings >= 0 ? `+${money(savings)} saved` : `-${money(Math.abs(savings))} deficit`}
              </span>
            </div>
            <div className="bar" style={{ height: "0.55rem" }}>
              <i
                style={{
                  width: `${Math.min(100, Math.max(0, rate))}%`,
                  background: savings >= 0 ? "#10b981" : "#ef4444",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>Savings rate: <strong style={{ color: savings >= 0 ? "#10b981" : "#ef4444" }}>{rate}%</strong></span>
              <span>Spent {money(total)} of {money(income)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm" style={{ color: "var(--muted)" }}>Enter your monthly pocket money or stipend</p>
            <button className="btn btn-sm btn-primary" onClick={onSetIncome}>Set monthly income</button>
          </div>
        )}
      </Card>
    </div>
  );
}

function InsightsSection({ monthExpenses, allExpenses }) {
  const lastMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const thisTotal = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const lastTotal = allExpenses
    .filter((e) => e.date?.startsWith(lastMonth))
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const diff = thisTotal - lastTotal;
  const pct = lastTotal ? Math.round(Math.abs(diff / lastTotal) * 100) : null;

  const avgPerDay = (() => {
    const day = new Date().getDate();
    return day > 0 ? Math.round(thisTotal / day) : 0;
  })();

  const topExpense = useMemo(() => {
    if (!monthExpenses.length) return null;
    return [...monthExpenses].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
  }, [monthExpenses]);

  const topCategory = useMemo(() => {
    const map = {};
    for (const e of monthExpenses) {
      const c = e.category || "Other";
      map[c] = (map[c] || 0) + Number(e.amount || 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0] || null;
  }, [monthExpenses]);

  if (!monthExpenses.length) return null;

  return (
    <div>
      <SectionHeader title="Spending Insights & Analytics" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>vs Last Month</div>
          <div className="mt-1 text-xl font-bold" style={{ color: diff > 0 ? "#ef4444" : "#10b981" }}>
            {diff > 0 ? "+" : ""}{money(diff)}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            {pct !== null ? `${pct}% ${diff > 0 ? "more" : "less"} than last month` : "First month recorded"}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Daily Velocity</div>
          <div className="mt-1 text-xl font-bold">{money(avgPerDay)} <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>/ day</span></div>
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Projected: ~{money(avgPerDay * 30)} this month
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Largest Single Spend</div>
          <div className="mt-1 text-xl font-bold">{topExpense ? money(topExpense.amount) : "—"}</div>
          <div className="text-xs mt-1 truncate" style={{ color: "var(--muted)" }}>
            {topExpense ? `${topExpense.title} (${topExpense.category || "Other"})` : "No data"}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [budgetDraft, setBudgetDraft] = useState("");
  const [incomeDraft, setIncomeDraft] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  const currentMonth = dateKey().slice(0, 7);
  const budget = state.ui?.budget || 0;
  const income = state.ui?.income || 0;

  const monthExpenses = useMemo(
    () => state.expenses.filter((e) => e.date?.startsWith(currentMonth)),
    [state.expenses, currentMonth]
  );

  const total = useMemo(
    () => monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    [monthExpenses]
  );

  const todaySpent = useMemo(() => {
    const today = dateKey();
    return state.expenses
      .filter((e) => e.date === today)
      .reduce((s, e) => s + Number(e.amount || 0), 0);
  }, [state.expenses]);

  const categories = useMemo(() => {
    const map = {};
    for (const e of monthExpenses) {
      const c = e.category || "Other";
      map[c] = (map[c] || 0) + Number(e.amount || 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthExpenses]);

  const filteredExpenses = useMemo(() => {
    let list = [...state.expenses];

    // Category filter
    if (filter !== "all") {
      list = list.filter((e) => (e.category || "Other") === filter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.title?.toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q) ||
        (e.payment || "").toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "date-desc") return b.date.localeCompare(a.date);
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "amount-desc") return Number(b.amount || 0) - Number(a.amount || 0);
      if (sortBy === "amount-asc") return Number(a.amount || 0) - Number(b.amount || 0);
      return 0;
    });

    return list;
  }, [state.expenses, filter, search, sortBy]);

  const save = () => {
    if (!draft?.title?.trim() || !Number(draft.amount)) return;
    dispatch({
      type: "expense.add",
      payload: {
        ...draft,
        title: draft.title.trim(),
        amount: Number(draft.amount),
        payment: draft.payment || "UPI",
      },
    });
    setOpen(false);
  };

  const handleQuickAdd = (preset) => {
    setDraft({
      title: preset.title,
      amount: String(preset.amount),
      category: preset.category,
      payment: "UPI",
      date: dateKey(),
    });
    setOpen(true);
  };

  const exportCSV = () => {
    if (!state.expenses.length) return;
    const headers = ["Date", "Title", "Category", "Amount (INR)", "Payment Method"];
    const rows = state.expenses.map((e) => [
      e.date,
      `"${(e.title || "").replace(/"/g, '""')}"`,
      e.category || "Other",
      e.amount,
      e.payment || "UPI",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_${dateKey()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Money Manager</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Track every rupee · Budget smart · Detailed insights & history
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state.expenses.length > 0 && (
            <button className="btn btn-sm" onClick={exportCSV} title="Download CSV report">
              📥 Export CSV
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => {
              setDraft({ title: "", amount: "", category: "Food", payment: "UPI", date: dateKey() });
              setOpen(true);
            }}
          >
            + Add expense
          </button>
        </div>
      </header>

      {/* Quick Add Presets */}
      <div>
        <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>⚡ Quick Add College Expenses</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.title}
              className="chip hover:scale-105 transition-transform"
              onClick={() => handleQuickAdd(preset)}
              title={`Add ${preset.title} (${money(preset.amount)})`}
            >
              <span>{preset.emoji}</span>
              <span>{preset.title}</span>
              <span className="font-semibold" style={{ color: "var(--accent)" }}>{money(preset.amount)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat emoji="📅" label={monthLabel(new Date())} value={money(total)} sub={`${monthExpenses.length} expenses`} />
        <Stat emoji="🏆" label="Top category" value={categories[0]?.[0] || "—"} sub={categories.length ? money(categories[0][1]) : "No expenses"} />
        <Stat emoji="🎯" label="Budget left" value={budget ? money(Math.max(0, budget - total)) : "—"} sub={budget ? `of ${money(budget)}` : "No budget set"} />
        <Stat emoji="📆" label="Today" value={money(todaySpent)} sub="Spent today" />
      </div>

      {/* Daily Chart */}
      <SpendingChart expenses={state.expenses} />

      {/* Budget & Savings sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BudgetSection
          monthExpenses={monthExpenses}
          budget={budget}
          onSetBudget={() => { setBudgetDraft(String(budget || "")); setBudgetOpen(true); }}
        />
        <SavingsSection
          monthExpenses={monthExpenses}
          income={income}
          onSetIncome={() => { setIncomeDraft(String(income || "")); setIncomeOpen(true); }}
        />
      </div>

      {/* Detailed Insights */}
      <InsightsSection monthExpenses={monthExpenses} allExpenses={state.expenses} />

      {/* Category breakdown */}
      <section>
        <SectionHeader title="This month by category" />
        <Card className="space-y-3">
          {categories.length ? (
            categories.map(([name, amount]) => {
              const meta = catMeta(name);
              return (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span>{meta.emoji}</span>
                      <span className="font-medium">{name}</span>
                      <span
                        className="text-[10px] rounded-full px-1.5 py-0.5 font-semibold"
                        style={{ background: `color-mix(in srgb, ${meta.color} 18%, transparent)`, color: meta.color }}
                      >
                        {total ? Math.round((amount / total) * 100) : 0}%
                      </span>
                    </span>
                    <span className="font-bold">{money(amount)}</span>
                  </div>
                  <div className="bar" style={{ height: "0.5rem" }}>
                    <i style={{ width: `${total ? (amount / total) * 100 : 0}%`, background: meta.color }} />
                  </div>
                </div>
              );
            })
          ) : (
            <Empty emoji="💳" title="No expenses this month" hint="Add transport, food, books, or other spending." />
          )}
        </Card>
      </section>

      {/* Expense History with Search & Sort */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <SectionHeader title="Expense history" />
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input text-xs py-1 px-2.5 h-8 w-40 sm:w-56"
              placeholder="🔍 Search expenses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="select text-xs py-1 px-2 h-8"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Highest amount</option>
              <option value="amount-asc">Lowest amount</option>
            </select>
          </div>
        </div>

        {/* Category Chips Filter */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {["all", ...CATEGORIES.map((c) => c.id)].map((cat) => (
            <button key={cat} className="chip" data-on={String(filter === cat)} onClick={() => setFilter(cat)}>
              {cat === "all" ? "All" : `${catMeta(cat).emoji} ${cat}`}
            </button>
          ))}
        </div>

        {/* Expenses List */}
        <div className="space-y-2">
          {filteredExpenses.length ? (
            filteredExpenses.map((e) => {
              const meta = catMeta(e.category || "Other");
              return (
                <Card key={e.id} className="flex items-center gap-3" style={{ borderLeft: `4px solid ${meta.color}` }}>
                  <span className="text-2xl shrink-0">{meta.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{e.title}</p>
                      {e.payment && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "var(--line)", color: "var(--muted)" }}>
                          {e.payment}
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{e.category || "Other"} · {e.date}</p>
                  </div>
                  <span className="font-bold text-base shrink-0">{money(e.amount)}</span>
                  <button
                    className="btn btn-ghost btn-sm shrink-0"
                    aria-label="Delete expense"
                    title="Delete expense"
                    onClick={() => dispatch({ type: "expense.delete", payload: { id: e.id } })}
                  >
                    ✕
                  </button>
                </Card>
              );
            })
          ) : (
            <Card><Empty emoji="🧾" title="No expenses found" hint="Try adjusting your filter/search or log a new expense." /></Card>
          )}
        </div>
      </section>

      {/* Add / Edit Expense Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New expense" footer={<button className="btn btn-primary" onClick={save}>Save expense</button>}>
        {draft && (
          <div className="space-y-3">
            <Field label="What did you spend on?">
              <input autoFocus className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Bus pass, lunch, books…" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)">
                <input className="input" type="number" min="1" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" />
              </Field>
              <Field label="Date">
                <input className="input" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </Field>
            </div>
            <Field label="Category">
              <div className="grid grid-cols-3 gap-2 mt-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="chip justify-center"
                    data-on={String(draft.category === c.id)}
                    onClick={() => setDraft({ ...draft, category: c.id })}
                    style={draft.category === c.id ? { borderColor: c.color, background: `color-mix(in srgb, ${c.color} 18%, transparent)` } : {}}
                  >
                    {c.emoji} {c.id}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Payment Method">
              <div className="grid grid-cols-3 gap-2 mt-1">
                {PAYMENT_METHODS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="chip justify-center"
                    data-on={String(draft.payment === p.id)}
                    onClick={() => setDraft({ ...draft, payment: p.id })}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}
      </Modal>

      {/* Budget Modal */}
      <Modal open={budgetOpen} onClose={() => setBudgetOpen(false)} title="Set monthly budget" footer={<button className="btn btn-primary" onClick={() => { dispatch({ type: "ui", payload: { budget: Number(budgetDraft) } }); setBudgetOpen(false); }}>Save budget</button>}>
        <Field label="Monthly budget limit (₹)">
          <input autoFocus className="input" type="number" min="1" value={budgetDraft} onChange={(e) => setBudgetDraft(e.target.value)} placeholder="e.g. 5000" />
        </Field>
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          You will get alerts when spending approaches or exceeds this amount.
        </p>
      </Modal>

      {/* Income Modal */}
      <Modal open={incomeOpen} onClose={() => setIncomeOpen(false)} title="Set monthly income / allowance" footer={<button className="btn btn-primary" onClick={() => { dispatch({ type: "ui", payload: { income: Number(incomeDraft) } }); setIncomeOpen(false); }}>Save income</button>}>
        <Field label="Monthly pocket money / stipend (₹)">
          <input autoFocus className="input" type="number" min="1" value={incomeDraft} onChange={(e) => setIncomeDraft(e.target.value)} placeholder="e.g. 8000" />
        </Field>
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          Used to calculate your monthly savings amount and savings rate %.
        </p>
      </Modal>
    </div>
  );
}
