import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Marketplace } from "@/components/site/marketplace";
import { Footer } from "@/components/site/footer";
import { getListings } from "@/lib/queries";

// Listings live in the database and change as students post, so render this
// page fresh on each request rather than caching a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listings = await getListings();

  return (
    <>
      <Nav />
      <main>
        <Hero />
        {/* Interactive: category chips + the (filtered) listings grid */}
        <Marketplace listings={listings} />
      </main>
      <Footer />
    </>
  );
}
