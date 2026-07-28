import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Business } from "@/lib/types";

/**
 * Server-side persistence for business profiles, stored as JSON on disk.
 *
 * This replaces the earlier localStorage-based approach, which only ever
 * worked on the single browser/device that created the business — a QR
 * code scanned from a different phone had no way to see it. Storing data
 * here, on the server, means ANY device that can reach this server (same
 * machine, same network, or a real deployment) can look up a business by
 * ID, which is what makes "scan QR on any phone" actually work.
 *
 * This is a lightweight, dependency-free store meant for local dev / a
 * single always-on Node process (e.g. `npm run start` on a VPS). It is
 * NOT suitable for serverless/edge deployments (Vercel, etc.) because
 * their filesystem is ephemeral and not shared across instances. For a
 * real production deployment, swap the functions below for a proper
 * database (Postgres, Supabase, PlanetScale, etc.) — the function
 * signatures are intentionally kept simple so that's a drop-in change.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "businesses.json");

// Serializes reads/writes within a single process so concurrent requests
// can't interleave and corrupt the JSON file.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.catch(() => undefined);
  return result;
}

async function readAll(): Promise<Record<string, Business>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Record<string, Business>;
  } catch {
    return {};
  }
}

async function writeAll(data: Record<string, Business>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpFile = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmpFile, DATA_FILE);
}

export async function saveBusinessServer(business: Business): Promise<Business> {
  return enqueue(async () => {
    const all = await readAll();
    all[business.id] = business;
    await writeAll(all);
    return business;
  });
}

export async function getBusinessServer(id: string): Promise<Business | null> {
  const all = await readAll();
  return all[id] ?? null;
}

export async function listBusinessesServer(): Promise<Business[]> {
  const all = await readAll();
  return Object.values(all).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
