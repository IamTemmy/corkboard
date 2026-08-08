import Link from "next/link";

export function Footer() {
  return (
    // mt-auto pushes the footer to the bottom on short pages (body is a flex column)
    <footer className="mt-auto border-t border-line px-6 py-7 text-center text-xs text-ink/55 sm:px-12">
      <p>
        Corkboard is an independent student project. Meet in public campus
        locations. Not affiliated with or endorsed by any university.
      </p>
      <nav className="mt-2 flex justify-center gap-4">
        <Link
          href="/how-it-works"
          className="transition-colors hover:text-ink"
        >
          How it works
        </Link>
        <Link href="/guidelines" className="transition-colors hover:text-ink">
          Community guidelines
        </Link>
      </nav>
    </footer>
  );
}
