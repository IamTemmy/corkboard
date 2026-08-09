import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Marketplace } from "@/components/site/marketplace";
import { Footer } from "@/components/site/footer";
import { getListings } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

// Listings live in the database and change as students post, so render this
// page fresh on each request rather than caching a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listings = await getListings();

  // Is a student signed in? Controls whether the primary CTA lists an item or
  // invites them to sign up first (you must have an account to post).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Nav />
      <main>
        <Hero />
        {/* Interactive: category chips + the (filtered) listings grid */}
        <Marketplace listings={listings} signedIn={!!user} />
      </main>
      <Footer />
    </>
  );
}
