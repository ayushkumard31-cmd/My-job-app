"use client";

// Liked & saved. The id lists live in planner state, so this page is a resolver:
// it turns those ids back into library documents. Items an admin has since
// deleted simply don't come back — they're dropped rather than shown broken.

import { useMemo, useState } from "react";
import { Card, Empty, Segmented, Stat } from "@/components/ui";
import { LibraryItem, LibraryState } from "@/components/library";
import { useApp } from "@/lib/store";
import { useItemsByIds, useReactions } from "@/lib/library";

const TABS = [
  { value: "likes", label: "Liked", emoji: "❤️" },
  { value: "saves", label: "Saved", emoji: "🔖" },
  { value: "watched", label: "Watched", emoji: "✅" },
];

export default function Liked() {
  const { state, dispatch } = useApp();
  const reactions = useReactions(state, dispatch);
  const [tab, setTab] = useState("likes");

  // One fetch for the union, so switching tabs doesn't re-hit Firestore.
  const allIds = useMemo(() => {
    const set = new Set([...reactions.likes, ...reactions.saves, ...reactions.watched]);
    return [...set].sort();
  }, [reactions.likes, reactions.saves, reactions.watched]);

  const { items, status } = useItemsByIds(allIds);

  const active = useMemo(() => {
    const ids = new Set(reactions[tab]);
    return items.filter((i) => ids.has(i.id));
  }, [items, tab, reactions]);

  const videos = active.filter((i) => i.kind === "video");
  const others = active.filter((i) => i.kind !== "video");

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Liked &amp; Saved</h1>
        <p className="text-sm text-muted">
          Everything you tapped ❤️ or 🔖 across Resources and College Docs.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Liked" value={reactions.likes.length} emoji="❤️" />
        <Stat label="Saved" value={reactions.saves.length} emoji="🔖" />
        <Stat label="Videos watched" value={reactions.watched.length} emoji="✅" />
      </div>

      <Segmented options={TABS} value={tab} onChange={setTab} />

      {!allIds.length ? (
        <Card>
          <Empty
            emoji="🤍"
            title="Nothing here yet"
            hint="Tap the heart on any resource or video and it lands on this page."
          />
        </Card>
      ) : (
        <LibraryState status={status}>
          {active.length ? (
            <div className="space-y-4">
              {videos.length ? (
                <section className="space-y-2">
                  <h2 className="section-title">Videos</h2>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {videos.map((item) => (
                      <LibraryItem key={item.id} item={item} reactions={reactions} />
                    ))}
                  </div>
                </section>
              ) : null}
              {others.length ? (
                <section className="space-y-2">
                  <h2 className="section-title">Resources</h2>
                  <div className="grid gap-2 md:grid-cols-2">
                    {others.map((item) => (
                      <LibraryItem key={item.id} item={item} reactions={reactions} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <Card>
              <Empty emoji="🗒️" title={`Nothing ${tab === "saves" ? "saved" : tab} yet`} />
            </Card>
          )}
        </LibraryState>
      )}
    </div>
  );
}
