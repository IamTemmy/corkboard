import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for the SERVER (Server Components, Route Handlers, Server
// Actions). It reads the session from the request cookies, so server code knows
// who is logged in. In Next 16 `cookies()` is async, so this factory is async.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // set() throws when called from a Server Component (cookies can't be
            // written during render). That's fine: proxy.ts refreshes the
            // session cookie on every request, so nothing is lost here.
          }
        },
      },
    },
  );
}
