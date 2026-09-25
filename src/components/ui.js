"use client";

import Image from "next/image";
import { useEffect } from "react";

/**
 * The app mark.
 * The source is a black-on-white bitmap, so dark mode inverts it
 * using the .logo-mark class from globals.css.
 */
export function Logo({ size = 28, className = "" }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Campus Compass"
      width={size}
      height={size}
      priority
      className={"logo-mark " + className}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}

export function Card({
  className = "",
  children,
  ...rest
}) {
  return (
    <div
      className={"card p-4 " + className}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h2 className="section-title">
        {title}
      </h2>

      {action}
    </div>
  );
}

export function ProgressBar({
  value = 0,
  color,
  className = "",
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, Number(value) || 0)
  );

  return (
    <div className={"bar " + className}>
      <i
        style={{
          width: safeValue + "%",
          background: color,
        }}
      />
    </div>
  );
}

export function Ring({
  value = 0,
  size = 92,
  stroke = 9,
  color,
  label,
  sub,
}) {
  const safeSize = Math.max(20, Number(size) || 92);
  const safeStroke = Math.max(
    1,
    Math.min(safeSize / 2, Number(stroke) || 9)
  );

  const radius = (safeSize - safeStroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const percentage = Math.max(
    0,
    Math.min(100, Number(value) || 0)
  );

  const displayLabel =
    label ?? Math.round(percentage) + "%";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{
        width: safeSize,
        height: safeSize,
      }}
    >
      <svg
        width={safeSize}
        height={safeSize}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={safeSize / 2}
          cy={safeSize / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={safeStroke}
        />

        <circle
          cx={safeSize / 2}
          cy={safeSize / 2}
          r={radius}
          fill="none"
          stroke={color || "var(--accent)"}
          strokeWidth={safeStroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={
            circumference -
            (circumference * percentage) / 100
          }
          style={{
            transition:
              "stroke-dashoffset .5s ease",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none">
          {displayLabel}
        </span>

        {sub ? (
          <span className="mt-0.5 text-[10px] text-muted">
            {sub}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Segmented({
  options = [],
  value,
  onChange,
  className = "",
}) {
  return (
    <div
      className={
        "scroll-x flex gap-1.5 " + className
      }
      role="tablist"
    >
      {options.map((option) => {
        const selected =
          value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              onChange?.(option.value)
            }
            className="chip shrink-0"
            data-on={String(selected)}
            aria-selected={selected}
            role="tab"
          >
            {option.emoji ? (
              <span aria-hidden="true">
                {option.emoji}
              </span>
            ) : null}

            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Empty({
  emoji = "🗒️",
  title,
  hint,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div
        className="text-3xl"
        aria-hidden="true"
      >
        {emoji}
      </div>

      <p className="font-medium">
        {title}
      </p>

      {hint ? (
        <p className="max-w-xs text-sm text-muted">
          {hint}
        </p>
      ) : null}

      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card fade-up relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-b-none p-4 sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {title}
          </h3>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {children}

        {footer ? (
          <div className="mt-4 flex justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
      </span>

      {children}

      {hint ? (
        <span className="mt-1 block text-xs text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Dot({ color }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{
        background: color,
      }}
      aria-hidden="true"
    />
  );
}

export function Pill({
  color = "var(--accent)",
  children,
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{
        background:
          "color-mix(in srgb, " +
          color +
          " 16%, transparent)",
        color,
      }}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  emoji,
}) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {emoji ? (
          <span aria-hidden="true">
            {emoji}
          </span>
        ) : null}

        {label}
      </div>

      <div className="mt-1 text-xl font-bold leading-tight">
        {value}
      </div>

      {sub ? (
        <div className="text-xs text-muted">
          {sub}
        </div>
      ) : null}
    </div>
  );
}