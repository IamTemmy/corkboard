import type { ReactNode } from "react";

// A lightweight, styled hover tooltip — pure CSS (group-hover), no JS, so it
// works in server or client components and pops up instantly (unlike the native
// `title` attribute, which lags ~1s and is easy to miss). Desktop-hover only,
// which is fine: on touch the button labels stand on their own.
export function Tooltip({
  label,
  side = "top",
  children,
}: {
  label: string;
  side?: "top" | "bottom";
  children: ReactNode;
}) {
  const position = side === "top" ? "bottom-full mb-2" : "top-full mt-2";
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 ${position} whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-paper opacity-0 shadow-[0_6px_18px_rgba(28,36,48,0.25)] transition-opacity duration-150 group-hover:opacity-100`}
      >
        {label}
      </span>
    </span>
  );
}
