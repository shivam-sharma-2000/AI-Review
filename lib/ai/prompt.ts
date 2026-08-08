import type { GenerateReviewRequest } from "@/lib/types";

export function buildReviewPrompt(input: GenerateReviewRequest): string {
  const { rating, liked, comments, language, business } = input;
  const hasDetails = Boolean(liked?.trim() || comments?.trim());

  const STYLE_VARIATIONS = [
    "Begin with a friendly, personal opening statement.",
    "Write in a casual, conversational, and direct style.",
    "Focus on the general helpful atmosphere and overall service vibe.",
    "Emphasize the ease of experience, speed, or overall reliability.",
    "Keep sentences concise and write in a straightforward, natural style.",
    "Focus on the positive impression of the business model or setup."
  ];
  const randomStyle = STYLE_VARIATIONS[Math.floor(Math.random() * STYLE_VARIATIONS.length)];

  const detailsBlock = hasDetails
    ? `What the customer liked most: ${liked || "Not specified"}
Additional comments from the customer: ${comments || "None"}`
    : `The customer did not provide specific text comments — only a star rating of ${rating}/5.`;

  const guidance = hasDetails
    ? "Elaborate naturally on the customer's specific highlights while maintaining a warm, authentic tone."
    : `Since no specific comments were provided, elaborate on what a typical ${rating}-star experience at a "${business.type}" feels like in broad, realistic terms (e.g., overall vibe, customer service, reliability, ease of experience) without inventing specific fake names, prices, or exact dishes/items.`;

  return `You write authentic, first-person Google reviews for real customers based on their overall rating and feedback.

Business name: ${business.name}
Business type: ${business.type}
Business description: ${business.description || "N/A"}
Relevant keywords (incorporate naturally if helpful): ${
    business.keywords.length ? business.keywords.join(", ") : "N/A"
  }

Customer's star rating: ${rating} out of 5
${detailsBlock}

Guidance:
${guidance}

Write the review in this language: ${language}.

Rules:
- Write a well-rounded review consisting of AT LEAST 3 to 4 full sentences (or 3 to 4 distinct lines/paragraphs).
- Do not invent specific staff names, exact dates, prices, or fake events.
- Reflect the tone implied by the star rating honestly (a 3-star review should sound balanced/mixed, whereas a 5-star review should sound enthusiastic).
- Sound like a real, natural customer writing casually — avoid marketing jargon or press-release phrasing.
- Write ONLY the body text of the review. Do not include quotation marks, titles, headers, bullet points, or sign-offs.
- Ensure this review draft is completely unique, original, and distinct. Vary the sentence structure, openings, and vocabulary. Do not use generic review cliches or templates.
- Focus style variation for uniqueness: ${randomStyle}`;
}

export const REVIEW_SYSTEM_PROMPT =
  "You are a helpful writing assistant that drafts well-structured, multi-sentence customer reviews based on ratings and feedback. You ensure reviews are detailed, authentic, and at least 3-4 sentences long.";

/** A normalized error thrown by either provider so the route can map it to an HTTP status + message. */
export class AiProviderError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
  }
}