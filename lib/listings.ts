// Hardcoded sample listings for the static prototype (Phase 1).
// When the backend arrives, this array gets replaced by data from Supabase —
// but the `Listing` shape below is what the rest of the UI depends on, so
// keeping it stable now makes that swap painless later.

export type Listing = {
  id: string;
  title: string;
  category: string;
  condition: string;
  /** Whole dollars. 0 means the item is free. */
  price: number;
  /** Whether the seller is a verified campus student. */
  verified: boolean;
};

export const listings: Listing[] = [
  {
    id: "beats-pill",
    title: "Beats Pill Speaker",
    category: "Electronics",
    condition: "Like new",
    price: 60,
    verified: true,
  },
  {
    id: "denim-jacket",
    title: "Denim Jacket, size M",
    category: "Clothing",
    condition: "Good condition",
    price: 18,
    verified: true,
  },
  {
    id: "graphic-tees",
    title: "Graphic Tee Bundle (3)",
    category: "Clothing",
    condition: "Good condition",
    price: 15,
    verified: true,
  },
  {
    id: "desk-lamp",
    title: "Desk Lamp",
    category: "Dorm",
    condition: "Works great",
    price: 8,
    verified: true,
  },
  {
    id: "mini-fridge",
    title: "Mini Fridge",
    category: "Dorm",
    condition: "Works great",
    price: 45,
    verified: true,
  },
  {
    id: "psych-textbook",
    title: "Intro to Psychology Textbook",
    category: "Books",
    condition: "Good condition",
    price: 25,
    verified: true,
  },
  {
    id: "desk-chair",
    title: "IKEA Desk Chair",
    category: "Furniture",
    condition: "Fair condition",
    price: 30,
    verified: true,
  },
  {
    id: "moveout-box",
    title: "Move-out Box: Hangers & Mugs",
    category: "Free",
    condition: "Good condition",
    price: 0,
    verified: true,
  },
];

/** Formats a listing price for display: `$60`, or `Free` when price is 0. */
export function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price}`;
}

/** Finds a single listing by its id, or returns undefined if none matches. */
export function getListingById(id: string): Listing | undefined {
  return listings.find((listing) => listing.id === id);
}
