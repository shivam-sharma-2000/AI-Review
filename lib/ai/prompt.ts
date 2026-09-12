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
- CRITICAL LENGTH: Your review MUST be exactly 4 or 5 sentences long. Under no circumstances should you write a 1-sentence or 2-sentence review.
- CRITICAL FORMATTING: You MUST separate every single sentence with a double line break (blank line) so they appear as separate paragraphs.

Use this EXACT structure for your output:

[First sentence: Overall impression and friendly opening]

[Second sentence: Specific detail about the experience, staff, or product]

[Third sentence: Another supporting detail or emotional response]

[Fourth sentence: A strong closing thought or recommendation]

- Do not include the bracketed text like "[First sentence:]". Just write the actual sentences separated by blank lines.
- Do not invent specific staff names, exact dates, prices, or fake events.
- Reflect the tone implied by the star rating honestly.
- Sound like a real, natural customer writing casually — avoid marketing jargon.
- Focus style variation for uniqueness: ${randomStyle}`;
}

export const REVIEW_SYSTEM_PROMPT =
  "You are an expert writing assistant that drafts highly detailed, multi-sentence customer reviews. You are strictly programmed to output detailed paragraphs containing exactly 4 to 5 well-developed lines.";

/** A normalized error thrown by either provider so the route can map it to an HTTP status + message. */
export class AiProviderError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
  }
}