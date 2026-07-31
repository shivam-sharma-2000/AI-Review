const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Ensure environment variables are loaded.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log("Connecting to Supabase at:", supabaseUrl);
  
  // Try to query schema information
  const { data: tables, error: tablesError } = await supabase
    .from("businesses")
    .select("id")
    .limit(1);

  if (tablesError) {
    console.error("Error querying businesses table:", tablesError);
  } else {
    console.log("Successfully connected and queried businesses. Sample data:", tables);
  }

  // Check if a users table exists
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .limit(1);

  if (usersError) {
    console.log("Users table error (probably does not exist yet):", usersError.message);
  } else {
    console.log("Users table exists! Sample data:", users);
  }
}

checkDb();
