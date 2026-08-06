import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { CategoryChips } from "@/components/site/category-chips";
import { ListingGrid } from "@/components/site/listing-grid";
import { Footer } from "@/components/site/footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <CategoryChips />
        <ListingGrid />
      </main>
      <Footer />
    </>
  );
}
