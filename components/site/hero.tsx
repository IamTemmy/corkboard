import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="px-6 pb-10 pt-16 text-center sm:px-12">
      {/* Trust line — the verification promise, in moss on a soft moss tint */}
      <span className="mb-6 inline-block rounded-full bg-moss/12 px-3.5 py-1.5 text-xs font-medium text-moss">
        Only verified students at your campus can list or contact sellers
      </span>

      <h1 className="font-display mx-auto mb-3 max-w-[640px] text-[34px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[44px]">
        Buy and sell with people on your campus
      </h1>

      <p className="mb-8 text-base text-ink/65">
        No shipping. No fees. Just students down the hall.
      </p>

      {/* Search bar — presentational for now (no backend to query yet).
          It's a <form> so pressing Enter behaves sensibly once wired up. */}
      <form className="mx-auto flex max-w-[520px] rounded-[12px] border border-line bg-paper-soft p-1.5">
        <input
          type="text"
          placeholder="Search for a couch, textbook, headphones..."
          className="flex-1 bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-ink/40"
          aria-label="Search listings"
        />
        <Button
          type="submit"
          className="h-auto rounded-[8px] bg-marigold px-5 text-sm font-semibold text-ink hover:bg-marigold/90"
        >
          Search
        </Button>
      </form>
    </section>
  );
}
