import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { MyListings } from "@/components/site/my-listings";
import { createClient } from "@/lib/supabase/server";
import { getListingsBySeller } from "@/lib/queries";

export const metadata: Metadata = {
  title: "My listings — Corkboard",
};

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/join");

  const listings = await getListingsBySeller(user.id);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:px-12">
        <span className="mb-6 block size-3 rounded-[3px] bg-brick" aria-hidden="true" />
        <h1 className="font-display mb-2 text-[30px] font-semibold leading-tight tracking-[-0.01em]">
          My listings
        </h1>
        <p className="mb-8 text-[15px] text-ink/65">
          Mark items reserved or sold, or take them down. Sold items leave the
          board but stay here as your history.
        </p>

        <MyListings listings={listings} />
      </main>
      <Footer />
    </>
  );
}
