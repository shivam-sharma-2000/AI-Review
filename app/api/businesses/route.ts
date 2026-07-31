import { NextRequest, NextResponse } from "next/server";
import { saveBusinessServer, listBusinessesServer } from "@/lib/server/business-repo";
import { getAuthUser } from "@/lib/server/auth-helper";
import { slugifyBusinessId } from "@/lib/slug";
import type { Business } from "@/lib/types";

export const runtime = "nodejs";

type CreateBusinessInput = Omit<Business, "id" | "createdAt" | "userId">;

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access — login required." }, { status: 401 });
  }

  let input: CreateBusinessInput;
  try {
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json({ error: "Empty request body." }, { status: 400 });
    }
    input = JSON.parse(raw) as CreateBusinessInput;
  } catch {
    return NextResponse.json(
      { error: "Malformed request body — expected JSON." },
      { status: 400 }
    );
  }

  if (!input.name?.trim()) {
    return NextResponse.json({ error: "Business name is required." }, { status: 400 });
  }
  if (!input.googleReviewUrl?.trim()) {
    return NextResponse.json({ error: "Google Review URL is required." }, { status: 400 });
  }

  try {
    const business: Business = {
      id: slugifyBusinessId(input.name),
      name: input.name.trim(),
      type: input.type ?? "",
      logoDataUrl: input.logoDataUrl ?? null,
      address: input.address ?? "",
      googleReviewUrl: input.googleReviewUrl.trim(),
      description: input.description ?? "",
      keywords: Array.isArray(input.keywords) ? input.keywords : [],
      createdAt: new Date().toISOString(),
      userId: user.id, // Store owner's User ID
    };

    const saved = await saveBusinessServer(business);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("create business error:", error);
    return NextResponse.json(
      { error: "Couldn't save the business. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access — login required." }, { status: 401 });
  }

  try {
    // List only businesses owned by this user
    const list = await listBusinessesServer(user.id);
    return NextResponse.json(list);
  } catch (error) {
    console.error("list businesses error:", error);
    return NextResponse.json(
      { error: "Couldn't load the businesses. Please try again." },
      { status: 500 }
    );
  }
}

