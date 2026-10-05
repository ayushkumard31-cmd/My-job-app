"use client";

import { useMemo, useState } from "react";
import { Card, Empty, Field, Modal, PageHeader, SectionHeader, Stat } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { dateKey, monthLabel } from "@/lib/time";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const CATEGORIES = [
  { id: "Room Rent", emoji: "🏠", type: "Fixed" },
  { id: "Electricity", emoji: "⚡", type: "Fixed" },
  { id: "WiFi", emoji: "📶", type: "Fixed" },
  { id: "Grocery", emoji: "🛒", type: "Variable" },
  { id: "Food", emoji: "🍱", type: "Variable" },
  { id: "Transport", emoji: "🚌", type: "Variable" },
  { id: "College / Study", emoji: "📚", type: "Variable" },
  { id: "Mobile", emoji: "📱", type: "Fixed" },
  { id: "Health", emoji: "💊", type: "Variable" },
  { id: "Entertainment", emoji: "🎮", type: "Variable" },
  { id: "Shopping", emoji: "🛍️", type: "Variable" },
  { id: "Other", emoji: "📦", type: "Variable" },
];

const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI / GPay", emoji: "📱" },
  { id: "Cash", label: "Cash", emoji: "💵" },
  { id: "Card", label: "Card", emoji: "💳" },
];

function categoryMeta(category) {
  return (
    CATEGORIES.find((item) => item.id === category) ||
    CATEGORIES[CATEGORIES.length - 1]
  );
}

function TodayExpenses({ expenses, onDelete }) {
  const today = dateKey();

  const todayExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.date === today)
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(
            String(a.createdAt || "")
          )
        ),
    [expenses, today]
  );

  const total = todayExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  return (
    <section>
      <SectionHeader title="Today's Expense 💸" />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {today}
            </p>

            <p className="mt-1 text-2xl font-bold">
              {money(total)}
            </p>

            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {todayExpenses.length} expense
              {todayExpenses.length === 1 ? "" : "s"} today
            </p>
          </div>

          <div
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              color: "var(--accent)",
            }}
          >
            Today
          </div>
        </div>

        {todayExpenses.length === 0 ? (
          <div className="mt-5">
            <Empty
              emoji="💰"
              title="No expenses today"
              hint="Add your first expense using the button below."
            />
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {todayExpenses.map((expense) => {
              const meta = categoryMeta(expense.category);

              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <span className="text-2xl">
                    {meta.emoji}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {expense.title || expense.category}
                    </p>

                    <p
                      className="text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {expense.category || "Other"}
                      {expense.payment
                        ? ` · ${expense.payment}`
                        : ""}
                    </p>
                  </div>

                  <span className="font-bold">
                    {money(expense.amount)}
                  </span>

                  <button
                    className="btn btn-ghost btn-sm text-muted opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    onClick={() => onDelete(expense.id)}
                    title="Delete expense"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}

function MonthlyCategoryBreakdown({ expenses }) {
  const currentMonth = dateKey().slice(0, 7);

  const monthExpenses = expenses.filter((expense) =>
    expense.date?.startsWith(currentMonth)
  );

  const data = CATEGORIES.map((category) => {
    const spent = monthExpenses
      .filter((expense) => expense.category === category.id)
      .reduce(
        (sum, expense) =>
          sum + Number(expense.amount || 0),
        0
      );

    return {
      ...category,
      spent,
    };
  });

  return (
    <section>
      <SectionHeader title="Monthly Expenses by Category" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((category) => (
          <Card key={category.id}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {category.emoji}
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {category.id}
                </p>

                <p
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  {category.type} expense
                </p>
              </div>

              <strong>
                {money(category.spent)}
              </strong>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function MoneyManagement() {
  const { state, dispatch } = useApp();

  const expenses = Array.isArray(state.expenses)
    ? state.expenses
    : [];

  const [open, setOpen] = useState(false);

  const [draft, setDraft] = useState({
    title: "",
    amount: "",
    category: "Food",
    payment: "UPI",
    date: dateKey(),
  });

  const currentMonth = dateKey().slice(0, 7);

  const monthExpenses = useMemo(
    () =>
      expenses.filter((expense) =>
        expense.date?.startsWith(currentMonth)
      ),
    [expenses, currentMonth]
  );

  const monthlyTotal = useMemo(
    () =>
      monthExpenses.reduce(
        (sum, expense) =>
          sum + Number(expense.amount || 0),
        0
      ),
    [monthExpenses]
  );

  const todayTotal = useMemo(
    () =>
      expenses
        .filter((expense) => expense.date === dateKey())
        .reduce(
          (sum, expense) =>
            sum + Number(expense.amount || 0),
          0
        ),
    [expenses]
  );

  const budget = Number(
    state.money?.monthlyBudget ||
      state.ui?.budget ||
      0
  );

  const remaining = budget
    ? budget - monthlyTotal
    : 0;

  function openAddExpense() {
    setDraft({
      title: "",
      amount: "",
      category: "Food",
      payment: "UPI",
      date: dateKey(),
    });

    setOpen(true);
  }

  function saveExpense() {
    const amount = Number(draft.amount);

    if (!draft.title.trim() || amount <= 0) {
      return;
    }

    dispatch({
      type: "expense.add",
      payload: {
        title: draft.title.trim(),
        amount,
        category: draft.category,
        payment: draft.payment,
        date: draft.date,
        createdAt: new Date().toISOString(),
      },
    });

    setOpen(false);
  }

  function deleteExpense(id) {
    dispatch({
      type: "expense.delete",
      payload: {
        id,
      },
    });
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <PageHeader
        title="Money Management"
        emoji="💰"
        subtitle="Track your daily expenses and monthly bills."
        action={
          <button className="btn btn-primary" onClick={openAddExpense}>
            <Plus size={16} /> Add Expense
          </button>
        }
      />

      {/* DAILY EXPENSE AT TOP */}

      <TodayExpenses
        expenses={expenses}
        onDelete={deleteExpense}
      />

      {/* SUMMARY */}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

        <Stat
          emoji="💸"
          label="Spent Today"
          value={money(todayTotal)}
          sub="Today's spending"
        />

        <Stat
          emoji="📅"
          label={monthLabel(new Date())}
          value={money(monthlyTotal)}
          sub={`${monthExpenses.length} expenses`}
        />

        <Stat
          emoji="💰"
          label="Monthly Budget"
          value={budget ? money(budget) : "Not set"}
          sub="Your spending limit"
        />

        <Stat
          emoji="🎯"
          label="Remaining"
          value={
            budget
              ? money(Math.max(0, remaining))
              : "—"
          }
          sub={
            remaining < 0
              ? "Budget exceeded"
              : "Available this month"
          }
        />

      </div>

      {/* MONTHLY CATEGORY BREAKDOWN */}

      <MonthlyCategoryBreakdown
        expenses={expenses}
      />

      {/* ALL EXPENSE HISTORY */}

      <section>

        <SectionHeader title="Expense History" />

        {expenses.length === 0 ? (
          <Card>
            <Empty
              emoji="🧾"
              title="No expenses yet"
              hint="Add your first expense to start tracking your money."
            />
          </Card>
        ) : (
          <div className="space-y-2">

            {[...expenses]
              .sort((a, b) =>
                String(b.date || "").localeCompare(
                  String(a.date || "")
                )
              )
              .map((expense) => {

                const meta = categoryMeta(
                  expense.category
                );

                return (
                  <Card
                    key={expense.id}
                    className="flex items-center gap-3"
                  >

                    <span className="text-2xl">
                      {meta.emoji}
                    </span>

                    <div className="min-w-0 flex-1">

                      <p className="truncate font-semibold">
                        {expense.title ||
                          expense.category}
                      </p>

                      <p
                        className="text-xs"
                        style={{
                          color: "var(--muted)",
                        }}
                      >
                        {expense.category || "Other"}
                        {" · "}
                        {expense.date}

                        {expense.payment
                          ? ` · ${expense.payment}`
                          : ""}
                      </p>

                    </div>

                    <strong>
                      {money(expense.amount)}
                    </strong>

                    <button
                      className="btn btn-ghost btn-sm text-muted"
                      onClick={() =>
                        deleteExpense(expense.id)
                      }
                      title="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>

                  </Card>
                );
              })}

          </div>
        )}

      </section>

      {/* ADD EXPENSE MODAL */}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Expense"
        footer={
          <button
            className="btn btn-primary"
            onClick={saveExpense}
          >
            Save Expense
          </button>
        }
      >

        <div className="space-y-4">

          <Field label="What did you spend on?">
            <input
              autoFocus
              className="input"
              value={draft.title}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  title: event.target.value,
                })
              }
              placeholder="e.g. Monthly rent, grocery..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">

            <Field label="Amount (₹)">
              <input
                className="input"
                type="number"
                min="1"
                value={draft.amount}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    amount: event.target.value,
                  })
                }
                placeholder="0"
              />
            </Field>

            <Field label="Date">
              <input
                className="input"
                type="date"
                value={draft.date}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    date: event.target.value,
                  })
                }
              />
            </Field>

          </div>

          <Field label="Category">

            <div className="grid grid-cols-2 gap-2">

              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="chip justify-center"
                  data-on={String(
                    draft.category === category.id
                  )}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      category: category.id,
                    })
                  }
                >
                  {category.emoji} {category.id}
                </button>
              ))}

            </div>

          </Field>

          <Field label="Payment Method">

            <div className="grid grid-cols-3 gap-2">

              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className="chip justify-center"
                  data-on={String(
                    draft.payment === method.id
                  )}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      payment: method.id,
                    })
                  }
                >
                  {method.emoji} {method.label}
                </button>
              ))}

            </div>

          </Field>

        </div>

      </Modal>

    </div>
  );
}