import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { ListingCard } from "@/components/site/listing-card";
import { ListingGallery } from "@/components/site/listing-gallery";
import { describeContact, formatPostedAt, formatPrice } from "@/lib/listings";
import { getListingById, getListings } from "@/lib/queries";

// `params` for a dynamic route arrives as a Promise in the App Router.
type ListingPageProps = {
  params: Promise<{ id: string }>;
};

// Listings come from the database and can change, so render on each request.
export const dynamic = "force-dynamic";

// Sets the browser-tab title per listing.
export async function generateMetadata({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = await getListingById(id);
  return {
    title: listing
      ? `${listing.title} — Corkboard`
      : "Listing not found — Corkboard",
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  // Read which id the URL asked for (await, because params is a Promise).
  const { id } = await params;
  const listing = await getListingById(id);

  // No matching listing → render Next's 404 page.
  if (!listing) notFound();

  const isAvailable = listing.status === "available";

  // Other items in the same category, to suggest below (max 4).
  const all = await getListings();
  const related = all
    .filter((other) => other.category === listing.category && other.id !== listing.id)
    .slice(0, 4);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-medium text-ink/65 transition-colors hover:text-ink"
        >
          ← Back to listings
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Image gallery — full main image plus thumbnails for extra angles */}
          <ListingGallery
            images={listing.images}
            alt={listing.title}
            dimmed={!isAvailable}
          />

          {/* Details */}
          <div className="flex flex-col">
            {!isAvailable && (
              <span className="mb-3 w-fit rounded-full bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-paper">
                {listing.status === "sold" ? "Sold" : "Reserved"}
              </span>
            )}

            <p className="mb-2 text-xs uppercase tracking-[0.06em] text-ink/55">
              {listing.category} · {listing.condition}
            </p>
            <h1 className="font-display mb-3 text-[32px] font-semibold leading-tight tracking-[-0.01em]">
              {listing.title}
            </h1>

            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-2xl font-medium">
                {formatPrice(listing.price)}
              </span>
              <span className="text-xs text-ink/50">
                Posted {formatPostedAt(listing.postedAt)}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-ink/70">
              {listing.description}
            </p>

            {/* Meet-at — the on-campus exchange spot, in the pin colour */}
            <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-line bg-paper-soft px-4 py-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brick">
                <span className="size-2 rounded-full bg-paper-soft" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.06em] text-ink/55">
                  Meet at
                </p>
                <p className="text-sm font-semibold">{listing.meetupSpot}</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-ink/55">
              Listed by {listing.seller} · {listing.campus}
            </p>

            {isAvailable ? (
              <div className="mt-6">
                <Button
                  title="Seller contact is coming soon"
                  className="h-auto w-full rounded-lg px-5 py-3 text-sm font-semibold sm:w-auto"
                >
                  Contact seller
                  <span className="ml-2 rounded-full bg-paper/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]">
                    Soon
                  </span>
                </Button>
                <p className="mt-3 max-w-md text-xs text-ink/55">
                  When accounts launch, verified students can reach {listing.seller}{" "}
                  over {describeContact(listing.contact)} to agree on a time. Always
                  meet at the campus spot above, in daylight — and it&apos;s fine to
                  bring a friend.
                </p>
              </div>
            ) : (
              <p className="mt-6 rounded-[12px] border border-dashed border-line px-4 py-4 text-sm text-ink/60">
                This item is {listing.status} and is no longer available.
              </p>
            )}
          </div>
        </div>

        {/* Keep browsing — other listings in the same category */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink/55">
              More in {listing.category}
            </h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              {related.map((other) => (
                <ListingCard key={other.id} listing={other} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
