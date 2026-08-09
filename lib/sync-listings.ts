import type { SupabaseClient } from "@supabase/supabase-js";
import type { SellerContact } from "./listings";

// Seller name and contact are SNAPSHOTTED onto each listing (so the public page
// never has to read another user's profile). That means whenever a seller
// changes those, every existing listing they own must be updated too — or the
// board drifts (e.g. an old listing keeps pointing at a changed Instagram).
//
// Both the Settings form and the New Listing form change these, so the update
// lives here, in one place, to guarantee they behave identically.
export async function syncSellerListings(
  supabase: SupabaseClient,
  sellerId: string,
  fields: { contact: SellerContact; seller?: string },
) {
  const patch: { contact: SellerContact; seller?: string } = {
    contact: fields.contact,
  };
  // Only the Settings form changes the display name; New Listing leaves it out.
  if (fields.seller !== undefined) patch.seller = fields.seller;

  return supabase.from("listings").update(patch).eq("seller_id", sellerId);
}
