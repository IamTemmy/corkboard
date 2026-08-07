import { createClient } from "./supabase/server";
import type { Listing, ListingStatus, MeetupSpot, SellerContact } from "./listings";

// The raw shape of a row as it comes back from the database (snake_case columns).
type ListingRow = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  category: string;
  condition: string | null;
  price: number;
  images: string[] | null;
  seller: string;
  campus: string;
  meetup_spot: string;
  contact: SellerContact | null;
  status: ListingStatus;
};

// Translate a database row into the app's Listing shape (camelCase).
function mapRow(row: ListingRow): Listing {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    condition: row.condition ?? "",
    price: row.price,
    images: row.images ?? [],
    seller: row.seller,
    campus: row.campus,
    meetupSpot: row.meetup_spot as MeetupSpot,
    contact: row.contact ?? {},
    status: row.status,
    postedAt: row.created_at,
  };
}

/** All listings, newest first. */
export async function getListings(): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load listings:", error.message);
    return [];
  }
  return (data as ListingRow[]).map(mapRow);
}

/** A single listing by id, or undefined if it doesn't exist. */
export async function getListingById(id: string): Promise<Listing | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapRow(data as ListingRow);
}
