import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { SettingsForm } from "@/components/site/settings-form";
import { createClient } from "@/lib/supabase/server";
import { jnumberOf } from "@/lib/identity";

export const metadata: Metadata = {
  title: "Settings — Corkboard",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/join");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, instagram, groupme, campus, created_at")
    .eq("id", user.id)
    .maybeSingle();

  // Whether the user has any listings — if so, they can't clear all contact.
  const { count: listingCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", user.id);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12 sm:px-12">
        <span className="mb-6 block size-3 rounded-[3px] bg-brick" aria-hidden="true" />
        <h1 className="font-display mb-2 text-[30px] font-semibold leading-tight tracking-[-0.01em]">
          Settings
        </h1>
        <p className="mb-8 text-[15px] text-ink/65">
          Change how you appear to other students and how they can reach you.
        </p>

        <SettingsForm
          userId={user.id}
          jnumber={jnumberOf(user.email)}
          initialDisplayName={profile?.display_name ?? ""}
          initialInstagram={profile?.instagram ?? ""}
          initialGroupme={profile?.groupme ?? ""}
          hasListings={(listingCount ?? 0) > 0}
        />

        {/* Account — read-only facts about the verified account. */}
        <section className="mt-10 rounded-xl border border-line bg-paper-soft p-5">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink/55">
            Account
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">School email</dt>
              <dd className="font-medium text-ink">{profile?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">Campus</dt>
              <dd className="font-medium text-ink">{profile?.campus}</dd>
            </div>
            {memberSince && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/55">Member since</dt>
                <dd className="font-medium text-ink">{memberSince}</dd>
              </div>
            )}
          </dl>
        </section>
      </main>
      <Footer />
    </>
  );
}
