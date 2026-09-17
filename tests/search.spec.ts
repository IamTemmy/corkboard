import { test, expect } from "@playwright/test";
import { searchListings } from "../lib/search";
import type { Listing } from "../lib/listings";

// Unit tests for the pure client-side search. No DB and no browser, so they
// stay green no matter what's on the live board (curation-proof) and protect
// the synonym / brand-indicator behavior directly — which the E2E content
// tests can no longer assume, now that demo data is being swapped for real.

function listing(over: Partial<Listing>): Listing {
  return {
    id: "id",
    title: "",
    description: "",
    category: "Clothing",
    condition: "Good condition",
    price: 0,
    images: [],
    seller: "seller",
    sellerId: null,
    campus: "JSU",
    meetupSpot: "Library",
    contact: {},
    status: "available",
    postedAt: "2026-01-01T00:00:00Z",
    soldAt: null,
    ...over,
  };
}

test.describe("searchListings()", () => {
  test("'shoe' finds a sneaker via synonyms, not unrelated items", () => {
    const items = [listing({ title: "Nike Air Force 1" }), listing({ title: "Snoopy Mug" })];
    const titles = searchListings(items, "shoe").map((l) => l.title);
    expect(titles).toContain("Nike Air Force 1");
    expect(titles).not.toContain("Snoopy Mug");
  });

  test("'shoe' finds a brand-only title (New Balance)", () => {
    const items = [listing({ title: "New Balance 9060" })];
    expect(searchListings(items, "shoe")).toHaveLength(1);
  });

  test("'sneaker' matches the shoe family (sandals)", () => {
    const items = [listing({ title: "Suede Sandals" })];
    expect(searchListings(items, "sneaker")).toHaveLength(1);
  });

  test("plural 'shoes' behaves like 'shoe'", () => {
    const items = [listing({ title: "Puma Mayze" })];
    expect(searchListings(items, "shoes")).toHaveLength(1);
  });

  test("matches across non-title fields (description)", () => {
    const items = [listing({ title: "Mystery box", description: "a pair of trainers" })];
    expect(searchListings(items, "shoe")).toHaveLength(1);
  });

  test("gibberish returns nothing", () => {
    const items = [listing({ title: "Beats Pill" })];
    expect(searchListings(items, "zzqqxxnope")).toHaveLength(0);
  });

  test("empty query returns everything", () => {
    const items = [listing({ title: "A" }), listing({ title: "B" })];
    expect(searchListings(items, "   ")).toHaveLength(2);
  });
});
