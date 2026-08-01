const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function checkRpc() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const data = await res.json();
  
  const rpcs = Object.keys(data.paths || {}).filter(path => path.startsWith("/rpc/"));
  console.log("Available RPC functions:", rpcs);
}

checkRpc();
