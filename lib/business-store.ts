import type { Business } from "@/lib/types";
import { apiFetch } from "@/lib/api-client";

/**
 * Client-side helpers for business profiles.
 *
 * These call server API routes (backed by lib/server/business-repo.ts)
 * rather than localStorage. That's what lets a business created on one
 * device (e.g. a laptop during setup) be looked up from a completely
 * different device (e.g. a customer's phone scanning the QR code) — the
 * data now lives on the server both devices talk to, not in one
 * browser's local storage.
 */

export type CreateBusinessInput = Omit<Business, "id" | "createdAt">;

export async function createBusiness(input: CreateBusinessInput): Promise<Business> {
  const res = await apiFetch("/api/businesses", {
    method: "POST",
    body: input,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Couldn't create the business. Please try again.");
  }
  return data as Business;
}

export async function getBusiness(id: string): Promise<Business | null> {
  const res = await apiFetch(`/api/businesses/${encodeURIComponent(id)}`, {
    skipAuthErrorHandling: true,
  });
  if (res.status === 404) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Couldn't load the business. Please try again.");
  }
  return data as Business;
}

export async function listBusinesses(): Promise<Business[]> {
  const res = await apiFetch("/api/businesses");
  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    throw new Error(data.error || "Couldn't load the businesses. Please try again.");
  }
  return data as Business[];
}

export function getReviewUrl(businessId: string): string {
  if (typeof window === "undefined") return `/review/${businessId}`;
  return `${window.location.origin}/review/${businessId}`;
}
