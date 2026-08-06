import Link from "next/link";
import type { Listing } from "@/lib/listings";
import { formatPrice } from "@/lib/listings";

export function ListingCard({ listing }: { listing: Listing }) {
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

        {/* Photo placeholder — real images arrive with the backend */}
        <div
          className="flex aspect-[4/3] items-center justify-center text-[13px] font-medium text-ink/35"
          style={{ background: "linear-gradient(135deg, #DCD3BE, #EDE6D6)" }}
        >
          Photo
        </div>

        <div className="px-4 pb-4 pt-3.5">
          <h3 className="mb-1 text-[15px] font-semibold">{listing.title}</h3>
          <p className="mb-2.5 text-xs text-ink/55">
            {listing.category} · {listing.condition}
          </p>
          <div className="flex items-center justify-between">
            {/* Price in IBM Plex Mono — reads like a price tag / receipt */}
            <span className="font-mono text-[15px] font-medium">
              {formatPrice(listing.price)}
            </span>
            {listing.verified && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-moss">
                ● Verified
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
