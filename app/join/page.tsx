import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { JoinForm } from "@/components/site/join-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Join — Corkboard",
  description: "Sign in with your school email to buy and sell on Corkboard.",
};

// Reads the session, so it must render per-request.
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  // Already signed in? No reason to be here — send them home.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-6 py-16 sm:px-12">
        <JoinForm />
      </main>
      <Footer />
    </>
  );
}
