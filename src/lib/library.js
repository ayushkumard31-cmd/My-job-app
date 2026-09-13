"use client";

// The shared library: syllabus, notes, PYQs, videos and hobby material that an
// admin publishes once and every student reads.
//
// Two deliberate shapes here:
//
//   * One `library` collection with a `kind` field, not one collection per kind.
//     Every screen filters the same way (branch → semester → subject → unit), so
//     splitting it would mean the same query written five times, five sets of
//     rules, and five admin forms.
//   * Every query is equality-only and sorted in the browser. Firestore needs a
//     deployed composite index the moment you add orderBy to a filtered query,
//     and this app has no index deployment step.
//
// A student's own likes/saves are NOT here — they live in the planner state
// (see ./store) so they keep working signed out and sync with everything else.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { getBucket, getDb, isStorageConfigured } from "./firebase";
import { useAuth } from "./auth";
import { isStarterId, starterById, starterHobbyItems, starterItemsFor } from "./starter";

const LIBRARY = "library";
const ADMINS = "admins";

export { isStorageConfigured };

// ------------------------------------------------------------- youtube --

/** Accepts a full URL, a share link, an embed link, or a bare 11-char id. */
export function youtubeId(input) {
  const v = (input || "").trim();
  if (!v) return "";
  if (/^[\w-]{11}$/.test(v)) return v;
  const m = v.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : "";
}

export const youtubeThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeEmbed = (id) => `https://www.youtube-nocookie.com/embed/${id}`;
export const youtubeWatch = (id) => `https://www.youtube.com/watch?v=${id}`;

// --------------------------------------------------------------- admin --

/**
 * Admin = a document at admins/{uid}. Presence is the whole check, so promoting
 * someone is one click in the Firebase console and no code change. The rules
 * enforce the same thing server-side; this hook only decides what to render.
 */
export function useAdmin() {
  const { user, ready: authReady } = useAuth();
  // Stamped with the uid it describes, so the answer for a previous account is
  // never mistaken for this one's. Only ever written from the async callback —
  // the render-time status below is derived, not stored.
  const [answer, setAnswer] = useState({ uid: null, isAdmin: false });

  const uid = user?.uid || null;
  const db = getDb();

  useEffect(() => {
    if (!authReady || !uid || !db) return;
    let alive = true;
    getDoc(doc(db, ADMINS, uid))
      .then((snap) => alive && setAnswer({ uid, isAdmin: snap.exists() }))
      // Rules reject the read for non-admins in some configurations; that
      // answer is "not an admin" either way.
      .catch(() => alive && setAnswer({ uid, isAdmin: false }));
    return () => {
      alive = false;
    };
  }, [uid, authReady, db]);

  const noAccount = authReady && (!uid || !db);
  return {
    isAdmin: answer.uid === uid && answer.isAdmin,
    ready: noAccount || (authReady && answer.uid === uid),
  };
}

// ------------------------------------------------------------ querying --

function normalise(snap) {
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    // serverTimestamp() is null in the local echo of a write, so sorting has to
    // tolerate it rather than assume a Timestamp is always there.
    createdMs: d.createdAt?.toMillis?.() ?? 0,
  };
}

const bySort = (a, b) =>
  (a.unit || 0) - (b.unit || 0) ||
  b.createdMs - a.createdMs ||
  (a.title || "").localeCompare(b.title || "");

/**
 * Live list of published subject material for one branch + semester.
 * Everything narrower (subject, unit, kind) is filtered by the caller.
 */
export function useSubjectLibrary(branch, semester) {
  return useLibraryQuery(
    useMemo(
      () =>
        branch && semester
          ? [
              where("scope", "==", "subject"),
              where("branch", "==", branch),
              where("semester", "==", Number(semester)),
              where("published", "==", true),
            ]
          : null,
      [branch, semester],
    ),
  );
}

/** Live list of published hobby material, across all hobbies. */
export function useHobbyLibrary() {
  return useLibraryQuery(
    useMemo(() => [where("scope", "==", "hobby"), where("published", "==", true)], []),
  );
}

/**
 * What a student actually sees: the college's own published material first,
 * with the built-in starter pack (see ./starter) underneath it. Defined here
 * rather than in each page so "everything for this semester" means one thing.
 *
 * The starter items need no network, so `status` describes the cloud half only
 * — the pages render the merged list regardless and show the status as a note.
 */
export function useSubjectResources(branch, semester) {
  const { items, status, error } = useSubjectLibrary(branch, semester);
  const starter = useMemo(() => starterItemsFor(branch, semester), [branch, semester]);
  const merged = useMemo(() => [...items, ...starter], [items, starter]);
  return { items: merged, published: items, starter, status, error };
}

/** The hobby equivalent of the above. */
export function useHobbyResources() {
  const { items, status, error } = useHobbyLibrary();
  const starter = starterHobbyItems();
  const merged = useMemo(() => [...items, ...starter], [items, starter]);
  return { items: merged, published: items, starter, status, error };
}

/** Everything, published or not — the admin panel's view. */
export function useAllLibrary(enabled) {
  return useLibraryQuery(useMemo(() => (enabled ? [] : null), [enabled]));
}

/**
 * `constraints` must be a memoised array (or null to stay idle) — its identity
 * is what marks a result as belonging to the current query, which is how the
 * loading state is derived at render time instead of being set in the effect.
 */
function useLibraryQuery(constraints) {
  const [result, setResult] = useState({ for: null, items: [], error: null });
  const db = getDb();

  useEffect(() => {
    if (!db || !constraints) return;
    const q = query(collection(db, LIBRARY), ...constraints);
    return onSnapshot(
      q,
      (snap) => setResult({ for: constraints, items: snap.docs.map(normalise).sort(bySort), error: null }),
      (e) => setResult({ for: constraints, items: [], error: libraryMessage(e) }),
    );
  }, [constraints, db]);

  const settled = result.for === constraints;
  const status = !db
    ? "off"
    : !constraints
      ? "idle"
      : !settled
        ? "loading"
        : result.error
          ? "error"
          : "ready";

  return {
    items: settled ? result.items : EMPTY,
    status,
    error: settled ? result.error : null,
  };
}

const EMPTY = [];

/**
 * Resolve saved/liked ids to documents. One getDoc each rather than an `in`
 * query: `in` caps out at 30 ids and would need paging, and a student's liked
 * list is small enough that the extra reads don't matter.
 *
 * Starter ids never hit the network — they're resolved from the built-in pack,
 * which is also why liking one keeps working with Firebase switched off.
 */
export async function fetchByIds(ids) {
  const local = ids.filter(isStarterId).map(starterById).filter(Boolean);
  const remote = ids.filter((id) => !isStarterId(id));

  const db = getDb();
  if (!db || !remote.length) return local;
  const snaps = await Promise.all(
    remote.map((id) => getDoc(doc(db, LIBRARY, id)).catch(() => null)),
  );
  return [...local, ...snaps.filter((s) => s?.exists()).map(normalise)];
}

/** Live-ish version of the above: refetches whenever the id list changes. */
export function useItemsByIds(ids) {
  const key = ids.join(",");
  const [result, setResult] = useState({ for: null, items: [], failed: false });
  const db = getDb();

  useEffect(() => {
    if (!key) return;
    let alive = true;
    fetchByIds(key.split(","))
      .then((docs) => alive && setResult({ for: key, items: docs.sort(bySort), failed: false }))
      .catch(() => alive && setResult({ for: key, items: [], failed: true }));
    return () => {
      alive = false;
    };
  }, [key, db]);

  const settled = result.for === key;
  // "off" only when there's genuinely nothing to show: starter items resolve
  // without Firebase, so a student who only liked those isn't blocked by it.
  const offline = !db && !ids.some(isStarterId);
  const status = !key
    ? "ready" // nothing liked yet — an empty list is a finished answer
    : offline
      ? "off"
      : !settled
        ? "loading"
        : result.failed
          ? "error"
          : "ready";

  return { items: settled ? result.items : EMPTY, status };
}

// ------------------------------------------------------------- writing --

/** Strips undefined — Firestore rejects it, and empty optional fields are common. */
function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export async function createItem(data, uid) {
  const db = getDb();
  if (!db) throw new Error("Firebase isn't configured.");
  const res = await addDoc(
    collection(db, LIBRARY),
    clean({
      published: true,
      ...data,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  return res.id;
}

export async function updateItem(id, patch) {
  const db = getDb();
  if (!db) throw new Error("Firebase isn't configured.");
  await updateDoc(doc(db, LIBRARY, id), clean({ ...patch, updatedAt: serverTimestamp() }));
}

export async function deleteItem(item) {
  const db = getDb();
  if (!db) throw new Error("Firebase isn't configured.");
  // File first: a deleted document with an orphaned file is invisible waste,
  // whereas a deleted file with a live document shows a broken link the admin
  // can actually see and clean up.
  if (item.storagePath) await removeFile(item.storagePath);
  await deleteDoc(doc(db, LIBRARY, item.id));
}

// ------------------------------------------------------------- storage --

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

/**
 * Why this file can't be uploaded, or "" if it's fine. Callers that hold a file
 * before uploading it (onboarding) use this to complain at pick time instead of
 * at submit time.
 */
export function pdfError(file) {
  if (!file) return "";
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
    return "Only PDF files are allowed.";
  }
  if (file.size > MAX_FILE_BYTES) return "That PDF is larger than 20 MB.";
  return "";
}

/**
 * Uploads a PDF and resolves to { url, storagePath, fileName, size }.
 * `onProgress` receives 0-100.
 */
export function uploadPdf(path, file, onProgress) {
  const bucket = getBucket();
  if (!bucket) return Promise.reject(new Error("Firebase Storage isn't configured."));
  const bad = pdfError(file);
  if (bad) return Promise.reject(new Error(bad));

  const storagePath = `${path}/${Date.now()}-${safeName(file.name)}`;
  const task = uploadBytesResumable(storageRef(bucket, storagePath), file, {
    contentType: "application/pdf",
  });

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) =>
        onProgress?.(
          snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0,
        ),
      (e) => reject(new Error(storageMessage(e))),
      async () => {
        try {
          resolve({
            url: await getDownloadURL(task.snapshot.ref),
            storagePath,
            fileName: file.name,
            size: file.size,
          });
        } catch (e) {
          reject(new Error(storageMessage(e)));
        }
      },
    );
  });
}

export async function removeFile(storagePath) {
  const bucket = getBucket();
  if (!bucket || !storagePath) return;
  try {
    await deleteObject(storageRef(bucket, storagePath));
  } catch {
    // Already gone, or rules say no. Never block deleting the row over it.
  }
}

function safeName(name) {
  return name.replace(/[^\w.\-]+/g, "_").slice(-80);
}

// -------------------------------------------------------------- errors --

export function libraryMessage(e) {
  if (e?.code === "permission-denied") {
    return "Firestore rules rejected that — deploy firestore.rules, and check you're an admin.";
  }
  if (e?.code === "unavailable") return "Offline — reconnect to load the library.";
  if (e?.code === "failed-precondition") {
    return "Firestore needs an index for that query. Open the console link in the browser log.";
  }
  return e?.message || "Something went wrong.";
}

export function storageMessage(e) {
  switch (e?.code) {
    case "storage/unauthorized":
      return "Storage rules rejected the upload — deploy storage.rules.";
    case "storage/canceled":
      return "Upload cancelled.";
    case "storage/quota-exceeded":
      return "This project's Storage quota is full.";
    case "storage/unknown":
      return "Upload failed. If Storage was never set up, enable it in the Firebase console (it needs the Blaze plan).";
    case "storage/retry-limit-exceeded":
      return "Upload timed out — check your connection and try again.";
    default:
      return e?.message || "Upload failed.";
  }
}

// ---------------------------------------------------------- convenience --

/** Reads a student's own reactions out of planner state. */
export function useReactions(state, dispatch) {
  const { likes, saves, watched } = state.library;
  return useMemo(
    () => ({
      likes,
      saves,
      watched,
      isLiked: (id) => likes.includes(id),
      isSaved: (id) => saves.includes(id),
      isWatched: (id) => watched.includes(id),
      toggleLike: (id) => dispatch({ type: "lib.like", payload: { id } }),
      toggleSave: (id) => dispatch({ type: "lib.save", payload: { id } }),
      toggleWatched: (id) => dispatch({ type: "lib.watched", payload: { id } }),
    }),
    [likes, saves, watched, dispatch],
  );
}

/** Groups library items by subject, preserving the syllabus subject order. */
export function groupBySubject(items, subjects) {
  const map = new Map(subjects.map((s) => [s, []]));
  const extra = [];
  items.forEach((it) => {
    if (map.has(it.subject)) map.get(it.subject).push(it);
    else extra.push(it);
  });
  const groups = subjects
    .map((s) => ({ subject: s, items: map.get(s) }))
    .filter((g) => g.items.length);
  if (extra.length) groups.push({ subject: "Other", items: extra });
  return groups;
}

export function useUploadState() {
  const [progress, setProgress] = useState(null);
  const start = useCallback(() => setProgress(0), []);
  const done = useCallback(() => setProgress(null), []);
  return { progress, setProgress, start, done, busy: progress !== null };
}
