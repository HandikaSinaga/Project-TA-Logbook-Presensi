import db from "./database/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrateAvatars = async () => {
    try {
        console.log("=== Starting Avatar Migration ===\n");

        // Get users with old avatar paths
        const [users] = await db.query(`
            SELECT id, name, avatar 
            FROM users 
            WHERE avatar LIKE '/uploads/profiles/%'
        `);

        console.log(`Found ${users.length} users with old avatar paths\n`);

        const oldDir = path.join(__dirname, "public/uploads/profiles");
        const newDir = path.join(__dirname, "public/uploads/avatars");

        // Ensure new directory exists
        if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
            console.log("✓ Created /uploads/avatars directory\n");
        }

        let migrated = 0;
        let failed = 0;

        for (const user of users) {
            const oldPath = user.avatar;
            const filename = path.basename(oldPath);
            const newPath = `/uploads/avatars/${filename}`;

            const oldFilePath = path.join(__dirname, "public", oldPath);
            const newFilePath = path.join(newDir, filename);

            try {
                // Check if old file exists
                if (fs.existsSync(oldFilePath)) {
                    // Copy file to new location
                    fs.copyFileSync(oldFilePath, newFilePath);

                    // Update database using Sequelize
                    await db.query(
                        "UPDATE users SET avatar = :newPath WHERE id = :userId",
                        {
                            replacements: { newPath, userId: user.id },
                            type: db.QueryTypes.UPDATE,
                        }
                    );

                    console.log(`✓ Migrated: ${user.name}`);
                    console.log(`  From: ${oldPath}`);
                    console.log(`  To:   ${newPath}\n`);

                    migrated++;
                } else {
                    console.log(
                        `✗ File not found: ${user.name} - ${oldPath}\n`
                    );
                    failed++;
                }
            } catch (error) {
                console.error(
                    `✗ Error migrating ${user.name}:`,
                    error.message,
                    "\n"
                );
                failed++;
            }
        }

        console.log("=== Migration Complete ===");
        console.log(`✓ Migrated: ${migrated}`);
        console.log(`✗ Failed: ${failed}`);
        console.log(`Total: ${users.length}\n`);

        // Verify migration
        const [updated] = await db.query(`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE avatar LIKE '/uploads/avatars/%'
        `);
        console.log(`Avatars in new path: ${updated[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error("Migration error:", error);
        process.exit(1);
    }
};

migrateAvatars();
