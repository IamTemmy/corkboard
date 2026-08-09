import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
import { AccountMenu } from "./account-menu";
import { createClient } from "@/lib/supabase/server";
import { jnumberOf } from "@/lib/identity";

type NavItem = { label: string; href: string; kind: "scroll" | "page" };

// Two kinds of links live here:
//  - "scroll" links jump to a section on the homepage (plain <a> + hash, so
//    same-page scrolling works; "/#id" also works from another page)
//  - "page" links go to a real route (next/link for instant client-side nav)
const navLinks = [
  { label: "Browse", href: "/#listings", kind: "scroll" as const },
  // "Categories" was removed — it scrolled to the filter chips, which sit right
  // above the listings, so it did the same thing as "Browse" (redundant).
  { label: "How it works", href: "/how-it-works", kind: "page" as const },
];

export async function Nav() {
  // Who's signed in (if anyone)? Used to swap the "Join" link for the account
  // state. getUser() is cheap here because proxy.ts already refreshed the token.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Greet by the student's chosen display name, falling back to their J-number
  // until they've picked one at /welcome.
  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? jnumberOf(user.email);
  }

  // Centre nav: "My listings" sits right after Browse for signed-in students.
  const centerItems: NavItem[] = [
    navLinks[0],
    ...(displayName
      ? [{ label: "My listings", href: "/my-listings", kind: "page" as const }]
      : []),
    navLinks[1],
  ];

  return (
    <nav className="relative flex items-center justify-between border-b border-line bg-paper-soft px-6 py-5 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-12">
      {/* Wordmark links home. A plain <a> (not next/link) forces a full page
          load, which resets any active search/filter — so clicking it is a
          reliable "back to a fresh homepage", even when you're already on it.
          This is deliberate, so we opt out of the next/link lint rule here. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="flex items-center gap-2 font-display text-[22px] font-semibold tracking-[-0.01em]"
      >
        {/* The brand pin — the same mark as the pins on the listing cards. */}
        <svg viewBox="0 0 32 32" className="size-7 shrink-0" fill="none" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#1C2430" />
          <circle cx="16" cy="16" r="7" fill="#B24A34" />
          <circle cx="16" cy="16" r="2.4" fill="#FBF8F2" />
        </svg>
        <span>
          cork<span className="text-marigold">board</span>
        </span>
      </a>

      {/* Center links — hidden on small screens to keep the mobile header clean */}
      <div className="hidden items-center gap-8 text-sm font-medium sm:flex">
        {centerItems.map((link) =>
          link.kind === "page" ? (
            <Link
              key={link.label}
              href={link.href}
              className="whitespace-nowrap text-ink/75 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ) : (
            <a
              key={link.label}
              href={link.href}
              className="whitespace-nowrap text-ink/75 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ),
        )}
      </div>

      {/* Desktop right cluster: auth state + CTA (hidden on phones — these move
          into the mobile menu). justify-end keeps it pinned to the right edge of
          its grid column so the centre nav links stay truly page-centred. */}
      {/* The corner is account-only now; "+ List an item" lives beside Search on
          the home page and on the My Listings page — the account and mobile
          menus stay navigation-only rather than repeating that CTA. */}
      <div className="hidden items-center gap-4 sm:flex sm:justify-end">
        {displayName ? (
          <AccountMenu name={displayName} />
        ) : (
          <>
            {/* Two words, one flow: returning students look for "Sign in",
                first-timers look for "Sign up". Both go to /join, which sends
                a code and creates the account on first verification. */}
            <Link
              href="/join"
              className="text-sm font-medium text-ink/75 transition-colors hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/join"
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
            >
              Sign up
            </Link>
          </>
        )}
      </div>

      {/* Phone-only hamburger holding the same links + CTA */}
      <MobileMenu links={navLinks} authName={displayName} />
    </nav>
  );
}
