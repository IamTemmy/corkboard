"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A reusable Corkboard-styled modal shell: dimmed backdrop, centered paper card,
// Escape + backdrop-click to close, focus trapped inside, page scroll locked.
// The card content (title, body, footer) is passed as children so different
// modals — a delete confirm, a report form — share one implementation.
//
// Mark the element that should receive focus on open with `data-autofocus`;
// otherwise the first focusable element (or the card) is focused.
export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  dismissable = true,
  showClose = false,
  className = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id of the heading that names the dialog, for screen readers. */
  labelledBy?: string;
  /** When false, Escape / backdrop / × can't close it (e.g. mid-submit). */
  dismissable?: boolean;
  /** Show a × button in the top-right corner. */
  showClose?: boolean;
  /** Overrides the card's max-width utility. */
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const card = cardRef.current;
    if (!card) return;

    // Remember what had focus so we can hand it back when the modal closes
    // (e.g. the "Report listing" trigger), for keyboard/screen-reader users.
    const opener = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        card.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

    // Focus the marked element, else the first focusable, else the card itself.
    (card.querySelector<HTMLElement>("[data-autofocus]") ??
      focusables()[0] ??
      card).focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (dismissable) onClose();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop — dims the page; clicking it closes (unless locked). */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={() => dismissable && onClose()}
        className="absolute inset-0 cursor-default bg-ink/40"
      />

      <div
        ref={cardRef}
        className={`relative w-full ${className} rounded-2xl border border-line bg-paper p-6 shadow-[0_24px_60px_rgba(28,36,48,0.28)]`}
      >
        {showClose && (
          <button
            type="button"
            onClick={() => dismissable && onClose()}
            disabled={!dismissable}
            aria-label="Close"
            className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
