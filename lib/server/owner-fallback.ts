import "server-only";
import { promises as fs } from "fs";
import * as path from "path";

const OWNERS_FILE = path.join(process.cwd(), ".data/business_owners.json");

/**
 * Stores the association between a business ID and its owner's user ID locally as a fallback.
 */
export async function saveBusinessOwnerFallback(businessId: string, userId: string): Promise<void> {
  try {
    await fs.mkdir(path.dirname(OWNERS_FILE), { recursive: true });
    let owners: Record<string, string> = {};
    try {
      const raw = await fs.readFile(OWNERS_FILE, "utf-8");
      owners = JSON.parse(raw);
    } catch {}
    
    owners[businessId] = userId;
    await fs.writeFile(OWNERS_FILE, JSON.stringify(owners, null, 2), "utf-8");
  } catch (err: any) {
    console.error("Failed to save business owner fallback:", err.message);
  }
}

/**
 * Retrieves the owner's user ID for a given business ID.
 */
export async function getBusinessOwnerFallback(businessId: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(OWNERS_FILE, "utf-8");
    const owners = JSON.parse(raw);
    return owners[businessId] || null;
  } catch {
    return null;
  }
}

/**
 * Retrieves all business IDs owned by a specific user.
 */
export async function getBusinessIdsForUserFallback(userId: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(OWNERS_FILE, "utf-8");
    const owners = JSON.parse(raw) as Record<string, string>;
    return Object.keys(owners).filter(bizId => owners[bizId] === userId);
  } catch {
    return [];
  }
}
