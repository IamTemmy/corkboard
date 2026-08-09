"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { processImageForUpload } from "@/lib/image";
import { isValidGroupme } from "@/lib/contact";
import { syncSellerListings } from "@/lib/sync-listings";
import { LISTING_ACKNOWLEDGMENT } from "@/lib/guidelines";
import { Button } from "@/components/ui/button";
import { DescriptionHint } from "@/components/site/description-hint";
import {
  LISTING_CATEGORIES,
  CONDITIONS,
  MEETUP_SPOTS,
  CATEGORY_LISTING_TIPS,
  DEFAULT_DESCRIPTION_PLACEHOLDER,
} from "@/lib/listings";

// Generous cap on the RAW pick — we downscale/compress before upload, so the
// stored file ends up small regardless. (Phone photos, esp. HEIC, run large.)
const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_IMAGES = 5;

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none transition placeholder:text-ink/40 focus:border-marigold focus:ring-2 focus:ring-marigold/30";

export function NewListingForm({
  userId,
  initialInstagram,
  initialGroupme,
}: {
  userId: string;
  initialInstagram: string;
  initialGroupme: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [meetupSpot, setMeetupSpot] = useState("");
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState(initialInstagram);
  const [groupme, setGroupme] = useState(initialGroupme);
  const [acknowledged, setAcknowledged] = useState(false);

  // A listing can have several photos; the first is the cover.
  const [images, setImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const [processing, setProcessing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // let the same file be re-picked later
    setError(null);
    if (picked.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }

    // Convert HEIC → JPEG (if needed) and downscale/compress each before upload.
    setProcessing(true);
    try {
      const added: { file: File; previewUrl: string }[] = [];
      for (const p of picked.slice(0, room)) {
        if (p.size > MAX_IMAGE_BYTES) continue; // skip oversized picks
        const f = await processImageForUpload(p);
        added.push({ file: f, previewUrl: URL.createObjectURL(f) });
      }
      if (added.length === 0) {
        setError("Those photos were too large (over 25 MB each).");
        return;
      }
      setImages((prev) => [...prev, ...added]);
      if (picked.length > room) {
        setError(`Only ${room} more could be added (max ${MAX_IMAGES}).`);
      }
    } catch {
      setError("Couldn't read one of those photos — try different ones.");
    } finally {
      setProcessing(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (images.length === 0) {
      setError("Add at least one photo so buyers can see the item.");
      return;
    }
    const priceValue = isFree ? 0 : Number(price);
    if (!isFree && (!Number.isFinite(priceValue) || priceValue < 0)) {
      setError("Enter a valid price (or mark it free).");
      return;
    }
    if (!isValidGroupme(groupme)) {
      setError("Enter a valid GroupMe link (groupme.com/…) or leave it blank.");
      return;
    }
    // A buyer needs a way to reach the seller (the school email is private), so
    // at least one contact channel is required to publish.
    const ig = instagram.trim().replace(/^@/, "");
    const gm = groupme.trim();
    if (!ig && !gm) {
      setError("Add at least one way for buyers to reach you (Instagram or GroupMe).");
      return;
    }
    const contact = {
      ...(ig ? { instagram: ig } : {}),
      ...(gm ? { groupme: gm } : {}),
    };
    // Every seller confirms the item is theirs and allowed before it goes live.
    if (!acknowledged) {
      setError("Please confirm your item follows the community guidelines.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    // 1. Upload each photo into the student's own folder (first = cover). Track
    //    the paths so we can roll them back if a later step fails — Storage and
    //    Postgres aren't one transaction, so we clean up orphans ourselves.
    const uploadedPaths: string[] = [];
    const imageUrls: string[] = [];
    for (const img of images) {
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, img.file, { contentType: "image/jpeg" });
      if (uploadError) {
        await supabase.storage.from("listing-images").remove(uploadedPaths);
        setSaving(false);
        setError(`Couldn't upload a photo: ${uploadError.message}`);
        return;
      }
      uploadedPaths.push(path);
      imageUrls.push(
        supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl,
      );
    }

    // 2. Save the contact to the profile (so it prefills next time) and — since
    //    contact is snapshotted per listing — sync it onto existing listings too,
    //    so changing it here doesn't leave old listings on the old handle.
    if (ig !== initialInstagram || gm !== initialGroupme) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ instagram: ig || null, groupme: gm || null })
        .eq("id", userId);
      if (profileError) {
        await supabase.storage.from("listing-images").remove(uploadedPaths);
        setSaving(false);
        setError("Couldn't save your contact — please try again.");
        return;
      }
      const { error: syncError } = await syncSellerListings(supabase, userId, {
        contact,
      });
      if (syncError) {
        await supabase.storage.from("listing-images").remove(uploadedPaths);
        setSaving(false);
        setError("Couldn't update your other listings — please try again.");
        return;
      }
    }

    // 3. Create the listing. We send ONLY the fields the seller decides — the
    //    database derives the trusted ones (seller_id, seller, campus,
    //    created_at, status, sold_at) via a trigger, so they can't be spoofed.
    const { data: created, error: insertError } = await supabase
      .from("listings")
      .insert({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        price: priceValue,
        images: imageUrls,
        meetup_spot: meetupSpot,
        contact,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      // Roll back the just-uploaded photos so they don't orphan in Storage.
      await supabase.storage.from("listing-images").remove(uploadedPaths);
      setSaving(false);
      setError(`Couldn't post the listing: ${insertError?.message ?? "unknown error"}`);
      return;
    }

    router.push(`/listings/${created.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Photos — several allowed; the first is the cover */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink/80">
          Photos{" "}
          <span className="font-normal text-ink/50">(the first is the cover)</span>
        </span>

        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div
              key={img.previewUrl}
              className="relative aspect-[4/5] w-24 overflow-hidden rounded-lg border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt="" className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-ink/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-paper">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-ink/80 text-paper"
              >
                <svg viewBox="0 0 24 24" className="size-3" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <label className="flex aspect-[4/5] w-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-paper-soft text-center text-xs text-ink/50 transition hover:border-ink/30">
              {processing ? (
                "Processing…"
              ) : (
                <span>
                  + Add
                  <br />
                  photo
                </span>
              )}
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={onPickImages}
                className="hidden"
              />
            </label>
          )}
        </div>

        <span className="text-xs text-ink/50">
          JPG, PNG, or HEIC — up to {MAX_IMAGES}, optimized automatically.
        </span>
      </div>

      {/* Title */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink/80">Title</span>
        <input
          type="text"
          required
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mini fridge (works great)"
          className={fieldClass}
        />
      </label>

      {/* Price + free */}
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

      {/* Category + condition */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/80">Category</span>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldClass}
          >
            <option value="" disabled>
              Choose…
            </option>
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
            <option value="" disabled>
              Choose…
            </option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Meetup spot */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink/80">
          Meet at{" "}
          <span className="font-normal text-ink/50">
            (where you&apos;ll hand it off)
          </span>
        </span>
        <select
          required
          value={meetupSpot}
          onChange={(e) => setMeetupSpot(e.target.value)}
          className={fieldClass}
        >
          <option value="" disabled>
            Choose a campus spot…
          </option>
          {MEETUP_SPOTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {/* Description */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink/80">
          Description{" "}
          <span className="font-normal text-ink/50">(optional)</span>
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

      {/* Contact (saved to profile) */}
      <div className="rounded-xl border border-line bg-paper-soft p-4">
        <p className="text-sm font-medium text-ink/80">
          How buyers reach you{" "}
          <span className="font-normal text-ink/50">(add at least one)</span>
        </p>
        <p className="mt-1 text-xs text-ink/55">
          Buyers use these to reach you. Your school email stays private — it&apos;s
          only for signing in. Saved to your profile and used on all your listings.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink/70">Instagram</span>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="yourhandle"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink/70">GroupMe link</span>
            <input
              type="text"
              value={groupme}
              onChange={(e) => setGroupme(e.target.value)}
              placeholder="https://groupme.com/…"
              className={fieldClass}
            />
          </label>
        </div>
      </div>

      {/* Guidelines reminder + acknowledgment — keeps banned items off the board */}
      <div className="rounded-xl border border-line bg-paper-soft p-4">
        <p className="text-sm text-ink/70">
          Corkboard doesn&apos;t allow weapons, drugs, alcohol, stolen or
          counterfeit goods, and a few other things. Take a moment to skim the{" "}
          <Link
            href="/guidelines"
            target="_blank"
            className="font-medium text-ink underline underline-offset-4 hover:text-brick"
          >
            community guidelines
          </Link>
          .
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5"
          />
          <span>{LISTING_ACKNOWLEDGMENT}</span>
        </label>
      </div>

      {error && <p className="text-sm text-brick">{error}</p>}

      <Button
        type="submit"
        disabled={saving || processing}
        className="h-auto w-full rounded-lg py-3 text-sm font-semibold sm:w-auto sm:self-start sm:px-8"
      >
        {saving ? "Posting…" : "Post listing"}
      </Button>
    </form>
  );
}
