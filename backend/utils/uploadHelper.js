import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload Helper with Best Practices
 * 
 * Struktur Folder:
 * public/uploads/{type}/{year}/{month}/{division_id}/
 * 
 * Contoh:
 * - public/uploads/attendance/2026/01/division-1/user-24-timestamp.jpg
 * - public/uploads/logbook/2026/01/division-2/user-25-timestamp.jpg
 * - public/uploads/leave/2026/01/division-1/user-24-timestamp.pdf
 * 
 * Benefits:
 * 1. Easy to find files by date and division
 * 2. Better performance (fewer files per folder)
 * 3. Easy cleanup for old data
 * 4. Better organization for backup/maintenance
 * 5. Can implement retention policy per folder
 */

/**
 * Create directory if not exists
 */
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * Get organized upload path
 * @param {string} type - Upload type (attendance, logbook, leave, avatar)
 * @param {object} user - User object with id and division_id
 * @returns {string} - Organized path
 */
export const getUploadPath = (type, user = null) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    
    let uploadPath;
    
    if (type === "avatar") {
        // Avatars tidak perlu per periode, langsung per division
        const divisionFolder = user?.division_id ? `division-${user.division_id}` : "no-division";
        uploadPath = path.join("public", "uploads", "avatars", divisionFolder);
    } else {
        // Attendance, Logbook, Leave: organized by year/month/division
        const divisionFolder = user?.division_id ? `division-${user.division_id}` : "no-division";
        uploadPath = path.join("public", "uploads", type, year.toString(), month, divisionFolder);
    }
    
    ensureDirectoryExists(uploadPath);
    return uploadPath;
};

/**
 * Get public URL path from file path
 * @param {string} filePath - Full file path
 * @returns {string} - Public URL path
 */
export const getPublicPath = (filePath) => {
    // Convert Windows path to URL path
    const publicPath = filePath
        .replace(/\\/g, "/")
        .replace(/^public/, "")
        .replace(/^\//, "");
    return `/${publicPath}`;
};

/**
 * Generate unique filename
 * @param {object} file - Multer file object
 * @param {object} user - User object
 * @returns {string} - Unique filename
 */
export const generateFilename = (file, user) => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000000);
    const ext = path.extname(file.originalname);
    return `user-${user.id}-${timestamp}-${randomNum}${ext}`;
};

/**
 * Configure Multer storage with organized structure
 * @param {string} type - Upload type (attendance, logbook, leave, avatar)
 * @returns {multer.StorageEngine}
 */
export const createOrganizedStorage = (type) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            try {
                const uploadPath = getUploadPath(type, req.user);
                cb(null, uploadPath);
            } catch (error) {
                console.error(`[Upload] Error creating directory:`, error);
                cb(error);
            }
        },
        filename: (req, file, cb) => {
            try {
                const filename = generateFilename(file, req.user);
                cb(null, filename);
            } catch (error) {
                console.error(`[Upload] Error generating filename:`, error);
                cb(error);
            }
        },
    });
};

/**
 * File filter for images only
 */
export const imageFileFilter = (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Format file tidak didukung. Hanya JPG, PNG, GIF, WEBP yang diperbolehkan."));
    }
};

/**
 * File filter for documents (PDF, images)
 */
export const documentFileFilter = (req, file, cb) => {
    const allowedMimes = [
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "application/pdf",
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Format file tidak didukung. Hanya JPG, PNG, PDF yang diperbolehkan."));
    }
};

/**
 * Create configured multer upload middleware
 * @param {string} type - Upload type
 * @param {string} fieldName - Form field name
 * @param {object} options - Additional options
 * @returns {multer.Multer}
 */
export const createUploadMiddleware = (type, fieldName, options = {}) => {
    const defaultOptions = {
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB default
        fileFilter: imageFileFilter,
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    return multer({
        storage: createOrganizedStorage(type),
        ...mergedOptions,
    }).single(fieldName);
};

/**
 * Delete old file when updating
 * @param {string} filePath - File path to delete
 */
export const deleteOldFile = (filePath) => {
    if (!filePath) return;
    
    try {
        // Convert URL path to file system path
        const fullPath = path.join("public", filePath.replace(/^\//, ""));
        
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`[Upload] Deleted old file: ${fullPath}`);
        }
    } catch (error) {
        console.error(`[Upload] Error deleting file:`, error);
    }
};

/**
 * Cleanup empty folders (for maintenance)
 * @param {string} dirPath - Directory path to clean
 */
export const cleanupEmptyFolders = (dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) return;
        
        const files = fs.readdirSync(dirPath);
        
        if (files.length === 0) {
            fs.rmdirSync(dirPath);
            console.log(`[Upload] Removed empty folder: ${dirPath}`);
            return true;
        }
        
        // Recursively check subfolders
        files.forEach((file) => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (cleanupEmptyFolders(fullPath)) {
                    // If subfolder was removed, check parent again
                    cleanupEmptyFolders(dirPath);
                }
            }
        });
        
        return false;
    } catch (error) {
        console.error(`[Upload] Error cleaning up folders:`, error);
        return false;
    }
};

/**
 * Get storage statistics
 * @param {string} type - Upload type or 'all'
 * @returns {object} - Storage stats
 */
export const getStorageStats = (type = "all") => {
    try {
        const uploadsPath = path.join("public", "uploads");
        
        if (!fs.existsSync(uploadsPath)) {
            return { totalSize: 0, fileCount: 0 };
        }
        
        let totalSize = 0;
        let fileCount = 0;
        
        const calculateSize = (dirPath) => {
            const files = fs.readdirSync(dirPath);
            
            files.forEach((file) => {
                const fullPath = path.join(dirPath, file);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    calculateSize(fullPath);
                } else {
                    totalSize += stats.size;
                    fileCount++;
                }
            });
        };
        
        const targetPath = type === "all" 
            ? uploadsPath 
            : path.join(uploadsPath, type);
            
        if (fs.existsSync(targetPath)) {
            calculateSize(targetPath);
        }
        
        return {
            totalSize,
            fileCount,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        };
    } catch (error) {
        console.error(`[Upload] Error calculating storage:`, error);
        return { totalSize: 0, fileCount: 0, totalSizeMB: "0.00" };
    }
};

export default {
    getUploadPath,
    getPublicPath,
    generateFilename,
    createOrganizedStorage,
    imageFileFilter,
    documentFileFilter,
    createUploadMiddleware,
    deleteOldFile,
    cleanupEmptyFolders,
    getStorageStats,
};
