import { NextRequest, NextResponse } from "next/server";
import type { GenerateReviewRequest } from "@/lib/types";
import { AiProviderError } from "@/lib/ai/prompt";
import { generateReviewWithOpenAI } from "@/lib/ai/openai-provider";
import { generateReviewWithGemini } from "@/lib/ai/gemini-provider";
import { getBusinessServer } from "@/lib/server/business-repo";
import { getUserProfileServer, incrementReviewCountServer } from "@/lib/server/profile-repo";

export const runtime = "nodejs";

type Provider = "openai" | "gemini";

function resolveProvider(): Provider {
  const raw = (process.env.AI_PROVIDER || "openai").trim().toLowerCase();
  return raw === "gemini" ? "gemini" : "openai";
}

interface RequestWithBusinessId extends GenerateReviewRequest {
  businessId?: string;
}

export async function POST(req: NextRequest) {
  let body: RequestWithBusinessId;
  try {
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json(
        { error: "Empty request body." },
        { status: 400 }
      );
    }
    body = JSON.parse(raw) as RequestWithBusinessId;
  } catch {
    return NextResponse.json(
      { error: "Malformed request body — expected JSON." },
      { status: 400 }
    );
  }

  // 1. Enforce Free Trial limits if businessId is provided
  let businessOwnerId: string | null = null;
  if (body.businessId) {
    try {
      const business = await getBusinessServer(body.businessId);
      if (!business) {
        return NextResponse.json({ error: "Business not found." }, { status: 404 });
      }

      if (business.userId) {
        businessOwnerId = business.userId;
        const profile = await getUserProfileServer(business.userId);
        if (profile) {
          const isExpired = new Date(profile.trialEnd) < new Date();
          const limitReached = profile.reviewCount >= profile.reviewLimit;

          if (isExpired || limitReached) {
            return NextResponse.json(
              { error: "Upgrade Required" },
              { status: 403 }
            );
          }
        }
      }
    } catch (err) {
      console.error("Error checking trial limits:", err instanceof Error ? err.message : String(err));
      // Fallback: log error and proceed to not block review generations for customers
    }
  }

  try {
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "A rating between 1 and 5 is required." },
        { status: 400 }
      );
    }

    const provider = resolveProvider();
    const review =
      provider === "gemini"
        ? await generateReviewWithGemini(body)
        : await generateReviewWithOpenAI(body);

    // 2. Increment review count on database for business owner
    if (businessOwnerId) {
      try {
        await incrementReviewCountServer(businessOwnerId);
      } catch (incErr) {
        console.error("Warning: Failed to increment review count:", incErr instanceof Error ? incErr.message : String(incErr));
      }
    }

    return NextResponse.json({ review, provider });
  } catch (error) {
    console.error("generate-review error:", error);

    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Something went wrong while generating the review.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
