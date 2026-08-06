import type { Metadata } from "next";
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
      </main>
      <Footer />
    </>
  );
}
