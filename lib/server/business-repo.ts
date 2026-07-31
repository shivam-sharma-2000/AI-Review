import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Business } from "@/lib/types";

// Initialize Supabase client
// For server-side operations, we ideally use a service role key to bypass RLS,
// but anon key works if RLS is properly configured for public access or disabled.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

interface BusinessRow {
  id: string;
  name: string;
  type: string;
  logo_data_url: string | null;
  address: string;
  google_review_url: string;
  description: string;
  keywords: string[] | null;
  created_at: string;
  user_id?: string | null;
}

/**
 * Maps a database row to the Business interface.
 */
function mapFromRow(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    logoDataUrl: row.logo_data_url,
    address: row.address,
    googleReviewUrl: row.google_review_url,
    description: row.description,
    keywords: row.keywords || [],
    createdAt: row.created_at,
    userId: row.user_id,
  };
}

/**
 * Maps a Business object to a database row.
 */
function mapToRow(business: Business): BusinessRow {
  return {
    id: business.id,
    name: business.name,
    type: business.type,
    logo_data_url: business.logoDataUrl,
    address: business.address,
    google_review_url: business.googleReviewUrl,
    description: business.description,
    keywords: business.keywords,
    created_at: business.createdAt,
    user_id: business.userId,
  };
}

export async function saveBusinessServer(business: Business): Promise<Business> {
  const row = mapToRow(business);
  
  let { data, error } = await supabase
    .from("businesses")
    .upsert(row)
    .select()
    .single();

  if (error) {
    // Fallback: retry without user_id column if the database column does not exist
    if (error.message?.includes("user_id") || error.code === "PGRST204") {
      console.warn("user_id column not found in businesses table. Saving with fallback.");
      const fallbackRow = { ...row };
      delete fallbackRow.user_id;

      const retryResult = await supabase
        .from("businesses")
        .upsert(fallbackRow)
        .select()
        .single();

      if (retryResult.error) {
        console.error("Error saving business to Supabase (fallback retry):", retryResult.error.message);
        throw new Error("Failed to save business");
      }
      
      data = retryResult.data;
      error = null;
    } else {
      console.error("Error saving business to Supabase:", error.message);
      throw new Error("Failed to save business");
    }
  }

  // If business has owner ID, save the mapping locally as a persistent backup
  if (business.userId) {
    const { saveBusinessOwnerFallback } = require("./owner-fallback");
    await saveBusinessOwnerFallback(business.id, business.userId);
  }

  return mapFromRow(data);
}

export async function getBusinessServer(id: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Record not found
      return null;
    }
    console.error("Error fetching business from Supabase:", error.message);
    return null;
  }

  const business = data ? mapFromRow(data) : null;
  
  // Fill owner ID from local fallback if missing in DB row
  if (business && !business.userId) {
    const { getBusinessOwnerFallback } = require("./owner-fallback");
    business.userId = await getBusinessOwnerFallback(id);
  }

  return business;
}

export async function listBusinessesServer(userId?: string): Promise<Business[]> {
  let query = supabase.from("businesses").select("*");
  
  if (userId) {
    // Try querying by user_id column directly
    const { data, error } = await query.eq("user_id", userId).order("created_at", { ascending: false });
    
    if (error) {
      // Fallback: if user_id column does not exist, filter in-memory using local owner mappings
      if (error.message?.includes("user_id") || error.code === "PGRST204") {
        console.warn("user_id column not found in businesses table. Filtering list via fallback mapping.");
        const { getBusinessIdsForUserFallback } = require("./owner-fallback");
        const userBizIds = await getBusinessIdsForUserFallback(userId);

        const allRes = await supabase
          .from("businesses")
          .select("*")
          .order("created_at", { ascending: false });

        if (allRes.error) {
          console.error("Error listing businesses (fallback fetch):", allRes.error.message);
          return [];
        }

        const mappedList = (allRes.data || []).map(mapFromRow);
        
        // Populate owner ID on the returned profiles from mapping and filter
        for (const biz of mappedList) {
          const { getBusinessOwnerFallback } = require("./owner-fallback");
          biz.userId = await getBusinessOwnerFallback(biz.id);
        }

        return mappedList.filter(biz => userBizIds.includes(biz.id) || biz.userId === userId);
      }
      
      console.error("Error listing businesses from Supabase:", error.message);
      return [];
    }

    return (data || []).map(mapFromRow);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing businesses from Supabase:", error.message);
    return [];
  }

  const list = (data || []).map(mapFromRow);
  
  // Backfill owner IDs for all businesses from local storage
  for (const biz of list) {
    const { getBusinessOwnerFallback } = require("./owner-fallback");
    biz.userId = await getBusinessOwnerFallback(biz.id);
  }

  return list;
}
