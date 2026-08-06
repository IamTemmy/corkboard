import { listings } from "@/lib/listings";
import { ListingCard } from "./listing-card";

export function ListingGrid() {
  return (
    <section>
      <h2 className="px-6 pb-4 pt-10 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink/55 sm:px-12">
        Fresh listings
      </h2>

      {/* 1 column on phones, 2 on small screens, 4 on large — the mockup is 4-up */}
      <div className="grid grid-cols-1 gap-5 px-6 pb-16 sm:grid-cols-2 sm:px-12 lg:grid-cols-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
