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
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  const { email, code } = body;

  if (!email || !email.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!code || !code.trim()) {
    return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'signup',
    });

    if (error) {
      console.error("Supabase OTP verification error:", error);
      return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 401 });
    }

    if (!data.session || !data.user) {
      return NextResponse.json({ error: "Failed to create session or retrieve user." }, { status: 401 });
    }

    // Since the email is now verified, we create the trial profile!
    let trialProfile = await getUserProfileServer(data.user.id);
    if (!trialProfile) {
      try {
        trialProfile = await createUserProfileServer(data.user.id);
      } catch (err) {
        console.error("Failed to initialize trial profile after verification:", err);
      }
    }

    const response = NextResponse.json({
      message: "Email verified successfully.",
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at,
        trialProfile,
      }
    }, { status: 200 });

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
    console.error("Unhandled verification API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
