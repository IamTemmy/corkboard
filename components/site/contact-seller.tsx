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
      display: href ? "Open group" : contact.groupme,
      href: href ?? undefined,
      external: Boolean(href),
    });
  }
  if (contact.email) {
    channels.push({
      label: "Email",
      display: contact.email,
      href: `mailto:${contact.email}`,
    });
  }
  return channels;
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
          a time — then meet at the campus spot above, in daylight. It&apos;s fine
          to bring a friend.
        </p>
      </div>
    );
  }

  // Unlocked — the actual channels.
  const channels = buildChannels(contact);

  return (
    <div className="mt-6">
      <p className="mb-2 text-[11px] uppercase tracking-[0.06em] text-ink/55">
        Reach {seller}
      </p>

      {channels.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {channels.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              <span className="text-ink/55">{c.label}:</span>
              {c.href ? (
                <a
                  href={c.href}
                  {...(c.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="font-medium text-ink underline-offset-4 hover:underline"
                >
                  {c.display}
                </a>
              ) : (
                <span className="font-medium text-ink">{c.display}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink/60">
          {seller} hasn&apos;t added a contact channel yet — check back soon.
        </p>
      )}

      <p className="mt-3 max-w-md text-xs text-ink/55">
        Agree on a time, then meet at the campus spot above, in daylight — it&apos;s
        fine to bring a friend.
      </p>
    </div>
  );
}
