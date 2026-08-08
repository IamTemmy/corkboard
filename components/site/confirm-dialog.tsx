"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A Corkboard-styled confirmation modal — replaces the browser-native
// window.confirm(), which renders in system chrome and breaks the look. Generic
// on purpose: pass a title, body, and labels, and flag `destructive` for the
// restrained-brick confirm button. Reusable for any "are you sure?" step.
//
// Accessibility: focus moves to the confirm button on open, Escape and a
// backdrop click cancel, Tab is trapped inside the card, and page scroll is
// locked while it's open.
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  busyLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Shown on the confirm button while the action runs (defaults to confirmLabel). */
  busyLabel?: string;
  /** Styles the confirm button as a destructive (brick) action. */
  destructive?: boolean;
  /** True while the confirmed action is in flight — disables both buttons. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Focus the primary action so Enter confirms and screen readers land here.
    confirmRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        onCancel();
        return;
      }
      // Keep Tab focus inside the dialog (only the two buttons are focusable).
      if (e.key === "Tab") {
        const nodes = cardRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled])",
        );
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
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
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop — dims the page; clicking it cancels (unless mid-action). */}
      <button
        type="button"
        aria-label="Cancel"
        tabIndex={-1}
        onClick={() => !busy && onCancel()}
        className="absolute inset-0 cursor-default bg-ink/40"
      />

      <div
        ref={cardRef}
        className="relative w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-[0_24px_60px_rgba(28,36,48,0.28)]"
      >
        <h2
          id="confirm-dialog-title"
          className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink"
        >
          {title}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-ink/70">{children}</div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink/75 transition-colors hover:bg-paper-soft hover:text-ink disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={
              destructive
                ? "rounded-lg bg-brick px-4 py-2 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-60"
                : "rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-60"
            }
          >
            {busy ? (busyLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
