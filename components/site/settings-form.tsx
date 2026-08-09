"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isValidGroupme } from "@/lib/contact";
import { syncSellerListings } from "@/lib/sync-listings";
import { Button } from "@/components/ui/button";

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none transition placeholder:text-ink/40 focus:border-marigold focus:ring-2 focus:ring-marigold/30";

const MAX_NAME = 30;

export function SettingsForm({
  userId,
  jnumber,
  initialDisplayName,
  initialInstagram,
  initialGroupme,
  hasListings,
}: {
  userId: string;
  jnumber: string;
  initialDisplayName: string;
  initialInstagram: string;
  initialGroupme: string;
  hasListings: boolean;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [groupme, setGroupme] = useState(initialGroupme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Any edit clears the "Saved" note so it always reflects the latest change.
  function edited<T>(setter: (v: T) => void) {
    return (v: T) => {
      setSaved(false);
      setter(v);
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidGroupme(groupme)) {
      setError("Enter a valid GroupMe link (groupme.com/…) or leave it blank.");
      return;
    }

    const ig = instagram.trim().replace(/^@/, "");
    const gm = groupme.trim();
    // If you have active listings, you can't remove every contact — buyers
    // would have no way to reach you. (No listings yet? Blank is fine.)
    if (hasListings && !ig && !gm) {
      setError("Keep at least one contact (Instagram or GroupMe) — you have active listings.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const name = displayName.trim();
    // What shows publicly as the seller name (falls back to the J-number).
    const displayValue = name || jnumber;
    const contact = {
      ...(ig ? { instagram: ig } : {}),
      ...(gm ? { groupme: gm } : {}),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        // Blank name → store the J-number itself (same as the Welcome step), so
        // display_name is never null after onboarding. A null would make /new
        // think onboarding is unfinished and bounce the user to /welcome.
        display_name: displayValue,
        instagram: ig || null,
        groupme: gm || null,
      })
      .eq("id", userId);

    if (profileError) {
      setSaving(false);
      setError("Couldn't save — please try again.");
      return;
    }

    // Name AND contact are snapshotted onto each listing — sync existing ones so
    // a change here shows up everywhere.
    const { error: listingsError } = await syncSellerListings(supabase, userId, {
      seller: displayValue,
      contact,
    });

    setSaving(false);
    if (listingsError) {
      setError("Saved your profile, but couldn't update your listings — try again.");
      return;
    }
    setSaved(true);
    router.refresh(); // header greeting + listings pick up the new values
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink/80">Display name</span>
        <input
          type="text"
          maxLength={MAX_NAME}
          value={displayName}
          onChange={(e) => edited(setDisplayName)(e.target.value)}
          placeholder={jnumber}
          className={fieldClass}
        />
        <span className="text-xs text-ink/50">
          How buyers see you. Leave blank to use your J-number ({jnumber}).
        </span>
      </label>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/80">
            Instagram{" "}
            <span className="font-normal text-ink/50">(optional)</span>
          </span>
          <input
            type="text"
            value={instagram}
            onChange={(e) => edited(setInstagram)(e.target.value)}
            placeholder="yourhandle"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/80">
            GroupMe link{" "}
            <span className="font-normal text-ink/50">(optional)</span>
          </span>
          <input
            type="text"
            value={groupme}
            onChange={(e) => edited(setGroupme)(e.target.value)}
            placeholder="https://groupme.com/…"
            className={fieldClass}
          />
        </label>
      </div>

      <p className="text-xs text-ink/55">
        Buyers reach you through these, shown on every listing you post. Your
        school email stays private — it&apos;s only for signing in.
      </p>

      {error && <p className="text-sm text-brick">{error}</p>}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={saving}
          className="h-auto rounded-lg px-6 py-3 text-sm font-semibold"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {saved && <span className="text-sm text-moss-text">Saved ✓</span>}
      </div>
    </form>
  );
}
