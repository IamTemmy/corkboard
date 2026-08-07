"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LISTING_CATEGORIES,
  CONDITIONS,
  MEETUP_SPOTS,
} from "@/lib/listings";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none transition placeholder:text-ink/40 focus:border-marigold focus:ring-2 focus:ring-marigold/30";

export function NewListingForm({
  userId,
  sellerName,
  initialInstagram,
  initialGroupme,
}: {
  userId: string;
  sellerName: string;
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

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setError(null);
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (picked.size > MAX_IMAGE_BYTES) {
      setError("That image is over 5 MB — please pick a smaller one.");
      return;
    }
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Add a photo so buyers can see the item.");
      return;
    }
    const priceValue = isFree ? 0 : Number(price);
    if (!isFree && (!Number.isFinite(priceValue) || priceValue < 0)) {
      setError("Enter a valid price (or mark it free).");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    // 1. Upload the photo into the student's own folder.
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setSaving(false);
      setError("Couldn't upload the photo — please try again.");
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("listing-images").getPublicUrl(path);

    // 2. Save any contact changes back to the profile (shown on all listings).
    const ig = instagram.trim().replace(/^@/, "");
    const gm = groupme.trim();
    if (ig !== initialInstagram || gm !== initialGroupme) {
      await supabase
        .from("profiles")
        .update({ instagram: ig || null, groupme: gm || null })
        .eq("id", userId);
    }

    // 3. Create the listing, owned by this student.
    const { data: created, error: insertError } = await supabase
      .from("listings")
      .insert({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        price: priceValue,
        images: [publicUrl],
        seller: sellerName,
        seller_id: userId,
        campus: "JSU",
        meetup_spot: meetupSpot,
        status: "available",
        contact: {},
      })
      .select("id")
      .single();

    if (insertError || !created) {
      setSaving(false);
      setError("Couldn't post the listing — please try again.");
      return;
    }

    router.push(`/listings/${created.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Photo */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink/80">Photo</span>
        <label className="flex aspect-[4/5] max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-paper-soft text-center transition hover:border-ink/30">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="px-4 text-sm text-ink/50">
              Tap to add a photo
              <br />
              <span className="text-xs">JPG or PNG, up to 5 MB</span>
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="hidden"
          />
        </label>
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
        <textarea
          rows={4}
          maxLength={600}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Size, condition details, why you're selling…"
          className={`${fieldClass} resize-y`}
        />
      </label>

      {/* Contact (saved to profile) */}
      <div className="rounded-xl border border-line bg-paper-soft p-4">
        <p className="text-sm font-medium text-ink/80">How buyers reach you</p>
        <p className="mt-1 text-xs text-ink/55">
          Buyers can always reach you by your school email. Add a handle below if
          you&apos;d rather chat there — saved to your profile and used on all your
          listings.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink/70">
              Instagram (optional)
            </span>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="yourhandle"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink/70">
              GroupMe link (optional)
            </span>
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

      {error && <p className="text-sm text-brick">{error}</p>}

      <Button
        type="submit"
        disabled={saving}
        className="h-auto w-full rounded-lg py-3 text-sm font-semibold sm:w-auto sm:self-start sm:px-8"
      >
        {saving ? "Posting…" : "Post listing"}
      </Button>
    </form>
  );
}
