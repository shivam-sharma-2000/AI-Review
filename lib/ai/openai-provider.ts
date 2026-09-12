import OpenAI from "openai";
import type { GenerateReviewRequest } from "@/lib/types";
import { buildReviewPrompt, REVIEW_SYSTEM_PROMPT, AiProviderError } from "@/lib/ai/prompt";

export async function generateReviewWithOpenAI(
  input: GenerateReviewRequest
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AiProviderError(
      "OPENAI_API_KEY is not configured on the server. Add it to your .env.local file.",
      500
    );
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 600,
      messages: [
        { role: "system", content: REVIEW_SYSTEM_PROMPT },
        { role: "user", content: buildReviewPrompt(input) },
      ],
    });

    const review = completion.choices[0]?.message?.content?.trim();
    if (!review) {
      throw new AiProviderError("OpenAI did not return a review. Please try again.", 502);
    }
    return review;
  } catch (error) {
    if (error instanceof AiProviderError) throw error;

    if (error instanceof OpenAI.APIError) {
      const status = error.status ?? 500;
      let message = error.message || "OpenAI returned an error.";

      if (status === 401) {
        message =
          "OpenAI rejected the API key (401 Unauthorized). Check OPENAI_API_KEY in .env.local, then restart `npm run dev`.";
      } else if (status === 429) {
        message =
          "OpenAI rate limit or quota exceeded (429). Check your usage/billing at platform.openai.com.";
      } else if (status === 404) {
        message =
          "The configured OpenAI model isn't available for this API key/org (404). Try a different model.";
      }

      throw new AiProviderError(message, status);
    }

    const message = error instanceof Error ? error.message : "Unknown OpenAI error.";
    throw new AiProviderError(message, 500);
  }
}
