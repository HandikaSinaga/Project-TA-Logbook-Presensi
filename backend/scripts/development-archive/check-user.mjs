/**
 * Simple script to check user in database
 * Usage: node check-user.mjs <email>
 */

import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const email = process.argv[2];

if (!email) {
    console.log("❌ Usage: node check-user.mjs <email>");
    process.exit(1);
}

async function checkUser() {
    console.log("\n🔍 GOOGLE LOGIN DIAGNOSTICS\n");
    console.log("=".repeat(60));

    // 1. Check Environment Variables
    console.log("\n1️⃣  Environment Variables:");
    console.log(
        "   GOOGLE_CLIENT_ID:",
        process.env.GOOGLE_CLIENT_ID ? "✅ SET" : "❌ NOT SET"
    );
    if (process.env.GOOGLE_CLIENT_ID) {
        console.log(
            "   Value:",
            process.env.GOOGLE_CLIENT_ID.substring(0, 30) + "..."
        );
    }
    console.log(
        "   JWT_SECRET:",
        process.env.JWT_SECRET ? "✅ SET" : "❌ NOT SET"
    );
    console.log("   DB_NAME:", process.env.DB_NAME || "NOT SET");

    // 2. Connect to database
    console.log("\n2️⃣  Database Connection:");
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "db_presensi_ta",
        });
        console.log("   ✅ Database connected");
    } catch (error) {
        console.log("   ❌ Connection failed:", error.message);
        process.exit(1);
    }

    // 3. Check User
    console.log("\n3️⃣  User Check for:", email);
    try {
        const [rows] = await connection.execute(
            "SELECT id, name, email, role, is_active, oauth_provider, oauth_id, division_id, periode, sumber_magang FROM users WHERE email = ?",
            [email]
        );

        if (rows.length > 0) {
            const user = rows[0];
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
                console.log("\n   💡 Solution: Run this command to activate:");
                console.log(
                    `   UPDATE users SET is_active = 1 WHERE email = '${email}';`
                );
                console.log(
                    "\n   Or run: node backend/activate-user.mjs ${email}"
                );
            } else {
                console.log("   ✅ User CAN login - Account is ACTIVE");
            }

            // Check OAuth setup
            console.log("\n5️⃣  OAuth Setup:");
            if (!user.oauth_provider || !user.oauth_id) {
                console.log("   ⚠️  OAuth not configured yet");
                console.log(
                    "   💡 Will be automatically set on first Google login"
                );
            } else if (user.oauth_provider === "google") {
                console.log("   ✅ User already linked with Google OAuth");
                console.log("   Google ID:", user.oauth_id);
            } else {
                console.log("   ⚠️  User linked with:", user.oauth_provider);
            }
        } else {
            console.log("   ⚠️  User does NOT exist in database");
            console.log("\n   💡 What will happen on Google login:");
            console.log("   - New account will be created automatically");
            console.log("   - Default role: user");
            console.log("   - Auto-activated: YES (is_active = 1)");
            console.log("   - OAuth provider: google");
        }
    } catch (error) {
        console.log("   ❌ Error checking user:", error.message);
    }

    // 4. Check all users (for reference)
    console.log("\n6️⃣  All Users in Database:");
    try {
        const [allUsers] = await connection.execute(
            "SELECT id, name, email, role, is_active, oauth_provider FROM users ORDER BY id"
        );
        console.log(`   Total users: ${allUsers.length}`);
        allUsers.forEach((u) => {
            const status = u.is_active ? "✅" : "❌";
            const oauth = u.oauth_provider ? `[${u.oauth_provider}]` : "";
            console.log(
                `   ${status} ${u.id}. ${u.name} (${u.email}) - ${u.role} ${oauth}`
            );
        });
    } catch (error) {
        console.log("   ❌ Error listing users:", error.message);
    }

    await connection.end();

    console.log("\n" + "=".repeat(60));
    console.log("\n✨ Diagnostic complete!\n");
}

checkUser().catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
});
