const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  console.log("Testing user signup with email:", testEmail);
  const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });

  if (signUpError) {
    console.error("Signup error:", signUpError);
    return;
  }

  console.log("Signup success! User ID:", signUpData.user.id);

  console.log("Testing user login...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error("Signin error:", signInError);
    return;
  }

  console.log("Signin success!");
  console.log("Access Token:", signInData.session.access_token);
  console.log("Refresh Token:", signInData.session.refresh_token);

  console.log("Testing token verification...");
  const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: { user }, error: userError } = await userClient.auth.getUser(signInData.session.access_token);

  if (userError) {
    console.error("Verification error:", userError);
  } else {
    console.log("Verification success! Verified User ID:", user.id);
  }

  // Clean up
  console.log("Deleting test user...");
  const { error: deleteError } = await supabase.auth.admin.deleteUser(signUpData.user.id);
  if (deleteError) {
    console.error("Deletion error:", deleteError);
  } else {
    console.log("Cleaned up test user successfully!");
  }
}

testAuth();
