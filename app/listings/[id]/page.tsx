import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { ListingCard } from "@/components/site/listing-card";
import { ListingGallery } from "@/components/site/listing-gallery";
import { ContactSeller } from "@/components/site/contact-seller";
import { formatPostedAt, formatPrice } from "@/lib/listings";
import { getListingById, getListings } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

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

  // Is a verified student signed in? (Signup is gated to approved .edu domains,
  // so a session already means "verified student".) Controls the contact reveal.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Real listings pull the seller's contact live from their profile; the legacy
  // demo rows use their embedded contact blob. Only fetched when signed in —
  // that's the only time contact is revealed anyway.
  let contact = listing.contact;
  if (user && listing.sellerId) {
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("email, instagram, groupme")
      .eq("id", listing.sellerId)
      .maybeSingle();
    if (sellerProfile) {
      contact = {
        email: sellerProfile.email ?? undefined,
        instagram: sellerProfile.instagram ?? undefined,
        groupme: sellerProfile.groupme ?? undefined,
      };
    }
  }

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
              <ContactSeller
                signedIn={!!user}
                seller={listing.seller}
                contact={contact}
              />
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
