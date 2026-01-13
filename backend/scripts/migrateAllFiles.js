/**
 * Master Migration Script: All Upload Files
 *
 * Runs all upload file migrations in sequence:
 * 1. Attendance photos (check-in/checkout)
 * 2. Leave attachments
 * 3. User avatars
 *
 * Usage: node backend/scripts/migrateAllFiles.js
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runMigration(scriptName) {
    return new Promise((resolve, reject) => {
        console.log(`\n${"=".repeat(70)}`);
        console.log(`🚀 Running: ${scriptName}`);
        console.log(`${"=".repeat(70)}\n`);

        const scriptPath = path.join(__dirname, scriptName);
        const child = spawn("node", [scriptPath], {
            stdio: "inherit",
            shell: true,
        });

        child.on("close", (code) => {
            if (code === 0) {
                console.log(`\n✅ ${scriptName} completed successfully\n`);
                resolve();
            } else {
                console.error(`\n❌ ${scriptName} failed with code ${code}\n`);
                reject(new Error(`${scriptName} failed`));
            }
        });

        child.on("error", (error) => {
            console.error(`\n❌ Error running ${scriptName}:`, error, "\n");
            reject(error);
        });
    });
}

async function migrateAllFiles() {
    console.log("\n");
    console.log("╔" + "═".repeat(68) + "╗");
    console.log(
        "║" +
            " ".repeat(15) +
            "UPLOAD FILES MASTER MIGRATION" +
            " ".repeat(24) +
            "║"
    );
    console.log("╚" + "═".repeat(68) + "╝");
    console.log("\n");
    console.log(
        "📦 This script will migrate all upload files to organized structure:"
    );
    console.log(
        "   1. Attendance photos → /uploads/attendance/{year}/{month}/division-{id}/"
    );
    console.log(
        "   2. Leave attachments → /uploads/leave/{year}/{month}/division-{id}/"
    );
    console.log("   3. User avatars → /uploads/avatars/division-{id}/");
    console.log("\n");

    const readline = await import("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
        rl.question("⚠️  Do you want to continue? (yes/no): ", resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== "yes" && answer.toLowerCase() !== "y") {
        console.log("\n❌ Migration cancelled by user\n");
        process.exit(0);
    }

    try {
        const startTime = Date.now();

        // Run migrations in sequence
        await runMigration("migrateAttendanceFiles.js");
        await runMigration("migrateLeaveFiles.js");
        await runMigration("migrateAvatarFiles.js");

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log("\n");
        console.log("╔" + "═".repeat(68) + "╗");
        console.log(
            "║" + " ".repeat(20) + "MIGRATION COMPLETE!" + " ".repeat(28) + "║"
        );
        console.log("╚" + "═".repeat(68) + "╝");
        console.log("\n");
        console.log(`⏱️  Total time: ${duration} seconds`);
        console.log("\n");
        console.log("✅ All files have been migrated to organized structure!");
        console.log("\n");
        console.log("📁 New structure:");
        console.log("   backend/public/uploads/");
        console.log("   ├── attendance/");
        console.log("   │   └── {year}/{month}/division-{id}/");
        console.log("   ├── leave/");
        console.log("   │   └── {year}/{month}/division-{id}/");
        console.log("   └── avatars/");
        console.log("       └── division-{id}/");
        console.log("\n");
        console.log(
            "🎉 You can now safely delete old flat structure folders if empty!"
        );
        console.log("\n");
    } catch (error) {
        console.error("\n");
        console.error("╔" + "═".repeat(68) + "╗");
        console.error(
            "║" + " ".repeat(22) + "MIGRATION FAILED!" + " ".repeat(29) + "║"
        );
        console.error("╚" + "═".repeat(68) + "╝");
        console.error("\n");
        console.error("❌ Error:", error.message);
        console.error("\n");
        console.error("💡 Tips:");
        console.error("   - Check database connection");
        console.error("   - Ensure file permissions are correct");
        console.error("   - Verify all migration scripts exist");
        console.error("   - Check logs above for specific errors");
        console.error("\n");
        process.exit(1);
    }
}

// Run master migration
migrateAllFiles();
