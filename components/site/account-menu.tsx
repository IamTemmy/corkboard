"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

// The signed-in account control in the header: an avatar + name chip that opens
// a small menu. Collapses the old loose "Hi, name" + "Sign out" into one tidy,
// scalable control (Settings and more can live here later).
export function AccountMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "block w-full rounded-lg px-3 py-2 text-left text-sm text-ink/80 transition-colors hover:bg-paper hover:text-ink";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Your account"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-paper"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[12ch] truncate text-sm font-medium text-ink/80">
          {name}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`size-3.5 text-ink/50 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-line bg-paper-soft p-1 shadow-[0_8px_24px_rgba(28,36,48,0.12)]"
        >
          <Link
            href="/new"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={item}
          >
            + List an item
          </Link>
          <Link
            href="/my-listings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={item}
          >
            My listings
          </Link>
          <span
            role="menuitem"
            aria-disabled="true"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-ink/40"
          >
            Settings
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em]">
              Soon
            </span>
          </span>
          <div className="my-1 h-px bg-line" />
          <SignOutButton className={item} />
        </div>
      )}
    </div>
  );
}
