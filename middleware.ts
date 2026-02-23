import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("jobcrm_token")?.value;

  const isDashboardPath = pathname.startsWith("/dashboard");
  const isAuthPath = pathname === "/login" || pathname === "/signup";

  if (isDashboardPath && !token) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
