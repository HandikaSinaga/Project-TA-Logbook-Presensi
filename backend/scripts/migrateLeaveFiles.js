/**
 * Migration Script: Leave Attachments
 *
 * Migrates leave attachment files from flat structure to organized hierarchy:
 * FROM: backend/public/uploads/leave/document-timestamp-random.pdf
 * TO: backend/public/uploads/leave/{year}/{month}/division-{id}/user-{userId}-timestamp-random.pdf
 *
 * Usage: node backend/scripts/migrateLeaveFiles.js
 */

import { Sequelize } from "sequelize";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const sequelize = new Sequelize({
    dialect: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || "project_ta",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    logging: false,
});

// Helper functions
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function getOrganizedPath(userId, divisionId, filename, createdAt) {
    const date = new Date(createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    const basePath = path.join(__dirname, "../public/uploads/leave");
    const organizedPath = path.join(
        basePath,
        year.toString(),
        month,
        `division-${divisionId}`
    );

    // Extract extension
    const ext = path.extname(filename);
    const timestamp = date.getTime();
    const random = Math.random().toString(36).substring(2, 8);

    // New filename format: user-{id}-{timestamp}-{random}.{ext}
    const newFilename = `user-${userId}-${timestamp}-${random}${ext}`;

    return {
        fullPath: path.join(organizedPath, newFilename),
        relativePath: `/uploads/leave/${year}/${month}/division-${divisionId}/${newFilename}`,
        directory: organizedPath,
    };
}

function cleanupEmptyFolders(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        if (fs.statSync(fullPath).isDirectory()) {
            cleanupEmptyFolders(fullPath);
        }
    }

    // Remove if empty
    const remainingItems = fs.readdirSync(dirPath);
    if (remainingItems.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`🗑️  Removed empty folder: ${dirPath}`);
    }
}

async function migrateLeaveFiles() {
    try {
        console.log("🚀 Starting Leave Attachments Migration...\n");

        // Connect to database
        await sequelize.authenticate();
        console.log("✅ Database connected\n");

        // Get all leaves with attachments
        const leaves = await sequelize.query(
            `SELECT l.id, l.user_id, l.attachment, l.created_at, u.division_id
             FROM leaves l
             JOIN users u ON l.user_id = u.id
             WHERE l.attachment IS NOT NULL 
             AND l.attachment != ''
             AND l.attachment NOT LIKE '/uploads/leave/%/%/%'`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        console.log(`📦 Found ${leaves.length} leave attachments to migrate\n`);

        if (leaves.length === 0) {
            console.log("✅ No files to migrate!\n");
            await sequelize.close();
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const leave of leaves) {
            try {
                const oldFilename = leave.attachment;

                // Old path (flat structure)
                const oldPath = path.join(
                    __dirname,
                    "../public/uploads/leave",
                    oldFilename
                );

                // Check if file exists
                if (!fs.existsSync(oldPath)) {
                    console.log(
                        `⚠️  File not found: ${oldFilename} (Leave ID: ${leave.id})`
                    );
                    errors.push({
                        leave_id: leave.id,
                        file: oldFilename,
                        error: "File not found",
                    });
                    errorCount++;
                    continue;
                }

                // Generate organized path
                const { fullPath, relativePath, directory } = getOrganizedPath(
                    leave.user_id,
                    leave.division_id,
                    oldFilename,
                    leave.created_at
                );

                // Create directory if not exists
                ensureDirectoryExists(directory);

                // Move file
                fs.renameSync(oldPath, fullPath);

                // Update database
                await sequelize.query(
                    `UPDATE leaves SET attachment = ? WHERE id = ?`,
                    { replacements: [relativePath, leave.id] }
                );

                successCount++;
                console.log(`✅ Migrated: ${oldFilename}`);
                console.log(`   → ${relativePath}\n`);
            } catch (error) {
                errorCount++;
                errors.push({
                    leave_id: leave.id,
                    file: leave.attachment,
                    error: error.message,
                });
                console.error(
                    `❌ Error migrating Leave ID ${leave.id}:`,
                    error.message,
                    "\n"
                );
            }
        }

        // Cleanup empty folders
        console.log("🧹 Cleaning up empty folders...\n");
        const oldLeaveDir = path.join(__dirname, "../public/uploads/leave");
        cleanupEmptyFolders(oldLeaveDir);

        // Summary
        console.log("=".repeat(60));
        console.log("📊 MIGRATION SUMMARY");
        console.log("=".repeat(60));
        console.log(`✅ Successfully migrated: ${successCount} files`);
        console.log(`❌ Failed: ${errorCount} files`);
        console.log(`📁 Total processed: ${leaves.length} files`);
        console.log("=".repeat(60) + "\n");

        if (errors.length > 0) {
            console.log("❌ ERRORS:\n");
            errors.forEach((err) => {
                console.log(`Leave ID: ${err.leave_id}`);
                console.log(`File: ${err.file}`);
                console.log(`Error: ${err.error}\n`);
            });
        }

        console.log("✅ Migration complete!\n");

        await sequelize.close();
    } catch (error) {
        console.error("❌ Migration failed:", error);
        await sequelize.close();
        process.exit(1);
    }
}

// Run migration
migrateLeaveFiles();
