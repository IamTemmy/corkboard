import Link from "next/link";
import { Button } from "@/components/ui/button";

// Links point at same-page sections via a hash. Using "/#id" (not just "#id")
// means they also work from other pages (e.g. a listing detail page): they
// navigate home first, then scroll to the section.
const navLinks = [
  { label: "Browse", href: "/#listings" },
  { label: "Categories", href: "/#categories" },
  { label: "How it works", href: "#" }, // placeholder — no destination yet
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

      {/* Center links — hidden on small screens to keep the mobile header clean.
          Plain <a> (not next/link) so same-page hash links scroll natively;
          from another page, "/#listings" navigates home and then scrolls. */}
      <div className="hidden items-center gap-8 text-sm font-medium sm:flex">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-ink/75 transition-colors hover:text-ink"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Primary CTA — shadcn Button; its default variant already renders in
          Ink Navy + paper text thanks to our token mapping. */}
      <Button className="h-auto rounded-lg px-5 py-2.5 text-sm font-semibold">
        + List an item
      </Button>
    </nav>
  );
}
