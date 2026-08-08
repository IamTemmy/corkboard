import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { EditListingForm } from "@/components/site/edit-listing-form";
import { createClient } from "@/lib/supabase/server";
import { getListingById } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit listing — Corkboard",
};

export const dynamic = "force-dynamic";

type EditPageProps = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: EditPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const listing = await getListingById(id);
  if (!listing) notFound();

  // Only the owner may edit — anyone else is sent to the public listing.
  if (listing.sellerId !== user.id) redirect(`/listings/${id}`);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:px-12">
        <span className="mb-6 block size-3 rounded-[3px] bg-brick" aria-hidden="true" />
        <h1 className="font-display mb-2 text-[30px] font-semibold leading-tight tracking-[-0.01em]">
          Edit listing
        </h1>
        <p className="mb-8 text-[15px] text-ink/65">
          Update the details buyers see. Changes go live right away.
        </p>

        <EditListingForm listing={listing} />
      </main>
      <Footer />
    </>
  );
}
