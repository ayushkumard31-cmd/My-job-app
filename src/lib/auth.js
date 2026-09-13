"use client";

// Accounts. An account is entirely optional — it exists so a student's planner
// follows them to another device. Signed out, the app behaves exactly as before
// and everything stays in localStorage.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth, initAnalytics, isFirebaseConfigured } from "./firebase";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `ready` = Firebase has told us whether a session exists. Until then we show
  // neither "signed in" nor "signed out" so the UI doesn't flicker on reload.
  const [ready, setReady] = useState(!isFirebaseConfigured);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    initAnalytics();
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, email: u.email, name: u.displayName, photo: u.photoURL } : null);
      setReady(true);
    });
  }, []);

  const value = useMemo(
    () => ({ user, ready, available: isFirebaseConfigured }),
    [user, ready],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx) ?? { user: null, ready: true, available: false };
}

// --------------------------------------------------------------- actions --
// Each returns a promise and throws an Error whose message is already
// human-readable, so callers can just `catch (e) => setError(e.message)`.

function requireAuth() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Cloud sync isn't set up — add your Firebase keys to .env.local.");
  return auth;
}

export async function signUpWithEmail(email, password, name) {
  const auth = requireAuth();
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name?.trim()) await updateProfile(user, { displayName: name.trim() });
    return user;
  } catch (e) {
    throw new Error(authMessage(e));
  }
}

export async function signInWithEmail(email, password) {
  const auth = requireAuth();
  try {
    const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
    return user;
  } catch (e) {
    throw new Error(authMessage(e));
  }
}

export async function signInWithGoogle() {
  const auth = requireAuth();
  try {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    return user;
  } catch (e) {
    throw new Error(authMessage(e));
  }
}

export async function sendReset(email) {
  const auth = requireAuth();
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (e) {
    throw new Error(authMessage(e));
  }
}

export async function signOutUser() {
  const auth = getFirebaseAuth();
  if (auth) await signOut(auth);
}

/** Firebase error codes are not something to show a student. */
export function authMessage(e) {
  switch (e?.code) {
    case "auth/invalid-email":
      return "That email doesn't look right.";
    case "auth/missing-password":
      return "Enter a password.";
    case "auth/weak-password":
      return "Use at least 6 characters for the password.";
    case "auth/email-already-in-use":
      return "That email already has an account — sign in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in window closed before finishing.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup — allow popups for this site.";
    case "auth/network-request-failed":
      return "No connection. Check your internet and try again.";
    case "auth/operation-not-allowed":
      return "That sign-in method isn't enabled in the Firebase console yet.";
    case "auth/unauthorized-domain":
      return "This domain isn't in the Firebase console's authorised domains list.";
    default:
      return e?.message?.replace(/^Firebase:\s*/, "") || "Something went wrong. Try again.";
  }
}
