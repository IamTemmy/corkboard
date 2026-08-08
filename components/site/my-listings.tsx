"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tooltip } from "./tooltip";
import { formatPrice } from "@/lib/listings";
import type { Listing, ListingStatus } from "@/lib/listings";

// Extract the in-bucket path (e.g. "<uid>/<file>.jpg") from a public Storage
// URL, so the object can be deleted with the listing. Non-Storage images (the
// legacy demo rows point at /public files) have no marker and are skipped.
function imageStoragePath(publicUrl: string): string | null {
  const marker = "/listing-images/";
  const i = publicUrl.indexOf(marker);
  return i === -1 ? null : publicUrl.slice(i + marker.length);
}

const statusStyles: Record<ListingStatus, string> = {
  available: "bg-moss/12 text-moss",
  reserved: "bg-marigold/20 text-ink",
  sold: "bg-ink text-paper",
};

const statusLabel: Record<ListingStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

// Each action reads as its own thing — distinct by icon AND a palette colour
// (neutral edit, marigold reserve, dark-ink sold, brick delete). No off-palette
// blue; everything stays within Corkboard's tokens.
const baseBtn =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50";
const neutralBtn = `${baseBtn} border border-line text-ink/80 hover:border-ink/25 hover:bg-ink/5 hover:text-ink`;
const reservedBtn = `${baseBtn} border border-marigold/45 text-ink/80 hover:border-marigold/70 hover:bg-marigold/10`;
const soldBtn = `${baseBtn} bg-ink font-semibold text-paper hover:bg-ink/85`;
const dangerBtn = `${baseBtn} text-brick hover:bg-brick/10`;

const iconClass = "size-3.5 shrink-0";
const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const EditIcon = () => (
  <svg {...svgProps} className={iconClass}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const ReserveIcon = () => (
  <svg {...svgProps} className={`${iconClass} text-marigold`}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const RelistIcon = () => (
  <svg {...svgProps} className={iconClass}>
    <path d="M3 3v5h5" />
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
  </svg>
);
const SoldIcon = () => (
  <svg {...svgProps} className={iconClass}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const DeleteIcon = () => (
  <svg {...svgProps} className={iconClass}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);

export function MyListings({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(id: string, status: ListingStatus) {
    setBusyId(id);
    const supabase = createClient();
    // Stamp the sale time when it sells; clear it if it comes back to life.
    const patch =
      status === "sold"
        ? { status, sold_at: new Date().toISOString() }
        : { status, sold_at: null };
    await supabase.from("listings").update(patch).eq("id", id);
    router.refresh();
    setBusyId(null);
  }

  async function remove(listing: Listing) {
    const ok = window.confirm(
      "Delete this listing? This can't be undone. If it sold, use “Mark sold” instead so it stays in your history.",
    );
    if (!ok) return;
    setBusyId(listing.id);
    const supabase = createClient();

    // Delete the photos from Storage first so they don't orphan (best-effort;
    // the paths live in the user's own folder, which their RLS policy allows).
    const paths = listing.images
      .map(imageStoragePath)
      .filter((p): p is string => p !== null);
    if (paths.length > 0) {
      await supabase.storage.from("listing-images").remove(paths);
    }

    await supabase.from("listings").delete().eq("id", listing.id);
    router.refresh();
    setBusyId(null);
  }

  if (listings.length === 0) {
    return (
      <p className="text-[15px] text-ink/65">
        You haven&apos;t listed anything yet.{" "}
        <Link href="/new" className="font-medium text-ink underline underline-offset-4">
          List an item
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {listings.map((l) => {
        const busy = busyId === l.id;
        return (
          <li
            key={l.id}
            className="flex gap-4 rounded-xl border border-line bg-paper-soft p-4"
          >
            <Link
              href={`/listings/${l.id}`}
              className="block aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-lg border border-line"
            >
              {l.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.images[0]}
                  alt=""
                  className={`size-full object-cover ${l.status === "sold" ? "opacity-60" : ""}`}
                />
              )}
            </Link>

            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/listings/${l.id}`}
                    className="font-medium hover:underline"
                  >
                    {l.title}
                  </Link>
                  <p className="font-mono text-sm text-ink/80">
                    {formatPrice(l.price)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.05em] ${statusStyles[l.status]}`}
                >
                  {statusLabel[l.status]}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Tooltip label="Edit this listing's details">
                  <Link href={`/listings/${l.id}/edit`} className={neutralBtn}>
                    <EditIcon />
                    Edit
                  </Link>
                </Tooltip>
                {l.status !== "available" && (
                  <Tooltip label="Put it back on the board as available">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(l.id, "available")}
                      className={neutralBtn}
                    >
                      <RelistIcon />
                      {l.status === "sold" ? "Relist" : "Mark available"}
                    </button>
                  </Tooltip>
                )}
                {l.status === "available" && (
                  <Tooltip label="Reserve this item while a sale is pending">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(l.id, "reserved")}
                      className={reservedBtn}
                    >
                      <ReserveIcon />
                      Mark reserved
                    </button>
                  </Tooltip>
                )}
                {l.status !== "sold" && (
                  <Tooltip label="Mark as sold (item will leave the board)">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(l.id, "sold")}
                      className={soldBtn}
                    >
                      <SoldIcon />
                      Mark sold
                    </button>
                  </Tooltip>
                )}
                <Tooltip label="Delete this listing permanently">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(l)}
                    className={dangerBtn}
                  >
                    <DeleteIcon />
                    Delete
                  </button>
                </Tooltip>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
