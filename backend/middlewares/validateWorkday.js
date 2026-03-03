/**
 * Workday Validation Middleware
 *
 * Middleware untuk memvalidasi bahwa presensi hanya bisa dilakukan pada hari kerja.
 * Melindungi endpoint check-in/check-out dari bypass API.
 *
 * @author GitHub Copilot
 * @date 2026-03-03
 */

import WorkCalendarService from "../services/WorkCalendarService.js";

/**
 * Validate that today is a workday before allowing attendance operations
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateWorkday = async (req, res, next) => {
    try {
        const user = req.user; // Assumes auth middleware has already populated req.user

        // Get comprehensive validation
        const validation = await WorkCalendarService.canUserCheckIn(user);

        if (!validation.canCheckIn) {
            return res.status(403).json({
                success: false,
                message: validation.message,
                error: {
                    code: "WORKDAY_VALIDATION_FAILED",
                    reason: validation.reason,
                    holiday: validation.holiday,
                },
            });
        }

        // Attach workday info to request for use in controller
        req.workdayInfo = {
            date: WorkCalendarService.getTodayString(),
            isWorkday: true,
        };

        next();
    } catch (error) {
        console.error("Error in validateWorkday middleware:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat memvalidasi hari kerja",
            error: {
                code: "VALIDATION_ERROR",
                details: error.message,
            },
        });
    }
};

/**
 * Validate checkout eligibility
 * Less strict than check-in, allows checkout even if not a workday
 * (in case user checked in before holiday was added)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateCheckout = async (req, res, next) => {
    try {
        // For checkout, we're more lenient
        // Just check if date is not in the future
        const today = WorkCalendarService.getTodayString();

        req.checkoutInfo = {
            date: today,
            allowCheckout: true,
        };

        next();
    } catch (error) {
        console.error("Error in validateCheckout middleware:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat validasi checkout",
            error: {
                code: "VALIDATION_ERROR",
                details: error.message,
            },
        });
    }
};

/**
 * Middleware to attach workday status to response (for info endpoints)
 * Does not block request, just adds information
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const attachWorkdayStatus = async (req, res, next) => {
    try {
        const status = await WorkCalendarService.getTodayWorkdayStatus();
        req.workdayStatus = status;
        next();
    } catch (error) {
        console.error("Error attaching workday status:", error);
        // Don't block request, just continue without status
        req.workdayStatus = null;
        next();
    }
};

export default {
    validateWorkday,
    validateCheckout,
    attachWorkdayStatus,
};
