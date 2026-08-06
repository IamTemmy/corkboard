import { Button } from "@/components/ui/button";

// Placeholder links — none of these route anywhere yet (single-page prototype).
const navLinks = [
  { label: "Browse", href: "#" },
  { label: "Categories", href: "#" },
  { label: "How it works", href: "#" },
];

export function Nav() {
  return (
    <nav className="flex items-center justify-between border-b border-line bg-paper-soft px-6 py-5 sm:px-12">
      {/* Wordmark: "cork" in ink, "board" in marigold (Fraunces display font) */}
      <div className="font-display text-[22px] font-semibold tracking-[-0.01em]">
        cork<span className="text-marigold">board</span>
      </div>

      {/* Center links — hidden on small screens to keep the mobile header clean */}
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
