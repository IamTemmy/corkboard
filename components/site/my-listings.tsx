"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/listings";
import type { Listing, ListingStatus } from "@/lib/listings";

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

// Matched set: same height/shape, distinct-but-consistent hover fills (soft grey
// for neutral, a visible lightening for the dark "sold", soft red for delete).
const neutralBtn =
  "rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-ink/80 transition-colors hover:border-ink/20 hover:bg-ink/5 hover:text-ink disabled:opacity-50";
const soldBtn =
  "rounded-lg bg-ink px-3.5 py-2 text-xs font-semibold text-paper transition-colors hover:bg-ink/85 disabled:opacity-50";
const dangerBtn =
  "rounded-lg px-3.5 py-2 text-xs font-medium text-brick transition-colors hover:bg-brick/10 disabled:opacity-50";

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

  async function remove(id: string) {
    const ok = window.confirm(
      "Delete this listing? This can't be undone. If it sold, use “Mark sold” instead so it stays in your history.",
    );
    if (!ok) return;
    setBusyId(id);
    const supabase = createClient();
    await supabase.from("listings").delete().eq("id", id);
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
                {l.status !== "available" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(l.id, "available")}
                    title="Put it back on the board as available"
                    className={neutralBtn}
                  >
                    {l.status === "sold" ? "Relist" : "Mark available"}
                  </button>
                )}
                {l.status === "available" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(l.id, "reserved")}
                    title="Hold it for a buyer — stays visible, but contact is hidden"
                    className={neutralBtn}
                  >
                    Mark reserved
                  </button>
                )}
                {l.status !== "sold" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(l.id, "sold")}
                    title="It sold — leaves the board, kept here in your history"
                    className={soldBtn}
                  >
                    Mark sold
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(l.id)}
                  title="Remove permanently — use “Mark sold” if it actually sold"
                  className={dangerBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
