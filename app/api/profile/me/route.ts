import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server/auth-helper";
import { getUserProfileServer, createUserProfileServer } from "@/lib/server/profile-repo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized access — login required." },
      { status: 401 }
    );
  }

  let trialProfile = await getUserProfileServer(user.id);
  
  if (!trialProfile) {
    try {
      // Auto-initialize free trial plan for legacy accounts on first access
      trialProfile = await createUserProfileServer(user.id);
    } catch (err) {
      console.error("Warning: Failed to auto-initialize trial profile for legacy user:", err);
    }
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
    trialProfile: trialProfile,
  }, { status: 200 });
}
