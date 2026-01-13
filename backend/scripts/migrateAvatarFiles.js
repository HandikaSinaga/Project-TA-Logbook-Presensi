/**
 * Migration Script: User Avatars
 *
 * Migrates user avatar files from flat structure to organized hierarchy:
 * FROM: backend/public/uploads/avatars/user-123-avatar.jpg
 * TO: backend/public/uploads/avatars/division-{id}/user-{userId}-avatar-timestamp-random.jpg
 *
 * Usage: node backend/scripts/migrateAvatarFiles.js
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
    const timestamp = date.getTime();
    const random = Math.random().toString(36).substring(2, 8);

    const basePath = path.join(__dirname, "../public/uploads/avatars");
    const organizedPath = path.join(basePath, `division-${divisionId}`);

    // Extract extension
    const ext = path.extname(filename);

    // New filename format: user-{id}-avatar-{timestamp}-{random}.{ext}
    const newFilename = `user-${userId}-avatar-${timestamp}-${random}${ext}`;

    return {
        fullPath: path.join(organizedPath, newFilename),
        relativePath: `/uploads/avatars/division-${divisionId}/${newFilename}`,
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

async function migrateAvatarFiles() {
    try {
        console.log("🚀 Starting User Avatars Migration...\n");

        // Connect to database
        await sequelize.authenticate();
        console.log("✅ Database connected\n");

        // Get all users with avatars (local uploads only, skip external URLs)
        const users = await sequelize.query(
            `SELECT id, division_id, avatar, created_at
             FROM users
             WHERE avatar IS NOT NULL 
             AND avatar != ''
             AND avatar LIKE '/uploads/avatars/%'
             AND avatar NOT LIKE '/uploads/avatars/division-%'
             AND avatar NOT LIKE 'http%'`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        console.log(`📦 Found ${users.length} avatars to migrate\n`);

        if (users.length === 0) {
            console.log("✅ No files to migrate!\n");
            await sequelize.close();
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const user of users) {
            try {
                // Extract filename from path (/uploads/avatars/filename.jpg)
                const oldFilename = path.basename(user.avatar);

                // Old path (flat structure)
                const oldPath = path.join(
                    __dirname,
                    "../public/uploads/avatars",
                    oldFilename
                );

                // Check if file exists
                if (!fs.existsSync(oldPath)) {
                    console.log(
                        `⚠️  File not found: ${oldFilename} (User ID: ${user.id})`
                    );
                    errors.push({
                        user_id: user.id,
                        file: oldFilename,
                        error: "File not found",
                    });
                    errorCount++;
                    continue;
                }

                // Generate organized path
                const { fullPath, relativePath, directory } = getOrganizedPath(
                    user.id,
                    user.division_id,
                    oldFilename,
                    user.created_at
                );

                // Create directory if not exists
                ensureDirectoryExists(directory);

                // Move file
                fs.renameSync(oldPath, fullPath);

                // Update database
                await sequelize.query(
                    `UPDATE users SET avatar = ? WHERE id = ?`,
                    { replacements: [relativePath, user.id] }
                );

                successCount++;
                console.log(`✅ Migrated: ${oldFilename}`);
                console.log(`   → ${relativePath}\n`);
            } catch (error) {
                errorCount++;
                errors.push({
                    user_id: user.id,
                    file: user.avatar,
                    error: error.message,
                });
                console.error(
                    `❌ Error migrating User ID ${user.id}:`,
                    error.message,
                    "\n"
                );
            }
        }

        // Cleanup empty folders
        console.log("🧹 Cleaning up empty folders...\n");
        const oldAvatarDir = path.join(__dirname, "../public/uploads/avatars");
        cleanupEmptyFolders(oldAvatarDir);

        // Summary
        console.log("=".repeat(60));
        console.log("📊 MIGRATION SUMMARY");
        console.log("=".repeat(60));
        console.log(`✅ Successfully migrated: ${successCount} files`);
        console.log(`❌ Failed: ${errorCount} files`);
        console.log(`📁 Total processed: ${users.length} files`);
        console.log("=".repeat(60) + "\n");

        if (errors.length > 0) {
            console.log("❌ ERRORS:\n");
            errors.forEach((err) => {
                console.log(`User ID: ${err.user_id}`);
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
migrateAvatarFiles();
