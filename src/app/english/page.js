
"use client";

import { useMemo } from "react";
import {
  Card,
  Field,
  ProgressBar,
  SectionHeader,
} from "@/components/ui";

import { dateKey } from "@/lib/time";
import { useApp } from "@/lib/store";

const META = {
  reading: {
    emoji: "📖",
    label: "Reading",
    description: "Improve vocabulary and comprehension",
  },
  listening: {
    emoji: "🎧",
    label: "Listening",
    description: "Improve understanding of spoken English",
  },
  writing: {
    emoji: "✍️",
    label: "Writing",
    description: "Build grammar and writing confidence",
  },
  speaking: {
    emoji: "🗣️",
    label: "Speaking",
    description: "Build fluency and speaking confidence",
  },
};

const QUICK_AMOUNTS = [1, 5, 10];

export default function EnglishPage() {
  const { state, dispatch } = useApp();

  const today = dateKey();

  const skills = state.english?.skills || {};

  /*
   * ---------------------------------------------------------
   * TODAY'S DATA
   * ---------------------------------------------------------
   */

  const skillEntries = Object.entries(skills);

  const todayStats = useMemo(() => {
    let completed = 0;
    let total = 0;
    let targets = 0;

    skillEntries.forEach(([id, skill]) => {
      const value = Number(skill.log?.[today] || 0);
      const target = Math.max(1, Number(skill.target) || 1);

      total += value;
      targets += target;

      if (value >= target) {
        completed++;
      }
    });

    const percentage =
      targets > 0
        ? Math.min(100, Math.round((total / targets) * 100))
        : 0;

    return {
      completed,
      total,
      targets,
      percentage,
    };
  }, [skillEntries, today]);


  /*
   * ---------------------------------------------------------
   * XP
   * ---------------------------------------------------------
   */

  const currentXP = state.xp || 0;

  const completedAll =
    skillEntries.length > 0 &&
    skillEntries.every(([id, skill]) => {
      const value = Number(skill.log?.[today] || 0);
      const target = Math.max(1, Number(skill.target) || 1);

      return value >= target;
    });


  /*
   * ---------------------------------------------------------
   * LOG PRACTICE
   * ---------------------------------------------------------
   */

  const logPractice = (skill, amount) => {
    dispatch({
      type: "english.log",
      payload: {
        skill,
        date: today,
        delta: amount,
      },
    });
  };


  /*
   * ---------------------------------------------------------
   * UPDATE TARGET
   * ---------------------------------------------------------
   */

  const updateTarget = (skill, value) => {
    const target = Math.max(
      1,
      Number(value) || 1
    );

    dispatch({
      type: "english.target",
      payload: {
        skill,
        patch: {
          target,
        },
      },
    });
  };


  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="space-y-5">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              English & Communication
            </h1>

            <p
              className="text-sm"
              style={{
                color: "var(--muted)",
              }}
            >
              Build reading, listening, writing and speaking
              confidence every day.
            </p>
          </div>

          <div
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              background:
                "color-mix(in srgb, var(--accent) 15%, transparent)",
              color: "var(--accent)",
            }}
          >
            {todayStats.completed}/{skillEntries.length} skills completed
          </div>
        </div>
      </header>


      {/* =====================================================
          DAILY OVERVIEW
      ====================================================== */}

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold"
              style={{
                color: "var(--muted)",
              }}
            >
              TODAY'S ENGLISH GOAL
            </p>

            <p className="text-2xl font-black mt-1">
              {todayStats.percentage}%
            </p>

            <p
              className="text-xs mt-1"
              style={{
                color: "var(--muted)",
              }}
            >
              {todayStats.total} / {todayStats.targets}{" "}
              total practice units
            </p>
          </div>

          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              border: "7px solid var(--line)",
              background:
                "color-mix(in srgb, var(--accent) 10%, transparent)",
            }}
          >
            <span className="text-lg font-bold">
              {todayStats.percentage}%
            </span>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar
            value={todayStats.percentage}
          />
        </div>

        <div
          className="mt-3 text-xs"
          style={{
            color: "var(--muted)",
          }}
        >
          {completedAll
            ? "🎉 Excellent! You completed all today's English targets."
            : todayStats.percentage >= 75
            ? "🔥 Almost there! Finish the remaining practice."
            : todayStats.percentage >= 40
            ? "💪 Good progress. Keep building the habit."
            : "🚀 Start small. One practice session is enough to begin."}
        </div>
      </Card>


      {/* =====================================================
          XP
      ====================================================== */}

      <Card
        className="relative overflow-hidden"
        style={{
          background: "var(--accent-soft)",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold"
              style={{
                color: "var(--muted)",
              }}
            >
              YOUR XP
            </p>

            <p className="text-3xl font-black mt-1">
              ⭐ {currentXP}
            </p>

            <p
              className="text-xs mt-1"
              style={{
                color: "var(--muted)",
              }}
            >
              Keep completing your daily targets to earn XP.
            </p>
          </div>

          <div className="text-4xl">
            {completedAll ? "🏆" : "⭐"}
          </div>
        </div>

        {completedAll && (
          <div
            className="mt-4 rounded-lg px-3 py-2 text-xs font-semibold"
            style={{
              background:
                "color-mix(in srgb, var(--accent) 15%, transparent)",
            }}
          >
            🎯 All four skills completed today!
          </div>
        )}
      </Card>


      {/* =====================================================
          TODAY'S PRACTICE
      ====================================================== */}

      <section>
        <SectionHeader
          title="Today's practice"
        />

        <div className="grid gap-3 md:grid-cols-2">

          {skillEntries.map(([id, skill]) => {
            const meta = META[id] || {
              emoji: "📚",
              label: id,
              description: "Improve your English skills",
            };

            const value = Number(
              skill.log?.[today] || 0
            );

            const target = Math.max(
              1,
              Number(skill.target) || 1
            );

            const rawPercentage =
              (value / target) * 100;

            const percentage = Math.min(
              100,
              Math.round(rawPercentage)
            );

            const completed =
              value >= target;

            const remaining = Math.max(
              0,
              target - value
            );

            return (
              <Card
                key={id}
                className="space-y-4"
                style={
                  completed
                    ? {
                        borderColor:
                          "color-mix(in srgb, #22c55e 45%, var(--line))",
                      }
                    : undefined
                }
              >

                {/* ------------------------------------------------
                    TITLE
                ------------------------------------------------- */}

                <div className="flex items-start justify-between gap-3">

                  <div className="flex gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{
                        background:
                          "color-mix(in srgb, var(--accent) 12%, transparent)",
                      }}
                    >
                      {meta.emoji}
                    </div>

                    <div>
                      <p className="font-semibold">
                        {meta.label}
                      </p>

                      <p
                        className="text-xs mt-0.5"
                        style={{
                          color: "var(--muted)",
                        }}
                      >
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className="text-xs font-bold"
                    style={{
                      color: completed
                        ? "#22c55e"
                        : "var(--accent)",
                    }}
                  >
                  {completed ? "✓ DONE" : percentage + "%"}
                  </span>
                </div>


                {/* ------------------------------------------------
                    PROGRESS
                ------------------------------------------------- */}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs"
                      style={{
                        color: "var(--muted)",
                      }}
                    >
                      {value} / {target}{" "}
                      {skill.unit}
                    </span>

                    {completed ? (
                      <span className="text-xs font-semibold">
                        +10 XP ⭐
                      </span>
                    ) : (
                      <span
                        className="text-xs"
                        style={{
                          color: "var(--muted)",
                        }}
                      >
                        {remaining} remaining
                      </span>
                    )}
                  </div>

                  <ProgressBar
                    value={percentage}
                    color={
                      completed
                        ? "#22c55e"
                        : undefined
                    }
                  />
                </div>


                {/* ------------------------------------------------
                    QUICK LOG BUTTONS
                ------------------------------------------------- */}

                <div>
                  <p
                    className="text-[11px] mb-2"
                    style={{
                      color: "var(--muted)",
                    }}
                  >
                    Log practice
                  </p>

                  <div className="flex gap-2">

                    {QUICK_AMOUNTS.map(
                      (amount) => (
                        <button
                          key={amount}
                          className="btn btn-sm"
                          onClick={() =>
                            logPractice(
                              id,
                              amount
                            )
                          }
                        >
                          +{amount}
                        </button>
                      )
                    )}

                    <button
                      className="btn btn-sm"
                      onClick={() =>
                        logPractice(
                          id,
                          -1
                        )
                      }
                      disabled={
                        value <= 0
                      }
                      aria-label={"Remove " + meta.label + " practice"}
                    >
                      −1
                    </button>
                  </div>
                </div>


                {/* ------------------------------------------------
                    TARGET
                ------------------------------------------------- */}

                <Field label="Daily target">
                  <div className="flex gap-2">
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={target}
                      onChange={(e) =>
                        updateTarget(
                          id,
                          e.target.value
                        )
                      }
                    />

                    <span
                      className="flex items-center px-3 text-xs rounded-md shrink-0"
                      style={{
                        background:
                          "var(--line)",
                        color:
                          "var(--muted)",
                      }}
                    >
                      {skill.unit}
                    </span>
                  </div>
                </Field>

              </Card>
            );
          })}

        </div>
      </section>


      {/* =====================================================
          DAILY CHECKLIST
      ====================================================== */}

      <Card>
        <SectionHeader
          title="English checklist"
        />

        <div className="space-y-2 mt-3">

          {skillEntries.map(([id, skill]) => {
            const meta =
              META[id];

            const value = Number(
              skill.log?.[today] || 0
            );

            const target = Math.max(
              1,
              Number(skill.target) || 1
            );

            const completed =
              value >= target;

            return (
              <div
                key={id}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                style={{
                  background:
                    "color-mix(in srgb, var(--line) 45%, transparent)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span>
                    {completed
                      ? "✅"
                      : "⬜"}
                  </span>

                  <span className="text-sm">
                    {meta?.emoji}{" "}
                    {meta?.label ||
                      id}
                  </span>
                </div>

                <span
                  className="text-xs"
                  style={{
                    color:
                      "var(--muted)",
                  }}
                >
                  {value}/{target}
                </span>
              </div>
            );
          })}

        </div>
      </Card>


      {/* =====================================================
          TIPS
      ====================================================== */}

      <Card>
        <SectionHeader
          title="How to improve faster"
        />

        <div className="grid gap-2 md:grid-cols-2 mt-3">

          <div className="text-sm">
            📖 <strong>Reading:</strong>{" "}
            Read an English article or 5–10 pages.
          </div>

          <div className="text-sm">
            🎧 <strong>Listening:</strong>{" "}
            Listen to English content without subtitles first.
          </div>

          <div className="text-sm">
            ✍️ <strong>Writing:</strong>{" "}
            Write a short paragraph about your day.
          </div>

          <div className="text-sm">
            🗣️ <strong>Speaking:</strong>{" "}
            Speak for 2–5 minutes without stopping.
          </div>

        </div>
      </Card>

    </div>
  );
}
