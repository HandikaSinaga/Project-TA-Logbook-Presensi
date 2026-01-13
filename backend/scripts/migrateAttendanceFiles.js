import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import models from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Attendance, User } = models;

/**
 * Migration Script: Organize Existing Upload Files
 * 
 * This script moves existing files from flat structure to organized structure:
 * FROM: public/uploads/attendance/filename.jpg
 * TO:   public/uploads/attendance/{year}/{month}/{division-id}/filename.jpg
 */

const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const getOrganizedPath = (fileName, date, divisionId) => {
    const fileDate = new Date(date);
    const year = fileDate.getFullYear();
    const month = String(fileDate.getMonth() + 1).padStart(2, "0");
    const divisionFolder = divisionId ? `division-${divisionId}` : "no-division";
    
    return path.join(
        "public",
        "uploads",
        "attendance",
        year.toString(),
        month,
        divisionFolder,
        fileName
    );
};

const migrateAttendanceFiles = async () => {
    console.log("🚀 Starting attendance files migration...\n");
    
    try {
        // Get all attendances with photos
        const attendances = await Attendance.findAll({
            where: {
                check_in_photo: { [models.Sequelize.Op.ne]: null }
            },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "division_id"],
                },
            ],
        });
        
        console.log(`📊 Found ${attendances.length} attendance records with check-in photos\n`);
        
        let movedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const attendance of attendances) {
            try {
                // Process check-in photo
                if (attendance.check_in_photo) {
                    const oldPath = path.join("public", attendance.check_in_photo.replace(/^\//, ""));
                    
                    if (fs.existsSync(oldPath)) {
                        const fileName = path.basename(oldPath);
                        const newPath = getOrganizedPath(
                            fileName,
                            attendance.date,
                            attendance.user?.division_id
                        );
                        
                        // Only move if not already in new location
                        if (oldPath !== newPath) {
                            ensureDirectoryExists(path.dirname(newPath));
                            fs.renameSync(oldPath, newPath);
                            
                            // Update database
                            const newPublicPath = "/" + newPath.replace(/\\/g, "/").replace(/^public\//, "");
                            await attendance.update({ check_in_photo: newPublicPath });
                            
                            console.log(`✅ Moved: ${fileName} -> ${newPublicPath}`);
                            movedCount++;
                        } else {
                            console.log(`⏭️  Skipped (already organized): ${fileName}`);
                            skippedCount++;
                        }
                    } else {
                        console.log(`⚠️  File not found: ${oldPath}`);
                        errorCount++;
                    }
                }
                
                // Process check-out photo
                if (attendance.check_out_photo) {
                    const oldPath = path.join("public", attendance.check_out_photo.replace(/^\//, ""));
                    
                    if (fs.existsSync(oldPath)) {
                        const fileName = path.basename(oldPath);
                        const newPath = getOrganizedPath(
                            fileName,
                            attendance.date,
                            attendance.user?.division_id
                        );
                        
                        if (oldPath !== newPath) {
                            ensureDirectoryExists(path.dirname(newPath));
                            fs.renameSync(oldPath, newPath);
                            
                            const newPublicPath = "/" + newPath.replace(/\\/g, "/").replace(/^public\//, "");
                            await attendance.update({ check_out_photo: newPublicPath });
                            
                            console.log(`✅ Moved: ${fileName} -> ${newPublicPath}`);
                            movedCount++;
                        } else {
                            skippedCount++;
                        }
                    } else {
                        errorCount++;
                    }
                }
                
            } catch (error) {
                console.error(`❌ Error processing attendance ${attendance.id}:`, error.message);
                errorCount++;
            }
        }
        
        console.log("\n" + "=".repeat(60));
        console.log("📈 Migration Summary:");
        console.log("=".repeat(60));
        console.log(`✅ Files moved: ${movedCount}`);
        console.log(`⏭️  Files skipped: ${skippedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log("=".repeat(60));
        
        // Cleanup empty old folders
        console.log("\n🧹 Cleaning up empty folders...");
        cleanupEmptyFolders(path.join("public", "uploads", "attendance"));
        
        console.log("\n✨ Migration completed successfully!");
        
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        throw error;
    }
};

const cleanupEmptyFolders = (dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) return;
        
        const files = fs.readdirSync(dirPath);
        
        // Check if folder only contains subfolders or is empty
        const hasFiles = files.some(file => {
            const fullPath = path.join(dirPath, file);
            return fs.statSync(fullPath).isFile();
        });
        
        if (!hasFiles && files.length > 0) {
            // Has only subfolders, check them recursively
            files.forEach(file => {
                const fullPath = path.join(dirPath, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    cleanupEmptyFolders(fullPath);
                }
            });
        }
        
        // After cleaning subfolders, check if this folder is now empty
        const remainingFiles = fs.readdirSync(dirPath);
        if (remainingFiles.length === 0) {
            // Don't remove the main attendance folder
            if (!dirPath.endsWith("attendance")) {
                fs.rmdirSync(dirPath);
                console.log(`🗑️  Removed empty folder: ${dirPath}`);
            }
        }
    } catch (error) {
        console.error(`Error cleaning folder ${dirPath}:`, error.message);
    }
};

// Run migration
console.log("\n" + "=".repeat(60));
console.log("📦 ATTENDANCE FILES MIGRATION SCRIPT");
console.log("=".repeat(60));
console.log("This script will organize your attendance photos into:");
console.log("  📁 public/uploads/attendance/{year}/{month}/{division-id}/");
console.log("=".repeat(60) + "\n");

migrateAttendanceFiles()
    .then(() => {
        console.log("\n✅ All done! Your files are now organized.\n");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    });
