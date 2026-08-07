// Shared types and display helpers for listings. The listing DATA now lives in
// the Supabase database (see lib/queries.ts); this file keeps the shape the UI
// depends on and the pure formatting helpers used across components.

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
  /** Campus label ("JSU" for now). */
  campus: string;
  /** Where the exchange happens — one of the curated on-campus spots. */
  meetupSpot: MeetupSpot;
  /** How a verified buyer reaches the seller to agree on a time. */
  contact: SellerContact;
  status: ListingStatus;
  /** ISO date the item was posted. */
  postedAt: string;
};

/** Formats a listing price for display: `$60`, or `Free` when price is 0. */
export function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price}`;
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
