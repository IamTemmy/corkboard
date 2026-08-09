"use client";

import { useState } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/listings";
import { searchListings } from "@/lib/search";
import { SearchBar } from "./search-bar";
import { CategoryChips } from "./category-chips";
import { ListingGrid } from "./listing-grid";

// Owns the two things a shopper can change — the search text and the selected
// category — and derives the visible listings from both. Because these live
// here (the common parent), the SearchBar, chips, and grid all stay in sync.
// The listings themselves are fetched on the server and passed in as a prop.
export function Marketplace({
  listings,
  signedIn,
}: {
  listings: Listing[];
  signedIn: boolean;
}) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  // First narrow by the selected category chip...
  const byCategory = listings.filter((listing) => {
    // "Free" is a price state, not a real category — filter it by price.
    if (category === "All") return true;
    if (category === "Free") return listing.price === 0;
    return listing.category === category;
  });

  // ...then apply search: matches across title/description/etc. with synonyms
  // and singular/plural handling, ranked so title hits come first (see
  // lib/search.ts). An empty query leaves the newest-first order untouched.
  const visibleListings = searchListings(byCategory, query);

  return (
    <>
      {/* Search to buy, list to sell — the two primary actions side by side. */}
      <div className="px-6 pt-8 sm:px-12">
        <div className="mx-auto flex max-w-[620px] flex-col gap-3 sm:flex-row">
          <SearchBar value={query} onChange={setQuery} />
          {/* Signed-in students list directly; signed-out visitors sign up
              first (posting requires an account — the same /join flow). */}
          <Link
            href={signedIn ? "/new" : "/join"}
            className="flex shrink-0 items-center justify-center rounded-[12px] bg-ink px-6 py-3 text-sm font-semibold whitespace-nowrap text-paper transition-colors hover:bg-ink/90"
          >
            {signedIn ? "+ List an item" : "Sign up to list"}
          </Link>
        </div>
      </div>
      <CategoryChips selected={category} onSelect={setCategory} />
      <ListingGrid listings={visibleListings} />
    </>
  );
}
