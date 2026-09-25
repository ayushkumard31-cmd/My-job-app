"use client";

import { useEffect, useMemo, useState } from "react";
import SortableList, { reorder } from "@/components/SortableList";
import {
  Card,
  Field,
  Modal,
  SectionHeader,
  Segmented,
} from "@/components/ui";

import {
  CATEGORIES,
  DAY_MODES,
  catColor,
  modeById,
} from "@/lib/catalog";

import {
  blocksFor,
  dayProgress,
  doneFor,
  modeFor,
  uid,
  useApp,
} from "@/lib/store";

import {
  addDays,
  dateKey,
  fmtDuration,
  fmtTime,
  longDate,
  parseKey,
  toHHMM,
  toMin,
} from "@/lib/time";


// ============================================================
// CONSTANTS
// ============================================================

const EMOJIS = [
  "📚",
  "🏃",
  "🧑‍💻",
  "🎮",
  "🛌",
  "🍽️",
  "📝",
  "⚡",
  "🎯",
  "💪",
  "🎧",
  "🌟",
  "🚀",
  "💡",
  "🎨",
  "🏋️",
];

const PRIORITIES = {
  high: {
    label: "High",
    emoji: "🔴",
    multiplier: 1.3,
  },
  medium: {
    label: "Medium",
    emoji: "🟡",
    multiplier: 1.0,
  },
  low: {
    label: "Low",
    emoji: "🟢",
    multiplier: 0.8,
  },
};


// ============================================================
// REPACK
// ============================================================

function repack(original, next) {
  const gaps = [];

  for (let i = 1; i < original.length; i++) {
    gaps.push(
      Math.max(
        0,
        original[i].start - original[i - 1].end
      )
    );
  }

  let t = original[0]?.start ?? 7 * 60;

  return next.map((b, i) => {
    const dur = Math.max(
      5,
      b.end - b.start
    );

    const block = {
      ...b,
      start: t,
      end: t + dur,
    };

    t =
      block.end +
      (gaps[i] ?? 0);

    return block;
  });
}


// ============================================================
// XP
// ============================================================

function blockXP(block) {
  const dur = Math.max(
    0,
    block.end - block.start
  );

  const base =
    Math.round(dur / 15) * 5;

  const multipliers = {
    study: 1.5,
    career: 1.5,
    fitness: 1.2,
    custom: 1.0,
    rest: 0.3,
    college: 1.0,
  };

  const categoryMultiplier =
    multipliers[block.category] || 1.0;

  const priorityMultiplier =
    PRIORITIES[block.priority]?.multiplier || 1;

  return Math.max(
    5,
    Math.round(
      base *
        categoryMultiplier *
        priorityMultiplier
    )
  );
}


function xpToLevel(xp) {
  const level =
    Math.floor(
      Math.sqrt(xp / 50)
    ) + 1;

  const current =
    Math.pow(level - 1, 2) * 50;

  const next =
    Math.pow(level, 2) * 50;

  return {
    level,
    current,
    next,
    progress: xp - current,
    needed: next - current,
  };
}


// ============================================================
// XP BAR
// ============================================================

function XPBar({ xp }) {
  const {
    level,
    progress,
    needed,
  } = xpToLevel(xp);

  const pct =
    needed > 0
      ? Math.min(
          100,
          (progress / needed) * 100
        )
      : 100;

  const rankNames = [
    "Rookie",
    "Learner",
    "Scholar",
    "Achiever",
    "Expert",
    "Master",
    "Legend",
    "Champion",
    "Elite",
    "Prodigy",
  ];

  const rank =
    rankNames[
      Math.min(
        level - 1,
        rankNames.length - 1
      )
    ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), #8b5cf6)",
              color: "#fff",
            }}
          >
            {level}
          </div>

          <div>
            <div className="text-sm font-bold">
              {rank}
            </div>

            <div
              className="text-[11px]"
              style={{
                color: "var(--muted)",
              }}
            >
              {xp} XP total
            </div>
          </div>
        </div>

        <div className="text-right">
          <div
            className="text-xs font-semibold"
            style={{
              color: "var(--accent)",
            }}
          >
            Level {level}
          </div>

          <div
            className="text-[11px]"
            style={{
              color: "var(--muted)",
            }}
          >
            {progress}/{needed} to Lvl{" "}
            {level + 1}
          </div>
        </div>
      </div>

      <div
        className="bar"
        style={{
          height: "0.6rem",
        }}
      >
        <i
          style={{
            width: `${pct}%`,
            background:
              "var(--accent)",
            transition:
              "width 0.5s ease",
          }}
        />
      </div>
    </Card>
  );
}


// ============================================================
// DAILY PROGRESS
// ============================================================

function DayProgress({
  blocks,
  done,
}) {
  const active = blocks.filter(
    (b) =>
      b.end > b.start &&
      b.category !== "rest"
  );

  const completed =
    active.filter((b) =>
      done.has(b.id)
    );

  const plannedMinutes =
    active.reduce(
      (sum, b) =>
        sum +
        Math.max(
          0,
          b.end - b.start
        ),
      0
    );

  const completedMinutes =
    completed.reduce(
      (sum, b) =>
        sum +
        Math.max(
          0,
          b.end - b.start
        ),
      0
    );

  const pct =
    plannedMinutes > 0
      ? Math.round(
          (completedMinutes /
            plannedMinutes) *
            100
        )
      : 0;

  const earnedXP =
    completed.reduce(
      (sum, b) =>
        sum + blockXP(b),
      0
    );

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <SectionHeader
          title="Today's progress"
        />

        <div
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background:
              "color-mix(in srgb, var(--accent) 18%, transparent)",
            color: "var(--accent)",
          }}
        >
          +{earnedXP} XP
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="relative flex-shrink-0"
          style={{
            width: 72,
            height: 72,
          }}
        >
          <svg
            width={72}
            height={72}
            className="-rotate-90"
          >
            <circle
              cx={36}
              cy={36}
              r={28}
              fill="none"
              stroke="var(--line)"
              strokeWidth={8}
            />

            <circle
              cx={36}
              cy={36}
              r={28}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={
                2 * Math.PI * 28
              }
              strokeDashoffset={
                2 *
                  Math.PI *
                  28 -
                (2 *
                  Math.PI *
                  28 *
                  pct) /
                  100
              }
              style={{
                transition:
                  "stroke-dashoffset 0.5s ease",
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold">
              {pct}%
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="text-sm">
            <strong>
              {fmtDuration(
                completedMinutes
              )}
            </strong>

            <span
              style={{
                color: "var(--muted)",
              }}
            >
              {" "}
              /{" "}
              {fmtDuration(
                plannedMinutes
              )}
            </span>
          </div>

          <div className="bar">
            <i
              style={{
                width: `${pct}%`,
                background:
                  "var(--accent)",
              }}
            />
          </div>

          <div
            className="text-[11px]"
            style={{
              color: "var(--muted)",
            }}
          >
            {pct === 100
              ? "🎉 Perfect day!"
              : pct >= 70
              ? "🔥 You're doing great!"
              : pct >= 40
              ? "💪 Keep going!"
              : "🚀 Start your first activity!"}
          </div>
        </div>
      </div>

      <div
        className="mt-3 text-xs"
        style={{
          color: "var(--muted)",
        }}
      >
        {completed.length} /{" "}
        {active.length} activities
        completed
      </div>
    </Card>
  );
}


// ============================================================
// CONFLICT DETECTION
// ============================================================

function findConflicts(blocks) {
  const sorted = [...blocks]
    .filter(
      (b) =>
        b.end > b.start
    )
    .sort(
      (a, b) =>
        a.start - b.start
    );

  const conflicts = [];

  for (
    let i = 0;
    i < sorted.length - 1;
    i++
  ) {
    const current =
      sorted[i];

    const next =
      sorted[i + 1];

    if (
      current.end >
      next.start
    ) {
      conflicts.push({
        first: current,
        second: next,
      });
    }
  }

  return conflicts;
}


// ============================================================
// TIMER
// ============================================================

function ActivityTimer({
  block,
  onComplete,
  onClose,
}) {
  const plannedSeconds =
    Math.max(
      0,
      block.end - block.start
    ) * 60;

  const [seconds, setSeconds] =
    useState(0);

  const [running, setRunning] =
    useState(true);

  useEffect(() => {
    if (!running) return;

    const interval =
      setInterval(() => {
        setSeconds(
          (value) =>
            value + 1
        );
      }, 1000);

    return () =>
      clearInterval(
        interval
      );
  }, [running]);

  const remaining =
    Math.max(
      0,
      plannedSeconds -
        seconds
    );

  const formatTimer = (
    total
  ) => {
    const hrs =
      Math.floor(
        total / 3600
      );

    const mins =
      Math.floor(
        (total % 3600) /
          60
      );

    const secs =
      total % 60;

    return `${String(
      hrs
    ).padStart(
      2,
      "0"
    )}:${String(
      mins
    ).padStart(
      2,
      "0"
    )}:${String(
      secs
    ).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${block.emoji} ${block.label}`}
    >
      <div className="text-center py-6">
        <div
          className="text-5xl font-mono font-bold"
          style={{
            color:
              "var(--accent)",
          }}
        >
          {formatTimer(
            remaining
          )}
        </div>

        <div
          className="text-xs mt-2"
          style={{
            color:
              "var(--muted)",
          }}
        >
          {running
            ? "Activity in progress"
            : "Timer paused"}
        </div>

        <div className="flex justify-center gap-2 mt-6">
          <button
            className="btn"
            onClick={() =>
              setRunning(
                (value) =>
                  !value
              )
            }
          >
            {running
              ? "⏸ Pause"
              : "▶ Resume"}
          </button>

          <button
            className="btn btn-primary"
            onClick={() => {
              onComplete(
                seconds
              );
            }}
          >
            ✓ Complete
          </button>
        </div>

        <div
          className="mt-4 text-xs"
          style={{
            color:
              "var(--muted)",
          }}
        >
          Actual time:{" "}
          {formatTimer(seconds)}
        </div>
      </div>
    </Modal>
  );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MyDay() {
  const {
    state,
    dispatch,
  } = useApp();

  const [
    offset,
    setOffset,
  ] = useState(0);

  const [
    editing,
    setEditing,
  ] = useState(null);

  const [
    xpFlash,
    setXpFlash,
  ] = useState(null);

  const [
    runningBlock,
    setRunningBlock,
  ] = useState(null);

  const date = dateKey(
    addDays(
      new Date(),
      offset
    )
  );

  const mode = modeFor(
    state,
    date
  );

  const modeMeta =
    modeById(mode);

  const blocks =
    blocksFor(
      state,
      date
    );

  const done = new Set(
    doneFor(
      state,
      date
    )
  );

  const isCustom =
    !!state.plans[
      mode
    ]?.length;


  // ==========================================================
  // CONFLICTS
  // ==========================================================

  const conflicts = useMemo(
    () =>
      findConflicts(
        blocks
      ),
    [blocks]
  );


  // ==========================================================
  // SAVE
  // ==========================================================

  const save = (
    next
  ) => {
    dispatch({
      type: "savePlan",
      payload: {
        mode,
        blocks: next.sort(
          (a, b) =>
            a.start -
            b.start
        ),
      },
    });
  };


  // ==========================================================
  // REORDER
  // ==========================================================

  const onReorder = (
    from,
    to
  ) => {
    const reordered =
      reorder(
        blocks,
        from,
        to
      );

    const next =
      repack(
        blocks,
        reordered
      );

    save(next);
  };


  // ==========================================================
  // UPSERT
  // ==========================================================

  const upsert = (
    block
  ) => {
    const exists =
      blocks.some(
        (b) =>
          b.id ===
          block.id
      );

    const next = exists
      ? blocks.map(
          (b) =>
            b.id ===
            block.id
              ? block
              : b
        )
      : [
          ...blocks,
          block,
        ];

    const newConflicts =
      findConflicts(
        next
      );

    if (
      newConflicts.length >
      0
    ) {
      const conflict =
        newConflicts[0];

      alert(
        `Schedule conflict:\n\n${conflict.first.label} overlaps with ${conflict.second.label}.`
      );

      return;
    }

    save(next);
    setEditing(null);
  };


  // ==========================================================
  // REMOVE
  // ==========================================================

  const remove = (
    id
  ) => {
    save(
      blocks.filter(
        (b) =>
          b.id !== id
      )
    );

    setEditing(null);
  };


  // ==========================================================
  // COMPLETE
  // ==========================================================

  const toggleDone = (
    block
  ) => {
    const wasNotDone =
      !done.has(
        block.id
      );

    const xp =
      blockXP(block);

    dispatch({
      type: "toggleDone",
      payload: {
        date,
        id: block.id,
      },
    });

    if (
      wasNotDone
    ) {
      dispatch({
        type: "xp.add",
        payload: {
          amount: xp,
        },
      });

      setXpFlash({
        id: block.id,
        xp,
      });

      setTimeout(
        () =>
          setXpFlash(
            null
          ),
        1500
      );
    } else {
      dispatch({
        type: "xp.deduct",
        payload: {
          amount: xp,
        },
      });
    }
  };


  // ==========================================================
  // TIMER COMPLETE
  // ==========================================================

  const completeFromTimer =
    (actualSeconds) => {
      if (
        !runningBlock
      )
        return;

      const block =
        runningBlock;

      toggleDone(
        block
      );

      setRunningBlock(
        null
      );
    };


  // ==========================================================
  // TOTAL TIME
  // ==========================================================

  const totalPlanned =
    blocks.reduce(
      (a, b) =>
        a +
        Math.max(
          0,
          b.end -
            b.start
        ),
      0
    );


  // ==========================================================
  // ACTIVE TIME
  // ==========================================================

  const activeMinutes =
    blocks
      .filter(
        (b) =>
          b.category !==
            "rest" &&
          b.end >
            b.start
      )
      .reduce(
        (sum, b) =>
          sum +
          (b.end -
            b.start),
        0
      );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-4">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            My Day
          </h1>

          <p
            className="text-sm"
            style={{
              color:
                "var(--muted)",
            }}
          >
            {longDate(
              parseKey(
                date
              )
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="btn btn-sm"
            onClick={() =>
              setOffset(
                (o) =>
                  o - 1
              )
            }
          >
            ←
          </button>

          <button
            className="btn btn-sm"
            onClick={() =>
              setOffset(0)
            }
            disabled={
              offset === 0
            }
          >
            Today
          </button>

          <button
            className="btn btn-sm"
            onClick={() =>
              setOffset(
                (o) =>
                  o + 1
              )
            }
          >
            →
          </button>
        </div>
      </header>


      {/* =====================================================
          XP
      ====================================================== */}

      <XPBar
        xp={
          state.xp || 0
        }
      />


      {/* =====================================================
          PROGRESS
      ====================================================== */}

      <DayProgress
        blocks={blocks}
        done={done}
      />


      {/* =====================================================
          CONFLICT WARNING
      ====================================================== */}

      {conflicts.length >
        0 && (
        <Card>
          <div className="flex items-start gap-3">
            <div className="text-2xl">
              ⚠️
            </div>

            <div>
              <div className="font-bold text-sm">
                Schedule conflicts
              </div>

              <div
                className="text-xs mt-1"
                style={{
                  color:
                    "var(--muted)",
                }}
              >
                You have{" "}
                {
                  conflicts.length
                }{" "}
                overlapping
                activities.
              </div>

              <div className="mt-3 space-y-2">
                {conflicts.map(
                  (
                    conflict,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="text-xs"
                    >
                      <strong>
                        {
                          conflict
                            .first
                            .label
                        }
                      </strong>{" "}
                      overlaps
                      with{" "}
                      <strong>
                        {
                          conflict
                            .second
                            .label
                        }
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </Card>
      )}


      {/* =====================================================
          DAY MODE
      ====================================================== */}

      <Card>
        <SectionHeader
          title="Day mode"
        />

        <Segmented
          value={mode}
          onChange={(m) =>
            dispatch({
              type: "mode",
              payload: {
                date,
                mode: m,
              },
            })
          }
          options={DAY_MODES.map(
            (m) => ({
              value: m.id,
              label: m.label,
              emoji: m.emoji,
            })
          )}
        />

        <p
          className="mt-2 text-xs"
          style={{
            color:
              "var(--muted)",
          }}
        >
          {modeMeta.note}
        </p>

        <div
          className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3"
          style={{
            borderColor:
              "var(--line)",
          }}
        >
          <span
            className="text-xs"
            style={{
              color:
                "var(--muted)",
            }}
          >
            {blocks.length}{" "}
            blocks ·{" "}
            {fmtDuration(
              totalPlanned
            )}{" "}
            planned ·{" "}
            {isCustom
              ? "custom layout"
              : "auto-generated"}
          </span>

          <div className="ml-auto flex gap-2">
            <button
              className="btn btn-sm"
              onClick={() =>
                setEditing({
                  id: `new-${uid(
                    "b"
                  )}`,

                  uid: uid(
                    "b"
                  ),

                  label: "",

                  emoji: "📖",

                  start:
                    18 * 60,

                  end:
                    19 * 60,

                  category:
                    "custom",

                  priority:
                    "medium",

                  fixed: false,

                  source:
                    "custom",

                  isNew: true,
                })
              }
            >
              + Add block
            </button>

            <button
              className="btn btn-sm"
              onClick={() =>
                dispatch({
                  type: "clearPlan",
                  payload: {
                    mode,
                  },
                })
              }
              disabled={
                !isCustom
              }
            >
              ♻ Regenerate
            </button>
          </div>
        </div>
      </Card>


      {/* =====================================================
          ACTIVITY LIST
      ====================================================== */}

      <SortableList
        items={blocks}
        getKey={(b) =>
          b.id
        }
        onReorder={
          onReorder
        }
        renderItem={(
          b,
          i,
          {
            dragging,
            handleProps,
          }
        ) => {
          const isDone =
            done.has(
              b.id
            );

          const xp =
            blockXP(b);

          const isFlashing =
            xpFlash?.id ===
            b.id;

          const priority =
            PRIORITIES[
              b.priority ||
                "medium"
            ];

          return (
            <div
              className="card flex items-center gap-2 p-2.5 relative overflow-hidden"
              style={
                dragging
                  ? {
                      borderColor:
                        "var(--accent)",
                    }
                  : undefined
              }
            >

              {/* XP animation */}

              {isFlashing && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  style={{
                    animation:
                      "fadeOut 1.5s ease forwards",
                  }}
                >
                  <span
                    className="text-lg font-bold px-3 py-1 rounded-full"
                    style={{
                      background:
                        "color-mix(in srgb, var(--accent) 25%, transparent)",
                      color:
                        "var(--accent)",
                      border:
                        "1px solid var(--accent)",
                    }}
                  >
                    +
                    {
                      xpFlash.xp
                    }{" "}
                    XP! ✨
                  </span>
                </div>
              )}


              {/* Drag */}

              <button
                {...handleProps}
                className="px-1 text-lg"
                style={{
                  color:
                    "var(--muted)",
                }}
                aria-label={`Move ${b.label}`}
              >
                ⠿
              </button>


              {/* Time */}

              <span
                className="w-[62px] shrink-0 font-mono text-xs"
                style={{
                  color:
                    "var(--muted)",
                }}
              >
                {fmtTime(
                  b.start
                )}
              </span>


              {/* Category */}

              <span
                className="h-8 w-1 shrink-0 rounded-full"
                style={{
                  background:
                    catColor(
                      b.category
                    ),
                }}
              />


              {/* Activity */}

              <button
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  setEditing({
                    ...b,
                  })
                }
              >
                <span
                  className={`block truncate text-sm ${
                    isDone
                      ? "line-through"
                      : ""
                  }`}
                  style={
                    isDone
                      ? {
                          color:
                            "var(--muted)",
                        }
                      : {}
                  }
                >
                  {b.emoji}{" "}
                  {b.label}
                </span>

                <span
                  className="text-[11px] flex flex-wrap gap-1"
                  style={{
                    color:
                      "var(--muted)",
                  }}
                >
                  {b.end >
                  b.start
                    ? `${fmtTime(
                        b.start
                      )} → ${fmtTime(
                        b.end
                      )} · ${fmtDuration(
                        b.end -
                          b.start
                      )}`
                    : "End of day"}

                  {" · "}

                  <span
                    style={{
                      color:
                        "var(--accent)",
                    }}
                  >
                    +{xp} XP
                  </span>

                  {" · "}

                  <span>
                    {
                      priority
                        .emoji
                    }{" "}
                    {
                      priority.label
                    }
                  </span>
                </span>
              </button>


              {/* START */}

              {!isDone &&
                b.end >
                  b.start && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      setRunningBlock(
                        b
                      )
                    }
                    title="Start activity"
                  >
                    ▶
                  </button>
                )}


              {/* COMPLETE */}

              <button
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  toggleDone(
                    b
                  )
                }
                aria-label="Toggle done"
              >
                {isDone
                  ? "✅"
                  : "⬜"}
              </button>
            </div>
          );
        }}
      />


      {/* =====================================================
          EDIT MODAL
      ====================================================== */}

      <Modal
        open={
          !!editing
        }
        onClose={() =>
          setEditing(
            null
          )
        }
        title={
          editing?.isNew
            ? "Add activity"
            : "Edit activity"
        }
        footer={
          <>
            {!editing?.isNew && (
              <button
                className="btn"
                onClick={() =>
                  remove(
                    editing.id
                  )
                }
              >
                Delete
              </button>
            )}

            <button
              className="btn btn-primary"
              disabled={
                !editing?.label?.trim()
              }
              onClick={() => {
                const {
                  isNew,
                  ...rest
                } = editing;

                upsert({
                  ...rest,
                  label:
                    rest.label.trim(),
                  priority:
                    rest.priority ||
                    "medium",
                });
              }}
            >
              Save
            </button>
          </>
        }
      >

        {editing && (
          <div className="space-y-3">

            {/* NAME */}

            <Field label="What is it?">
              <input
                className="input"
                autoFocus
                placeholder="e.g. DSA Practice"
                value={
                  editing.label
                }
                onChange={(
                  e
                ) =>
                  setEditing({
                    ...editing,
                    label:
                      e.target
                        .value,
                  })
                }
              />
            </Field>


            {/* ICON */}

            <div>
              <span className="label">
                Icon
              </span>

              <div className="flex flex-wrap gap-1">
                {EMOJIS.map(
                  (e) => (
                    <button
                      key={e}
                      className="chip"
                      data-on={String(
                        editing.emoji ===
                          e
                      )}
                      onClick={() =>
                        setEditing(
                          {
                            ...editing,
                            emoji:
                              e,
                          }
                        )
                      }
                    >
                      {e}
                    </button>
                  )
                )}
              </div>
            </div>


            {/* TIME */}

            <div className="grid grid-cols-2 gap-3">

              <Field label="Starts">
                <input
                  type="time"
                  className="input"
                  value={toHHMM(
                    editing.start
                  )}
                  onChange={(
                    e
                  ) => {
                    const s =
                      toMin(
                        e.target
                          .value
                      );

                    const dur =
                      Math.max(
                        5,
                        editing.end -
                          editing.start
                      );

                    setEditing({
                      ...editing,
                      start: s,
                      end:
                        s +
                        dur,
                    });
                  }}
                />
              </Field>


              <Field label="Duration">
                <select
                  className="select"
                  value={
                    editing.end -
                    editing.start
                  }
                  onChange={(
                    e
                  ) =>
                    setEditing({
                      ...editing,
                      end:
                        editing.start +
                        Number(
                          e.target
                            .value
                        ),
                    })
                  }
                >
                  {[
                    15,
                    20,
                    30,
                    45,
                    60,
                    75,
                    90,
                    120,
                    150,
                    180,
                    240,
                    300,
                    420,
                  ].map(
                    (n) => (
                      <option
                        key={n}
                        value={n}
                      >
                        {fmtDuration(
                          n
                        )}
                      </option>
                    )
                  )}
                </select>
              </Field>
            </div>


            {/* PRIORITY */}

            <div>
              <span className="label">
                Priority
              </span>

              <div className="flex gap-2 mt-1">
                {Object.entries(
                  PRIORITIES
                ).map(
                  ([
                    id,
                    p,
                  ]) => (
                    <button
                      key={id}
                      className="chip"
                      data-on={String(
                        (editing.priority ||
                          "medium") ===
                          id
                      )}
                      onClick={() =>
                        setEditing(
                          {
                            ...editing,
                            priority:
                              id,
                          }
                        )
                      }
                    >
                      {p.emoji}{" "}
                      {p.label}
                    </button>
                  )
                )}
              </div>
            </div>


            {/* CATEGORY */}

            <div>
              <span className="label">
                Category
              </span>

              <div className="flex flex-wrap gap-1.5">
                {Object.entries(
                  CATEGORIES
                ).map(
                  ([
                    id,
                    c,
                  ]) => (
                    <button
                      key={id}
                      className="chip"
                      data-on={String(
                        editing.category ===
                          id
                      )}
                      onClick={() =>
                        setEditing(
                          {
                            ...editing,
                            category:
                              id,
                          }
                        )
                      }
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          background:
                            c.color,
                        }}
                      />

                      {c.label}
                    </button>
                  )
                )}
              </div>
            </div>

          </div>
        )}

      </Modal>


      {/* =====================================================
          ACTIVITY TIMER
      ====================================================== */}

      {runningBlock && (
        <ActivityTimer
          block={
            runningBlock
          }
          onComplete={
            completeFromTimer
          }
          onClose={() =>
            setRunningBlock(
              null
            )
          }
        />
      )}


      {/* =====================================================
          ANIMATION
      ====================================================== */}

      <style>{`
        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }

          70% {
            opacity: 1;
            transform: scale(1.1);
          }

          100% {
            opacity: 0;
            transform: scale(0.9)
              translateY(-10px);
          }
        }
      `}</style>

    </div>
  );
}