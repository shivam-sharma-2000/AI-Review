import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({
    message: "Logged out successfully."
  }, { status: 200 });

  // Clear the cookie immediately by setting its expiration date in the past
  response.cookies.set("sb-access-token", "", {
    path: "/",
    expires: new Date(0),
    httpOnly: true,
  });

  return response;
}
