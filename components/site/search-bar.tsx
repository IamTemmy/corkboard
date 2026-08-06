import { Button } from "@/components/ui/button";

type SearchBarProps = {
  /** Current search text (owned by the parent — this is a controlled input). */
  value: string;
  /** Called with the new text on every keystroke. */
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-6 pt-8 sm:px-12">
      <form
        className="mx-auto flex max-w-[520px] rounded-[12px] border border-line bg-paper-soft p-1.5"
        // Filtering happens live as you type, so submitting the form (pressing
        // Enter) shouldn't reload the page.
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search for a couch, textbook, headphones..."
          className="flex-1 bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-ink/40"
          aria-label="Search listings"
        />
        <Button
          type="submit"
          className="h-auto rounded-[8px] bg-marigold px-5 text-sm font-semibold text-ink hover:bg-marigold/90"
        >
          Search
        </Button>
      </form>
    </div>
  );
}
