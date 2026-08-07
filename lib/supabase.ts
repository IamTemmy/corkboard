import { createClient } from "@supabase/supabase-js";

// A Supabase client for reading public data (like listings) from the database.
// The URL and key come from environment variables (.env.local locally, and
// Vercel's env settings in production) — never hardcoded here.
//
// The anon/publishable key is safe to ship to the browser: it can only do what
// our Row Level Security policies allow. When we add student accounts, we'll
// introduce cookie-aware clients (@supabase/ssr) for logged-in requests.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
