"use client";

import { useState } from "react";
import Link from "next/link";

type NavLink = { label: string; href: string; kind: "scroll" | "page" };

// The mobile-only header menu. On phones the nav links are hidden to keep the
// header uncluttered; this hamburger button reveals them (plus the CTA) in a
// dropdown. Shown under `sm` only — the desktop nav has the links inline.
export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  const linkClass =
    "rounded-lg px-2 py-3 text-sm font-medium text-ink/80 transition-colors hover:bg-paper";

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex size-10 items-center justify-center rounded-lg text-ink"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 flex flex-col gap-1 border-b border-line bg-paper-soft px-6 py-3 shadow-[0_8px_24px_rgba(28,36,48,0.08)]">
          {links.map((link) =>
            link.kind === "page" ? (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                {link.label}
              </a>
            ),
          )}

          <button
            type="button"
            title="Listing items is coming soon"
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-paper"
          >
            + List an item
            <span className="rounded-full bg-paper/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]">
              Soon
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
