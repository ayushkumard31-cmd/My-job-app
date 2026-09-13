"use client";

// The sign-in / create-account form. Shared by the header's login popup and the
// Profile page's account card so both stay in step.

import { useState } from "react";
import { Field } from "@/components/ui";
import { sendReset, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/auth";

export default function SignInForm({ onDone }) {
  const [mode, setMode] = useState("in"); // "in" | "up"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {[
          ["in", "Sign in"],
          ["up", "Create account"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="chip"
            data-on={String(mode === id)}
            onClick={() => {
              setMode(id);
              setError(null);
              setNotice(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            if (mode === "up") await signUpWithEmail(email, password, name);
            else await signInWithEmail(email, password);
            onDone?.();
          });
        }}
      >
        {mode === "up" ? (
          <Field label="Name">
            <input
              className="input"
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        ) : null}
        <Field label="Email">
          <input
            className="input"
            type="email"
            required
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" hint={mode === "up" ? "At least 6 characters." : undefined}>
          <input
            className="input"
            type="password"
            required
            value={password}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "…" : mode === "up" ? "Create account" : "Sign in"}
          </button>
          <button
            className="btn"
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await signInWithGoogle();
                onDone?.();
              })
            }
          >
            Continue with Google
          </button>
          {mode === "in" ? (
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              disabled={busy || !email}
              onClick={() =>
                run(async () => {
                  await sendReset(email);
                  setNotice(`Password reset link sent to ${email}.`);
                })
              }
            >
              Forgot password?
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p> : null}
      {notice ? <p className="text-xs" style={{ color: "#22c55e" }}>{notice}</p> : null}
      <p className="text-xs text-muted">
        Signing in for the first time uploads whatever is already on this device — you won&apos;t
        lose the planner you&apos;ve built.
      </p>
    </div>
  );
}
