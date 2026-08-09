import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import {
  PROHIBITED_ITEMS,
  COMMUNITY_RULES,
  type ProhibitedItem,
} from "@/lib/guidelines";

export const metadata: Metadata = {
  title: "Community guidelines — Corkboard",
  description:
    "What you can and can't sell on Corkboard, and how to buy and sell safely on campus.",
};

// A titled list of rules — reused for both the prohibited items and the
// good-conduct rules, with a colour accent per section.
function RuleList({
  items,
  accent,
}: {
  items: ProhibitedItem[];
  accent: "brick" | "moss";
}) {
  const dot = accent === "brick" ? "bg-brick" : "bg-moss";
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.title}
          className="flex gap-3 rounded-[12px] border border-line bg-paper-soft px-4 py-4"
        >
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot}`} />
          <div>
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/65">
              {item.detail}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function GuidelinesPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-12">
        <span className="mb-6 inline-block rounded-full bg-moss/12 px-3.5 py-1.5 text-xs font-medium text-moss-text">
          Keeping Corkboard safe and useful
        </span>
        <h1 className="font-display mb-3 max-w-[640px] text-[34px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[44px]">
          Community guidelines
        </h1>
        <p className="mb-12 max-w-[600px] text-base text-ink/65">
          Corkboard is a marketplace for verified students meeting in person on
          campus. A few simple rules keep it that way. By posting a listing, you
          agree to follow these.
        </p>

        {/* What you can't sell */}
        <section className="mb-14">
          <h2 className="font-display mb-1 text-[22px] font-semibold tracking-[-0.01em]">
            What you can&apos;t sell
          </h2>
          <p className="mb-5 max-w-[600px] text-sm text-ink/60">
            These items are off-limits, whether they&apos;re against the law or
            against JSU campus rules. Listings for them are removed, and repeat
            posts can lose you access.
          </p>
          <RuleList items={PROHIBITED_ITEMS} accent="brick" />
        </section>

        {/* How to behave */}
        <section className="mb-14">
          <h2 className="font-display mb-1 text-[22px] font-semibold tracking-[-0.01em]">
            Buying &amp; selling well
          </h2>
          <p className="mb-5 max-w-[600px] text-sm text-ink/60">
            The marketplace only works if people can trust it. Here&apos;s what
            we expect from everyone.
          </p>
          <RuleList items={COMMUNITY_RULES} accent="moss" />
        </section>

        {/* Reporting */}
        <section className="rounded-[16px] border border-line bg-paper-soft px-6 py-6">
          <h2 className="font-display mb-2 text-[20px] font-semibold tracking-[-0.01em]">
            See something off?
          </h2>
          <p className="max-w-[620px] text-sm leading-relaxed text-ink/65">
            Every listing has a <span className="font-medium text-ink">Report</span>{" "}
            option. If something breaks these guidelines — a banned item, a scam,
            or anything that feels wrong — flag it and we&apos;ll take a look.
            Reporting is private; the seller isn&apos;t told who reported them.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-ink/65 transition-colors hover:text-ink"
          >
            ← Back to listings
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
