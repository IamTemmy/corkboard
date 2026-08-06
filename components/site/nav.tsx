import Link from "next/link";
import { Button } from "@/components/ui/button";

// Two kinds of links live here:
//  - "scroll" links jump to a section on the homepage (plain <a> + hash, so
//    same-page scrolling works; "/#id" also works from another page)
//  - "page" links go to a real route (next/link for instant client-side nav)
const navLinks = [
  { label: "Browse", href: "/#listings", kind: "scroll" as const },
  { label: "Categories", href: "/#categories", kind: "scroll" as const },
  { label: "How it works", href: "/how-it-works", kind: "page" as const },
];

export function Nav() {
  return (
    <nav className="flex items-center justify-between border-b border-line bg-paper-soft px-6 py-5 sm:px-12">
      {/* Wordmark links home, as every site's logo should */}
      <Link
        href="/"
        className="font-display text-[22px] font-semibold tracking-[-0.01em]"
      >
        cork<span className="text-marigold">board</span>
      </Link>

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

      {/* Listing an item needs the backend + auth, so it's not wired yet.
          The "Soon" badge makes that honest instead of looking clickable-but-dead. */}
      <Button
        title="Listing items is coming soon"
        className="h-auto rounded-lg px-4 py-2.5 text-sm font-semibold"
      >
        + List an item
        <span className="ml-2 rounded-full bg-paper/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]">
          Soon
        </span>
      </Button>
    </nav>
  );
}
