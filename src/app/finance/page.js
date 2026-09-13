"use client";

import { useMemo, useState } from "react";
import { Card, Empty, Field, Modal, SectionHeader, Stat } from "@/components/ui";
import { useApp } from "@/lib/store";
import { dateKey, monthLabel } from "@/lib/time";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function FinancePage() {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const month = dateKey().slice(0, 7);
  const monthExpenses = useMemo(() => state.expenses.filter((e) => e.date?.startsWith(month)), [state.expenses, month]);
  const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const categories = useMemo(() => Object.entries(monthExpenses.reduce((a, e) => ({ ...a, [e.category || "Other"]: (a[e.category || "Other"] || 0) + Number(e.amount || 0) }), {})), [monthExpenses]);

  const save = () => {
    if (!draft?.title?.trim() || !Number(draft.amount)) return;
    dispatch({ type: "expense.add", payload: { ...draft, title: draft.title.trim(), amount: Number(draft.amount) } });
    setOpen(false);
  };
  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold">Money manager</h1><p className="text-sm text-muted">Keep every expense visible and make better spending choices.</p></div><button className="btn btn-primary" onClick={() => { setDraft({ title: "", amount: "", category: "Food", date: dateKey() }); setOpen(true); }}>+ Add expense</button></header>
    <div className="grid gap-3 sm:grid-cols-2"><Stat emoji="💸" label={monthLabel(new Date())} value={money(total)} sub={`${monthExpenses.length} expenses`} /><Stat emoji="🏷️" label="Top category" value={categories.sort((a,b) => b[1]-a[1])[0]?.[0] || "—"} sub={categories.length ? money(categories.sort((a,b) => b[1]-a[1])[0][1]) : "Add your first expense"} /></div>
    <section><SectionHeader title="This month by category" /><Card className="space-y-3">{categories.length ? categories.sort((a,b) => b[1]-a[1]).map(([name, amount]) => <div key={name}><div className="mb-1 flex justify-between text-sm"><span>{name}</span><span className="text-muted">{money(amount)}</span></div><div className="bar"><i style={{ width: `${total ? amount / total * 100 : 0}%`, background: "var(--accent)" }} /></div></div>) : <Empty emoji="💰" title="No expenses this month" hint="Add transport, food, books, or other spending." />}</Card></section>
    <section><SectionHeader title="Recent expenses" /><div className="space-y-2">{state.expenses.length ? state.expenses.sort((a,b) => b.date.localeCompare(a.date)).map((e) => <Card key={e.id} className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{e.title}</p><p className="text-xs text-muted">{e.category || "Other"} · {e.date}</p></div><span className="font-semibold">{money(e.amount)}</span><button className="btn btn-ghost btn-sm" aria-label="Delete expense" onClick={() => dispatch({ type: "expense.delete", payload: { id: e.id } })}>✕</button></Card>) : <Card><Empty emoji="🧾" title="Your expenses will appear here" /></Card>}</div></section>
    <Modal open={open} onClose={() => setOpen(false)} title="New expense" footer={<button className="btn btn-primary" onClick={save}>Save expense</button>}>{draft && <div className="space-y-3"><Field label="What did you spend on?"><input autoFocus className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Bus pass" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Amount (₹)"><input className="input" type="number" min="1" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} /></Field><Field label="Date"><input className="input" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field></div><Field label="Category"><select className="select" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{["Food", "Travel", "Books", "Fees", "Shopping", "Other"].map((x) => <option key={x}>{x}</option>)}</select></Field></div>}</Modal>
  </div>;
}
