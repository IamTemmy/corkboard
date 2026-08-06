// Static category filters. The "All" chip is shown active to match the mockup;
// making these actually filter the grid is a planned next step.
const categories = [
  "All",
  "Electronics",
  "Clothing",
  "Furniture",
  "Books",
  "Dorm",
  "Free",
];

export function CategoryChips() {
  return (
    <div className="flex flex-wrap justify-center gap-2.5 px-6 pb-2 pt-6 sm:px-12">
      {categories.map((category) => {
        const isActive = category === "All";
        return (
          <span
            key={category}
            className={
              "rounded-full border px-4 py-2 text-[13px] font-medium " +
              (isActive
                ? "border-ink bg-ink text-paper"
                : "border-line bg-paper-soft text-ink/80")
            }
          >
            {category}
          </span>
        );
      })}
    </div>
  );
}
