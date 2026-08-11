"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tooltip } from "./tooltip";
import { ConfirmDialog } from "./confirm-dialog";
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
  available: "bg-moss/12 text-moss-text",
  reserved: "bg-marigold/20 text-ink",
  sold: "bg-ink text-paper",
};

const statusLabel: Record<ListingStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

// Four outline buttons, each its own icon + colour. Reserve/Sold fill in
// (their "active" state) when the item IS in that status; clicking an active one
// reverts to available — so revert lives in the same four buttons, no fifth.
const baseBtn =
  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50";
const editBtn = `${baseBtn} border-[#3b6fa0]/45 text-[#3b6fa0] hover:border-[#3b6fa0]/70 hover:bg-[#3b6fa0]/8`;
const deleteBtn = `${baseBtn} border-brick/40 text-brick hover:border-brick/60 hover:bg-brick/8`;
const reservedIdle = `${baseBtn} border-[#c8912e]/55 text-[#a9781a] hover:bg-marigold/12`;
const reservedActive = `${baseBtn} border-transparent bg-marigold font-semibold text-ink hover:bg-marigold/90`;
const soldIdle = `${baseBtn} border-ink/30 text-ink/70 hover:border-moss/60 hover:bg-moss/8 hover:text-moss-text`;
const soldActive = `${baseBtn} border-transparent bg-moss font-semibold text-paper hover:bg-moss/90`;

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

// Icons inherit the button's text colour (currentColor), so they match each state.
const EditIcon = () => (
  <svg {...svgProps} className={iconClass}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const ReserveIcon = () => (
  <svg {...svgProps} className={iconClass}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const SoldIcon = () => (
  <svg {...svgProps} className={iconClass}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const DeleteIcon = () => (
  <svg {...svgProps} className={iconClass}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0" aria-hidden="true">
    <circle cx="12" cy="5" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="12" cy="19" r="1.6" />
  </svg>
);

export function MyListings({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // The listing awaiting delete confirmation (null = the dialog is closed).
  const [pendingDelete, setPendingDelete] = useState<Listing | null>(null);
  // Surfaced when a status change or delete fails (they were silent before).
  const [actionError, setActionError] = useState<string | null>(null);

  // Close the ⋮ menu on an outside click.
  useEffect(() => {
    if (!openMenuId) return;
    function onDown(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-row-menu]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenuId]);

  async function copyLink(id: string) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/listings/${id}`,
      );
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // clipboard blocked — nothing we can do; just close the menu
    }
    setOpenMenuId(null);
  }

  async function setStatus(id: string, status: ListingStatus) {
    setActionError(null);
    setBusyId(id);
    const supabase = createClient();
    // Stamp the sale time when it sells; clear it if it comes back to life.
    const patch =
      status === "sold"
        ? { status, sold_at: new Date().toISOString() }
        : { status, sold_at: null };
    const { error } = await supabase.from("listings").update(patch).eq("id", id);
    setBusyId(null);
    if (error) {
      // Putting an item back on the board (relist / un-reserve) when the seller
      // has cleared all their contact methods trips the DB rule "an available
      // listing must have a contact" (a check constraint). Point them at the
      // real fix instead of a misleading connection error.
      const missingContact =
        error.code === "23514" && /available_has_contact/i.test(error.message ?? "");
      setActionError(
        missingContact
          ? "Add a contact method (Instagram or GroupMe) in Settings before putting this back on the board."
          : "Couldn't update the listing — check your connection and try again.",
      );
      return;
    }
    router.refresh();
  }

  // Runs after the styled ConfirmDialog is accepted.
  async function confirmDelete() {
    const listing = pendingDelete;
    if (!listing) return;
    setActionError(null);
    setBusyId(listing.id);
    const supabase = createClient();

    // Delete the row FIRST. If that fails, the listing stays fully intact —
    // better than a live listing whose photos we already deleted out from under
    // it (the previous order risked exactly that).
    const { error } = await supabase.from("listings").delete().eq("id", listing.id);
    if (error) {
      setBusyId(null);
      setPendingDelete(null);
      setActionError("Couldn't delete the listing — please try again.");
      return;
    }

    // Row is gone; now clean up its Storage photos best-effort. An orphaned file
    // is harmless, and RLS only lets us touch our own folder anyway.
    const paths = listing.images
      .map(imageStoragePath)
      .filter((p): p is string => p !== null);
    if (paths.length > 0) {
      await supabase.storage.from("listing-images").remove(paths);
    }

    setPendingDelete(null);
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
    <>
    {actionError && (
      <p className="mb-4 rounded-lg border border-brick/40 bg-brick/8 px-4 py-2.5 text-sm text-brick">
        {actionError}
      </p>
    )}
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
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.05em] ${statusStyles[l.status]}`}
                  >
                    {statusLabel[l.status]}
                  </span>
                  <div className="relative" data-row-menu>
                    <button
                      type="button"
                      aria-label="More actions"
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === l.id}
                      onClick={() =>
                        setOpenMenuId(openMenuId === l.id ? null : l.id)
                      }
                      className="flex size-7 items-center justify-center rounded-lg text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      <MoreIcon />
                    </button>
                    {openMenuId === l.id && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-30 mt-1 w-40 rounded-xl border border-line bg-paper-soft p-1 shadow-[0_8px_24px_rgba(28,36,48,0.12)]"
                      >
                        <button
                          type="button"
                          onClick={() => copyLink(l.id)}
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink/80 transition-colors hover:bg-paper hover:text-ink"
                        >
                          {copiedId === l.id ? "Copied ✓" : "Copy link"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Tooltip label="Edit this listing's details">
                  <Link href={`/listings/${l.id}/edit`} className={editBtn}>
                    <EditIcon />
                    Edit
                  </Link>
                </Tooltip>

                {/* Reserve only applies to a live item. A sold listing goes
                    Sold → Relist → Available (then it can be reserved again). */}
                {l.status !== "sold" && (
                  <Tooltip
                    label={
                      l.status === "reserved"
                        ? "Un-reserve — put it back on the board"
                        : "Reserve this item while a sale is pending"
                    }
                  >
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setStatus(
                          l.id,
                          l.status === "reserved" ? "available" : "reserved",
                        )
                      }
                      className={l.status === "reserved" ? reservedActive : reservedIdle}
                    >
                      <ReserveIcon />
                      {l.status === "reserved" ? "Reserved" : "Mark reserved"}
                    </button>
                  </Tooltip>
                )}

                <Tooltip
                  label={
                    l.status === "sold"
                      ? "Relist — put it back on the board"
                      : "Mark as sold (item will leave the board)"
                  }
                >
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setStatus(l.id, l.status === "sold" ? "available" : "sold")
                    }
                    className={l.status === "sold" ? soldActive : soldIdle}
                  >
                    <SoldIcon />
                    {l.status === "sold" ? "Sold" : "Mark sold"}
                  </button>
                </Tooltip>

                <Tooltip label="Delete this listing permanently">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPendingDelete(l)}
                    className={deleteBtn}
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this listing?"
        confirmLabel="Delete listing"
        busyLabel="Deleting…"
        destructive
        busy={busyId !== null && busyId === pendingDelete?.id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        This permanently removes the listing. If the item sold, mark it sold
        instead so it stays in your history.
      </ConfirmDialog>
    </>
  );
}
