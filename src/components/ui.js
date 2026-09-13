"use client";

import Image from "next/image";
import { useEffect } from "react";

/**
 * The app mark. The source is a black-on-white bitmap, so dark mode inverts it
 * (see .logo-mark in globals.css) rather than shipping a second file.
 */
export function Logo({ size = 28, className = "" }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Campus Compass"
      width={size}
      height={size}
      priority
      className={`logo-mark ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function Card({ className = "", children, ...rest }) {
  return (
    <div className={`card p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, action }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  );
}

export function ProgressBar({ value, color, className = "" }) {
  return (
    <div className={`bar ${className}`}>
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Ring({ value = 0, size = 92, stroke = 9, color, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color || "var(--accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none">{label ?? `${Math.round(pct)}%`}</span>
        {sub ? <span className="mt-0.5 text-[10px] text-muted">{sub}</span> : null}
      </div>
    </div>
  );
}

export function Segmented({ options, value, onChange, className = "" }) {
  return (
    <div className={`scroll-x flex gap-1.5 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="chip shrink-0"
          data-on={String(value === o.value)}
        >
          {o.emoji ? <span>{o.emoji}</span> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ emoji = "🗒️", title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="text-3xl">{emoji}</div>
      <p className="font-medium">{title}</p>
      {hint ? <p className="max-w-xs text-sm text-muted">{hint}</p> : null}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />
      <div className="card fade-up relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-b-none p-4 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
        {footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Dot({ color }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: color }}
      aria-hidden
    />
  );
}

export function Pill({ color, children }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value, sub, emoji }) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {emoji ? <span>{emoji}</span> : null}
        {label}
      </div>
      <div className="mt-1 text-xl font-bold leading-tight">{value}</div>
      {sub ? <div className="text-xs text-muted">{sub}</div> : null}
    </div>
  );
}
