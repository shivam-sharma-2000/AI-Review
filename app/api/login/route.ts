import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserProfileServer, createUserProfileServer } from "@/lib/server/profile-repo";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json({ error: "Empty request body." }, { status: 400 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Malformed request body — expected JSON." }, { status: 400 });
  }

  const { email, password } = body;

  // 1. Validation
  if (!email || !email.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!password || !password.trim()) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  try {
    // Connect to Supabase Auth with anon key to authenticate user credentials
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      console.error("Supabase user login error:", error);
      if (error.status === 400 || error.message?.includes("Invalid login credentials")) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }
      return NextResponse.json({ error: error.message || "Failed to log in." }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({ error: "No session generated. Please verify your account." }, { status: 401 });
    }

    // 2. Fetch user trial profile to include in login response
    let trialProfile = await getUserProfileServer(data.user.id);
    if (!trialProfile) {
      try {
        trialProfile = await createUserProfileServer(data.user.id);
      } catch (err) {
        console.error("Warning: Failed to auto-initialize trial profile at login:", err);
      }
    }

    // Build the JSON response containing token and user info
    const response = NextResponse.json({
      message: "Login successful.",
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at,
        trialProfile: trialProfile,
      }
    }, { status: 200 });

    // 3. Store JWT inside an HttpOnly cookie so the Next.js middleware can read it securely
    const protocol = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol || "";
    const isSecureConnection = protocol.toLowerCase().startsWith("https");

    response.cookies.set("sb-access-token", data.session.access_token, {
      path: "/",
      httpOnly: true,
      secure: isSecureConnection,
      sameSite: "lax",
      maxAge: data.session.expires_in,
    });

    return response;

  } catch (error) {
    console.error("Unhandled login API error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
