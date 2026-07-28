import { NextRequest, NextResponse } from "next/server";
import { getBusinessServer } from "@/lib/server/business-repo";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const business = await getBusinessServer(id);
    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }
    return NextResponse.json(business);
  } catch (error) {
    console.error("get business error:", error);
    return NextResponse.json(
      { error: "Couldn't load the business. Please try again." },
      { status: 500 }
    );
  }
}
