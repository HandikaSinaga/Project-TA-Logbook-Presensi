/**
 * WorkCalendarService
 *
 * Centralized service untuk business logic kalender kerja dan validasi presensi.
 * Menangani pengecekan hari kerja, hari libur, dan validasi eligibility user untuk presensi.
 *
 * @author GitHub Copilot
 * @date 2026-03-03
 */

import Holiday from "../models/settingsModels/Holiday.js";
import models from "../models/index.js";
import { Op } from "sequelize";
import moment from "moment-timezone";

const { AppSetting, User } = models;

const TIMEZONE = "Asia/Jakarta";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache
const cache = {
    holidays: null,
    holidaysExpiry: 0,
    workingDays: null,
    workingDaysExpiry: 0,
};

class WorkCalendarService {
    /**
     * Helper: Format date to local YYYY-MM-DD string
     * Prevents timezone conversion issues with .toISOString()
     *
     * @param {Date} date - Date object to format
     * @returns {string} Local date string (YYYY-MM-DD)
     */
    static formatLocalDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    /**
     * Check if date is before user's join date
     *
     * @param {Object} user - User object with created_at field
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is before user joined
     */
    static isBeforeJoinDate(user, date) {
        if (!user || !user.created_at) return false;

        const joinDate = new Date(user.created_at);
        joinDate.setHours(0, 0, 0, 0);

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate < joinDate;
    }

    /**
     * Check if date is in the future
     *
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is after today
     */
    static isAfterToday(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate > today;
    }

    /**
     * Check if date is valid for attendance/calculation
     * Valid = on/after join date AND on/before today
     *
     * @param {Object} user - User object with created_at
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is valid
     */
    static isValidWorkDate(user, date) {
        return !this.isBeforeJoinDate(user, date) && !this.isAfterToday(date);
    }

    /**
     * Get working days configuration from settings
     * Default: [1, 2, 3, 4, 5] = Monday to Friday
     *
     * @returns {Promise<number[]>} Array of working days (0=Sunday, 1=Monday, ..., 6=Saturday)
     */
    static async getWorkingDays() {
        try {
            // Check cache
            if (cache.workingDays && Date.now() < cache.workingDaysExpiry) {
                return cache.workingDays;
            }

            const setting = await AppSetting.findOne({
                where: { key: "working_days" },
                attributes: ["value"],
                raw: true,
            });

            const workingDays = setting?.value
                ? JSON.parse(setting.value)
                : [1, 2, 3, 4, 5];

            // Update cache
            cache.workingDays = workingDays;
            cache.workingDaysExpiry = Date.now() + CACHE_TTL;

            return workingDays;
        } catch (error) {
            console.error("Error getting working days config:", error);
            return [1, 2, 3, 4, 5]; // Default: Monday-Friday
        }
    }

    /**
     * Get holidays for a specific date or date range
     *
     * @param {Date|string} startDate - Start date
     * @param {Date|string} endDate - Optional end date for range query
     * @returns {Promise<Holiday[]>} Array of holidays
     */
    static async getHolidays(startDate, endDate = null) {
        try {
            const start = moment(startDate).tz(TIMEZONE).format("YYYY-MM-DD");
            const end = endDate
                ? moment(endDate).tz(TIMEZONE).format("YYYY-MM-DD")
                : start;

            const holidays = await Holiday.findAll({
                where: {
                    date: endDate ? { [Op.between]: [start, end] } : start,
                    is_active: true,
                },
                attributes: ["id", "date", "name", "type", "is_national"],
                raw: true,
            });

            return holidays;
        } catch (error) {
            console.error("Error fetching holidays:", error);
            return [];
        }
    }

    /**
     * Check if a specific date is a holiday
     *
     * @param {Date|string} date - Date to check
     * @returns {Promise<{isHoliday: boolean, holiday: Holiday|null}>}
     */
    static async isHoliday(date) {
        try {
            const dateStr = moment(date).tz(TIMEZONE).format("YYYY-MM-DD");

            const holiday = await Holiday.findOne({
                where: {
                    date: dateStr,
                    is_active: true,
                },
                attributes: [
                    "id",
                    "date",
                    "name",
                    "type",
                    "is_national",
                    "description",
                ],
                raw: true,
            });

            return {
                isHoliday: holiday !== null,
                holiday: holiday,
            };
        } catch (error) {
            console.error("Error checking holiday:", error);
            return { isHoliday: false, holiday: null };
        }
    }

    /**
     * Check if a specific date is a weekend
     *
     * @param {Date|string} date - Date to check
     * @returns {boolean}
     */
    static isWeekend(date) {
        const dayOfWeek = moment(date).tz(TIMEZONE).day();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    }

    /**
     * Check if a specific date is a working day (not weekend, not holiday)
     *
     * @param {Date|string} date - Date to check
     * @returns {Promise<{isWorkday: boolean, reason: string|null, holiday: Holiday|null}>}
     */
    static async isWorkday(date) {
        try {
            const dateStr = moment(date).tz(TIMEZONE).format("YYYY-MM-DD");
            const dayOfWeek = moment(date).tz(TIMEZONE).day();

            // Check if weekend
            if (this.isWeekend(date)) {
                return {
                    isWorkday: false,
                    reason: "weekend",
                    holiday: null,
                };
            }

            // Check if in working days configuration
            const workingDays = await this.getWorkingDays();
            if (!workingDays.includes(dayOfWeek)) {
                return {
                    isWorkday: false,
                    reason: "not_configured_workday",
                    holiday: null,
                };
            }

            // Check if holiday
            const { isHoliday, holiday } = await this.isHoliday(date);
            if (isHoliday) {
                return {
                    isWorkday: false,
                    reason: "holiday",
                    holiday: holiday,
                };
            }

            return {
                isWorkday: true,
                reason: null,
                holiday: null,
            };
        } catch (error) {
            console.error("Error checking workday:", error);
            // Default to not workday for safety
            return {
                isWorkday: false,
                reason: "error",
                holiday: null,
            };
        }
    }

    /**
     * Get today's date in Jakarta timezone
     *
     * @returns {Date}
     */
    static getTodayDate() {
        return moment().tz(TIMEZONE).toDate();
    }

    /**
     * Get today's date string in YYYY-MM-DD format
     *
     * @returns {string}
     */
    static getTodayString() {
        return moment().tz(TIMEZONE).format("YYYY-MM-DD");
    }

    /**
     * Check if date is in the future
     *
     * @param {Date|string} date - Date to check
     * @returns {boolean}
     */
    static isFutureDate(date) {
        const today = moment().tz(TIMEZONE).startOf("day");
        const checkDate = moment(date).tz(TIMEZONE).startOf("day");
        return checkDate.isAfter(today);
    }

    /**
     * Check if date is today
     *
     * @param {Date|string} date - Date to check
     * @returns {boolean}
     */
    static isToday(date) {
        const today = moment().tz(TIMEZONE).format("YYYY-MM-DD");
        const checkDate = moment(date).tz(TIMEZONE).format("YYYY-MM-DD");
        return today === checkDate;
    }

    /**
     * Comprehensive validation for user check-in eligibility
     *
     * @param {Object} user - User object with created_at
     * @param {Date|string} date - Date to check (optional, defaults to today)
     * @returns {Promise<{canCheckIn: boolean, reason: string, message: string, holiday: Holiday|null}>}
     */
    static async canUserCheckIn(user, date = null) {
        try {
            const checkDate = date
                ? moment(date).tz(TIMEZONE)
                : moment().tz(TIMEZONE);
            const dateStr = checkDate.format("YYYY-MM-DD");
            const today = moment().tz(TIMEZONE).format("YYYY-MM-DD");

            // 1. Check if date is in the future
            if (this.isFutureDate(checkDate)) {
                return {
                    canCheckIn: false,
                    reason: "future_date",
                    message:
                        "Tidak dapat melakukan presensi untuk tanggal yang akan datang.",
                    holiday: null,
                };
            }

            // 2. Check if date is before user join date
            if (user && user.created_at) {
                const userJoinDate = moment(user.created_at)
                    .tz(TIMEZONE)
                    .format("YYYY-MM-DD");
                if (checkDate.isBefore(userJoinDate, "day")) {
                    return {
                        canCheckIn: false,
                        reason: "before_join_date",
                        message: `Tidak dapat melakukan presensi sebelum tanggal bergabung (${userJoinDate}).`,
                        holiday: null,
                    };
                }
            }

            // 3. Check if date is not today (only allow today's check-in)
            if (dateStr !== today) {
                return {
                    canCheckIn: false,
                    reason: "not_today",
                    message: "Presensi hanya dapat dilakukan pada hari ini.",
                    holiday: null,
                };
            }

            // 4. Check if it's a workday
            const { isWorkday, reason, holiday } =
                await this.isWorkday(checkDate);

            if (!isWorkday) {
                let message = "";

                if (reason === "weekend") {
                    message =
                        "Hari ini adalah akhir pekan, presensi tidak tersedia.";
                } else if (reason === "holiday") {
                    message = `Hari ini adalah hari libur (${holiday.name}), presensi tidak tersedia.`;
                } else {
                    message =
                        "Hari ini bukan hari kerja, presensi tidak tersedia.";
                }

                return {
                    canCheckIn: false,
                    reason: reason,
                    message: message,
                    holiday: holiday,
                };
            }

            // All validations passed
            return {
                canCheckIn: true,
                reason: null,
                message: "Presensi dapat dilakukan.",
                holiday: null,
            };
        } catch (error) {
            console.error("Error checking user check-in eligibility:", error);
            return {
                canCheckIn: false,
                reason: "system_error",
                message: "Terjadi kesalahan sistem. Silakan coba lagi.",
                holiday: null,
            };
        }
    }

    /**
     * Get workday status for today
     * Optimized for frontend to check if today is a workday
     *
     * @returns {Promise<Object>}
     */
    static async getTodayWorkdayStatus() {
        try {
            const today = this.getTodayString();
            const { isWorkday, reason, holiday } = await this.isWorkday(today);

            return {
                date: today,
                isWorkday: isWorkday,
                isWeekend: this.isWeekend(today),
                isHoliday: reason === "holiday",
                reason: reason,
                holiday: holiday,
                message: isWorkday
                    ? "Hari kerja normal"
                    : reason === "weekend"
                      ? "Akhir pekan"
                      : reason === "holiday"
                        ? `Hari libur: ${holiday.name}`
                        : "Bukan hari kerja",
            };
        } catch (error) {
            console.error("Error getting today workday status:", error);
            return {
                date: this.getTodayString(),
                isWorkday: false,
                isWeekend: false,
                isHoliday: false,
                reason: "error",
                holiday: null,
                message: "Terjadi kesalahan sistem",
            };
        }
    }

    /**
     * Clear cache (useful for testing or when settings change)
     */
    static clearCache() {
        cache.holidays = null;
        cache.holidaysExpiry = 0;
        cache.workingDays = null;
        cache.workingDaysExpiry = 0;
    }
}

export default WorkCalendarService;
