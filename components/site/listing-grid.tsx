import type { Listing } from "@/lib/listings";
import { ListingCard } from "./listing-card";

// Presentational: it just renders whatever listings it's handed. The decision
// about *which* listings to show lives one level up, in Marketplace.
export function ListingGrid({ listings }: { listings: Listing[] }) {
  return (
    <section id="listings" className="scroll-mt-4">
      <h2 className="px-6 pb-4 pt-10 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink/55 sm:px-12">
        Fresh listings
      </h2>

      {listings.length === 0 ? (
        // Empty state — shown when a category has no listings yet
        <div className="px-6 pb-16 sm:px-12">
          <p className="rounded-[14px] border border-dashed border-line py-16 text-center text-sm text-ink/55">
            No listings match. Try a different search or category.
          </p>
        </div>
      ) : (
        // 1 column on phones, 2 on small screens, 4 on large — the mockup is 4-up
        <div className="grid grid-cols-1 gap-5 px-6 pb-16 sm:grid-cols-2 sm:px-12 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}
