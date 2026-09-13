"use client";

import { useMemo, useState } from "react";
import { Card, Pill, Segmented } from "@/components/ui";
import { GAME_TAGS, gameItemsFor, tagById } from "@/lib/games";
import { useApp } from "@/lib/store";
import { ReactionBar } from "@/components/library";
import { useReactions } from "@/lib/library";

const TABS = [
  { value: "", label: "All", emoji: "🎮" },
  ...GAME_TAGS.map((t) => ({ value: t.id, label: t.label, emoji: t.emoji })),
];

export default function GamesPage() {
  const { state, dispatch } = useApp();
  const reactions = useReactions(state, dispatch);
  const [tag, setTag] = useState("");
  const games = useMemo(() => gameItemsFor(tag), [tag]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Games</h1>
        <p className="text-sm text-muted">Quick brain breaks, coding puzzles, and logic practice.</p>
      </header>

      <Segmented options={TABS} value={tag} onChange={setTag} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((g) => (
          <Card key={g.id} className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-2xl leading-none" aria-hidden>
                  {g.emoji}
                </span>
                <p className="min-w-0 font-medium leading-snug">{g.title}</p>
              </div>
              <ReactionBar item={g} reactions={reactions} />
            </div>
            <p className="text-sm text-muted">{g.description}</p>
            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
              {g.tags.map((id) => {
                const meta = tagById(id);
                return meta ? (
                  <Pill key={id} color="#6366f1">
                    {meta.emoji} {meta.label}
                  </Pill>
                ) : null;
              })}
              <a className="btn btn-sm" href={g.url} target="_blank" rel="noreferrer">
                Play
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
