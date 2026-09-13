"use client";

// The top-right account control.
//
//   signed out  →  [ Log in ]  [ Continue as guest ]
//   guest       →  [ Log in ]            (the guest nudge is dismissed)
//   signed in   →  [ 🅰 Name ▾ ]         (no log-in / guest buttons at all)
//
// Signing in is always optional — "Continue as guest" just puts the prompt away
// and leaves the planner in this browser.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui";
import SignInForm from "@/components/SignInForm";
import { signOutUser, useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";

export default function AuthMenu({ showProfileLink = true }) {
  const { user, ready, available } = useAuth();
  const { state, dispatch } = useApp();
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Signing in retires the guest choice, so signing out later offers it again.
  useEffect(() => {
    if (user && state.ui.guest) dispatch({ type: "ui", payload: { guest: false } });
  }, [user, state.ui.guest, dispatch]);

  // No Firebase keys — there is nothing to log into, so show nothing.
  if (!available) return null;

  // Firebase hasn't reported a session yet. A placeholder keeps the header from
  // jumping between "Log in" and the account chip on every reload.
  if (!ready) {
    return <div className="h-8 w-24 animate-pulse rounded-xl" style={{ background: "var(--line)" }} />;
  }

  if (user) {
    const label = user.name || user.email || "Account";
    return (
      <div className="relative">
        <button
          className="btn btn-sm"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: "var(--accent-soft)" }}
            aria-hidden
          >
            {label.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[9rem] truncate">{label}</span>
          <span aria-hidden>▾</span>
        </button>

        {menuOpen ? (
          <>
            <button
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close account menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="card fade-up absolute right-0 z-50 mt-1 w-56 space-y-2 p-3 text-left">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{user.name || "Signed in"}</div>
                <div className="truncate text-xs text-muted">{user.email}</div>
              </div>
              {showProfileLink ? (
                <Link
                  href="/profile"
                  className="btn btn-sm w-full justify-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Account &amp; sync
                </Link>
              ) : null}
              <button
                className="btn btn-sm w-full justify-center"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await signOutUser();
                    setMenuOpen(false);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "…" : "Sign out"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button className="btn btn-sm btn-primary" onClick={() => setLoginOpen(true)}>
          Log in
        </button>
        {state.ui.guest ? null : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => dispatch({ type: "ui", payload: { guest: true } })}
          >
            Continue as guest
          </button>
        )}
      </div>

      <Modal open={loginOpen} onClose={() => setLoginOpen(false)} title="Log in to Campus Compass">
        <p className="mb-3 text-sm text-muted">
          An account keeps your planner backed up and synced across devices. You can skip it and
          keep everything in this browser.
        </p>
        <SignInForm onDone={() => setLoginOpen(false)} />
      </Modal>
    </>
  );
}
