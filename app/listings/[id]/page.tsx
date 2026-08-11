import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { ListingCard } from "@/components/site/listing-card";
import { ListingGallery } from "@/components/site/listing-gallery";
import { ListingDescription } from "@/components/site/listing-description";
import { ContactSeller, MeetSafelyNote } from "@/components/site/contact-seller";
import { ReportListing } from "@/components/site/report-listing";
import { formatPostedAt, formatPrice } from "@/lib/listings";
import { getListingById, getListingContact, getListings } from "@/lib/queries";
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

  // Contact is fetched separately and ONLY for a signed-in (verified) student
  // viewing an available listing — it never rides along in the public payload,
  // and the anon role can't read the column at the DB either (supabase/008).
  const contact = user && isAvailable ? await getListingContact(listing.id) : {};

  // The owner manages their own listing, so they see an Edit action where
  // everyone else sees Report — either way the details column ends on a
  // bottom-anchored action so short listings never leave a dead zone.
  const isOwner = !!user && user.id === listing.sellerId;

  // Suggest up to 4 other listings below. Prefer the same category, then top up
  // with other recent listings so the row never strands a lone card in an empty
  // grid — matters most now, while categories are still thin.
  const all = await getListings();
  const others = all.filter((other) => other.id !== listing.id);
  const sameCategory = others.filter((other) => other.category === listing.category);
  // Backfill with the OLDEST other listings (getListings is newest-first, so we
  // reverse). The homepage already spotlights the newest, so this surfaces the
  // tail instead of repeating it — and gives older, still-available items a look.
  const backfill = others
    .filter((other) => other.category !== listing.category)
    .reverse();
  const related = [...sameCategory, ...backfill].slice(0, 4);
  // Only call it "More in <category>" when every card really is that category;
  // once we've topped up with other items, it's just "Keep browsing".
  const relatedAllSameCategory =
    related.length > 0 && related.every((r) => r.category === listing.category);

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

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-marigold-text">
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

            {listing.description && (
              <ListingDescription text={listing.description} />
            )}

            {/* Meet-at — the on-campus exchange spot. Uses the universal map
                marker (the brand's brick pin already sits on the photo, so
                repeating it here would be redundant) + a soft moss tint, which
                pairs it with the safety note as the "meetup & safety" colour. */}
            <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-moss/25 bg-moss/8 px-4 py-3">
              <svg
                viewBox="0 0 24 24"
                className="size-7 shrink-0 text-moss-text"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 22c5-5.5 7-8.9 7-12a7 7 0 1 0-14 0c0 3.1 2 6.5 7 12zm0-9.4a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z"
                />
              </svg>
              <div>
                <p className="text-[11px] uppercase tracking-[0.06em] text-moss-text">
                  Meet at
                </p>
                <p className="text-sm font-semibold">{listing.meetupSpot}</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-ink/55">
              Listed by{" "}
              <span className="font-semibold text-ink">{listing.seller}</span> ·{" "}
              {listing.campus}
            </p>

            {isAvailable ? (
              <ContactSeller
                signedIn={!!user}
                seller={listing.seller}
                contact={contact}
              />
            ) : (
              <p className="mt-6 rounded-[12px] border border-dashed border-line px-4 py-4 text-sm text-ink/60">
                {listing.status === "reserved"
                  ? "Reserved — the seller has agreed to sell this to another buyer. If that falls through, it may become available again."
                  : "This item has sold."}
              </p>
            )}

            {/* Bottom-anchored action (mt-auto) so the details column always
                ends level with the bottom of the photo, however short the
                listing is — no dangling dead zone. The owner gets Edit (powder
                blue, matching My Listings); everyone else gets Report, or a
                sign-in nudge when signed out. */}
            <div className="mt-auto">
              {/* Meet-safely note sits with the closing actions, not under the
                  contact chips — an end-of-visit reminder. Shown to signed-in
                  students on an available listing (the signed-out lock copy
                  already carries the safety line). */}
              {isAvailable && user && <MeetSafelyNote />}

              {/* The closing line + action. When the safety note is present the
                  line hugs it (mt-3, so it reads as one closing block); with no
                  note it keeps a normal gap from the content above (mt-8). The
                  owner gets Edit (powder blue); everyone else gets Report. */}
              <div
                className={`border-t border-line pt-6 ${
                  isAvailable && user ? "mt-3" : "mt-8"
                }`}
              >
                {isOwner ? (
                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3b6fa0] underline-offset-4 transition-colors hover:text-[#3b6fa0]/80 hover:underline"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    Edit listing
                  </Link>
                ) : (
                  <ReportListing
                    listingId={listing.id}
                    reporterId={user?.id ?? null}
                    isOwner={false}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Keep browsing — other listings in the same category */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink/55">
              {relatedAllSameCategory ? `More in ${listing.category}` : "Keep browsing"}
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
