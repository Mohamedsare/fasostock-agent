import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Proxy (Next.js 16 replacement for middleware). Refreshes the Supabase auth
 * session on each request and gates the dashboard:
 *  - unauthenticated users hitting /dashboard are sent to /login
 *  - authenticated users hitting /login are sent to /dashboard
 *
 * When Supabase is not configured (early development), gating is skipped so the
 * mock-data UI remains reachable (CLAUDE.md §30).
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isOnboarding = pathname === "/onboarding";
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    return NextResponse.redirect(url);
  };

  // Unauthenticated: protect the dashboard + onboarding.
  if (!user) {
    if (isDashboard || isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Authenticated: ensure the user has an organization (onboarding gate).
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  const hasOrg = Boolean((profile as { org_id?: string } | null)?.org_id);

  if (!hasOrg && (isDashboard || isAuthPage)) return redirectTo("/onboarding");
  if (hasOrg && (isAuthPage || isOnboarding)) return redirectTo("/dashboard");

  return response;
}

export const config = {
  matcher: [
    // Run on pages only; API routes (incl. the Wasender webhook) handle their
    // own auth and must not be gated/slowed by the session proxy.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
