const { createClient } = require("@supabase/supabase-js");

const testEmail = `restaurant_${Date.now()}@example.com`;
const testPassword = "Password123!";
const baseUrl = "http://localhost:3000";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTrialTests() {
  console.log("=== ReviewAI Free Trial System Integration Test ===");
  console.log("Testing with email:", testEmail);

  let userId = null;
  let authToken = null;
  let businessId = null;

  // 1. Create a new account
  try {
    console.log("\n[1] Registering restaurant account...");
    const regRes = await fetch(`${baseUrl}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const regData = await regRes.json();
    console.log("Reg Status:", regRes.status);
    
    if (regRes.status !== 201) {
      throw new Error(`Registration failed: ${regData.error}`);
    }

    userId = regData.user.id;
    console.log("Registered User ID:", userId);
  } catch (err) {
    console.error("Registration Error:", err.message);
    process.exit(1);
  }

  // 2. Log in to get JWT token
  try {
    console.log("\n[2] Logging in...");
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginData = await loginRes.json();
    console.log("Login Status:", loginRes.status);
    
    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    authToken = loginData.token;
  } catch (err) {
    console.error("Login Error:", err.message);
    process.exit(1);
  }

  // 3. Query profile/me to verify default trial values are present
  try {
    console.log("\n[3] Verifying trial details in profile...");
    const profileRes = await fetch(`${baseUrl}/api/profile/me`, {
      headers: { "Authorization": `Bearer ${authToken}` },
    });
    const profileData = await profileRes.json();
    console.log("Profile Status:", profileRes.status);
    console.log("Trial Profile details:", JSON.stringify(profileData.trialProfile, null, 2));

    if (profileRes.status !== 200) {
      throw new Error(`Profile fetch failed: ${profileData.error}`);
    }

    if (!profileData.trialProfile) {
      throw new Error("Missing trialProfile in /api/profile/me response");
    }

    const { reviewCount, reviewLimit, plan } = profileData.trialProfile;
    if (reviewCount !== 0 || reviewLimit !== 100 || plan !== "free_trial") {
      throw new Error(`Incorrect default trial values: count=${reviewCount}, limit=${reviewLimit}, plan=${plan}`);
    }
    console.log("Default trial values verified successfully!");
  } catch (err) {
    console.error("Profile check Error:", err.message);
    process.exit(1);
  }

  // 4. Create a business associated with the user
  try {
    console.log("\n[4] Creating a business for the user...");
    const busRes = await fetch(`${baseUrl}/api/businesses`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: `Test Diner ${Date.now()}`,
        type: "Restaurant / Cafe",
        googleReviewUrl: "https://g.page/r/test-review",
        description: "Cozy neighborhood diner",
        keywords: ["burgers", "shakes"]
      }),
    });
    const busData = await busRes.json();
    console.log("Business Create Status:", busRes.status);
    
    if (busRes.status !== 201) {
      throw new Error(`Business creation failed: ${busData.error}`);
    }

    businessId = busData.id;
    console.log("Created Business ID:", businessId);
  } catch (err) {
    console.error("Business Create Error:", err.message);
    process.exit(1);
  }

  // 5. Generate a review and confirm success
  try {
    console.log("\n[5] Generating a review draft...");
    const genRes = await fetch(`${baseUrl}/api/generate-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: 5,
        liked: "food and service",
        comments: "Great burger and fast shake service",
        language: "English",
        businessId: businessId,
        business: {
          name: "Test Diner",
          type: "Restaurant",
          description: "Cozy neighborhood diner",
          keywords: ["burgers", "shakes"]
        }
      })
    });
    const genData = await genRes.json();
    console.log("Generation Status:", genRes.status);
    console.log("Review Draft Preview:", genData.review ? genData.review.substring(0, 60) + "..." : null);

    if (genRes.status !== 200) {
      throw new Error(`Review generation failed: ${genData.error}`);
    }
  } catch (err) {
    console.error("Review Gen Error:", err.message);
    process.exit(1);
  }

  // 6. Verify count was incremented to 1
  try {
    console.log("\n[6] Re-checking trial usage count...");
    const profileRes = await fetch(`${baseUrl}/api/profile/me`, {
      headers: { "Authorization": `Bearer ${authToken}` },
    });
    const profileData = await profileRes.json();
    console.log("Current Review Count:", profileData.trialProfile?.reviewCount);

    if (profileData.trialProfile?.reviewCount !== 1) {
      throw new Error(`Expected reviewCount to be 1, got: ${profileData.trialProfile?.reviewCount}`);
    }
    console.log("Count incremented successfully!");
  } catch (err) {
    console.error("Count check Error:", err.message);
    process.exit(1);
  }

  // 7. Force limit exhaustion by updating db profile limit to 0
  try {
    console.log("\n[7] Simulating trial limit exhaustion (updating limit to 0)...");
    const { error: dbError } = await supabase
      .from("user_profiles")
      .update({ review_limit: 0 })
      .eq("id", userId);

    if (dbError) {
      if (dbError.code === "PGRST205" || dbError.message?.includes("relation") || dbError.message?.includes("does not exist")) {
        console.log("user_profiles table not found, updating auth metadata instead...");
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        const { error: metaError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...user.user_metadata,
            reviewLimit: 0
          }
        });
        if (metaError) throw new Error("Metadata update failed: " + metaError.message);
      } else {
        throw new Error(`Supabase update failed: ${dbError.message}`);
      }
    }
    console.log("Successfully set user trial review_limit to 0 in database.");
  } catch (err) {
    console.error("DB update Error:", err.message);
    process.exit(1);
  }

  // 8. Attempt review generation, expect 403 Forbidden with "Upgrade Required"
  try {
    console.log("\n[8] Generating review while limit is exceeded...");
    const genRes = await fetch(`${baseUrl}/api/generate-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: 5,
        liked: "food",
        comments: "good",
        language: "English",
        businessId: businessId,
        business: {
          name: "Test Diner",
          type: "Restaurant",
          description: "Cozy neighborhood diner",
          keywords: ["burgers", "shakes"]
        }
      })
    });
    const genData = await genRes.json();
    console.log("Generation Status:", genRes.status);
    console.log("Response:", JSON.stringify(genData, null, 2));

    if (genRes.status !== 403) {
      throw new Error(`Expected status 403, got: ${genRes.status}`);
    }
    if (genData.error !== "Upgrade Required") {
      throw new Error(`Expected error 'Upgrade Required', got: '${genData.error}'`);
    }
    console.log("Trial limit enforcement verified successfully (403 Upgrade Required returned)!");
  } catch (err) {
    console.error("Enforcement Error:", err.message);
    process.exit(1);
  }

  // 9. Clean up test user in DB
  try {
    console.log("\n[9] Cleaning up test data...");
    // Deleting the user will automatically cascade delete the user_profiles row
    const { error: delError } = await supabase.auth.admin.deleteUser(userId);
    if (delError) {
      throw new Error(delError.message);
    }
    console.log("Test user and profile cleaned up successfully.");
  } catch (err) {
    console.error("Clean up Error:", err.message);
  }

  console.log("\nAll Free Trial System tests completed successfully!");
}

runTrialTests();
