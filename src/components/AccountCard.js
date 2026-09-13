"use client";

// Account + cloud sync panel, shown on the Profile page. Everything here is
// optional: without an account the planner just stays on this device.

import { useState } from "react";
import { Card, SectionHeader } from "@/components/ui";
import SignInForm from "@/components/SignInForm";
import { signOutUser, useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";

const STATUS = {
  off: { dot: "#9ca3af", text: "Cloud sync not configured" },
  "signed-out": { dot: "#9ca3af", text: "This device only" },
  pulling: { dot: "#f59e0b", text: "Checking the cloud…" },
  saving: { dot: "#f59e0b", text: "Saving…" },
  synced: { dot: "#22c55e", text: "Synced" },
  conflict: { dot: "#f59e0b", text: "Two versions to choose from" },
  error: { dot: "#ef4444", text: "Sync problem" },
};

function timeAgo(ts) {
  if (!ts) return null;
  const secs = Math.round((Date.now() - ts) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  return `${Math.floor(secs / 3600)} h ago`;
}

function when(ts) {
  if (!ts) return "unknown date";
  return new Date(ts).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Shown only when signing in finds edits on this device *and* in the account. */
function ConflictChoice({ conflict, keepCloud, keepLocal }) {
  return (
    <div className="space-y-2 rounded-xl border border-line p-3">
      <p className="text-sm font-semibold">Which planner should win?</p>
      <p className="text-xs text-muted">
        This device and your account have both been edited, so one has to be picked. The one you
        drop is kept as a recovery copy in this browser.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={keepCloud}>
          ☁ Use my account&apos;s — {when(conflict.remoteUpdatedAt)}
        </button>
        <button className="btn" onClick={keepLocal}>
          💻 Use this device&apos;s — {when(conflict.localUpdatedAt)}
        </button>
      </div>
    </div>
  );
}

function SyncLine() {
  const { sync } = useApp();
  const meta = STATUS[sync.status] || STATUS["signed-out"];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: meta.dot }} aria-hidden />
      <span>{sync.error || meta.text}</span>
      {sync.status === "synced" && sync.lastSyncAt ? <span>· {timeAgo(sync.lastSyncAt)}</span> : null}
    </div>
  );
}

export default function AccountCard() {
  const { user, ready, available } = useAuth();
  const { sync } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!available) {
    return (
      <Card className="space-y-2">
        <SectionHeader title="Account & sync" />
        <p className="text-sm text-muted">
          Cloud sync is switched off because no Firebase keys were found. Copy{" "}
          <code>.env.example</code> to <code>.env.local</code>, fill it in from your Firebase
          console, and restart <code>npm run dev</code>.
        </p>
      </Card>
    );
  }

  if (!ready) {
    return (
      <Card>
        <SectionHeader title="Account & sync" />
        <p className="animate-pulse text-sm text-muted">Checking your session…</p>
      </Card>
    );
  }

  if (user) {
    return (
      <Card className="space-y-3">
        <SectionHeader title="Account & sync" />
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "var(--accent-soft)" }}
            aria-hidden
          >
            {(user.name || user.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user.name || "Signed in"}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
          </div>
        </div>
        <SyncLine />
        {sync.conflict ? (
          <ConflictChoice
            conflict={sync.conflict}
            keepCloud={sync.keepCloud}
            keepLocal={sync.keepLocal}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            className="btn"
            disabled={busy || !!sync.conflict}
            onClick={() => run(sync.syncNow)}
          >
            ⟳ Sync now
          </button>
          <button
            className="btn"
            disabled={busy}
            onClick={() =>
              run(async () => {
                if (!sync.conflict) await sync.syncNow();
                await signOutUser();
              })
            }
          >
            Sign out
          </button>
        </div>
        {error ? <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p> : null}
        <p className="text-xs text-muted">
          Your planner is saved to your account after every change, so signing in on another device
          picks up where you left off. The newest copy always wins.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <SectionHeader title="Account & sync" />
      <p className="text-sm text-muted">
        Sign in to keep your planner backed up and synced across devices. Skip it and everything
        stays in this browser — nothing else changes.
      </p>

      <SignInForm />
    </Card>
  );
}
