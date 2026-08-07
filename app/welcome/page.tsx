import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { WelcomeForm } from "@/components/site/welcome-form";
import { createClient } from "@/lib/supabase/server";
import { jnumberOf } from "@/lib/identity";

export const metadata: Metadata = {
  title: "Welcome — Corkboard",
};

// Reads the session and profile, so render per-request.
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Must be signed in to set up a profile.
  if (!user) redirect("/join");

  // Already chose a display name? Nothing to do here.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.display_name) redirect("/");

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-16 sm:px-12">
        <WelcomeForm userId={user.id} jnumber={jnumberOf(user.email)} />
      </main>
      <Footer />
    </>
  );
}
