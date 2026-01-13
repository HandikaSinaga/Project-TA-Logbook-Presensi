/**
 * File Helper Utilities
 * Centralized file handling functions
 */

export const FILE_SIZE_LIMITS = {
    IMAGE: 2 * 1024 * 1024, // 2MB
    DOCUMENT: 5 * 1024 * 1024, // 5MB
};

/**
 * Convert file to base64 string
 * @param {File} file
 * @returns {Promise<string>}
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Validate image file
 * @param {File} file
 * @param {number} maxSize - Max size in bytes (default 2MB)
 * @returns {{valid: boolean, error?: string}}
 */
export const validateImageFile = (file, maxSize = FILE_SIZE_LIMITS.IMAGE) => {
    if (!file) {
        return { valid: false, error: "File tidak ditemukan" };
    }

    // Check file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: "Format file tidak valid. Gunakan JPG, PNG, atau GIF",
        };
    }

    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            error: `Ukuran file maksimal ${maxSizeMB}MB`,
        };
    }

    return { valid: true };
};

/**
 * Format file size for display
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Get file extension
 * @param {string} filename
 * @returns {string}
 */
export const getFileExtension = (filename) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

/**
 * Validate document file
 * @param {File} file
 * @param {number} maxSize
 * @returns {{valid: boolean, error?: string}}
 */
export const validateDocumentFile = (
    file,
    maxSize = FILE_SIZE_LIMITS.DOCUMENT
) => {
    if (!file) {
        return { valid: false, error: "File tidak ditemukan" };
    }

    // Check file type
    const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: "Format file tidak valid. Gunakan PDF atau DOC/DOCX",
        };
    }

    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            error: `Ukuran file maksimal ${maxSizeMB}MB`,
        };
    }

    return { valid: true };
};
