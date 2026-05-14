import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload Helper with Best Practices
 *
 * Struktur Folder:
 * public/uploads/{type}/{year}/{month}/{division_id}/
 *
 * Contoh:
 * - public/uploads/attendance/2026/01/division-1/user-24-hash.jpg
 * - public/uploads/logbook/2026/01/division-2/user-25-hash.jpg
 * - public/uploads/leave/2026/01/division-1/user-24-hash.pdf
 */

/**
 * Create directory safely to handle concurrent creations
 */
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
        } catch (err) {
            if (err.code !== "EEXIST") throw err;
        }
    }
};

/**
 * Get organized upload path based on current date and user info
 */
export const getUploadPath = (type, user = null) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    let uploadPath;

    if (type === "avatar") {
        // Avatars: group by division to avoid one massive folder
        const divisionFolder = user?.division_id
            ? `division-${user.division_id}`
            : "no-division";
        uploadPath = path.join("public", "uploads", "avatars", divisionFolder);
    } else {
        // Attendance, Logbook, Leave: organized by year/month/division
        // This keeps folder sizes manageable even with millions of records
        const divisionFolder = user?.division_id
            ? `division-${user.division_id}`
            : "no-division";
        uploadPath = path.join(
            "public",
            "uploads",
            type,
            year.toString(),
            month,
            divisionFolder,
        );
    }

    ensureDirectoryExists(uploadPath);
    return uploadPath;
};

/**
 * Get public URL path from file path
 */
export const getPublicPath = (filePath) => {
    const publicPath = filePath
        .replace(/\\/g, "/")
        .replace(/^public/, "")
        .replace(/^\//, "");
    return `/${publicPath}`;
};

/**
 * Generate secure unique filename using crypto random bytes
 */
export const generateFilename = (file, user) => {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(8).toString("hex");

    // Keamanan: Validasi ekstensi berdasarkan MIME type yang diizinkan,
    // bukan dari nama file asli (mencegah upload shell .php, atau script .html/.svg)
    const mimeToExt = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "application/pdf": ".pdf",
    };

    // Jika mimetype tidak ada di map (walaupun harusnya difilter oleh multer), default ke .bin
    const safeExt = mimeToExt[file.mimetype] || ".bin";

    // Format: user-{id}-{timestamp}-{randomhex}.{ext}
    const userId = user?.id || "guest";
    return `user-${userId}-${timestamp}-${randomHex}${safeExt}`;
};

// Use dynamic import for sharp to avoid breaking if not installed
let sharp;
try {
    const sharpModule = await import("sharp");
    sharp = sharpModule.default;
} catch (error) {
    console.log("[Upload] Sharp not installed, image optimization disabled.");
}

/**
 * Configure Multer storage using memory storage for image optimization
 * or disk storage for direct saving
 */
export const createOrganizedStorage = (type, optimize = false) => {
    // If optimization is enabled and sharp is available, use MemoryStorage
    if (optimize && sharp) {
        return multer.memoryStorage();
    }

    // Otherwise fall back to secure disk storage
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
                // Attach generated filename to file object so we know what it's called
                file.generatedFilename = filename;
                cb(null, filename);
            } catch (error) {
                console.error(`[Upload] Error generating filename:`, error);
                cb(error);
            }
        },
    });
};

/**
 * Middleware to optimize image from memory and save to disk
 */
export const optimizeImage = (type) => async (req, res, next) => {
    if (!req.file) return next();

    // Skip non-images (PDFs etc)
    if (!req.file.mimetype.startsWith("image/")) {
        // We shouldn't hit this if using memory storage combined with sharp, but just in case
        return next();
    }

    try {
        const uploadPath = getUploadPath(type, req.user);
        const filename = generateFilename(req.file, req.user);

        // Define WebP as standard output for optimization
        const finalFilename = filename.replace(/\.[^/.]+$/, ".webp");
        const fullPath = path.join(uploadPath, finalFilename);

        // Resize and optimize with Sharp
        await sharp(req.file.buffer)
            .resize(1024, 1024, {
                // Max dimensions 1024x1024
                fit: sharp.fit.inside,
                withoutEnlargement: true,
            })
            .webp({ quality: 80 }) // Convert to efficient WebP format
            .toFile(fullPath);

        // Update req.file so subsequent middlewares/controllers have the right path
        req.file.path = fullPath;
        req.file.filename = finalFilename;
        req.file.destination = uploadPath;
        req.file.mimetype = "image/webp";
        // Remove buffer to free memory
        delete req.file.buffer;

        next();
    } catch (error) {
        console.error(`[Upload] Image optimization error:`, error);
        next(error);
    }
};

/**
 * File filter for images only
 */
export const imageFileFilter = (req, file, cb) => {
    const allowedMimes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Format file tidak didukung. Hanya JPG, PNG, GIF, WEBP yang diperbolehkan.",
            ),
        );
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
        cb(
            new Error(
                "Format file tidak didukung. Hanya JPG, PNG, PDF yang diperbolehkan.",
            ),
        );
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

        const targetPath =
            type === "all" ? uploadsPath : path.join(uploadsPath, type);

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
