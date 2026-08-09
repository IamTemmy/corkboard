import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { NewListingForm } from "@/components/site/new-listing-form";
import { createClient } from "@/lib/supabase/server";
import { jnumberOf } from "@/lib/identity";

export const metadata: Metadata = {
  title: "List an item — Corkboard",
};

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only signed-in (verified) students can list.
  if (!user) redirect("/join");

  // Prefill contact + get the name to snapshot onto the listing.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, instagram, groupme")
    .eq("id", user.id)
    .maybeSingle();

  // If they haven't chosen how to appear yet, send them through /welcome first —
  // otherwise the seller name would fall back to their (semi-private) J-number
  // and get snapshotted publicly onto the listing.
  if (!profile?.display_name) redirect("/welcome");

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:px-12">
        <span className="mb-6 block size-3 rounded-[3px] bg-brick" aria-hidden="true" />
        <h1 className="font-display mb-2 text-[30px] font-semibold leading-tight tracking-[-0.01em]">
          List an item
        </h1>
        <p className="mb-8 text-[15px] text-ink/65">
          A few details and a photo. You&apos;ll meet the buyer at the campus spot
          you choose.
        </p>

        <NewListingForm
          userId={user.id}
          sellerName={profile?.display_name ?? jnumberOf(user.email)}
          initialInstagram={profile?.instagram ?? ""}
          initialGroupme={profile?.groupme ?? ""}
        />
      </main>
      <Footer />
    </>
  );
}
