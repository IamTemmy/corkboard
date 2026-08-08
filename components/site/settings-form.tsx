"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
}: {
  userId: string;
  jnumber: string;
  initialDisplayName: string;
  initialInstagram: string;
  initialGroupme: string;
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
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const name = displayName.trim();
    // What shows publicly as the seller name (falls back to the J-number).
    const displayValue = name || jnumber;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        // Blank name → null, which falls back to the J-number in the UI.
        display_name: name || null,
        instagram: instagram.trim().replace(/^@/, "") || null,
        groupme: groupme.trim() || null,
      })
      .eq("id", userId);

    if (profileError) {
      setSaving(false);
      setError("Couldn't save — please try again.");
      return;
    }

    // The seller name is snapshotted onto each listing, so sync existing ones to
    // the new name — that's what makes a name change show up everywhere.
    const { error: listingsError } = await supabase
      .from("listings")
      .update({ seller: displayValue })
      .eq("seller_id", userId);

    setSaving(false);
    if (listingsError) {
      setError("Saved your profile, but couldn't update your listings' name — try again.");
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
        Buyers can always reach you by your school email. Instagram and GroupMe
        are optional extras, shown on every listing you post.
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
        {saved && <span className="text-sm text-moss">Saved ✓</span>}
      </div>
    </form>
  );
}
