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

        {/* Photo — a real image once one exists, otherwise the placeholder.
            Portrait 4:5 slot fits the (mostly portrait) product photos with
            less cropping than a landscape box. */}
        <div className={`aspect-[4/5] w-full ${isAvailable ? "" : "opacity-60"}`}>
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
          {/* One line, always — truncate keeps every card the same height even
              when the category+condition is long (uppercase made the longest
              ones wrap and grow the card). */}
          <p className="mb-2.5 truncate text-[10px] font-semibold uppercase tracking-[0.03em] text-marigold-text">
            {listing.category} · {listing.condition}
          </p>
          <div className="flex items-center justify-between gap-2">
            {/* Price in IBM Plex Mono — reads like a price tag / receipt */}
            <span className="font-mono text-[15px] font-medium">
              {formatPrice(listing.price)}
            </span>
            {/* Meetup spot — the green pin echoes the detail page's Meet-at, so
                the card and its detail page share the "green = campus meeting"
                colour. */}
            <span className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-moss-text">
              <svg
                viewBox="0 0 24 24"
                className="size-3 shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 22c5-5.5 7-8.9 7-12a7 7 0 1 0-14 0c0 3.1 2 6.5 7 12zm0-9.4a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z"
                />
              </svg>
              <span className="truncate">{listing.meetupSpot}</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
