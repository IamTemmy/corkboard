import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Marketplace } from "@/components/site/marketplace";
import { Footer } from "@/components/site/footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        {/* Interactive: category chips + the (filtered) listings grid */}
        <Marketplace />
      </main>
      <Footer />
    </>
  );
}
