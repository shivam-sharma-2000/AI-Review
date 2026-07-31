import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createUserProfileServer } from "@/lib/server/profile-repo";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(req: NextRequest) {
  let body: any;
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
    // Initialize Supabase with Service Role Key to manage users administratively
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the user using admin panel to auto-confirm email for frictionless demo flow
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
    });

    if (error) {
      console.error("Supabase user registration error:", error);
      // Map common Supabase Auth errors
      if (error.status === 422 || error.message?.includes("already registered")) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || "Failed to register user." }, { status: 400 });
    }

    // 2. Initialize a default Free Trial profile for the new user
    try {
      await createUserProfileServer(data.user.id);
    } catch (profileErr: any) {
      console.error("Warning: Failed to initialize trial profile:", profileErr.message);
      // We don't fail the whole registration if profile creation fails (e.g. migration hasn't run yet),
      // but we log it. In production, we'd fail or retry.
    }

    return NextResponse.json({
      message: "User registered successfully.",
      user: {
        id: data.user.id,
        email: data.user.email,
        createdAt: data.user.created_at,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Unhandled registration API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
