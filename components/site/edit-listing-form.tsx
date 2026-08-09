"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { DescriptionHint } from "@/components/site/description-hint";
import {
  LISTING_CATEGORIES,
  CONDITIONS,
  MEETUP_SPOTS,
  CATEGORY_LISTING_TIPS,
  DEFAULT_DESCRIPTION_PLACEHOLDER,
} from "@/lib/listings";
import type { Listing } from "@/lib/listings";

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none transition placeholder:text-ink/40 focus:border-marigold focus:ring-2 focus:ring-marigold/30";

// Edit the details of a listing you own. Photos and contact are handled
// elsewhere (contact lives on your profile); this covers the fields sellers most
// often need to fix — price, title, description, category, condition, spot.
export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [title, setTitle] = useState(listing.title);
  const [isFree, setIsFree] = useState(listing.price === 0);
  const [price, setPrice] = useState(
    listing.price === 0 ? "" : String(listing.price),
  );
  const [category, setCategory] = useState(listing.category);
  const [condition, setCondition] = useState(listing.condition);
  const [meetupSpot, setMeetupSpot] = useState<string>(listing.meetupSpot);
  const [description, setDescription] = useState(listing.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceValue = isFree ? 0 : Number(price);
    if (!isFree && (!Number.isFinite(priceValue) || priceValue < 0)) {
      setError("Enter a valid price (or mark it free).");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("listings")
      .update({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        price: priceValue,
        meetup_spot: meetupSpot,
      })
      .eq("id", listing.id);

    setSaving(false);
    if (error) {
      setError("Couldn't save changes — please try again.");
      return;
    }
    router.push(`/listings/${listing.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink/80">Title</span>
        <input
          type="text"
          required
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClass}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink/80">Price</span>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/50">
              $
            </span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              disabled={isFree}
              required={!isFree}
              value={isFree ? "" : price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className={`${fieldClass} pl-8 disabled:opacity-50`}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/75">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
            />
            Free
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/80">Category</span>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldClass}
          >
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/80">Condition</span>
          <select
            required
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className={fieldClass}
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink/80">Meet at</span>
        <select
          required
          value={meetupSpot}
          onChange={(e) => setMeetupSpot(e.target.value)}
          className={fieldClass}
        >
          {MEETUP_SPOTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink/80">
          Description <span className="font-normal text-ink/50">(optional)</span>
        </span>
        <DescriptionHint category={category} />
        <textarea
          rows={4}
          maxLength={600}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            CATEGORY_LISTING_TIPS[category]?.placeholder ??
            DEFAULT_DESCRIPTION_PLACEHOLDER
          }
          className={`${fieldClass} resize-y`}
        />
      </label>

      <p className="text-xs text-ink/55">
        To change photos or contact, use the listing&apos;s photos on a new post,
        or update contact in Settings. (Editing photos is coming soon.)
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
        <Link
          href={`/listings/${listing.id}`}
          className="text-sm text-ink/60 underline-offset-4 hover:text-ink hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
