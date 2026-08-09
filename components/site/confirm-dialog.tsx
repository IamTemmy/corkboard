"use client";

import { type ReactNode } from "react";
import { Modal } from "./modal";

// A Corkboard-styled confirmation dialog — replaces the browser-native
// window.confirm(). Generic on purpose: pass a title, body, and labels, and
// flag `destructive` for the restrained-brick confirm button. Built on the
// shared Modal shell (backdrop, focus trap, Escape, scroll lock).
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
  return (
    <Modal
      open={open}
      onClose={onCancel}
      dismissable={!busy}
      labelledBy="confirm-dialog-title"
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
          type="button"
          data-autofocus
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
    </Modal>
  );
}
