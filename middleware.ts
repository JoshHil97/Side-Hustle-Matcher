import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("jobcrm_token")?.value;

  const isDashboardPath = pathname.startsWith("/dashboard");

  if (isDashboardPath && !token) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  // Always allow /login and /signup.
  // A stale cookie can exist even when auth is invalid, and forcing redirects here can create loops.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
