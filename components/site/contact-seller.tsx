import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { groupmeHref } from "@/lib/contact";
import type { SellerContact } from "@/lib/listings";

// The seller's contact details are the payoff of verification: they're shown
// ONLY to signed-in students. Because signup is gated to approved .edu domains,
// "signed in" already means "verified student" — so a session is all we check.

type Channel = { label: string; display: string; href?: string; external?: boolean };

function buildChannels(contact: SellerContact): Channel[] {
  const channels: Channel[] = [];

  if (contact.instagram) {
    const handle = contact.instagram.replace(/^@/, "").trim();
    channels.push({
      label: "Instagram",
      display: `@${handle}`,
      href: `https://instagram.com/${handle}`,
      external: true,
    });
  }
  if (contact.groupme) {
    // Only a real groupme.com link is clickable; anything else shows as text.
    const href = groupmeHref(contact.groupme);
    channels.push({
      label: "GroupMe",
      display: href ? "Open chat" : contact.groupme,
      href: href ?? undefined,
      external: Boolean(href),
    });
  }
  // Note: the school email is intentionally NOT a contact channel — it's used
  // only for sign-in/verification and is never shown to buyers.
  return channels;
}

// Small brand-ish glyphs for the contact chips.
function ChannelIcon({ label }: { label: string }) {
  if (label === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
      </svg>
    );
  }
  // GroupMe → a chat bubble
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9A1.5 1.5 0 0 1 18.5 16H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A little ↗ marking a chip as opening an external app (Instagram / GroupMe).
function ExternalArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="ml-auto size-3.5 shrink-0 text-marigold"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 16 16 8M9 8h7v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A single contact channel rendered as a bordered chip (link when we have a
// safe URL, plain card otherwise). Contact is the primary action on the page,
// so the chip wears the marigold accent — border + icon + the ↗ open-in-app
// arrow — to stand out from the description. The value itself stays high-
// contrast ink (a marigold value would fail AA on the paper background).
function ChannelChip({ channel }: { channel: Channel }) {
  const inner = (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-marigold/12 text-marigold">
        <ChannelIcon label={channel.label} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-[0.05em] text-ink/50">
          {channel.label}
        </span>
        <span className="max-w-[170px] truncate text-[13px] font-semibold text-ink">
          {channel.display}
        </span>
      </span>
      {channel.external && <ExternalArrow />}
    </>
  );

  // Compact — a contact ACTION, not another information card.
  const base =
    "flex items-center gap-2.5 rounded-xl border border-marigold/45 bg-paper-soft px-3 py-2";

  return channel.href ? (
    <a
      href={channel.href}
      {...(channel.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={cn(base, "transition-colors hover:border-marigold hover:bg-marigold/10")}
    >
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}

// The safety reminder gets a calm moss "you're good" treatment — a subtle
// shield + tint that reads as reassurance, distinct from the neutral copy. Moss
// owns exactly one job on this page (safety); Meet-at keeps the brick pin, and
// contact keeps marigold, so no colour means more than one thing.
// Filled moss shield with a light check — a small "you're covered" badge that
// reads clearly, rather than a thin outline that got lost against the tint.
function ShieldCheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 size-5 shrink-0 text-moss-text"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2.2l7.4 3a1 1 0 0 1 .6.9v4.8c0 4.8-3.2 8.3-7.6 10a1 1 0 0 1-.8 0C7.2 19.2 4 15.7 4 10.9V6.1a1 1 0 0 1 .6-.9z"
        fill="currentColor"
      />
      <path
        d="m8.8 11.9 2.2 2.2 4.2-4.4"
        stroke="#FBF8F2"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ContactSeller({
  signedIn,
  seller,
  contact,
}: {
  signedIn: boolean;
  seller: string;
  contact: SellerContact;
}) {
  // Locked state — invite them to verify.
  if (!signedIn) {
    return (
      <div className="mt-6">
        <Link
          href="/join"
          className={cn(
            buttonVariants(),
            "h-auto w-full rounded-lg px-5 py-3 text-sm font-semibold sm:w-auto",
          )}
        >
          Sign in to contact {seller}
        </Link>
        <p className="mt-3 max-w-md text-xs text-ink/55">
          Corkboard only shows a seller&apos;s contact details to verified
          students. Sign in with your school email to reach {seller} and agree on
          a time — then meet at the campus spot above. It&apos;s fine to bring a
          friend.
        </p>
      </div>
    );
  }

  // Unlocked — the actual channels, as chips.
  const channels = buildChannels(contact);

  return (
    <div className="mt-6">
      <p className="mb-2.5 text-[11px] uppercase tracking-[0.06em] text-moss-text">
        Reach {seller}
      </p>

      {channels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {channels.map((channel) => (
            <ChannelChip key={channel.label} channel={channel} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink/60">
          {seller} hasn&apos;t added a contact channel yet — check back soon.
        </p>
      )}
    </div>
  );
}

// The "meet safely" reminder — shield + soft green text. Rendered at the BOTTOM
// of the details column (beside Report / Edit), not under the contact chips:
// it's an end-of-visit note, so anchoring it near the closing line frees the
// description/contact area above to breathe.
export function MeetSafelyNote() {
  return (
    <div className="flex max-w-md items-start gap-2">
      <ShieldCheckIcon />
      <p className="text-xs leading-relaxed text-moss-text">
        Agree on a time, then meet at the campus spot above — it&apos;s fine to
        bring a friend.
      </p>
    </div>
  );
}
