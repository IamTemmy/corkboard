"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// The sign-in / sign-up flow. One flow does both: a first-time student is
// created on verification, a returning one is just logged in. No passwords.
//
//   Step 1 (email): send a 6-digit code to a school email.
//   Step 2 (code):  type the code back to prove they own the inbox → signed in.
//
// The .edu restriction is NOT enforced here — the database auth hook is the real
// gate, so a non-approved address comes back with the server's message. That
// keeps the allow-list in one place (the approved_email_domains table).
const inputClass =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-ink outline-none transition placeholder:text-ink/40 focus:border-marigold focus:ring-2 focus:ring-marigold/30";

export function JoinForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Signed in. The session cookie is now set; refresh so server components
    // (like the header) re-render and see it. Send them to /welcome, which will
    // ask first-timers how they want to appear and bounce returners straight home.
    router.push("/welcome");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Little brick pin — the same signature detail as the listing cards */}
      <span className="mb-6 block size-3 rounded-[3px] bg-brick" aria-hidden="true" />

      <h1 className="font-display mb-2 text-[30px] font-semibold leading-tight tracking-[-0.01em]">
        {step === "email" ? "Sign in to Corkboard" : "Check your email"}
      </h1>

      {step === "email" ? (
        <p className="mb-7 text-[15px] text-ink/65">
          Enter your Jackson State student email and we&apos;ll send a 6-digit
          code — no password. New to Corkboard? This creates your account too.
        </p>
      ) : (
        <p className="mb-7 text-[15px] text-ink/65">
          We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>.
          Enter it below to finish. (Check your spam folder if it&apos;s not there.)
        </p>
      )}

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink/80">School email</span>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@students.jsums.edu"
              className={inputClass}
            />
          </label>

          {error && <p className="text-sm text-brick">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="h-auto w-full rounded-lg py-3 text-sm font-semibold"
          >
            {loading ? "Sending code…" : "Send me a code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink/80">6-digit code</span>
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className={`${inputClass} text-center text-lg tracking-[0.4em]`}
            />
          </label>

          {error && <p className="text-sm text-brick">{error}</p>}

          <Button
            type="submit"
            disabled={loading || code.length < 6}
            className="h-auto w-full rounded-lg py-3 text-sm font-semibold"
          >
            {loading ? "Verifying…" : "Verify & sign in"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="text-sm text-ink/60 underline-offset-4 hover:text-ink hover:underline"
          >
            Wrong email? Start over
          </button>
        </form>
      )}

      <p className="mt-8 text-xs leading-relaxed text-ink/50">
        Corkboard is an independent student project, not operated or endorsed by
        the university. Verifying a school email confirms you can receive mail at
        that address — nothing more.
      </p>
    </div>
  );
}
