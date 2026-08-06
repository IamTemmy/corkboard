export function Footer() {
  return (
    // mt-auto pushes the footer to the bottom on short pages (body is a flex column)
    <footer className="mt-auto border-t border-line px-6 py-7 text-center text-xs text-ink/55 sm:px-12">
      Corkboard is an independent student project. Meet in public campus
      locations. Not affiliated with or endorsed by any university.
    </footer>
  );
}
