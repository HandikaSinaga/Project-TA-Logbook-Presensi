/**
 * Middleware untuk memvalidasi input dari request.
 */

/**
 * Validasi untuk parameter ID pada URL agar hanya menerima integer/angka positif.
 * Kompatibel dengan express router.param('id', ...)
 */
export const validateParamId = (req, res, next, id) => {
    if (id !== undefined && id !== "") {
        // Cek jika ID tidak valid (bukan angka positif)
        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Format ID tidak valid (parameter pada URL harus berupa angka)",
                error: "INVALID_PARAMETER",
            });
        }
    }
    next();
};

/**
 * Validasi untuk parameter tanggal (YYYY-MM-DD) pada parameter URL.
 * Kompatibel dengan express router.param('date', ...)
 */
export const validateParamDate = (req, res, next, date) => {
    if (date !== undefined && date !== "") {
        // Simple YYYY-MM-DD check
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                message: "Format tanggal tidak valid (harus YYYY-MM-DD)",
                error: "INVALID_PARAMETER",
            });
        }

        // Pengecekan tanggal valid
        const d = new Date(date);
        if (Object.prototype.toString.call(d) === "[object Date]") {
            if (isNaN(d.getTime())) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Tanggal yang diberikan tidak valid (out of bounds)",
                    error: "INVALID_PARAMETER",
                });
            }
        }
    }
    next();
};

/**
 * Validasi input pada body yang rentan seperti script tags.
 * Mencegah Cross-Site Scripting (XSS).
 */
export const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        const sanitizeString = (str) => {
            if (typeof str !== "string") return str;
            // Cegah script tag injection basic
            if (
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(str)
            ) {
                return str
                    .replace(
                        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                        "",
                    )
                    .replace(/[<>]/g, "");
            }
            return str;
        };

        const traverse = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === "string") {
                    obj[key] = sanitizeString(obj[key]);
                } else if (typeof obj[key] === "object" && obj[key] !== null) {
                    traverse(obj[key]);
                }
            }
        };

        traverse(req.body);
    }
    next();
};

export default {
    validateParamId,
    validateParamDate,
    sanitizeBody,
};
