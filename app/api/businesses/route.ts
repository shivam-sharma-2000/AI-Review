import { NextRequest, NextResponse } from "next/server";
import { saveBusinessServer } from "@/lib/server/business-repo";
import { slugifyBusinessId } from "@/lib/slug";
import type { Business } from "@/lib/types";

export const runtime = "nodejs";

type CreateBusinessInput = Omit<Business, "id" | "createdAt">;

export async function POST(req: NextRequest) {
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
