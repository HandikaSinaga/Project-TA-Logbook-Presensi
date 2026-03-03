/**
 * AlphaCalculationService
 *
 * Centralized service untuk perhitungan Alpha (ketidakhadiran) dengan business rule yang ketat.
 * Service ini adalah SINGLE SOURCE OF TRUTH untuk semua perhitungan alpha di sistem.
 *
 * BUSINESS RULES:
 * 1. Alpha = Hari kerja tanpa presensi dan tanpa izin valid
 * 2. Hanya hitung tanggal >= user.created_at (join date)
 * 3. Hanya hitung tanggal <= hari ini
 * 4. Exclude: weekend, holiday, future dates, pre-join dates
 * 5. Reset otomatis per bulan (1-31/30/28)
 * 6. TIDAK ADA LIMIT HARDCODED (alpha bisa >21, >50, dst)
 *
 * @author GitHub Copilot
 * @date 2026-03-03
 */

import Holiday from "../models/settingsModels/Holiday.js";
import models from "../models/index.js";
import { Op } from "sequelize";
import moment from "moment-timezone";

const { Attendance, Leave, AppSetting, User } = models;

const TIMEZONE = "Asia/Jakarta";

class AlphaCalculationService {
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
     * Get working days configuration from AppSetting
     *
     * @returns {Promise<number[]>} Array of working day numbers (1=Monday, ..., 5=Friday)
     */
    static async getWorkingDaysConfig() {
        try {
            const setting = await AppSetting.findOne({
                where: { key: "working_days" },
                attributes: ["value"],
                raw: true,
            });

            return setting?.value ? JSON.parse(setting.value) : [1, 2, 3, 4, 5]; // Default: Mon-Fri
        } catch (error) {
            console.error("[AlphaService] Error getting working days:", error);
            return [1, 2, 3, 4, 5];
        }
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
     * Check if date is valid for alpha calculation
     * Valid = on/after join date AND on/before today
     *
     * @param {Object} user - User object with created_at
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is valid for calculation
     */
    static isValidWorkDate(user, date) {
        return !this.isBeforeJoinDate(user, date) && !this.isAfterToday(date);
    }

    /**
     * Calculate alpha (absent days) for a user in a specific month
     * This is the SINGLE SOURCE OF TRUTH for alpha calculation
     *
     * @param {number} userId - User ID
     * @param {number} year - Target year
     * @param {number} month - Target month (1-12)
     * @returns {Promise<Object>} Calculation result with details
     */
    static async calculateMonthlyAlpha(userId, year, month) {
        try {
            console.log(
                `\n[AlphaService] ========== CALCULATING ALPHA FOR USER ${userId} ==========`,
            );
            console.log(
                `[AlphaService] Period: ${year}-${String(month).padStart(2, "0")}`,
            );

            // 1. Get user info (must include created_at)
            const user = await User.findByPk(userId, {
                attributes: ["id", "name", "email", "created_at"],
                raw: true,
            });

            if (!user) {
                throw new Error(`User ${userId} not found`);
            }

            console.log(
                `[AlphaService] User joined: ${this.formatLocalDate(new Date(user.created_at))}`,
            );

            // 2. Define month date range
            const firstDay = new Date(year, month - 1, 1);
            const lastDay = new Date(year, month, 0);
            const firstDayStr = this.formatLocalDate(firstDay);
            const lastDayStr = this.formatLocalDate(lastDay);

            console.log(
                `[AlphaService] Month range: ${firstDayStr} to ${lastDayStr}`,
            );

            // 3. Determine calculation boundary
            // Only calculate up to today (inclusive)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let checkUntil;
            if (lastDay < today) {
                // Past month: count all days
                checkUntil = new Date(lastDay);
            } else if (firstDay > today) {
                // Future month: no calculation needed
                console.log(`[AlphaService] Future month, returning 0 alpha`);
                return {
                    alphaCount: 0,
                    expectedWorkingDays: 0,
                    attendanceDays: 0,
                    leaveDays: 0,
                    details: {
                        periodStart: firstDayStr,
                        periodEnd: lastDayStr,
                        checkUntil: null,
                        reason: "Future month",
                    },
                };
            } else {
                // Current month: count until today
                checkUntil = new Date(today);
            }

            console.log(
                `[AlphaService] Calculating until: ${this.formatLocalDate(checkUntil)}`,
            );

            // 4. Get working days config and holidays
            const [workingDays, holidays] = await Promise.all([
                this.getWorkingDaysConfig(),
                Holiday.findAll({
                    where: {
                        date: { [Op.between]: [firstDayStr, lastDayStr] },
                        is_active: true,
                    },
                    attributes: ["date", "name"],
                    raw: true,
                }),
            ]);

            const holidayDates = new Set(holidays.map((h) => h.date));
            console.log(
                `[AlphaService] Working days config: [${workingDays.join(", ")}]`,
            );
            console.log(
                `[AlphaService] Holidays in period: ${holidayDates.size} days`,
            );

            // 5. Count expected working days
            // Rule: Must be workday, not holiday, not weekend, >= join date, <= today
            let expectedWorkingDays = 0;
            const expectedDates = [];

            for (
                let d = new Date(firstDay);
                d <= checkUntil;
                d.setDate(d.getDate() + 1)
            ) {
                const dateStr = this.formatLocalDate(d);
                const dayOfWeek = d.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // CRITICAL: Skip if before join date
                if (this.isBeforeJoinDate(user, d)) {
                    continue;
                }

                // Check if this is a working day
                if (
                    !isWeekend &&
                    workingDays.includes(dayOfWeek) &&
                    !holidayDates.has(dateStr)
                ) {
                    expectedWorkingDays++;
                    expectedDates.push(dateStr);
                }
            }

            console.log(
                `[AlphaService] Expected working days: ${expectedWorkingDays}`,
            );
            console.log(
                `[AlphaService] Expected dates: [${expectedDates.join(", ")}]`,
            );

            // 6. Get attendance data
            const attendances = await Attendance.findAll({
                where: {
                    user_id: userId,
                    date: { [Op.between]: [firstDayStr, lastDayStr] },
                },
                attributes: ["date"],
                raw: true,
            });

            const attendanceDates = new Set(
                attendances
                    .filter((att) => {
                        const attDate = new Date(att.date);
                        return attDate <= checkUntil;
                    })
                    .map((att) => att.date),
            );

            console.log(
                `[AlphaService] Attendance days: ${attendanceDates.size}`,
            );

            // 7. Get approved leave data
            const leaves = await Leave.findAll({
                where: {
                    user_id: userId,
                    status: "approved",
                    [Op.or]: [
                        {
                            start_date: {
                                [Op.between]: [firstDayStr, lastDayStr],
                            },
                        },
                        {
                            end_date: {
                                [Op.between]: [firstDayStr, lastDayStr],
                            },
                        },
                        {
                            [Op.and]: [
                                { start_date: { [Op.lte]: firstDayStr } },
                                { end_date: { [Op.gte]: lastDayStr } },
                            ],
                        },
                    ],
                },
                attributes: ["start_date", "end_date", "type"],
                raw: true,
            });

            // Expand leave dates (only count working days)
            const leaveDates = new Set();
            leaves.forEach((leave) => {
                const start = new Date(leave.start_date);
                const end = new Date(leave.end_date);

                for (
                    let d = new Date(start);
                    d <= end;
                    d.setDate(d.getDate() + 1)
                ) {
                    const dateStr = this.formatLocalDate(d);
                    const dayOfWeek = d.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    // Only count if it's a valid working day
                    if (
                        d <= checkUntil &&
                        !isWeekend &&
                        workingDays.includes(dayOfWeek) &&
                        !holidayDates.has(dateStr)
                    ) {
                        leaveDates.add(dateStr);
                    }
                }
            });

            console.log(`[AlphaService] Leave days: ${leaveDates.size}`);

            // 8. Calculate alpha
            // Alpha = Expected working days - Attendance - Leave
            const alphaCount = Math.max(
                0,
                expectedWorkingDays - attendanceDates.size - leaveDates.size,
            );

            // 9. Find actual absent dates for transparency
            const absentDates = [];
            for (const expectedDate of expectedDates) {
                if (
                    !attendanceDates.has(expectedDate) &&
                    !leaveDates.has(expectedDate)
                ) {
                    absentDates.push(expectedDate);
                }
            }

            console.log(
                `[AlphaService] Calculation: ${expectedWorkingDays} - ${attendanceDates.size} - ${leaveDates.size} = ${alphaCount}`,
            );
            console.log(
                `[AlphaService] Absent dates: [${absentDates.join(", ")}]`,
            );

            // Verification
            if (absentDates.length !== alphaCount) {
                console.warn(
                    `[AlphaService] ⚠️ MISMATCH! Direct count (${absentDates.length}) != Calculated (${alphaCount})`,
                );
            } else {
                console.log(
                    `[AlphaService] ✅ Calculation verified: ${alphaCount} alpha days`,
                );
            }

            console.log(
                `[AlphaService] ========== CALCULATION COMPLETE ==========\n`,
            );

            return {
                alphaCount,
                expectedWorkingDays,
                attendanceDays: attendanceDates.size,
                leaveDays: leaveDates.size,
                absentDates: absentDates,
                details: {
                    periodStart: firstDayStr,
                    periodEnd: lastDayStr,
                    checkUntil: this.formatLocalDate(checkUntil),
                    userJoinDate: this.formatLocalDate(
                        new Date(user.created_at),
                    ),
                    workingDaysConfig: workingDays,
                    holidaysCount: holidayDates.size,
                },
            };
        } catch (error) {
            console.error(`[AlphaService] Error calculating alpha:`, error);
            throw error;
        }
    }

    /**
     * Get alpha statistics for multiple months (bulk calculation)
     * Useful for reports and historical data
     *
     * @param {number} userId - User ID
     * @param {Array<{year: number, month: number}>} periods - Array of periods to calculate
     * @returns {Promise<Array<Object>>} Array of calculation results
     */
    static async calculateMultipleMonths(userId, periods) {
        try {
            const results = await Promise.all(
                periods.map((period) =>
                    this.calculateMonthlyAlpha(
                        userId,
                        period.year,
                        period.month,
                    ),
                ),
            );

            return results.map((result, index) => ({
                year: periods[index].year,
                month: periods[index].month,
                ...result,
            }));
        } catch (error) {
            console.error(
                `[AlphaService] Error calculating multiple months:`,
                error,
            );
            throw error;
        }
    }
}

export default AlphaCalculationService;
