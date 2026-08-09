"use client";

import { useRef, useState } from "react";

// The detail-page image viewer: one large image plus a row of clickable
// thumbnails when a listing has more than one photo. On the main frame you can
// also swipe (touch) or use the hover arrows / arrow keys to move between
// photos — the shopping-app pattern. Client component because navigating swaps
// the main image (that needs state).
export function ListingGallery({
  images,
  alt,
  dimmed = false,
}: {
  images: string[];
  alt: string;
  /** Fades the image for sold/reserved items. */
  dimmed?: boolean;
}) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;
  const multiple = images.length > 1;

  // Where a touch began, so touchend can tell a swipe from a tap.
  const touchStartX = useRef<number | null>(null);

  // Move by a direction (-1 prev, +1 next), wrapping around the ends.
  function go(dir: number) {
    if (!multiple) return;
    setActive((i) => (i + dir + images.length) % images.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    // Ignore small movements (taps / vertical scrolls).
    if (Math.abs(dx) < 40) return;
    go(dx < 0 ? 1 : -1); // swipe left → next, swipe right → prev
  }

  return (
    <div className="flex flex-col gap-3 self-start">
      {/* Main image (with the pin motif). `group` so the arrows fade in on hover.
          A fixed 4:5 cover box (like the cards) so portrait phone photos fill
          cleanly without letterbox side-bars — a small symmetric crop instead;
          other angles stay reachable via the thumbnails/swipe. */}
      <div
        className="group relative aspect-[4/5] w-full overflow-hidden rounded-[14px] border border-line bg-paper-soft"
        onTouchStart={multiple ? onTouchStart : undefined}
        onTouchEnd={multiple ? onTouchEnd : undefined}
        onKeyDown={
          multiple
            ? (e) => {
                if (e.key === "ArrowLeft") go(-1);
                if (e.key === "ArrowRight") go(1);
              }
            : undefined
        }
        tabIndex={multiple ? 0 : undefined}
        role={multiple ? "group" : undefined}
        aria-label={multiple ? `${alt} — image ${active + 1} of ${images.length}` : undefined}
      >
        <span className="absolute left-3 top-3 z-10 flex size-[22px] items-center justify-center rounded-full bg-brick shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
          <span className="size-1.5 rounded-full bg-paper-soft" />
        </span>

        {hasImages ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[active]}
            alt={alt}
            draggable={false}
            className={`h-full w-full select-none object-cover ${dimmed ? "opacity-60" : ""}`}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[13px] font-medium text-ink/35"
            style={{ background: "linear-gradient(135deg, #DCD3BE, #EDE6D6)" }}
          >
            Photo
          </div>
        )}

        {/* Prev/next arrows — desktop affordance; fade in on hover/focus. Touch
            users swipe instead. Only rendered with more than one photo. */}
        {multiple && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink opacity-0 shadow-[0_2px_8px_rgba(28,36,48,0.2)] backdrop-blur-sm transition hover:bg-paper focus-visible:opacity-100 group-hover:opacity-100"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-ink opacity-0 shadow-[0_2px_8px_rgba(28,36,48,0.2)] backdrop-blur-sm transition hover:bg-paper focus-visible:opacity-100 group-hover:opacity-100"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Position counter — feedback when swiping on mobile. */}
            <span className="absolute bottom-3 right-3 z-10 rounded-full bg-ink/70 px-2 py-0.5 font-mono text-[11px] font-medium text-paper">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails — only when there's more than one angle */}
      {multiple && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === active}
              className={`overflow-hidden rounded-lg border transition ${
                index === active
                  ? "border-marigold ring-2 ring-marigold"
                  : "border-line hover:border-ink/30"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
