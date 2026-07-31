import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Extracts and verifies the user's JWT token from the Request headers or cookies.
 * Returns the Supabase User object if the token is valid, or null otherwise.
 */
export async function getAuthUser(req: Request): Promise<any | null> {
  let token: string | null = null;

  // 1. Try to extract from Authorization Header (Bearer token)
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  // 2. Try to extract from cookies (Next.js middleware or direct page requests)
  if (!token) {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const parts = cookie.trim().split("=");
      const key = parts[0];
      const val = parts.slice(1).join("=");
      if (key && val) {
        acc[key] = decodeURIComponent(val);
      }
      return acc;
    }, {} as Record<string, string>);

    token = cookies["sb-access-token"] || null;
  }

  if (!token) {
    return null;
  }

  try {
    // Create an instance of supabase client using the anon key to verify this token
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth helper token verification failed:", error);
    return null;
  }
}
