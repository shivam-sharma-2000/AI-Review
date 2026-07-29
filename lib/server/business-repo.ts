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
  };
}

export async function saveBusinessServer(business: Business): Promise<Business> {
  const { data, error } = await supabase
    .from("businesses")
    .upsert(mapToRow(business))
    .select()
    .single();

  if (error) {
    console.error("Error saving business to Supabase:", error);
    throw new Error("Failed to save business");
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
    console.error("Error fetching business from Supabase:", error);
    return null;
  }

  return data ? mapFromRow(data) : null;
}

export async function listBusinessesServer(): Promise<Business[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing businesses from Supabase:", error);
    return [];
  }

  return (data || []).map(mapFromRow);
}
