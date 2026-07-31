import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req: NextRequest) {
  let token = req.cookies.get("sb-access-token")?.value;
  
  // Fallback: check Authorization: Bearer <token> header for API requests
  if (!token) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }
  
  const { pathname } = req.nextUrl;

  // 1. Allow public GET requests for specific business details: /api/businesses/[id]
  const pathSegments = pathname.split("/");
  if (pathname.startsWith("/api/businesses/") && pathSegments.length > 3 && req.method === "GET") {
    return NextResponse.next();
  }

  // 2. Define target routes that require authentication
  const isProtectedRoute = 
    pathname.startsWith("/setup") || 
    pathname.startsWith("/businesses") || 
    pathname.startsWith("/qr") || 
    pathname.startsWith("/api/businesses");

  if (isProtectedRoute) {
    if (!token) {
      // For page routes, redirect to login page with a redirect query param
      if (!pathname.startsWith("/api/")) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      // For API routes, return 401 Unauthorized
      return NextResponse.json(
        { error: "Unauthorized access — login required." },
        { status: 401 }
      );
    }

    try {
      // Verify token validity against Supabase Auth
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      );
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        // Token is invalid or expired
        if (!pathname.startsWith("/api/")) {
          const loginUrl = new URL("/login", req.url);
          loginUrl.searchParams.set("redirect", pathname);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete("sb-access-token"); // Clear expired cookie
          return response;
        }
        return NextResponse.json(
          { error: "Session expired — please login again." },
          { status: 401 }
        );
      }
    } catch (err) {
      console.error("Middleware authentication check failed:", err);
      return NextResponse.json(
        { error: "Authentication system error." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/setup/:path*",
    "/businesses/:path*",
    "/qr/:path*",
    "/api/businesses/:path*",
  ],
};
