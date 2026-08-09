import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { HowItWorksSteps } from "@/components/site/how-it-works";

export const metadata: Metadata = {
  title: "How it works — Corkboard",
  description: "How buying and selling on Corkboard works.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-12">
        <span className="mb-6 inline-block rounded-full bg-moss/12 px-3.5 py-1.5 text-xs font-medium text-moss">
          Built for verified students, meeting in person
        </span>
        <h1 className="font-display mb-3 max-w-[640px] text-[34px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[44px]">
          How Corkboard works
        </h1>
        <p className="mb-10 max-w-[560px] text-base text-ink/65">
          No shipping, no fees, no middleman — just students buying and selling
          with people down the hall. Here&apos;s the whole flow.
        </p>
        <HowItWorksSteps />

        {/* What can I list? — points to the guidelines, where people look for it */}
        <div className="mt-10 flex flex-col gap-3 rounded-[14px] border border-line bg-paper-soft p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">
              What can I list?
            </h2>
            <p className="mt-1 max-w-[520px] text-sm text-ink/65">
              Just about anything students buy and sell — with a few exceptions
              (no weapons, alcohol, drugs, or stolen goods). The full list is in
              our community guidelines.
            </p>
          </div>
          <Link
            href="/guidelines"
            className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg border border-ink/25 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Read the guidelines
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
