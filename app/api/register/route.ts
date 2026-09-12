import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createUserProfileServer } from "@/lib/server/profile-repo";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
  }

  try {
    // Use the anon key to trigger the standard sign-up flow which sends the confirmation email
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
    
    const { data, error } = await supabaseAnon.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      console.error("Supabase user registration error:", error);
      if (error.status === 422 || error.message?.includes("already registered")) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || "Failed to register user." }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Failed to create user." }, { status: 400 });
    }

    // Note: We deliberately do NOT create the trial profile here.
    // We wait until their first successful login (which requires a confirmed email)
    // to prevent spam accounts from flooding the trial database.

    return NextResponse.json({
      message: "User registered successfully.",
      user: {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Unhandled registration API error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
