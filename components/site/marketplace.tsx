"use client";

import { useState } from "react";
import { listings } from "@/lib/listings";
import { CategoryChips } from "./category-chips";
import { ListingGrid } from "./listing-grid";

// Owns the "which category is selected?" state and derives the filtered list
// from it. This is the only interactive (client) part of the homepage.
export function Marketplace() {
  const [selected, setSelected] = useState("All");

  // "All" shows everything; otherwise keep only listings in the chosen category.
  const visibleListings =
    selected === "All"
      ? listings
      : listings.filter((listing) => listing.category === selected);

  return (
    <>
      <CategoryChips selected={selected} onSelect={setSelected} />
      <ListingGrid listings={visibleListings} />
    </>
  );
}
