import { GoogleGenAI } from "@google/genai";
import type { GenerateReviewRequest } from "@/lib/types";
import { buildReviewPrompt, REVIEW_SYSTEM_PROMPT, AiProviderError } from "@/lib/ai/prompt";

interface GoogleApiErrorShape {
  error?: { code?: number; message?: string; status?: string };
}

function extractGoogleErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const maybe = error as { status?: number; code?: number };
    if (typeof maybe.status === "number") return maybe.status;
    if (typeof maybe.code === "number") return maybe.code;
  }
  return undefined;
}

function extractGoogleErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error && error.message) {
    // The SDK often throws with a JSON string as the message body.
    try {
      const parsed = JSON.parse(error.message) as GoogleApiErrorShape;
      if (parsed.error?.message) return parsed.error.message;
    } catch {
      return error.message;
    }
    return error.message;
  }
  return undefined;
}

const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-2.0-flash",
];

export async function generateReviewWithGemini(
  input: GenerateReviewRequest
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiProviderError(
      "GEMINI_API_KEY is not configured on the server. Add it to your .env.local file.",
      500
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const envModel = process.env.GEMINI_MODEL?.trim();
  // If the person pinned a model via env, only try that one. Otherwise walk
  // through a list of currently-known model names, since Google frequently
  // renames/retires versions and a single hardcoded default tends to 404
  // after a few months.
  const candidates = envModel ? [envModel] : FALLBACK_MODELS;

  let lastError: unknown;

  for (const model of candidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: buildReviewPrompt(input),
        config: {
          systemInstruction: REVIEW_SYSTEM_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 800, // <--- Increased from 320 to allow 3-4 full sentences
        },
      });

      const review = response.text?.trim();
      if (!review) {
        throw new AiProviderError("Gemini did not return a review. Please try again.", 502);
      }
      return review;
    } catch (error) {
      lastError = error;
      const status = extractGoogleErrorStatus(error);
      // Only fall through to the next candidate on a "model not found"
      // style error. Anything else (bad key, quota, etc.) should surface
      // immediately rather than retrying uselessly against other models.
      if (status !== 404) break;
    }
  }

  if (lastError instanceof AiProviderError) throw lastError;

  const status = extractGoogleErrorStatus(lastError) ?? 500;
  let message = extractGoogleErrorMessage(lastError) || "Gemini returned an error.";

  if (status === 400 && /API key not valid/i.test(message)) {
    message =
      "Gemini rejected the API key (invalid key). Check GEMINI_API_KEY in .env.local, then restart `npm run dev`.";
  } else if (status === 403) {
    message =
      "Gemini refused the request (403). The API key may not have access to this model or the API isn't enabled.";
  } else if (status === 429) {
    message =
      "Gemini rate limit or quota exceeded (429). Check your usage at aistudio.google.com.";
  } else if (status === 404) {
    message = envModel
      ? `The configured Gemini model ("${envModel}") wasn't found (404). Remove GEMINI_MODEL from .env.local to let the app auto-select a working model, or try a different one from https://ai.google.dev/gemini-api/docs/models.`
      : `None of the known Gemini model names were available for this API key (404). Check https://ai.google.dev/gemini-api/docs/models and set GEMINI_MODEL in .env.local to one your key supports.`;
  }

  throw new AiProviderError(message, status >= 400 && status < 600 ? status : 500);
}
