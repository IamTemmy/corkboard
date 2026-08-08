"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

// Reporting is a payoff of verification, like contact reveal: only signed-in
// (= verified) students can report, so reports are accountable, not anon spam.
// `reporterId` is the signed-in user's id (null when signed out).
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
  const [done, setDone] = useState(false);

  // Signed-out visitors get a nudge to sign in rather than the form.
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

  // After a successful report, replace the whole block with a thank-you.
  if (done) {
    return (
      <p className="mt-8 border-t border-line pt-6 text-xs text-moss">
        Thanks — this listing has been reported. We&apos;ll take a look.
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

    if (insertError) {
      // Unique violation = they've already reported this listing. Treat it as
      // success — the flag is already on file, no need to alarm them.
      if (insertError.code === "23505") {
        setDone(true);
        return;
      }
      setSubmitting(false);
      setError("Couldn't send the report — please try again.");
      return;
    }

    setDone(true);
  }

  return (
    <div className="mt-8 border-t border-line pt-6">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-ink/50 transition-colors hover:text-brick"
        >
          Report this listing
        </button>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <p className="text-sm font-medium text-ink/80">
            Report this listing
          </p>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink/60">What&apos;s wrong?</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-marigold focus:ring-2 focus:ring-marigold/30"
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

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink/60">
              Anything to add?{" "}
              <span className="text-ink/40">(optional)</span>
            </span>
            <textarea
              rows={3}
              maxLength={400}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Extra context that helps us review it."
              className="w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-marigold focus:ring-2 focus:ring-marigold/30"
            />
          </label>

          {error && <p className="text-sm text-brick">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brick px-4 py-2 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Submit report"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-ink/55 transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-ink/45">
            Reports are private — the seller isn&apos;t told who reported them.
          </p>
        </form>
      )}
    </div>
  );
}
