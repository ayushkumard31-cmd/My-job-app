"use client";

// Single place where Firebase is initialised. Everything is lazy so importing
// this module never touches the network, and the whole app still runs with the
// env vars unset — `isFirebaseConfigured` is false and the cloud features
// quietly switch themselves off instead of crashing.

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/** False when .env.local is missing — the app then stays local-only. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

/** The one FirebaseApp, created on first use and reused across hot reloads. */
export function getFirebaseApp() {
  if (!isFirebaseConfigured) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getDb() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

/** Null when the bucket isn't configured — callers fall back to link-only. */
export function getBucket() {
  const app = getFirebaseApp();
  if (!app || !firebaseConfig.storageBucket) return null;
  return getStorage(app);
}

export const isStorageConfigured = Boolean(
  isFirebaseConfigured && firebaseConfig.storageBucket,
);

// Analytics only exists in a real browser (it needs cookies + indexedDB), so it
// is code-split and probed with isSupported() rather than imported up front.
let analyticsPromise = null;

export function initAnalytics() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!isFirebaseConfigured || !firebaseConfig.measurementId) return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = import("firebase/analytics")
      .then(async ({ getAnalytics, isSupported }) =>
        (await isSupported()) ? getAnalytics(getFirebaseApp()) : null,
      )
      .catch(() => null);
  }
  return analyticsPromise;
}

/** Fire-and-forget event; a no-op when analytics is unavailable. */
export function track(name, params) {
  initAnalytics().then(async (analytics) => {
    if (!analytics) return;
    const { logEvent } = await import("firebase/analytics");
    logEvent(analytics, name, params);
  });
}
