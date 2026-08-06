import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { formatPrice, getListingById, listings } from "@/lib/listings";

// `params` for a dynamic route arrives as a Promise in the App Router.
type ListingPageProps = {
  params: Promise<{ id: string }>;
};

// Pre-build a static page for every listing at build time (one per id).
// Because our data is fixed, all 8 detail pages are generated up front.
export function generateStaticParams() {
  return listings.map((listing) => ({ id: listing.id }));
}

// Sets the browser-tab title per listing.
export async function generateMetadata({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = getListingById(id);
  return {
    title: listing
      ? `${listing.title} — Corkboard`
      : "Listing not found — Corkboard",
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  // Read which id the URL asked for (await, because params is a Promise).
  const { id } = await params;
  const listing = getListingById(id);

  // No matching listing → render Next's 404 page.
  if (!listing) notFound();

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
          {/* Photo (with the same pin motif as the cards) */}
          <div className="relative overflow-hidden rounded-[14px] border border-line">
            <span className="absolute left-3 top-3 z-10 flex size-[22px] items-center justify-center rounded-full bg-brick shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
              <span className="size-1.5 rounded-full bg-paper-soft" />
            </span>
            <div
              className="flex aspect-[4/3] items-center justify-center text-[13px] font-medium text-ink/35"
              style={{ background: "linear-gradient(135deg, #DCD3BE, #EDE6D6)" }}
            >
              Photo
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="mb-2 text-xs uppercase tracking-[0.06em] text-ink/55">
              {listing.category} · {listing.condition}
            </p>
            <h1 className="font-display mb-3 text-[32px] font-semibold leading-tight tracking-[-0.01em]">
              {listing.title}
            </h1>
            <div className="mb-6 flex items-center gap-3">
              <span className="font-mono text-2xl font-medium">
                {formatPrice(listing.price)}
              </span>
              {listing.verified && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-moss">
                  ● Verified
                </span>
              )}
            </div>

            {/* Placeholder CTA — contact/messaging isn't built yet */}
            <Button className="h-auto w-full rounded-lg px-5 py-3 text-sm font-semibold sm:w-auto">
              Contact seller
            </Button>
            <p className="mt-3 max-w-sm text-xs text-ink/55">
              Sellers arrange meetups over Instagram or GroupMe. Always meet in a
              public campus location.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
