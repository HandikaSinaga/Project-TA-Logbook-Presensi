/**
 * Test script untuk diagnose Google Login issues
 * Usage: node test-google-login.js <email>
 */

import dotenv from "dotenv";
import db from "./database/db.js";
import User from "./models/usersModels/userModel.js";

dotenv.config();

const email = process.argv[2];

if (!email) {
    console.log("❌ Usage: node test-google-login.js <email>");
    process.exit(1);
}

async function diagnoseGoogleLogin() {
    console.log("\n🔍 GOOGLE LOGIN DIAGNOSTICS\n");
    console.log("=".repeat(60));

    // 1. Check Environment Variables
    console.log("\n1️⃣  Environment Variables:");
    console.log(
        "   GOOGLE_CLIENT_ID:",
        process.env.GOOGLE_CLIENT_ID ? "✅ SET" : "❌ NOT SET"
    );
    console.log("   Value:", process.env.GOOGLE_CLIENT_ID || "N/A");
    console.log(
        "   JWT_SECRET:",
        process.env.JWT_SECRET ? "✅ SET" : "❌ NOT SET"
    );

    // 2. Check Database Connection
    console.log("\n2️⃣  Database Connection:");
    try {
        await db.authenticate();
        console.log("   ✅ Database connected");
    } catch (error) {
        console.log("   ❌ Database connection failed:", error.message);
        process.exit(1);
    }

    // 3. Check User Exists
    console.log("\n3️⃣  User Check for:", email);
    try {
        const user = await User.findOne({
            where: { email },
            attributes: [
                "id",
                "name",
                "email",
                "role",
                "is_active",
                "oauth_provider",
                "oauth_id",
                "division_id",
                "periode",
                "sumber_magang",
            ],
        });

        if (user) {
            console.log("   ✅ User exists in database");
            console.log("\n   User Details:");
            console.log("   - ID:", user.id);
            console.log("   - Name:", user.name);
            console.log("   - Email:", user.email);
            console.log("   - Role:", user.role);
            console.log(
                "   - Active:",
                user.is_active ? "✅ YES" : "❌ NO (THIS IS THE PROBLEM!)"
            );
            console.log(
                "   - OAuth Provider:",
                user.oauth_provider || "Not set"
            );
            console.log("   - OAuth ID:", user.oauth_id || "Not set");
            console.log(
                "   - Division ID:",
                user.division_id || "Not assigned"
            );
            console.log("   - Periode:", user.periode || "Not set");
            console.log("   - Sumber Magang:", user.sumber_magang || "Not set");

            // Check if user can login
            console.log("\n4️⃣  Login Check:");
            if (!user.is_active) {
                console.log("   ❌ User CANNOT login - Account is INACTIVE");
                console.log("   💡 Solution: Run this SQL to activate:");
                console.log(
                    `   UPDATE users SET is_active = 1 WHERE email = '${email}';`
                );
            } else {
                console.log("   ✅ User CAN login - Account is ACTIVE");
            }

            // Check OAuth setup
            console.log("\n5️⃣  OAuth Setup:");
            if (!user.oauth_provider || !user.oauth_id) {
                console.log(
                    "   ⚠️  OAuth not configured yet (will be set on first Google login)"
                );
            } else if (user.oauth_provider === "google") {
                console.log("   ✅ User already linked with Google OAuth");
            } else {
                console.log("   ⚠️  User linked with:", user.oauth_provider);
            }
        } else {
            console.log("   ⚠️  User does NOT exist in database");
            console.log("   💡 New account will be created on Google login");
            console.log("   - Default role: user");
            console.log("   - Auto-activated: YES");
            console.log("   - OAuth provider: google");
        }
    } catch (error) {
        console.log("   ❌ Error checking user:", error.message);
    }

    // 6. Test Google Auth Library
    console.log("\n6️⃣  Google Auth Library:");
    try {
        const { OAuth2Client } = await import("google-auth-library");
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        console.log("   ✅ Google Auth Library loaded successfully");
        console.log(
            "   Client ID configured:",
            process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "..."
        );
    } catch (error) {
        console.log("   ❌ Google Auth Library error:", error.message);
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✨ Diagnostic complete!\n");

    process.exit(0);
}

diagnoseGoogleLogin().catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
});
