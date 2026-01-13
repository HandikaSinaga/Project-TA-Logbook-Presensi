/**
 * Test Google OAuth endpoint
 * This simulates what happens when frontend sends Google ID token
 */

import dotenv from "dotenv";

dotenv.config();

const API_URL = "http://localhost:3001/api/google-idtoken";

console.log("\n🧪 Testing Google OAuth Endpoint\n");
console.log("=".repeat(60));
console.log("\n⚠️  NOTE: This test requires a REAL Google ID token");
console.log("You cannot generate a valid token without Google Sign-In\n");

console.log("📋 How to test manually:\n");
console.log("1. Open browser DevTools (F12)");
console.log("2. Go to login page: http://localhost:5173");
console.log("3. Click Google Sign-In button");
console.log('4. In Network tab, find "google-idtoken" request');
console.log("5. Check the payload and response\n");

console.log("🔍 What to check:\n");
console.log("Request:");
console.log("  POST", API_URL);
console.log("  Headers: Content-Type: application/json");
console.log('  Body: { "id_token": "eyJhbG..." }\n');

console.log("Success Response (200):");
console.log("  {");
console.log('    "success": true,');
console.log('    "message": "Google login successful",');
console.log('    "token": "eyJhbG...",');
console.log('    "user": { ... }');
console.log("  }\n");

console.log("Error Response (401):");
console.log("  {");
console.log('    "success": false,');
console.log('    "message": "Invalid Google ID token"');
console.log("  }\n");

console.log("Error Response (403):");
console.log("  {");
console.log('    "success": false,');
console.log('    "message": "Akun Anda belum diaktifkan..."');
console.log("  }\n");

console.log("=".repeat(60));
console.log("\n💡 Common Issues:\n");
console.log("1. ❌ Google button not appearing");
console.log("   → Check: config.googleClientId is set");
console.log("   → Check: Google SDK script loaded");
console.log("   → Check: googleButtonRef.current exists\n");

console.log("2. ❌ Button appears but no popup");
console.log("   → Check: Browser pop-up blocker");
console.log("   → Check: renderButton() was called");
console.log("   → Solution: Allow popups for localhost:5173\n");

console.log("3. ❌ Popup appears but no callback");
console.log("   → Check: handleGoogleCallback is defined");
console.log("   → Check: callback parameter in initialize()");
console.log("   → Check: Browser console for errors\n");

console.log("4. ❌ Callback fires but API request fails");
console.log("   → Check: Backend is running (port 3001)");
console.log("   → Check: CORS configuration");
console.log("   → Check: Network tab for actual error\n");

console.log('5. ❌ API returns 401 "Invalid token"');
console.log("   → Check: GOOGLE_CLIENT_ID in backend .env");
console.log("   → Check: Client ID matches between frontend/backend");
console.log("   → Check: google-auth-library is installed\n");

console.log('6. ❌ API returns 403 "Account not activated"');
console.log("   → Run: node check-user.mjs <email>");
console.log("   → Activate: UPDATE users SET is_active=1 WHERE email=...\n");

console.log("=".repeat(60));
console.log("\n🔧 Quick Checks:\n");

// Check if backend is running
console.log("Checking if backend is running...");
try {
    const response = await fetch("http://localhost:3001/health");
    const data = await response.json();
    if (data.status === "OK") {
        console.log("✅ Backend is running");
    }
} catch (error) {
    console.log("❌ Backend is NOT running");
    console.log("   Run: cd backend && npm run dev");
}

// Check if frontend is running
console.log("\nChecking if frontend is running...");
try {
    const response = await fetch("http://localhost:5173");
    if (response.ok) {
        console.log("✅ Frontend is running");
    }
} catch (error) {
    console.log("❌ Frontend is NOT running");
    console.log("   Run: cd frontend && npm run dev");
}

// Check config endpoint
console.log("\nChecking config endpoint...");
try {
    const response = await fetch("http://localhost:3001/api/config");
    const data = await response.json();
    if (data.success && data.config) {
        console.log("✅ Config endpoint working");
        console.log(
            "   Google OAuth enabled:",
            data.config.features?.googleOAuth ? "✅ YES" : "❌ NO"
        );
        console.log(
            "   Client ID:",
            data.config.googleClientId?.substring(0, 30) + "..."
        );
    }
} catch (error) {
    console.log("❌ Config endpoint error:", error.message);
}

console.log("\n" + "=".repeat(60));
console.log(
    "\n✨ Ready to test! Open http://localhost:5173 and try Google login\n"
);
