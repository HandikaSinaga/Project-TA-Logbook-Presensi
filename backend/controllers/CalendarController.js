import { Op } from "sequelize";
import models from "../models/index.js";
import { validateDateInput, isFutureDate } from "../utils/dateHelper.js";

const {
    Holiday,
    Attendance,
    Logbook,
    Leave,
    User,
    Division,
    AppSetting,
} = models;

/**
 * CalendarController - Fully Optimized Version
 * 
 * Best Practices Implemented:
 * - Promise.all() for parallel queries (better performance)
 * - raw: true untuk queries yang tidak perlu Sequelize instances
 * - Attributes filtering untuk minimal data transfer
 * - Proper error handling dengan descriptive messages in Bahasa Indonesia
 * - Consistent response structure untuk semua endpoints
 * - Helper methods untuk reusable logic
 * 
 * @class CalendarController
 */
class CalendarController {
    /**
     * Helper: Get working days configuration from AppSetting
     * @returns {Promise<number[]>} Array of working days (0-6, where 0 = Sunday)
     */
    static async getWorkingDaysConfig() {
        try {
            const setting = await AppSetting.findOne({
                where: { key: "working_days" },
                attributes: ["value"],
                raw: true,
            });
            return setting?.value ? JSON.parse(setting.value) : [1, 2, 3, 4, 5];
        } catch (error) {
            console.error("Error parsing working_days:", error);
            return [1, 2, 3, 4, 5]; // Default: Senin-Jumat
        }
    }

    /**
     * Helper: Parse and validate month date range
     * @param {string|number} year - Target year
     * @param {string|number} month - Target month (1-12)
     * @returns {Object} Date range object with year, month, firstDay, lastDay
     */
    static getMonthDateRange(year, month) {
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
        const firstDay = new Date(targetYear, targetMonth, 1);
        const lastDay = new Date(targetYear, targetMonth + 1, 0);

        return {
            year: targetYear,
            month: targetMonth + 1,
            firstDay: firstDay.toISOString().split("T")[0],
            lastDay: lastDay.toISOString().split("T")[0],
        };
    }

    /**
     * USER ROLE: Get calendar data for current user
     * Optimized dengan Promise.all() untuk parallel queries
     * 
     * @route GET /api/user/calendar
     * @access Private (User)
     */
    static async getUserCalendar(req, res) {
        try {
            const userId = req.user.id;
            const { year, month } = req.query;

            // Parse date range
            const period = CalendarController.getMonthDateRange(year, month);
            const { firstDay, lastDay } = period;

            // Parallel queries untuk performance optimal
            const [workingDays, holidays, attendances, logbooks, leaves] =
                await Promise.all([
                    CalendarController.getWorkingDaysConfig(),
                    Holiday.findAll({
                        where: {
                            date: { [Op.between]: [firstDay, lastDay] },
                            is_active: true,
                        },
                        attributes: [
                            "id",
                            "date",
                            "name",
                            "description",
                            "type",
                            "is_national",
                        ],
                        order: [["date", "ASC"]],
                        raw: true,
                    }),
                    Attendance.findAll({
                        where: {
                            user_id: userId,
                            date: { [Op.between]: [firstDay, lastDay] },
                        },
                        attributes: [
                            "id",
                            "date",
                            "check_in_time",
                            "check_out_time",
                            "status",
                            "work_type",
                            "check_in_address",
                            "notes",
                        ],
                        order: [["date", "ASC"]],
                        raw: true,
                    }),
                    Logbook.findAll({
                        where: {
                            user_id: userId,
                            date: { [Op.between]: [firstDay, lastDay] },
                        },
                        attributes: ["id", "date", "activity", "description", "created_at"],
                        order: [["date", "ASC"]],
                        raw: true,
                    }),
                    Leave.findAll({
                        where: {
                            user_id: userId,
                            status: "approved", // Only show approved leaves
                            [Op.or]: [
                                { start_date: { [Op.between]: [firstDay, lastDay] } },
                                { end_date: { [Op.between]: [firstDay, lastDay] } },
                                {
                                    [Op.and]: [
                                        { start_date: { [Op.lte]: firstDay } },
                                        { end_date: { [Op.gte]: lastDay } },
                                    ],
                                },
                            ],
                        },
                        attributes: [
                            "id",
                            "start_date",
                            "end_date",
                            "type",
                            "reason",
                            "status",
                            "reviewed_by",
                            "reviewed_at",
                        ],
                        order: [["start_date", "ASC"]],
                        raw: true,
                    }),
                ]);

            // Calculate summary statistics with proper absent calculation
            // Get working days in the period (excluding weekends and holidays)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Calculate expected working days up to today
            let expectedWorkingDays = 0;
            const periodStart = new Date(firstDay);
            const periodEnd = new Date(lastDay);
            const checkUntil = periodEnd < today ? periodEnd : new Date(today);
            checkUntil.setHours(0, 0, 0, 0);
            
            // Count working days excluding holidays
            const holidayDates = new Set(holidays.map(h => h.date));
            for (let d = new Date(periodStart); d <= checkUntil; d.setDate(d.getDate() + 1)) {
                const dayOfWeek = d.getDay();
                const dateStr = d.toISOString().split('T')[0];
                
                // CRITICAL: Only count if it's a working day (exclude weekend: 0=Sunday, 6=Saturday)
                // Count if: NOT WEEKEND AND working day AND not holiday
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                if (!isWeekend && workingDays.includes(dayOfWeek) && !holidayDates.has(dateStr)) {
                    expectedWorkingDays++;
                }
            }
            
            // Calculate leave days (count individual days, not leave records)
            const leaveDates = new Set();
            leaves.forEach(leave => {
                const start = new Date(leave.start_date);
                const end = new Date(leave.end_date);
                
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dayOfWeek = d.getDay();
                    const dateStr = d.toISOString().split('T')[0];
                    
                    // CRITICAL: Only count working days (exclude weekend: 0=Sunday, 6=Saturday)
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    if (!isWeekend && 
                        workingDays.includes(dayOfWeek) && 
                        !holidayDates.has(dateStr) && 
                        d <= checkUntil) {
                        leaveDates.add(dateStr);
                    }
                }
            });
            
            const attendanceDates = new Set(attendances.map(att => att.date));
            
            // Absent = Expected working days - Attendance days - Leave days
            const absentCount = expectedWorkingDays - attendanceDates.size - leaveDates.size;
            
            const summary = {
                totalAttendances: attendances.length,
                lateCount: attendances.filter((att) => att.status === 'late').length,
                offsiteCount: attendances.filter((att) => att.work_type === 'offsite').length,
                totalLogbooks: logbooks.length,
                totalLeaves: leaves.length,
                leaveCount: leaveDates.size, // Actual leave days, not leave records
                absentCount: Math.max(0, absentCount), // Ensure non-negative
                expectedWorkingDays,
            };

            return res.status(200).json({
                success: true,
                message: "Data kalender berhasil dimuat",
                data: {
                    period,
                    workingDays,
                    holidays,
                    attendances,
                    logbooks,
                    leaves,
                    summary,
                },
            });
        } catch (error) {
            console.error("Error in getUserCalendar:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memuat data kalender",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    }

    /**
     * USER ROLE: Get detail data for specific date
     * Optimized dengan parallel queries
     * 
     * @route GET /api/user/calendar/:date
     * @access Private (User)
     */
    static async getUserDateDetail(req, res) {
        try {
            const userId = req.user.id;
            const { date } = req.params;

            // Validate date format and check if future date
            const validation = validateDateInput(date);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: validation.error,
                });
            }

            // Additional check for future dates (security layer)
            if (isFutureDate(date)) {
                return res.status(403).json({
                    success: false,
                    message: "Tidak dapat mengakses data tanggal di masa depan",
                });
            }

            // Calculate day info
            const targetDate = new Date(date + "T00:00:00");
            const dayOfWeek = targetDate.getDay();
            const workingDays = await CalendarController.getWorkingDaysConfig();
            const isWorkingDay = workingDays.includes(dayOfWeek);

            // Parallel queries
            const [holiday, attendance, logbook, leave] = await Promise.all([
                Holiday.findOne({
                    where: { date, is_active: true },
                    attributes: ["id", "date", "name", "description", "type", "is_national"],
                    raw: true,
                }),
                Attendance.findOne({
                    where: { user_id: userId, date: date },
                    attributes: [
                        "id",
                        "date",
                        "check_in_time",
                        "check_out_time",
                        "status",
                        "work_type",
                        "check_in_address",
                        "check_in_photo",
                        "check_out_photo",
                        "notes",
                        "created_at",
                        "updated_at",
                    ],
                }),
                Logbook.findOne({
                    where: { user_id: userId, date },
                    attributes: ["id", "date", "activity", "description", "created_at", "updated_at"],
                }),
                Leave.findOne({
                    where: {
                        user_id: userId,
                        start_date: { [Op.lte]: date },
                        end_date: { [Op.gte]: date },
                    },
                    include: [
                        {
                            model: User,
                            as: "reviewer",
                            attributes: ["id", "name"],
                        },
                    ],
                    attributes: [
                        "id",
                        "start_date",
                        "end_date",
                        "type",
                        "reason",
                        "status",
                        "reviewed_by",
                        "reviewed_at",
                        "review_notes",
                        "created_at",
                    ],
                }),
            ]);

            return res.status(200).json({
                success: true,
                message: "Detail tanggal berhasil dimuat",
                data: {
                    date,
                    dayOfWeek,
                    isWorkingDay,
                    holiday,
                    attendance,
                    logbook,
                    leave,
                },
            });
        } catch (error) {
            console.error("Error in getUserDateDetail:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memuat detail tanggal",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    }

    /**
     * SUPERVISOR ROLE: Get calendar data for team
     * Optimized dengan parallel queries dan proper grouping
     * 
     * @route GET /api/supervisor/calendar
     * @access Private (Supervisor)
     */
    static async getSupervisorCalendar(req, res) {
        try {
            const supervisorId = req.user.id;
            const { year, month, user_id } = req.query;

            // Parse date range
            const period = CalendarController.getMonthDateRange(year, month);
            const { firstDay, lastDay } = period;

            // Get supervisor's division
            const supervisor = await User.findByPk(supervisorId, {
                attributes: ["division_id"],
                raw: true,
            });

            if (!supervisor || !supervisor.division_id) {
                return res.status(404).json({
                    success: false,
                    message: "Divisi supervisor tidak ditemukan",
                });
            }

            // Build user filter
            const userWhereClause = {
                division_id: supervisor.division_id,
                role: "user",
            };
            if (user_id) {
                userWhereClause.id = parseInt(user_id);
            }

            // Get team members first
            const teamMembers = await User.findAll({
                where: userWhereClause,
                attributes: ["id", "name", "email"],
                include: [
                    {
                        model: Division,
                        as: "division",
                        attributes: ["id", "name"],
                    },
                ],
                raw: false,
            });

            const teamMemberIds = teamMembers.map((member) => member.id);

            if (teamMemberIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "Data kalender tim berhasil dimuat",
                    data: {
                        period,
                        workingDays: await CalendarController.getWorkingDaysConfig(),
                        holidays: [],
                        teamMembers: [],
                        attendances: [],
                        leaves: [],
                        validationHistory: [],
                        summary: {
                            totalTeamMembers: 0,
                            totalAttendances: 0,
                            totalLeaves: 0,
                            pendingValidations: 0,
                        },
                    },
                });
            }

            // Parallel queries untuk semua data
            const [workingDays, holidays, attendances, leaves, validationHistory] =
                await Promise.all([
                    CalendarController.getWorkingDaysConfig(),
                    Holiday.findAll({
                        where: {
                            date: { [Op.between]: [firstDay, lastDay] },
                            is_active: true,
                        },
                        attributes: ["id", "date", "name", "description", "type", "is_national"],
                        order: [["date", "ASC"]],
                        raw: true,
                    }),
                    Attendance.findAll({
                        where: {
                            user_id: { [Op.in]: teamMemberIds },
                            date: { [Op.between]: [firstDay, lastDay] },
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name"],
                            },
                        ],
                        attributes: [
                            "id",
                            "user_id",
                            "date",
                            "check_in_time",
                            "check_out_time",
                            "status",
                            "work_type",
                        ],
                        order: [["date", "ASC"]],
                    }),
                    Leave.findAll({
                        where: {
                            user_id: { [Op.in]: teamMemberIds },
                            [Op.or]: [
                                { start_date: { [Op.between]: [firstDay, lastDay] } },
                                { end_date: { [Op.between]: [firstDay, lastDay] } },
                                {
                                    [Op.and]: [
                                        { start_date: { [Op.lte]: firstDay } },
                                        { end_date: { [Op.gte]: lastDay } },
                                    ],
                                },
                            ],
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name"],
                            },
                        ],
                        attributes: [
                            "id",
                            "user_id",
                            "start_date",
                            "end_date",
                            "type",
                            "reason",
                            "status",
                        ],
                        order: [["start_date", "ASC"]],
                    }),
                    Leave.findAll({
                        where: {
                            reviewed_by: supervisorId,
                            reviewed_at: { [Op.between]: [firstDay, lastDay] },
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name"],
                            },
                        ],
                        attributes: [
                            "id",
                            "user_id",
                            "start_date",
                            "end_date",
                            "type",
                            "status",
                            "reviewed_at",
                            "review_notes",
                        ],
                        order: [["reviewed_at", "DESC"]],
                    }),
                ]);

            // Calculate summary
            const summary = {
                totalTeamMembers: teamMembers.length,
                totalAttendances: attendances.length,
                totalLeaves: leaves.length,
                pendingValidations: leaves.filter((l) => l.status === "pending").length,
            };

            return res.status(200).json({
                success: true,
                message: "Data kalender tim berhasil dimuat",
                data: {
                    period,
                    workingDays,
                    holidays,
                    teamMembers,
                    attendances,
                    leaves,
                    validationHistory,
                    summary,
                },
            });
        } catch (error) {
            console.error("Error in getSupervisorCalendar:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memuat data kalender tim",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    }

    /**
     * SUPERVISOR ROLE: Get date detail for team
     * Optimized dengan parallel queries
     * 
     * @route GET /api/supervisor/calendar/:date
     * @access Private (Supervisor)
     */
    static async getSupervisorDateDetail(req, res) {
        try {
            const supervisorId = req.user.id;
            const { date } = req.params;
            const { user_id } = req.query;

            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return res.status(400).json({
                    success: false,
                    message: "Format tanggal tidak valid. Gunakan YYYY-MM-DD",
                });
            }

            // Get supervisor's division
            const supervisor = await User.findByPk(supervisorId, {
                attributes: ["division_id"],
                raw: true,
            });

            if (!supervisor || !supervisor.division_id) {
                return res.status(404).json({
                    success: false,
                    message: "Divisi supervisor tidak ditemukan",
                });
            }

            // Build user filter
            const userWhereClause = {
                division_id: supervisor.division_id,
                role: "user",
            };
            if (user_id) {
                userWhereClause.id = parseInt(user_id);
            }

            // Get team members
            const teamMembers = await User.findAll({
                where: userWhereClause,
                attributes: ["id", "name", "email"],
                raw: true,
            });

            const teamMemberIds = teamMembers.map((member) => member.id);

            // Calculate day info
            const targetDate = new Date(date + "T00:00:00");
            const dayOfWeek = targetDate.getDay();

            // Parallel queries
            const [holiday, attendances, logbooks, leaves, validations] =
                await Promise.all([
                    Holiday.findOne({
                        where: { date, is_active: true },
                        attributes: ["id", "date", "name", "description", "type", "is_national"],
                        raw: true,
                    }),
                    Attendance.findAll({
                        where: {
                            user_id: { [Op.in]: teamMemberIds },
                            date: date,
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name", "email"],
                                include: [
                                    {
                                        model: Division,
                                        as: "division",
                                        attributes: ["id", "name"],
                                    },
                                ],
                            },
                        ],
                        order: [["check_in_time", "ASC"]],
                    }),
                    Logbook.findAll({
                        where: {
                            user_id: { [Op.in]: teamMemberIds },
                            date,
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name"],
                            },
                        ],
                        order: [["created_at", "DESC"]],
                    }),
                    Leave.findAll({
                        where: {
                            user_id: { [Op.in]: teamMemberIds },
                            start_date: { [Op.lte]: date },
                            end_date: { [Op.gte]: date },
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name"],
                            },
                        ],
                    }),
                    Leave.findAll({
                        where: {
                            reviewed_by: supervisorId,
                            reviewed_at: {
                                [Op.gte]: date + " 00:00:00",
                                [Op.lte]: date + " 23:59:59",
                            },
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name"],
                            },
                        ],
                        order: [["reviewed_at", "DESC"]],
                    }),
                ]);

            // Calculate summary
            const summary = {
                totalTeamMembers: teamMembers.length,
                presentCount: attendances.length,
                onLeaveCount: leaves.filter((l) => l.status === "approved").length,
                validationsToday: validations.length,
            };

            return res.status(200).json({
                success: true,
                message: "Detail tanggal tim berhasil dimuat",
                data: {
                    date,
                    dayOfWeek,
                    holiday,
                    teamMembers,
                    attendances,
                    logbooks,
                    leaves,
                    validations,
                    summary,
                },
            });
        } catch (error) {
            console.error("Error in getSupervisorDateDetail:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memuat detail tanggal tim",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    }

    /**
     * ADMIN ROLE: Get system-wide calendar data
     * Optimized dengan parallel queries dan statistics
     * 
     * @route GET /api/admin/calendar
     * @access Private (Admin)
     */
    static async getAdminCalendar(req, res) {
        try {
            const { year, month, division_id } = req.query;

            // Parse date range
            const period = CalendarController.getMonthDateRange(year, month);
            const { firstDay, lastDay } = period;

            // Build user filter
            const userWhereClause = {};
            if (division_id) {
                userWhereClause.division_id = parseInt(division_id);
            }

            // Get users first
            const users = await User.findAll({
                where: userWhereClause,
                attributes: ["id", "name", "email", "role"],
                include: [
                    {
                        model: Division,
                        as: "division",
                        attributes: ["id", "name"],
                    },
                ],
                raw: false,
            });

            const userIds = users.map((user) => user.id);

            // Parallel queries untuk semua data
            const [workingDays, holidays, attendances, leaves] = await Promise.all([
                CalendarController.getWorkingDaysConfig(),
                Holiday.findAll({
                    where: {
                        date: { [Op.between]: [firstDay, lastDay] },
                        is_active: true,
                    },
                    include: [
                        {
                            model: User,
                            as: "creator",
                            attributes: ["id", "name"],
                        },
                    ],
                    order: [["date", "ASC"]],
                }),
                Attendance.findAll({
                    where: {
                        user_id: { [Op.in]: userIds },
                        date: { [Op.between]: [firstDay, lastDay] },
                    },
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "name"],
                            include: [
                                {
                                    model: Division,
                                    as: "division",
                                    attributes: ["id", "name"],
                                },
                            ],
                        },
                    ],
                    attributes: [
                        "id",
                        "user_id",
                        "date",
                        "check_in_time",
                        "check_out_time",
                        "status",
                    ],
                    order: [["date", "ASC"]],
                }),
                Leave.findAll({
                    where: {
                        user_id: { [Op.in]: userIds },
                        [Op.or]: [
                            { start_date: { [Op.between]: [firstDay, lastDay] } },
                            { end_date: { [Op.between]: [firstDay, lastDay] } },
                            {
                                [Op.and]: [
                                    { start_date: { [Op.lte]: firstDay } },
                                    { end_date: { [Op.gte]: lastDay } },
                                ],
                            },
                        ],
                    },
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "name"],
                        },
                    ],
                    order: [["start_date", "ASC"]],
                }),
            ]);

            // Group attendances by date untuk calendar view
            const attendancesByDate = attendances.reduce((acc, att) => {
                const dateKey = att.date;
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(att);
                return acc;
            }, {});

            // Calculate statistics
            const summary = {
                totalUsers: users.length,
                totalAttendances: attendances.length,
                lateCount: attendances.filter((att) => att.status === 'late').length,
                totalHolidays: holidays.length,
                leaveStats: {
                    pending: leaves.filter((l) => l.status === "pending").length,
                    approved: leaves.filter((l) => l.status === "approved").length,
                    rejected: leaves.filter((l) => l.status === "rejected").length,
                },
            };

            return res.status(200).json({
                success: true,
                message: "Data kalender sistem berhasil dimuat",
                data: {
                    period,
                    workingDays,
                    holidays,
                    users,
                    attendances,
                    attendancesByDate,
                    leaves,
                    summary,
                },
            });
        } catch (error) {
            console.error("Error in getAdminCalendar:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memuat data kalender sistem",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    }

    /**
     * ADMIN ROLE: Get comprehensive date detail for all users
     * Optimized dengan parallel queries
     * 
     * @route GET /api/admin/calendar/:date
     * @access Private (Admin)
     */
    static async getAdminDateDetail(req, res) {
        try {
            const { date } = req.params;
            const { division_id } = req.query;

            // Validate date format and check if future date
            const validation = validateDateInput(date);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: validation.error,
                });
            }

            // Additional check for future dates (security layer)
            if (isFutureDate(date)) {
                return res.status(403).json({
                    success: false,
                    message: "Tidak dapat mengakses data tanggal di masa depan",
                });
            }

            // Calculate day info
            const targetDate = new Date(date + "T00:00:00");
            const dayOfWeek = targetDate.getDay();

            // Build user filter
            const userWhereClause = {};
            if (division_id) {
                userWhereClause.division_id = parseInt(division_id);
            }

            // Get users
            const users = await User.findAll({
                where: userWhereClause,
                attributes: ["id", "name", "email", "role"],
                include: [
                    {
                        model: Division,
                        as: "division",
                        attributes: ["id", "name"],
                    },
                ],
                raw: false,
            });

            const userIds = users.map((user) => user.id);

            // Parallel queries
            const [holiday, attendances, logbooks, leaves] = await Promise.all([
                Holiday.findOne({
                    where: { date, is_active: true },
                    include: [
                        {
                            model: User,
                            as: "creator",
                            attributes: ["id", "name"],
                        },
                    ],
                }),
                Attendance.findAll({
                    where: {
                        user_id: { [Op.in]: userIds },
                        date: date,
                    },
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "name", "email"],
                            include: [
                                {
                                    model: Division,
                                    as: "division",
                                    attributes: ["id", "name"],
                                },
                            ],
                        },
                    ],
                    order: [["check_in_time", "ASC"]],
                }),
                Logbook.findAll({
                    where: {
                        user_id: { [Op.in]: userIds },
                        date,
                    },
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "name"],
                        },
                    ],
                    order: [["created_at", "DESC"]],
                }),
                Leave.findAll({
                    where: {
                        user_id: { [Op.in]: userIds },
                        start_date: { [Op.lte]: date },
                        end_date: { [Op.gte]: date },
                    },
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "name"],
                        },
                        {
                            model: User,
                            as: "reviewer",
                            attributes: ["id", "name"],
                        },
                    ],
                }),
            ]);

            // Calculate statistics
            const approvedLeaves = leaves.filter((l) => l.status === "approved");
            const summary = {
                totalUsers: users.length,
                presentCount: attendances.length,
                leaveCount: approvedLeaves.length,
                absentCount: users.length - attendances.length - approvedLeaves.length,
                logbookCount: logbooks.length,
            };

            return res.status(200).json({
                success: true,
                message: "Detail tanggal sistem berhasil dimuat",
                data: {
                    date,
                    dayOfWeek,
                    holiday,
                    users,
                    attendances,
                    logbooks,
                    leaves,
                    summary,
                },
            });
        } catch (error) {
            console.error("Error in getAdminDateDetail:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memuat detail tanggal sistem",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    }
}

export default CalendarController;
