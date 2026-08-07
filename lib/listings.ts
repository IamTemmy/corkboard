// Hardcoded sample listings for the static prototype (Phase 1), using real
// photos of real items. The `Listing` shape is deliberately the *real* shape we
// expect the Supabase-backed version to use, so the UI and the future database
// agree from the start. Human-readable fields now (seller name, campus); the
// opaque database keys (sellerId, campusId) arrive with the backend.

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
  /** Image paths (in /public for now; storage URLs later). First is the thumbnail. */
  images: string[];
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
    id: "nike-air-force-1",
    title: "Nike Air Force 1 (White/Black)",
    description:
      "Classic white Air Force 1s with the black swoosh. Light wear, plenty of life left. Men's US 10.",
    category: "Clothing",
    condition: "Good condition",
    price: 45,
    images: ["/listings/nike-af1-1.jpg", "/listings/nike-af1-2.jpg"],
    seller: "Devon",
    campus: "JSU",
    meetupSpot: "Student Center",
    contact: { instagram: "@devon.d", email: "devon@students.jsu.edu" },
    status: "available",
    postedAt: "2026-08-06",
  },
  {
    id: "puma-mayze",
    title: "Puma Mayze Platform Sneakers",
    description:
      "White Puma platform sneakers with floral embroidery. Worn twice, super clean. Women's US 8.",
    category: "Clothing",
    condition: "Like new",
    price: 35,
    images: ["/listings/puma-floral.jpg"],
    seller: "Maya",
    campus: "JSU",
    meetupSpot: "Student Plaza",
    contact: { instagram: "@maya.thrifts" },
    status: "reserved",
    postedAt: "2026-08-04",
  },
  {
    id: "suede-sandals",
    title: "Suede Double-Strap Sandals",
    description:
      "Tan suede double-buckle slides, barely worn. Comes in the original box. Size 9.",
    category: "Clothing",
    condition: "Like new",
    price: 22,
    images: ["/listings/suede-sandals.jpg"],
    seller: "Temi",
    campus: "JSU",
    meetupSpot: "Student Center",
    contact: { instagram: "@temi.sells" },
    status: "available",
    postedAt: "2026-08-05",
  },
  {
    id: "epiphone-sg",
    title: "Epiphone SG Electric Guitar",
    description:
      "Cherry-red Epiphone SG Tribute. Plays great, includes the stand and strap. A couple of small scuffs on the body.",
    category: "Electronics",
    condition: "Good condition",
    price: 140,
    images: ["/listings/epiphone-sg.jpg"],
    seller: "Sam",
    campus: "JSU",
    meetupSpot: "Walter Payton Center",
    contact: { groupme: "https://groupme.com/join_group/example" },
    status: "available",
    postedAt: "2026-08-02",
  },
  {
    id: "snoopy-mug",
    title: "Snoopy Lidded Mug",
    description:
      "Collectible ceramic Snoopy mug with a matching lid. Cute on a desk or shelf, no chips.",
    category: "Dorm",
    condition: "Good condition",
    price: 12,
    images: ["/listings/snoopy-mug.jpg"],
    seller: "Nia",
    campus: "JSU",
    meetupSpot: "Library",
    contact: { instagram: "@nia.jsu" },
    status: "available",
    postedAt: "2026-08-03",
  },
  {
    id: "duck-umbrella",
    title: "Duck-Handle Compact Umbrella",
    description:
      "Compact umbrella with a wooden duck-head handle and duck print. Auto open/close, barely used.",
    category: "Dorm",
    condition: "Like new",
    price: 15,
    images: ["/listings/duck-umbrella.jpg"],
    seller: "Aisha",
    campus: "JSU",
    meetupSpot: "Library",
    contact: { email: "aisha@students.jsu.edu" },
    status: "available",
    postedAt: "2026-08-01",
  },
  {
    id: "soccer-art",
    title: "Framed Soccer Art Print",
    description:
      "Framed abstract print of a soccer legend. Brand new, still has the corner protectors. Great dorm wall piece.",
    category: "Dorm",
    condition: "Like new",
    price: 25,
    images: ["/listings/soccer-art.jpg"],
    seller: "Jordan",
    campus: "JSU",
    meetupSpot: "Student Plaza",
    contact: { groupme: "https://groupme.com/join_group/example" },
    status: "sold",
    postedAt: "2026-07-29",
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
