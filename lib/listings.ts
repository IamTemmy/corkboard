// Hardcoded sample listings for the static prototype (Phase 1).
// The `Listing` shape below is deliberately the *real* shape we expect the
// Supabase-backed version to use, so the UI and the future database agree from
// the start. Human-readable fields now (seller name, campus); the opaque
// database keys (sellerId, campusId) arrive with the backend.

// The campus meetup spots a seller can choose from. Single source of truth —
// the future "list an item" form's dropdown will read from this same list.
export const MEETUP_SPOTS = [
  "Student Center",
  "Library",
  "Walter Payton Center",
  "Student Plaza",
] as const;

export type MeetupSpot = (typeof MEETUP_SPOTS)[number];

export type ListingStatus = "available" | "reserved" | "sold";

// A seller's chosen coordination channel(s). No one is forced to share social
// media or a phone number — a verified student always has their campus email.
export type SellerContact = {
  instagram?: string;
  groupme?: string;
  email?: string;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  /** Whole dollars. 0 means the item is free. */
  price: number;
  /** Local path in /public for now; a storage URL once uploads exist. null → placeholder. */
  imageUrl: string | null;
  /** Seller's first name / nickname (an opaque sellerId comes with the DB). */
  seller: string;
  /** Campus label ("JSU" for now; a campusId comes with the DB). */
  campus: string;
  /** Where the exchange happens — one of the curated on-campus spots. */
  meetupSpot: MeetupSpot;
  /** How a verified buyer reaches the seller to agree on a time. */
  contact: SellerContact;
  status: ListingStatus;
  /** ISO date the item was posted. */
  postedAt: string;
};

export const listings: Listing[] = [
  {
    id: "beats-pill",
    title: "Beats Pill Speaker",
    description:
      "Barely used Beats Pill — great sound and battery life. Comes with the charging cable.",
    category: "Electronics",
    condition: "Like new",
    price: 60,
    imageUrl: null,
    seller: "Temi",
    campus: "JSU",
    meetupSpot: "Student Center",
    contact: { instagram: "@temi.sells" },
    status: "available",
    postedAt: "2026-08-05",
  },
  {
    id: "denim-jacket",
    title: "Denim Jacket, size M",
    description:
      "Classic medium-wash denim jacket, size M. Worn a handful of times, no rips or stains.",
    category: "Clothing",
    condition: "Good condition",
    price: 18,
    imageUrl: null,
    seller: "Maya",
    campus: "JSU",
    meetupSpot: "Student Plaza",
    contact: { instagram: "@maya.thrifts" },
    status: "available",
    postedAt: "2026-08-04",
  },
  {
    id: "graphic-tees",
    title: "Graphic Tee Bundle (3)",
    description:
      "Three graphic tees, size L, selling together as a bundle. Soft and barely worn.",
    category: "Clothing",
    condition: "Good condition",
    price: 15,
    imageUrl: null,
    seller: "Jordan",
    campus: "JSU",
    meetupSpot: "Library",
    contact: { groupme: "https://groupme.com/join_group/example" },
    status: "available",
    postedAt: "2026-08-06",
  },
  {
    id: "desk-lamp",
    title: "Desk Lamp",
    description:
      "Adjustable LED desk lamp with a few brightness levels — perfect for late-night studying.",
    category: "Dorm",
    condition: "Works great",
    price: 8,
    imageUrl: null,
    seller: "Priya",
    campus: "JSU",
    meetupSpot: "Walter Payton Center",
    contact: { email: "priya@students.jsu.edu" },
    status: "available",
    postedAt: "2026-08-01",
  },
  {
    id: "mini-fridge",
    title: "Mini Fridge",
    description:
      "Compact mini fridge, cools well and runs quiet. Moving out, so it needs a new home.",
    category: "Dorm",
    condition: "Works great",
    price: 45,
    imageUrl: null,
    seller: "Devon",
    campus: "JSU",
    meetupSpot: "Student Center",
    contact: { instagram: "@devon.d", email: "devon@students.jsu.edu" },
    status: "reserved",
    postedAt: "2026-07-30",
  },
  {
    id: "psych-textbook",
    title: "Intro to Psychology Textbook",
    description:
      "Intro to Psychology, 4th edition. Minimal highlighting, cover in good shape.",
    category: "Books",
    condition: "Good condition",
    price: 25,
    imageUrl: null,
    seller: "Aisha",
    campus: "JSU",
    meetupSpot: "Library",
    contact: { email: "aisha@students.jsu.edu" },
    status: "available",
    postedAt: "2026-08-03",
  },
  {
    id: "desk-chair",
    title: "IKEA Desk Chair",
    description:
      "Sturdy IKEA desk chair. Some wear on the seat but it rolls and adjusts fine.",
    category: "Furniture",
    condition: "Fair condition",
    price: 30,
    imageUrl: null,
    seller: "Sam",
    campus: "JSU",
    meetupSpot: "Student Plaza",
    contact: { groupme: "https://groupme.com/join_group/example" },
    status: "sold",
    postedAt: "2026-07-28",
  },
  {
    id: "moveout-box",
    title: "Move-out Box: Hangers & Mugs",
    description:
      "Free box of wire hangers and a few mugs. First come, first served — just take it off my hands.",
    category: "Free",
    condition: "Good condition",
    price: 0,
    imageUrl: null,
    seller: "Nia",
    campus: "JSU",
    meetupSpot: "Walter Payton Center",
    contact: { instagram: "@nia.jsu" },
    status: "available",
    postedAt: "2026-08-05",
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

/** A friendly relative label like "Today", "Yesterday", or "3 days ago". */
export function formatPostedAt(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

/** Human summary of a seller's contact channels, e.g. "Instagram or campus email". */
export function describeContact(contact: SellerContact): string {
  const channels: string[] = [];
  if (contact.instagram) channels.push("Instagram");
  if (contact.groupme) channels.push("GroupMe");
  if (contact.email) channels.push("campus email");
  if (channels.length === 0) return "campus email";
  if (channels.length === 1) return channels[0];
  return `${channels.slice(0, -1).join(", ")} or ${channels[channels.length - 1]}`;
}
