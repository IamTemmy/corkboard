"use client";

// The full set of category filters. Exported so the parent (Marketplace)
// and this component agree on the same list.
export const categories = [
  "All",
  "Electronics",
  "Clothing",
  "Furniture",
  "Books",
  "Dorm",
  "Free",
];

type CategoryChipsProps = {
  /** The currently selected category (controlled by the parent). */
  selected: string;
  /** Called with the new category when a chip is clicked. */
  onSelect: (category: string) => void;
};

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <div
      id="categories"
      className="flex flex-wrap justify-center gap-2.5 px-6 pb-2 pt-6 scroll-mt-4 sm:px-12"
    >
      {categories.map((category) => {
        const isActive = category === selected;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            aria-pressed={isActive}
            className={
              "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-medium transition-colors " +
              (isActive
                ? "border-ink bg-ink text-paper"
                : "border-line bg-paper-soft text-ink/80 hover:border-ink/30")
            }
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
