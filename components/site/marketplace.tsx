"use client";

import { useState } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/listings";
import { SearchBar } from "./search-bar";
import { CategoryChips } from "./category-chips";
import { ListingGrid } from "./listing-grid";

// Owns the two things a shopper can change — the search text and the selected
// category — and derives the visible listings from both. Because these live
// here (the common parent), the SearchBar, chips, and grid all stay in sync.
// The listings themselves are fetched on the server and passed in as a prop.
export function Marketplace({ listings }: { listings: Listing[] }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const visibleListings = listings.filter((listing) => {
    // "Free" is a price state, not a real category — filter it by price.
    const matchesCategory =
      category === "All"
        ? true
        : category === "Free"
          ? listing.price === 0
          : listing.category === category;
    const matchesQuery =
      q === "" ||
      listing.title.toLowerCase().includes(q) ||
      listing.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      {/* Search to buy, list to sell — the two primary actions side by side. */}
      <div className="px-6 pt-8 sm:px-12">
        <div className="mx-auto flex max-w-[620px] flex-col gap-3 sm:flex-row">
          <SearchBar value={query} onChange={setQuery} />
          <Link
            href="/new"
            className="flex shrink-0 items-center justify-center rounded-[12px] bg-ink px-6 py-3 text-sm font-semibold whitespace-nowrap text-paper transition-colors hover:bg-ink/90"
          >
            + List an item
          </Link>
        </div>
      </div>
      <CategoryChips selected={category} onSelect={setCategory} />
      <ListingGrid listings={visibleListings} />
    </>
  );
}
