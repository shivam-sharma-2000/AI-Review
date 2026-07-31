export type Language = "English" | "Hindi" | "Gujarati" | "Marathi";

export const LANGUAGES: Language[] = ["English", "Hindi", "Gujarati", "Marathi"];

export const BUSINESS_TYPES = [
  "Restaurant / Cafe",
  "Salon / Spa",
  "Retail Store",
  "Clinic / Healthcare",
  "Hotel / Stay",
  "Gym / Fitness",
  "Automotive",
  "Professional Services",
  "Education",
  "Other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export interface Business {
  id: string;
  name: string;
  type: string;
  logoDataUrl: string | null;
  address: string;
  googleReviewUrl: string;
  description: string;
  keywords: string[];
  createdAt: string;
  userId?: string | null;
}

export interface ReviewFormInput {
  rating: number;
  liked: string;
  comments: string;
  language: Language;
}

export interface GenerateReviewRequest extends ReviewFormInput {
  businessId?: string;
  business: {
    name: string;
    type: string;
    description: string;
    keywords: string[];
  };
}

export interface GenerateReviewResponse {
  review: string;
}
