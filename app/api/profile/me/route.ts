import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server/auth-helper";
import { getUserProfileServer } from "@/lib/server/profile-repo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized access — login required." },
      { status: 401 }
    );
  }

  const trialProfile = await getUserProfileServer(user.id);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
    trialProfile: trialProfile,
  }, { status: 200 });
}
