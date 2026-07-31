import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

export interface TrialProfile {
  id: string;
  reviewCount: number;
  reviewLimit: number;
  plan: string;
  trialEnd: string;
  createdAt: string;
}

/**
 * Helper to fetch fallback profile details from auth.users metadata if the public table doesn't exist.
 */
async function getMetadataProfile(userId: string): Promise<TrialProfile | null> {
  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !user) {
      console.error("Auth admin getUserById failed:", error?.message);
      return null;
    }

    const meta = user.user_metadata || {};
    // If trial details don't exist yet, we initialize them inline
    const reviewLimit = typeof meta.reviewLimit === "number" ? meta.reviewLimit : 100;
    const reviewCount = typeof meta.reviewCount === "number" ? meta.reviewCount : 0;
    const plan = meta.plan || "free_trial";
    
    let trialEnd = meta.trialEnd;
    if (!trialEnd) {
      const date = new Date(user.created_at || Date.now());
      date.setDate(date.getDate() + 30);
      trialEnd = date.toISOString();
    }

    return {
      id: userId,
      reviewCount,
      reviewLimit,
      plan,
      trialEnd,
      createdAt: user.created_at || new Date().toISOString(),
    };
  } catch (err: any) {
    console.error("Failed to read fallback metadata profile:", err.message);
    return null;
  }
}

/**
 * Fetches the trial/subscription profile of a user from the database.
 */
export async function getUserProfileServer(userId: string): Promise<TrialProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // If table does not exist, fall back to auth.users metadata storage
      if (error.code === "PGRST205" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
        return await getMetadataProfile(userId);
      }
      console.error("Error fetching user profile from Supabase table:", error.message);
      return null;
    }

    return {
      id: data.id,
      reviewCount: data.review_count,
      reviewLimit: data.review_limit,
      plan: data.plan,
      trialEnd: data.trial_end,
      createdAt: data.created_at,
    };
  } catch (err: any) {
    console.error("Fatal error fetching user profile:", err.message);
    return await getMetadataProfile(userId);
  }
}

/**
 * Automatically creates a default free trial profile for a new user.
 */
export async function createUserProfileServer(userId: string): Promise<TrialProfile> {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial duration

  const profileData = {
    id: userId,
    review_count: 0,
    review_limit: 100, // 100 free AI review drafts limit
    plan: "free_trial",
    trial_end: trialEnd.toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      // If table does not exist, fall back to writing to auth.users metadata
      if (error.code === "PGRST205" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
        console.log("user_profiles table not found. Using auth.users metadata fallback.");
        const { error: metaError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            reviewCount: 0,
            reviewLimit: 100,
            plan: "free_trial",
            trialEnd: trialEnd.toISOString(),
          }
        });

        if (metaError) {
          throw new Error("Metadata profile creation failed: " + metaError.message);
        }

        return {
          id: userId,
          reviewCount: 0,
          reviewLimit: 100,
          plan: "free_trial",
          trialEnd: trialEnd.toISOString(),
          createdAt: new Date().toISOString(),
        };
      }
      throw error;
    }

    return {
      id: data.id,
      reviewCount: data.review_count,
      reviewLimit: data.review_limit,
      plan: data.plan,
      trialEnd: data.trial_end,
      createdAt: data.created_at,
    };
  } catch (err: any) {
    console.error("Profile creation error, using metadata fallback:", err.message);
    // Final fallback to user metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        reviewCount: 0,
        reviewLimit: 100,
        plan: "free_trial",
        trialEnd: trialEnd.toISOString(),
      }
    });
    return {
      id: userId,
      reviewCount: 0,
      reviewLimit: 100,
      plan: "free_trial",
      trialEnd: trialEnd.toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Increments the user's generated review count in the database by 1.
 */
export async function incrementReviewCountServer(userId: string): Promise<boolean> {
  const profile = await getUserProfileServer(userId);
  if (!profile) {
    console.error(`Cannot increment review count: profile not found for user ${userId}`);
    return false;
  }

  try {
    const { error } = await supabase
      .from("user_profiles")
      .update({ review_count: profile.reviewCount + 1 })
      .eq("id", userId);

    if (error) {
      // Fallback for metadata profile increments
      if (error.code === "PGRST205" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
        const { error: metaError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            reviewCount: profile.reviewCount + 1,
            reviewLimit: profile.reviewLimit,
            plan: profile.plan,
            trialEnd: profile.trialEnd,
          }
        });
        return !metaError;
      }
      console.error("Error incrementing review count in Supabase table:", error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("Exception during review count increment:", err.message);
    const { error: metaError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        reviewCount: profile.reviewCount + 1,
        reviewLimit: profile.reviewLimit,
        plan: profile.plan,
        trialEnd: profile.trialEnd,
      }
    });
    return !metaError;
  }
}
