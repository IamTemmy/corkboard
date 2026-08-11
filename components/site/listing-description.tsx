"use client";

import { useEffect, useRef, useState } from "react";

// The listing description with a 3-line clamp on desktop. A long description
// would otherwise stretch the right column past the photo and dictate the whole
// page's height; clamping keeps the "gallery = details height" composition, and
// "More" expands it IN PLACE (no modal, no overlay) when the reader wants it.
// The toggle only appears when the text actually overflows three lines.
export function ListingDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Measured while clamped (on mount): is there more than three lines to show?
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={`text-sm leading-relaxed text-ink/70 ${expanded ? "" : "line-clamp-3"}`}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-sm font-semibold text-marigold-text underline-offset-4 hover:underline"
        >
          {expanded ? "Show less" : "More"}
        </button>
      )}
    </div>
  );
}
