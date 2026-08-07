// Single source of truth for the site's public base URL.
// Reads NEXT_PUBLIC_SITE_URL (set in Vercel or a local .env.local) and falls
// back to the current production URL, so the app still builds and generates
// correct links with no env setup required.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://corkboard-six.vercel.app";
