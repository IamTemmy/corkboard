import { createBrowserClient } from "@supabase/ssr";

// Supabase client for the BROWSER (Client Components — e.g. the /join form).
// It reads and writes the session cookie via document.cookie so that a login
// performed in the browser is visible to the server on the next request.
//
// The anon/publishable key is safe to ship to the browser: Row Level Security
// decides what it's actually allowed to do.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
