"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Shown once, right after a student first verifies. Lets them choose how they
// appear to others — a preferred name (recommended, friendlier/more trustworthy)
// or their J-number (a real JSU identity, if they'd rather not use a name).
// Writes to their own profile row (allowed by RLS: users update own profile).
const MAX_NAME = 30;

export function WelcomeForm({
  userId,
  jnumber,
}: {
  userId: string;
  jnumber: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(displayName: string) {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", userId);

    if (error) {
      setSaving(false);
      setError("Couldn't save that — please try again.");
      return;
    }

    // Onboarded. Refresh so the header (a server component) picks up the name.
    router.push("/");
    router.refresh();
  }

  const trimmed = name.trim();

  return (
    <div className="mx-auto w-full max-w-md">
      <span className="mb-6 block size-3 rounded-[3px] bg-brick" aria-hidden="true" />

      <h1 className="font-display mb-2 text-[30px] font-semibold leading-tight tracking-[-0.01em]">
        Welcome to Corkboard
      </h1>
      <p className="mb-7 text-[15px] text-ink/65">
        How would you like buyers and sellers to see you?
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed) save(trimmed);
        }}
        className="flex flex-col gap-4"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/80">
            Preferred name{" "}
            <span className="font-normal text-ink/50">(recommended)</span>
          </span>
          <input
            type="text"
            autoFocus
            maxLength={MAX_NAME}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Temmy"
            className="w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none transition placeholder:text-ink/40 focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          />
          <span className="text-xs text-ink/50">
            A first name helps buyers recognize and trust you. Your email and
            J-number stay private.
          </span>
        </label>

        {error && <p className="text-sm text-brick">{error}</p>}

        <Button
          type="submit"
          disabled={saving || !trimmed}
          className="h-auto w-full rounded-lg py-3 text-sm font-semibold"
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      </form>

      {/* Secondary choice — styled as an outline button so it clearly reads as
          an action, not body text. */}
      <div className="mt-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs uppercase tracking-[0.06em] text-ink/45">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => save(jnumber)}
        className="mt-3 h-auto w-full rounded-lg border border-line bg-paper-soft py-3 text-sm font-medium text-ink/80 transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-50"
      >
        Use my J-number ({jnumber}) instead
      </button>
    </div>
  );
}
