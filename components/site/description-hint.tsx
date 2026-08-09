import { CATEGORY_LISTING_TIPS } from "@/lib/listings";

// A one-line "Buyers usually want to know: Size · Brand · Condition" nudge shown
// under the Description field once a category is chosen. Guidance only — no
// inputs, nothing required. Corkboard guides sellers toward good listings
// instead of policing them into filling out forms.
export function DescriptionHint({ category }: { category: string }) {
  const tip = CATEGORY_LISTING_TIPS[category];
  if (!tip) return null;

  return (
    <p className="text-xs text-ink/55">
      Buyers usually want to know:{" "}
      {tip.wants.map((w, i) => (
        <span key={w}>
          {i > 0 && <span className="text-ink/30"> · </span>}
          <span className="font-medium text-ink/70">{w}</span>
        </span>
      ))}
    </p>
  );
}
