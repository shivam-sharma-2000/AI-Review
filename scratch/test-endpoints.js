const testEmail = `user_${Date.now()}@example.com`;
const testPassword = "Password123!";
const baseUrl = "http://localhost:3000";

async function runTests() {
  console.log("=== ReviewAI Auth Endpoints Test ===");
  console.log("Testing with email:", testEmail);

  let authToken = null;
  let cookieHeader = "";

  // 1. Test POST /api/register
  try {
    console.log("\n[1] Testing Registration...");
    const regRes = await fetch(`${baseUrl}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const regData = await regRes.json();
    console.log(`Status: ${regRes.status}`);
    console.log("Response:", JSON.stringify(regData, null, 2));

    if (regRes.status !== 201) {
      throw new Error("Registration failed");
    }
  } catch (err) {
    console.error("Reg Error:", err.message);
    process.exit(1);
  }

  // 2. Test POST /api/register (Duplicate check)
  try {
    console.log("\n[2] Testing Duplicate Registration...");
    const regRes = await fetch(`${baseUrl}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const regData = await regRes.json();
    console.log(`Status: ${regRes.status}`);
    console.log("Response:", JSON.stringify(regData, null, 2));

    if (regRes.status !== 409) {
      console.warn("WARNING: Expected duplicate status code 409, got:", regRes.status);
    }
  } catch (err) {
    console.error("Duplicate Reg Error:", err.message);
  }

  // 3. Test POST /api/login
  try {
    console.log("\n[3] Testing Login...");
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status}`);
    console.log("Response (without raw token):", {
      ...loginData,
      token: loginData.token ? "[REDACTED]" : null
    });

    if (loginRes.status !== 200) {
      throw new Error("Login failed");
    }

    authToken = loginData.token;

    // Capture the cookie header from the response
    const setCookie = loginRes.headers.get("set-cookie");
    if (setCookie) {
      cookieHeader = setCookie.split(";")[0];
      console.log("Captured cookie successfully.");
    } else {
      console.warn("WARNING: No set-cookie header found in login response.");
    }
  } catch (err) {
    console.error("Login Error:", err.message);
    process.exit(1);
  }

  // 4. Test GET /api/profile/me (using Bearer token)
  try {
    console.log("\n[4] Testing Profile Query (via Bearer Token)...");
    const profRes = await fetch(`${baseUrl}/api/profile/me`, {
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
    const profData = await profRes.json();
    console.log(`Status: ${profRes.status}`);
    console.log("Response:", JSON.stringify(profData, null, 2));

    if (profRes.status !== 200) {
      throw new Error("Profile retrieval via token failed");
    }
  } catch (err) {
    console.error("Profile Token Error:", err.message);
    process.exit(1);
  }

  // 5. Test GET /api/profile/me (using Cookie)
  try {
    console.log("\n[5] Testing Profile Query (via Cookie)...");
    const profRes = await fetch(`${baseUrl}/api/profile/me`, {
      headers: {
        "Cookie": cookieHeader
      }
    });
    const profData = await profRes.json();
    console.log(`Status: ${profRes.status}`);
    console.log("Response:", JSON.stringify(profData, null, 2));

    if (profRes.status !== 200) {
      throw new Error("Profile retrieval via cookie failed");
    }
  } catch (err) {
    console.error("Profile Cookie Error:", err.message);
    process.exit(1);
  }

  // 6. Test GET /api/profile/me (Unauthorized)
  try {
    console.log("\n[6] Testing Profile Query (No Auth)...");
    const profRes = await fetch(`${baseUrl}/api/profile/me`);
    const profData = await profRes.json();
    console.log(`Status: ${profRes.status}`);
    console.log("Response:", JSON.stringify(profData, null, 2));

    if (profRes.status !== 401) {
      console.warn("WARNING: Expected status 401, got:", profRes.status);
    }
  } catch (err) {
    console.error("Unauthorized profile check error:", err.message);
  }

  // 7. Test POST /api/logout
  try {
    console.log("\n[7] Testing Logout...");
    const logoutRes = await fetch(`${baseUrl}/api/logout`, {
      method: "POST",
    });
    const logoutData = await logoutRes.json();
    console.log(`Status: ${logoutRes.status}`);
    console.log("Response:", JSON.stringify(logoutData, null, 2));

    const setCookie = logoutRes.headers.get("set-cookie");
    if (setCookie && setCookie.includes("Max-Age=0")) {
      console.log("Cookie cleared successfully via Max-Age=0 or Expiry in past.");
    }

    if (logoutRes.status !== 200) {
      throw new Error("Logout failed");
    }
  } catch (err) {
    console.error("Logout Error:", err.message);
    process.exit(1);
  }

  console.log("\nAll integration API tests completed successfully!");
}

runTests();
