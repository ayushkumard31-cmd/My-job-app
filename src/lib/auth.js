"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

import {
  getFirebaseAuth,
  initAnalytics,
  isFirebaseConfigured,
} from "./firebase";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!isFirebaseConfigured);

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth) {
      setReady(true);
      return;
    }

    initAnalytics();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photo: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }

      setReady(true);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      available: isFirebaseConfigured,
    }),
    [user, ready]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const context = useContext(Ctx);

  if (context) {
    return context;
  }

  return {
    user: null,
    ready: true,
    available: false,
  };
}

function requireAuth() {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error(
      "Firebase is not configured. Check your .env.local file."
    );
  }

  return auth;
}

export async function signUpWithEmail(email, password, name) {
  const auth = requireAuth();

  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const user = result.user;

    if (name && name.trim()) {
      await updateProfile(user, {
        displayName: name.trim(),
      });
    }

    return user;
  } catch (error) {
    throw new Error(authMessage(error));
  }
}

export async function signInWithEmail(email, password) {
  const auth = requireAuth();

  try {
    const result = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    return result.user;
  } catch (error) {
    throw new Error(authMessage(error));
  }
}

export async function signInWithGoogle() {
  const auth = requireAuth();

  try {
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);

    return result.user;
  } catch (error) {
    throw new Error(authMessage(error));
  }
}

export async function sendReset(email) {
  const auth = requireAuth();

  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    throw new Error(authMessage(error));
  }
}

export async function signOutUser() {
  const auth = getFirebaseAuth();

  if (auth) {
    await signOut(auth);
  }
}

export function authMessage(error) {
  switch (error?.code) {
    case "auth/invalid-email":
      return "That email doesn't look right.";

    case "auth/missing-password":
      return "Enter a password.";

    case "auth/weak-password":
      return "Use at least 6 characters for the password.";

    case "auth/email-already-in-use":
      return "That email already has an account. Sign in instead.";

    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";

    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";

    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in window was closed before finishing.";

    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups for this site.";

    case "auth/network-request-failed":
      return "No connection. Check your internet and try again.";

    case "auth/operation-not-allowed":
      return "This sign-in method isn't enabled in Firebase.";

    case "auth/unauthorized-domain":
      return "This domain isn't authorized in Firebase.";

    case "auth/configuration-not-found":
      return "Firebase Authentication is not configured correctly.";

    default:
      return error?.message || "Something went wrong. Try again.";
  }
}