import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isApiAdmin = req.nextUrl.pathname.startsWith("/api/admin");

    if (token?.role !== "ADMIN") {
      if (isApiAdmin) {
        return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};
