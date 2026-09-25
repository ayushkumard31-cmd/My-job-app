"use client";

import { useMemo, useState } from "react";

import { Card, Pill, Segmented } from "@/components/ui";
import { GAME_TAGS, gameItemsFor, tagById } from "@/lib/games";
import { useApp } from "@/lib/store";
import { ReactionBar } from "@/components/library";
import { useReactions } from "@/lib/library";

const TABS = [
  { value: "", label: "All", emoji: "🎮" },
  ...GAME_TAGS.map((t) => ({
    value: t.id,
    label: t.label,
    emoji: t.emoji,
  })),
];

export default function GamesPage() {
  const { state, dispatch } = useApp();

  const reactions = useReactions(state, dispatch);

  const [tag, setTag] = useState("");

  const games = useMemo(() => {
    return gameItemsFor(tag);
  }, [tag]);

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <header>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Games 🎮
            </h1>

            <p className="mt-1 text-sm text-muted">
              Quick brain breaks, coding puzzles, and logic practice.
            </p>
          </div>

          <div
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{
              background:
                "color-mix(in srgb, var(--accent) 12%, transparent)",
              color: "var(--accent)",
            }}
          >
            {games.length} game{games.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      {/* FILTERS */}
      <Card>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">
              Choose a category
            </p>

            <p className="text-xs text-muted">
              Pick a type of game to find something that matches your mood.
            </p>
          </div>

          <div className="overflow-x-auto pb-1">
            <Segmented
              options={TABS}
              value={tag}
              onChange={setTag}
            />
          </div>
        </div>
      </Card>

      {/* GAME LIST */}
      {games.length > 0 ? (
        <section>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {games.map((g) => (
              <Card
                key={g.id}
                className="flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
              >
                {/* GAME TITLE */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{
                        background:
                          "color-mix(in srgb, var(--accent) 12%, transparent)",
                      }}
                    >
                      <span aria-hidden="true">
                        {g.emoji}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-semibold leading-snug">
                        {g.title}
                      </h2>

                      <p className="mt-0.5 text-xs text-muted">
                        Brain break
                      </p>
                    </div>
                  </div>

                  <ReactionBar
                    item={g}
                    reactions={reactions}
                  />
                </div>

                {/* DESCRIPTION */}
                <p className="text-sm leading-relaxed text-muted">
                  {g.description}
                </p>

                {/* TAGS */}
                {Array.isArray(g.tags) && g.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {g.tags.map((id) => {
                      const meta = tagById(id);

                      if (!meta) {
                        return null;
                      }

                      return (
                        <Pill
                          key={id}
                          color="#6366f1"
                        >
                          {meta.emoji} {meta.label}
                        </Pill>
                      );
                    })}
                  </div>
                )}

                {/* PLAY BUTTON */}
                <div className="mt-auto pt-1">
                  {g.url ? (
                    <a
                      className="btn btn-primary btn-sm flex w-full items-center justify-center gap-2"
                      href={g.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={"Play " + g.title}
                    >
                      <span>▶</span>
                      <span>Play Game</span>
                    </a>
                  ) : (
                    <button
                      className="btn btn-sm w-full"
                      type="button"
                      disabled
                    >
                      Game unavailable
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        /* EMPTY STATE */
        <Card>
          <div className="py-8 text-center">
            <div className="text-4xl">🎮</div>

            <h2 className="mt-3 font-semibold">
              No games found
            </h2>

            <p className="mt-1 text-sm text-muted">
              There are no games in this category yet.
            </p>

            <button
              type="button"
              className="btn btn-sm mt-4"
              onClick={() => setTag("")}
            >
              Show all games
            </button>
          </div>
        </Card>
      )}

      {/* FOOTER TIP */}
      <Card
        style={{
          background:
            "color-mix(in srgb, var(--accent) 7%, transparent)",
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">
            🧠
          </span>

          <div>
            <p className="font-semibold">
              Use games as smart breaks
            </p>

            <p className="mt-1 text-xs leading-relaxed text-muted">
              Take a short break between study sessions. Choose a
              puzzle or logic game instead of endlessly scrolling.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}