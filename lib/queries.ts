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
  seller_id: string | null;
  sold_at: string | null;
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
    sellerId: row.seller_id ?? null,
    campus: row.campus,
    meetupSpot: row.meetup_spot as MeetupSpot,
    contact: row.contact ?? {},
    status: row.status,
    postedAt: row.created_at,
    soldAt: row.sold_at ?? null,
  };
}

/** Listings for the public board — available + reserved, newest first (sold
 *  items leave the grid; they live on in the seller's "My Listings"). */
export async function getListings(): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .neq("status", "sold")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load listings:", error.message);
    return [];
  }
  return (data as ListingRow[]).map(mapRow);
}

/** Every listing owned by a given account (all statuses), newest first. */
export async function getListingsBySeller(sellerId: string): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load seller listings:", error.message);
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
