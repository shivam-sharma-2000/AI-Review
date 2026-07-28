import { NextRequest, NextResponse } from "next/server";
import type { GenerateReviewRequest } from "@/lib/types";
import { AiProviderError } from "@/lib/ai/prompt";
import { generateReviewWithOpenAI } from "@/lib/ai/openai-provider";
import { generateReviewWithGemini } from "@/lib/ai/gemini-provider";

export const runtime = "nodejs";

type Provider = "openai" | "gemini";

function resolveProvider(): Provider {
  const raw = (process.env.AI_PROVIDER || "openai").trim().toLowerCase();
  return raw === "gemini" ? "gemini" : "openai";
}

export async function POST(req: NextRequest) {
  let body: GenerateReviewRequest;
  try {
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json(
        { error: "Empty request body." },
        { status: 400 }
      );
    }
    body = JSON.parse(raw) as GenerateReviewRequest;
  } catch {
    return NextResponse.json(
      { error: "Malformed request body — expected JSON." },
      { status: 400 }
    );
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
