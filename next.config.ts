import type { NextConfig } from "next";

// Baseline security response headers, applied to every route. These are
// "defense-in-depth" — the real authorization lives in the database (RLS,
// triggers, RPCs). None of these change what the app renders; they just tell
// the browser to behave more defensively. Deliberately NOT setting a
// Content-Security-Policy here yet: a wrong CSP can blank the page (Next's
// hydration uses inline scripts), so that gets its own carefully-tested pass.
// HSTS is already applied by Vercel at the edge, so we don't duplicate it here.
const securityHeaders = [
  // Clickjacking: refuse to be embedded in a cross-origin <iframe>.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop the browser from MIME-sniffing a response into a different type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send our origin (never the full path/UUID) when a student clicks out
  // to an external site like Instagram/GroupMe — no listing IDs leak.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We don't use these device APIs anywhere; disable them site-wide.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Drop the framework-fingerprinting "x-powered-by: Next.js" header.
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Every path.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
