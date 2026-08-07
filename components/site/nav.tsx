import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";

// Two kinds of links live here:
//  - "scroll" links jump to a section on the homepage (plain <a> + hash, so
//    same-page scrolling works; "/#id" also works from another page)
//  - "page" links go to a real route (next/link for instant client-side nav)
const navLinks = [
  { label: "Browse", href: "/#listings", kind: "scroll" as const },
  // "Categories" was removed — it scrolled to the filter chips, which sit right
  // above the listings, so it did the same thing as "Browse" (redundant).
  { label: "How it works", href: "/how-it-works", kind: "page" as const },
];

export function Nav() {
  return (
    <nav className="relative flex items-center justify-between border-b border-line bg-paper-soft px-6 py-5 sm:px-12">
      {/* Wordmark links home. A plain <a> (not next/link) forces a full page
          load, which resets any active search/filter — so clicking it is a
          reliable "back to a fresh homepage", even when you're already on it. */}
      <a
        href="/"
        className="font-display text-[22px] font-semibold tracking-[-0.01em]"
      >
        cork<span className="text-marigold">board</span>
      </a>

      {/* Center links — hidden on small screens to keep the mobile header clean */}
      <div className="hidden items-center gap-8 text-sm font-medium sm:flex">
        {navLinks.map((link) =>
          link.kind === "page" ? (
            <Link
              key={link.label}
              href={link.href}
              className="text-ink/75 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ) : (
            <a
              key={link.label}
              href={link.href}
              className="text-ink/75 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ),
        )}
      </div>

      {/* Desktop CTA (hidden on phones — it moves into the mobile menu).
          Listing an item needs the backend + auth, so it's not wired yet;
          the "Soon" badge makes that honest instead of clickable-but-dead. */}
      <Button
        title="Listing items is coming soon"
        className="hidden h-auto rounded-lg px-4 py-2.5 text-sm font-semibold sm:inline-flex"
      >
        + List an item
        <span className="ml-2 rounded-full bg-paper/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]">
          Soon
        </span>
      </Button>

      {/* Phone-only hamburger holding the same links + CTA */}
      <MobileMenu links={navLinks} />
    </nav>
  );
}
