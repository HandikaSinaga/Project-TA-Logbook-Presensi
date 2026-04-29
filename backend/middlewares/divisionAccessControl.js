/**
 * Division Access Control Middleware
 *
 * Purpose: Validate that supervisor has access to requested division data.
 * Prevents supervisors from accessing other divisions' data.
 *
 * Business Rules:
 * - Supervisor can only access data from their assigned division
 * - Division ID must match supervisor's division_id
 * - Admin users bypass this check (handled by roleCheck middleware)
 *
 * @module middlewares/divisionAccessControl
 */

import models from "../models/index.js";

const { User } = models;

/**
 * Middleware: Verify supervisor has access to requested division
 *
 * Validates that:
 * 1. Supervisor is assigned to a division
 * 2. Requested data belongs to supervisor's division
 * 3. Query parameters don't attempt to access other divisions
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const divisionAccessControl = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Skip check for admin users
        if (userRole === "admin") {
            return next();
        }

        // Get user's division from database
        const user = await User.findByPk(userId, {
            attributes: ["id", "role", "division_id"],
            raw: true,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan",
            });
        }

        // Check if user has a division assigned
        if (!user.division_id) {
            return res.status(403).json({
                success: false,
                message: "Anda belum ditugaskan ke divisi manapun",
            });
        }

        // Check if trying to access another division's data
        const requestedDivisionId =
            req.query.division_id || req.body.division_id;

        if (
            requestedDivisionId &&
            parseInt(requestedDivisionId) !== user.division_id
        ) {
            return res.status(403).json({
                success: false,
                message: "Anda tidak memiliki akses ke data divisi lain",
            });
        }

        // Attach division_id to request for downstream use
        req.divisionId = user.division_id;

        next();
    } catch (error) {
        console.error("Error in divisionAccessControl middleware:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal memverifikasi akses divisi",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

export default divisionAccessControl;
