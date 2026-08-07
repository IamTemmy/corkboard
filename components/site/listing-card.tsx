import Link from "next/link";
import type { Listing } from "@/lib/listings";
import { formatPrice } from "@/lib/listings";

export function ListingCard({ listing }: { listing: Listing }) {
  const isAvailable = listing.status === "available";

  return (
    // The whole card is a link to its detail page (/listings/<id>).
    // `group` lets the inner <article> react to hovering the link.
    <Link
      href={`/listings/${listing.id}`}
      className="group block rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold"
    >
      <article className="relative overflow-hidden rounded-[14px] border border-line bg-paper-soft shadow-[0_1px_2px_rgba(28,36,48,0.04)] transition-all duration-150 group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_24px_rgba(28,36,48,0.10)]">
        {/* The pin — Corkboard's signature detail: a brick disc with a paper dot */}
        <span className="absolute left-3 top-3 z-10 flex size-[22px] items-center justify-center rounded-full bg-brick shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
          <span className="size-1.5 rounded-full bg-paper-soft" />
        </span>

        {/* Sold / reserved marker */}
        {!isAvailable && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-paper">
            {listing.status === "sold" ? "Sold" : "Reserved"}
          </span>
        )}

        {/* Photo — a real image once one exists, otherwise the placeholder */}
        <div className={`aspect-[4/3] w-full ${isAvailable ? "" : "opacity-60"}`}>
          {listing.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[13px] font-medium text-ink/35"
              style={{ background: "linear-gradient(135deg, #DCD3BE, #EDE6D6)" }}
            >
              Photo
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-3.5">
          {/* Reserve two lines so every card is the same height regardless of
              title length; longer titles clamp with an ellipsis. */}
          <h3 className="mb-1 line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug">
            {listing.title}
          </h3>
          <p className="mb-2.5 text-xs text-ink/55">
            {listing.category} · {listing.condition}
          </p>
          <div className="flex items-center justify-between">
            {/* Price in IBM Plex Mono — reads like a price tag / receipt */}
            <span className="font-mono text-[15px] font-medium">
              {formatPrice(listing.price)}
            </span>
            {/* Meetup spot — reinforces the on-campus identity */}
            <span className="text-[11px] text-ink/50">{listing.meetupSpot}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
