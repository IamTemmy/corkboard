"use client";

import { useState } from "react";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

type NavLink = { label: string; href: string; kind: "scroll" | "page" };

// The mobile-only header menu. On phones the nav links are hidden to keep the
// header uncluttered; this hamburger button reveals them (plus the CTA) in a
// dropdown. Shown under `sm` only — the desktop nav has the links inline.
// `authName` is the signed-in student's name, or null when logged out.
export function MobileMenu({
  links,
  authName,
}: {
  links: NavLink[];
  authName: string | null;
}) {
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

          {/* Auth sits with the other links; signed-in shows name + sign-out */}
          {authName ? (
            <>
              <Link
                href="/my-listings"
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                My listings
              </Link>
              <div className="flex items-center justify-between rounded-lg px-2 py-3">
                <span className="text-sm text-ink/75">
                  Hi, <span className="font-medium text-ink">{authName}</span>
                </span>
                <SignOutButton />
              </div>
            </>
          ) : (
            <Link
              href="/join"
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              Sign in
            </Link>
          )}

          {/* Signed-out visitors get a Sign up button to set off the auth
              flow. For signed-in students we deliberately DON'T repeat
              "+ List an item" here — it's already the big CTA beside Search on
              the home page (and on My Listings), so putting it in the menu too
              just stacks two identical primary buttons. The menu is navigation,
              not a second copy of the page's main action. */}
          {!authName && (
            <Link
              href="/join"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-paper"
            >
              Sign up
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
