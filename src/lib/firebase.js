"use client";

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

// Firebase is considered configured only when the required values exist.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

// Create the Firebase app only when it is actually needed.
export function getFirebaseApp() {
  if (!isFirebaseConfigured) {
    return null;
  }

  return getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);
}

// Firebase Authentication
export function getFirebaseAuth() {
  const app = getFirebaseApp();

  return app ? getAuth(app) : null;
}

// Firestore Database
export function getDb() {
  const app = getFirebaseApp();

  return app ? getFirestore(app) : null;
}

// Firebase Storage
export function getBucket() {
  const app = getFirebaseApp();

  if (!app || !firebaseConfig.storageBucket) {
    return null;
  }

  return getStorage(app);
}

export const isStorageConfigured = Boolean(
  isFirebaseConfigured && firebaseConfig.storageBucket
);

// Firebase Analytics
let analyticsPromise = null;

export function initAnalytics() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (
    !isFirebaseConfigured ||
    !firebaseConfig.measurementId
  ) {
    return Promise.resolve(null);
  }

  if (!analyticsPromise) {
    analyticsPromise = import("firebase/analytics")
      .then(async ({ getAnalytics, isSupported }) => {
        const supported = await isSupported();

        if (!supported) {
          return null;
        }

        const app = getFirebaseApp();

        if (!app) {
          return null;
        }

        return getAnalytics(app);
      })
      .catch(() => null);
  }

  return analyticsPromise;
}

// Send an Analytics event.
// Does nothing if Analytics isn't available.
export function track(name, params) {
  initAnalytics().then(async (analytics) => {
    if (!analytics) {
      return;
    }

    const { logEvent } = await import("firebase/analytics");

    logEvent(analytics, name, params);
  });
}