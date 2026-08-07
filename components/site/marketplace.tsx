"use client";

import { useState } from "react";
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
    const matchesCategory = category === "All" || listing.category === category;
    const matchesQuery =
      q === "" ||
      listing.title.toLowerCase().includes(q) ||
      listing.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      <SearchBar value={query} onChange={setQuery} />
      <CategoryChips selected={category} onSelect={setCategory} />
      <ListingGrid listings={visibleListings} />
    </>
  );
}
