const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  // We can query postgrest OpenAPI spec
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const data = await res.json();
  
  if (data.paths && data.paths["/businesses"]) {
    console.log("Businesses endpoint parameters:");
    console.log(JSON.stringify(data.paths["/businesses"].get?.parameters, null, 2));
  } else {
    console.log("No /businesses path found in API spec.");
  }
}

checkColumns();
