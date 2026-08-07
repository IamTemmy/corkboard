import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before every matched request. Its one job for auth: refresh the user's
// session (an access token expires after ~1 hour) and write the refreshed
// cookie back onto the response, so logins don't silently drop.
//
// NOTE: In Next 16 this file is `proxy.ts`, not `middleware.ts` — the middleware
// convention was renamed to proxy. Behaviour is the same. (See AGENTS.md.)
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update the request (so downstream sees the new cookies)...
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          // ...and the response (so the browser stores them).
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: don't run other code between creating the client and this call.
  // getUser() revalidates the token with Supabase and triggers the cookie
  // refresh above when needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on all routes except static assets and image files — those don't need a
  // session and we don't want to slow them down.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
