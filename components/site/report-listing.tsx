"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "./modal";

// The reasons a student can pick when reporting a listing. These map onto the
// community guidelines (see lib/guidelines.ts / /guidelines).
const REPORT_REASONS = [
  "Prohibited item (weapon, drug, alcohol, etc.)",
  "Stolen or counterfeit goods",
  "Looks like a scam",
  "Offensive or inappropriate",
  "Spam or duplicate",
  "Something else",
] as const;

const fieldClass =
  "w-full rounded-lg border border-line bg-paper-soft px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-marigold focus:ring-2 focus:ring-marigold/30";

// A small flag — the trigger and the "reported" confirmation both use it.
function FlagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

// Reporting is a payoff of verification, like contact reveal: only signed-in
// (= verified) students can report, so reports are accountable, not anon spam.
// `reporterId` is the signed-in user's id (null when signed out). The report is
// a secondary action, so it opens in a modal — the listing page never reflows.
export function ReportListing({
  listingId,
  reporterId,
}: {
  listingId: string;
  reporterId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const [toast, setToast] = useState(false);

  // Auto-dismiss the success toast.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Signed-out visitors get a nudge to sign in rather than the report action.
  if (!reporterId) {
    return (
      <p className="mt-8 border-t border-line pt-6 text-xs text-ink/50">
        <Link href="/join" className="underline-offset-4 hover:underline">
          Sign in
        </Link>{" "}
        to report this listing.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reason) {
      setError("Pick a reason for the report.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("reports").insert({
      listing_id: listingId,
      reporter_id: reporterId,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);

    // A unique violation (23505) means they already reported this listing — the
    // flag is on file, so treat it exactly like a fresh success.
    if (insertError && insertError.code !== "23505") {
      setError("Couldn't send the report — please try again.");
      return;
    }

    setOpen(false);
    setReported(true);
    setToast(true);
  }

  return (
    <div className="mt-8 border-t border-line pt-6">
      {reported ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-moss">
          <FlagIcon />
          Reported — thanks
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brick underline-offset-4 transition-colors hover:text-brick/80 hover:underline"
        >
          <FlagIcon />
          Report listing
        </button>
      )}

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        dismissable={!submitting}
        showClose
        labelledBy="report-title"
      >
        <form onSubmit={onSubmit}>
          <h2
            id="report-title"
            className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink"
          >
            Report this listing
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
            Help us keep Corkboard safe. Reports are private — the seller
            isn&apos;t told who reported them.
          </p>

          <label className="mt-5 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink/80">
              What&apos;s wrong?
            </span>
            <select
              data-autofocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={fieldClass}
            >
              <option value="" disabled>
                Choose a reason…
              </option>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink/80">
              Anything to add?{" "}
              <span className="font-normal text-ink/50">(optional)</span>
            </span>
            <textarea
              rows={3}
              maxLength={400}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Extra context that helps us review it."
              className={`${fieldClass} resize-y`}
            />
          </label>

          {error && <p className="mt-3 text-sm text-brick">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink/75 transition-colors hover:bg-paper-soft hover:text-ink disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brick px-4 py-2 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Submit report"}
            </button>
          </div>
        </form>
      </Modal>

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-[110] flex justify-center px-4">
          <div
            role="status"
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper shadow-[0_8px_24px_rgba(28,36,48,0.28)]"
          >
            <svg viewBox="0 0 24 24" className="size-4 text-moss" fill="none" aria-hidden="true">
              <path
                d="m5 13 4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Report submitted — thanks for helping keep Corkboard safe.
          </div>
        </div>
      )}
    </div>
  );
}
