"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Clears the session cookie in the browser, then refreshes so server components
// (the header) re-render in the logged-out state.
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className={
        className ??
        "text-sm font-medium text-ink/70 transition-colors hover:text-ink disabled:opacity-50"
      }
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
