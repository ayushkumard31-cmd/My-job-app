"use client";

// Cloud sync: the same state object that lives in localStorage, mirrored to one
// Firestore document per user. Deliberately dumb — the whole state is stored as
// a single JSON string and conflicts are resolved by "newest `updatedAt` wins".
// A planner is edited by one person on one device at a time, so a per-field
// merge would be a lot of machinery for no real benefit.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import { useAuth } from "./auth";

const COLLECTION = "planners";
const SCHEMA = 1;
const DEBOUNCE_MS = 1200;
const MAX_BYTES = 900_000; // Firestore hard limit is 1 MiB per document
// Where a local planner is parked if the user chooses the cloud copy instead.
const REPLACED_KEY = "student-planner-state-replaced";

function ref(uid) {
  const db = getDb();
  return db ? doc(db, COLLECTION, uid) : null;
}

/** `hydrated` is about this tab's boot, not the user's data — never store it. */
function forCloud(state) {
  const { hydrated, ...rest } = state;
  return rest;
}

function parse(snap) {
  if (!snap.exists()) return null;
  const data = snap.data();
  try {
    return { state: JSON.parse(data.blob), updatedAt: data.updatedAt || 0 };
  } catch {
    return null; // corrupt document — treat as "nothing in the cloud yet"
  }
}

export async function pullState(uid) {
  const r = ref(uid);
  if (!r) return null;
  return parse(await getDoc(r));
}

export async function pushState(uid, state) {
  const r = ref(uid);
  if (!r) return;
  const blob = JSON.stringify(forCloud(state));
  if (blob.length > MAX_BYTES) {
    throw new Error("Your planner is too big to sync — export a backup and reset old focus sessions.");
  }
  await setDoc(r, {
    blob,
    schema: SCHEMA,
    updatedAt: state.updatedAt || 0,
    savedAt: serverTimestamp(),
  });
}

/** Live subscription. `cb(remote, error)` — remote is null when no doc exists. */
export function watchState(uid, cb) {
  const r = ref(uid);
  if (!r) return () => {};
  return onSnapshot(
    r,
    (snap) => cb(parse(snap), null),
    (err) => cb(null, err),
  );
}

export function cloudMessage(e) {
  if (e?.code === "permission-denied") {
    return "Firestore rules rejected the write — deploy firestore.rules.";
  }
  if (e?.code === "unavailable" || e?.code === "failed-precondition") {
    return "Offline — changes will sync when you're back online.";
  }
  return e?.message || "Sync failed.";
}

/** Keeps the copy we're about to replace, so a wrong choice is still recoverable. */
function stashLocal(state) {
  try {
    localStorage.setItem(REPLACED_KEY, JSON.stringify(state));
  } catch {
    /* quota — the cloud copy is still safe, so carry on */
  }
}

/**
 * Drives sync for the whole app. Called once, from inside <AppProvider>, and
 * returns the status the Profile page shows. Signed out (or with Firebase
 * unconfigured) it does nothing at all.
 *
 * status: "off" | "signed-out" | "pulling" | "conflict" | "saving" | "synced" | "error"
 */
export function useCloudSync({ state, dispatch, ready }) {
  const { user, ready: authReady, available } = useAuth();
  // Only ever written from async callbacks; null means "signed in but the first
  // snapshot hasn't landed". The status the UI sees is derived below, which is
  // what keeps the effects free of synchronous setState.
  const [phase, setPhase] = useState(null);
  const [error, setError] = useState(null);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  // Set when signing in finds edits on both sides — see the first-snapshot
  // branch below. Nothing is uploaded or overwritten until the user picks.
  const [conflict, setConflict] = useState(null);
  // Which uid's first snapshot has been dealt with. State as well as a ref,
  // because resolving a conflict has to re-trigger the push effect.
  const [mergedUid, setMergedUid] = useState(null);
  const mergedRef = useRef(null);

  // The `updatedAt` stamp Firestore is known to already hold. While it matches
  // local state there is nothing to push, which is what stops the
  // push → snapshot → push loop.
  const syncedStamp = useRef(0);
  // Lets the snapshot callback read current state without resubscribing on
  // every keystroke.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const uid = user?.uid || null;

  const markMerged = useCallback((id) => {
    mergedRef.current = id;
    setMergedUid(id);
  }, []);

  const adopt = useCallback(
    (remote) => {
      syncedStamp.current = remote.updatedAt || 0;
      dispatch({ type: "hydrate", payload: remote.state });
      setLastSyncAt(Date.now());
    },
    [dispatch],
  );

  useEffect(() => {
    if (!available || !authReady || !ready || !uid) return;

    const unsub = watchState(uid, (remote, err) => {
      if (err) {
        setError(cloudMessage(err));
        setPhase("error");
        return;
      }
      const localStamp = stateRef.current.updatedAt || 0;
      const remoteStamp = remote?.updatedAt || 0;

      if (mergedRef.current !== uid) {
        // First snapshot after signing in. Three cases, and only one of them is
        // unsafe to decide automatically.
        if (!remote) {
          // Nothing in the account yet — the push effect uploads this device.
          markMerged(uid);
          setPhase("synced");
        } else if (localStamp === 0) {
          // Untouched device — the account's copy is simply the right answer.
          adopt(remote);
          markMerged(uid);
          setPhase("synced");
        } else if (remoteStamp !== localStamp) {
          // Both sides have real edits and one scalar timestamp can't tell us
          // whether they overlap. Ask rather than silently discard a planner.
          setConflict({ remote, remoteUpdatedAt: remoteStamp, localUpdatedAt: localStamp });
        } else {
          markMerged(uid);
          setPhase("synced");
        }
        return;
      }

      // Steady state: last write wins, which is what keeps two devices in step.
      if (remote && remoteStamp > localStamp) adopt(remote);
      setPhase("synced");
    });

    return () => {
      unsub();
      // Signing out (or switching account) forgets everything about the session
      // so the next sign-in starts from a clean first snapshot.
      mergedRef.current = null;
      setMergedUid(null);
      setPhase(null);
      setConflict(null);
      setError(null);
    };
  }, [uid, authReady, ready, available, adopt, markMerged]);

  // Upload local edits, debounced so a burst of typing is one write.
  useEffect(() => {
    if (!available || !ready || !uid) return;
    if (mergedUid !== uid) return;
    const stamp = state.updatedAt || 0;
    if (stamp === syncedStamp.current) return;

    const timer = setTimeout(async () => {
      setPhase("saving");
      try {
        await pushState(uid, state);
        syncedStamp.current = stamp;
        setLastSyncAt(Date.now());
        setError(null);
        setPhase("synced");
      } catch (e) {
        setError(cloudMessage(e));
        setPhase("error");
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state, uid, ready, available, mergedUid]);

  /** Conflict resolution: take the account's planner, stashing the local one. */
  const keepCloud = useCallback(() => {
    if (!conflict || !uid) return;
    stashLocal(stateRef.current);
    adopt(conflict.remote);
    setConflict(null);
    markMerged(uid);
    setPhase("synced");
  }, [conflict, uid, adopt, markMerged]);

  /** Conflict resolution: this device wins and overwrites the account. */
  const keepLocal = useCallback(() => {
    if (!conflict || !uid) return;
    syncedStamp.current = 0; // mismatch with state.updatedAt makes the push effect fire
    setConflict(null);
    markMerged(uid);
    setPhase("saving");
  }, [conflict, uid, markMerged]);

  /** Force an upload — the "Sync now" button. */
  const syncNow = useCallback(async () => {
    if (!uid || conflict) return;
    setPhase("saving");
    try {
      await pushState(uid, stateRef.current);
      syncedStamp.current = stateRef.current.updatedAt || 0;
      setLastSyncAt(Date.now());
      setError(null);
      setPhase("synced");
    } catch (e) {
      setError(cloudMessage(e));
      setPhase("error");
    }
  }, [uid, conflict]);

  const status = !available
    ? "off"
    : !uid
      ? "signed-out"
      : conflict
        ? "conflict"
        : (phase ?? "pulling");

  // Memoised so <AppProvider>'s context value stays referentially stable.
  return useMemo(
    () => ({
      status,
      error,
      lastSyncAt,
      syncNow,
      conflict,
      keepCloud,
      keepLocal,
      signedIn: !!uid,
      available,
    }),
    [status, error, lastSyncAt, syncNow, conflict, keepCloud, keepLocal, uid, available],
  );
}
