"use client";

import { useState } from "react";

// The detail-page image viewer: one large image plus a row of clickable
// thumbnails when a listing has more than one photo. Client component because
// clicking a thumbnail swaps the main image (that needs state).
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

  return (
    <div className="flex flex-col gap-3 self-start">
      {/* Main image (with the pin motif) */}
      <div className="relative overflow-hidden rounded-[14px] border border-line">
        <span className="absolute left-3 top-3 z-10 flex size-[22px] items-center justify-center rounded-full bg-brick shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
          <span className="size-1.5 rounded-full bg-paper-soft" />
        </span>
        {hasImages ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[active]}
            alt={alt}
            className={`w-full ${dimmed ? "opacity-60" : ""}`}
          />
        ) : (
          <div
            className="flex aspect-[4/5] w-full items-center justify-center text-[13px] font-medium text-ink/35"
            style={{ background: "linear-gradient(135deg, #DCD3BE, #EDE6D6)" }}
          >
            Photo
          </div>
        )}
      </div>

      {/* Thumbnails — only when there's more than one angle */}
      {images.length > 1 && (
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
