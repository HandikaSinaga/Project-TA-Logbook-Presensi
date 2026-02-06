import models from "../models/index.js";
import { getJakartaDate } from "./dateHelper.js";

const { AppSetting } = models;

/**
 * Time Validation Helper
 * Validates check-in and check-out times against admin-configured settings
 * Provides user-friendly messages for better UX
 */

/**
 * Get system settings with defaults
 */
async function getSystemSettings() {
    const settingsData = await AppSetting.findAll();

    const settings = {};
    settingsData.forEach((setting) => {
        let value = setting.value;

        if (setting.type === "boolean") {
            value = value === "true" || value === "1";
        } else if (setting.type === "number") {
            value = parseFloat(value);
        } else if (setting.type === "json") {
            try {
                value = JSON.parse(value);
            } catch (e) {
                // Keep as string if JSON parse fails
            }
        }

        settings[setting.key] = value;
    });

    // Default values
    const defaults = {
        check_in_start_time: "06:00",
        check_in_end_time: "08:30",
        check_out_start_time: "16:00",
        check_out_end_time: "20:00",
        working_hours_start: "08:00",
        working_hours_end: "17:00",
        late_tolerance_minutes: 15,
        auto_checkout_enabled: false,
        auto_checkout_time: "17:30",
    };

    return { ...defaults, ...settings };
}

/**
 * Parse time string (HH:MM or HH:MM:SS) to minutes since midnight
 */
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:MM format
 */
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Get current time in HH:MM:SS format (Jakarta timezone)
 */
function getCurrentTime() {
    const now = getJakartaDate();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
}

/**
 * Get current time in minutes since midnight
 */
function getCurrentTimeInMinutes() {
    const now = getJakartaDate();
    return now.getHours() * 60 + now.getMinutes();
}

/**
 * Validate check-in time
 * @returns {Object} { allowed: boolean, message: string, status: string, details: object }
 */
export async function validateCheckInTime() {
    try {
        const settings = await getSystemSettings();
        const currentMinutes = getCurrentTimeInMinutes();
        const currentTime = getCurrentTime();

        const checkInStart = timeToMinutes(settings.check_in_start_time);
        const checkInEnd = timeToMinutes(settings.check_in_end_time);
        const workingHoursStart = timeToMinutes(settings.working_hours_start);
        const lateTolerance = parseInt(settings.late_tolerance_minutes) || 15;

        // Too early - before check-in window opens
        if (currentMinutes < checkInStart) {
            return {
                allowed: false,
                message: `Check-in belum dibuka. Waktu check-in mulai pukul ${settings.check_in_start_time} WIB`,
                status: "too_early",
                details: {
                    current_time: currentTime,
                    check_in_start: settings.check_in_start_time,
                    check_in_end: settings.check_in_end_time,
                    working_hours_start: settings.working_hours_start,
                },
            };
        }

        // Too late - after check-in window closes
        if (currentMinutes > checkInEnd) {
            return {
                allowed: false,
                message: `Waktu check-in sudah ditutup (pukul ${settings.check_in_end_time} WIB). Silakan hubungi admin atau supervisor Anda`,
                status: "too_late",
                details: {
                    current_time: currentTime,
                    check_in_start: settings.check_in_start_time,
                    check_in_end: settings.check_in_end_time,
                    working_hours_start: settings.working_hours_start,
                },
            };
        }

        // Check if late
        const lateThreshold = workingHoursStart + lateTolerance;
        const isLate = currentMinutes > lateThreshold;

        // Calculate how late
        let lateMinutes = 0;
        if (isLate) {
            lateMinutes = currentMinutes - lateThreshold;
        }

        return {
            allowed: true,
            message: isLate
                ? `Check-in berhasil, tetapi Anda terlambat ${lateMinutes} menit`
                : "Check-in berhasil, Anda tepat waktu",
            status: isLate ? "late" : "on_time",
            is_late: isLate,
            late_minutes: lateMinutes,
            details: {
                current_time: currentTime,
                check_in_start: settings.check_in_start_time,
                check_in_end: settings.check_in_end_time,
                working_hours_start: settings.working_hours_start,
                late_tolerance_minutes: lateTolerance,
            },
        };
    } catch (error) {
        console.error("[validateCheckInTime] Error:", error);
        // Allow check-in if validation fails (fail-safe)
        return {
            allowed: true,
            message: "Check-in diizinkan (validasi waktu dilewati)",
            status: "validation_error",
            details: {},
        };
    }
}

/**
 * Validate check-out time
 * @param {string} checkInTime - User's check-in time (HH:MM:SS)
 * @returns {Object} { allowed: boolean, message: string, status: string, details: object }
 */
export async function validateCheckOutTime(checkInTime) {
    try {
        const settings = await getSystemSettings();
        const currentMinutes = getCurrentTimeInMinutes();
        const currentTime = getCurrentTime();

        const checkOutStart = timeToMinutes(settings.check_out_start_time);
        const checkOutEnd = timeToMinutes(settings.check_out_end_time);
        const workingHoursEnd = timeToMinutes(settings.working_hours_end);

        // Parse check-in time
        const checkInMinutes = timeToMinutes(checkInTime);

        // Calculate minimum work hours (e.g., 8 hours)
        const workingHoursStart = timeToMinutes(settings.working_hours_start);
        const standardWorkDuration = workingHoursEnd - workingHoursStart; // e.g., 9 hours (08:00 to 17:00)
        const minimumCheckOutTime = checkInMinutes + standardWorkDuration;

        // Too early - before check-out window opens
        if (currentMinutes < checkOutStart) {
            const waitMinutes = checkOutStart - currentMinutes;
            const canCheckOutAt = minutesToTime(checkOutStart);

            return {
                allowed: false,
                message: `Belum waktunya check-out. Waktu check-out mulai pukul ${settings.check_out_start_time} WIB (${waitMinutes} menit lagi)`,
                status: "too_early",
                wait_minutes: waitMinutes,
                can_checkout_at: canCheckOutAt,
                details: {
                    current_time: currentTime,
                    check_in_time: checkInTime,
                    check_out_start: settings.check_out_start_time,
                    check_out_end: settings.check_out_end_time,
                    working_hours_end: settings.working_hours_end,
                },
            };
        }

        // Too late - after check-out window closes (warning only, still allowed)
        if (currentMinutes > checkOutEnd) {
            return {
                allowed: true,
                message: `Check-out berhasil, tetapi Anda melewati batas waktu check-out (pukul ${settings.check_out_end_time} WIB)`,
                status: "overtime",
                details: {
                    current_time: currentTime,
                    check_in_time: checkInTime,
                    check_out_start: settings.check_out_start_time,
                    check_out_end: settings.check_out_end_time,
                    working_hours_end: settings.working_hours_end,
                },
            };
        }

        // Check if leaving early (before standard working hours end)
        if (currentMinutes < minimumCheckOutTime) {
            const shortMinutes = minimumCheckOutTime - currentMinutes;
            const shouldWorkUntil = minutesToTime(minimumCheckOutTime);

            // Still allow, but mark as early
            return {
                allowed: true,
                message: `Check-out berhasil, tetapi Anda pulang lebih awal ${shortMinutes} menit (seharusnya sampai ${shouldWorkUntil} WIB)`,
                status: "early",
                early_minutes: shortMinutes,
                should_work_until: shouldWorkUntil,
                details: {
                    current_time: currentTime,
                    check_in_time: checkInTime,
                    check_out_start: settings.check_out_start_time,
                    check_out_end: settings.check_out_end_time,
                    working_hours_end: settings.working_hours_end,
                    minimum_work_hours: (standardWorkDuration / 60).toFixed(1),
                },
            };
        }

        // Normal check-out
        return {
            allowed: true,
            message: "Check-out berhasil, Anda telah menyelesaikan jam kerja",
            status: "on_time",
            details: {
                current_time: currentTime,
                check_in_time: checkInTime,
                check_out_start: settings.check_out_start_time,
                check_out_end: settings.check_out_end_time,
                working_hours_end: settings.working_hours_end,
            },
        };
    } catch (error) {
        console.error("[validateCheckOutTime] Error:", error);
        // Allow check-out if validation fails (fail-safe)
        return {
            allowed: true,
            message: "Check-out diizinkan (validasi waktu dilewati)",
            status: "validation_error",
            details: {},
        };
    }
}

/**
 * Get time validation settings (for frontend display)
 */
export async function getTimeValidationSettings() {
    try {
        const settings = await getSystemSettings();

        return {
            check_in: {
                start_time: settings.check_in_start_time,
                end_time: settings.check_in_end_time,
                late_tolerance_minutes: parseInt(
                    settings.late_tolerance_minutes,
                ),
            },
            check_out: {
                start_time: settings.check_out_start_time,
                end_time: settings.check_out_end_time,
            },
            working_hours: {
                start: settings.working_hours_start,
                end: settings.working_hours_end,
                duration:
                    timeToMinutes(settings.working_hours_end) -
                    timeToMinutes(settings.working_hours_start),
            },
            auto_checkout: {
                enabled: settings.auto_checkout_enabled,
                time: settings.auto_checkout_time,
            },
        };
    } catch (error) {
        console.error("[getTimeValidationSettings] Error:", error);
        return null;
    }
}

/**
 * Check if current time is within working hours
 */
export async function isWithinWorkingHours() {
    try {
        const settings = await getSystemSettings();
        const currentMinutes = getCurrentTimeInMinutes();

        const workStart = timeToMinutes(settings.working_hours_start);
        const workEnd = timeToMinutes(settings.working_hours_end);

        return currentMinutes >= workStart && currentMinutes <= workEnd;
    } catch (error) {
        console.error("[isWithinWorkingHours] Error:", error);
        return true; // Fail-safe
    }
}

export default {
    validateCheckInTime,
    validateCheckOutTime,
    getTimeValidationSettings,
    isWithinWorkingHours,
    getCurrentTime,
    getCurrentTimeInMinutes,
};
