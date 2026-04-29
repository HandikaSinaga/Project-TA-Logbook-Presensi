import { Op } from "sequelize";
import models from "../models/index.js";
import { validateDateInput, isFutureDate } from "../utils/dateHelper.js";
import AlphaCalculationService from "../services/AlphaCalculationService.js";
import WorkCalendarService from "../services/WorkCalendarService.js";

const { Holiday, Attendance, Logbook, Leave, User, Division, AppSetting } =
    models;

/**
 * CalendarController - Fully Optimized Version with AlphaCalculationService
 *
 * Best Practices Implemented:
 * - AlphaCalculationService as SINGLE SOURCE OF TRUTH for alpha calculation
 * - User join date (created_at) validation
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

        // FIX: Use local date formatting to avoid timezone conversion
        // .toISOString() converts to UTC which causes off-by-one errors in WIB (UTC+7)
        const formatLocalDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const d = String(date.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        };

        return {
            year: targetYear,
            month: targetMonth + 1,
            firstDay: formatLocalDate(firstDay),
            lastDay: formatLocalDate(lastDay),
        };
    }

    /**
     * USER ROLE: Get calendar data for current user
     * Uses AlphaCalculationService as single source of truth
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

            // Get user info (needed for join date validation)
            const user = await User.findByPk(userId, {
                attributes: ["id", "name", "email", "created_at"],
                raw: true,
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User tidak ditemukan",
                });
            }

            // Parallel queries untuk performance optimal
            const [
                workingDays,
                holidays,
                attendances,
                logbooks,
                leaves,
                alphaStats,
            ] = await Promise.all([
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
                    attributes: [
                        "id",
                        "date",
                        "activity",
                        "description",
                        "created_at",
                    ],
                    order: [["date", "ASC"]],
                    raw: true,
                }),
                Leave.findAll({
                    where: {
                        user_id: userId,
                        status: "approved", // Only show approved leaves
                        [Op.or]: [
                            {
                                start_date: {
                                    [Op.between]: [firstDay, lastDay],
                                },
                            },
                            {
                                end_date: {
                                    [Op.between]: [firstDay, lastDay],
                                },
                            },
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
                // Use AlphaCalculationService as SINGLE SOURCE OF TRUTH
                AlphaCalculationService.calculateMonthlyAlpha(
                    userId,
                    period.year,
                    period.month,
                ),
            ]);

            // Build summary from AlphaCalculationService + other counts
            const summary = {
                totalAttendances: attendances.length,
                lateCount: attendances.filter((att) => att.status === "late")
                    .length,
                offsiteCount: attendances.filter(
                    (att) => att.work_type === "offsite",
                ).length,
                totalLogbooks: logbooks.length,
                totalLeaves: leaves.length,
                // Alpha stats from centralized service
                absentCount: alphaStats.alphaCount,
                expectedWorkingDays: alphaStats.expectedWorkingDays,
                attendanceDays: alphaStats.attendanceDays,
                leaveDays: alphaStats.leaveDays,
            };

            console.log(`[Calendar] Summary for user ${userId}:`, summary);

            return res.status(200).json({
                success: true,
                message: "Data kalender berhasil dimuat",
                data: {
                    period,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        created_at: user.created_at,
                    },
                    workingDays,
                    holidays,
                    attendances,
                    logbooks,
                    leaves,
                    summary,
                    alphaDetails: alphaStats.details, // Include calculation details
                },
            });
        } catch (error) {
            console.error("Error in getUserCalendar:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memuat data kalender",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
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
                    attributes: [
                        "id",
                        "date",
                        "name",
                        "description",
                        "type",
                        "is_national",
                    ],
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
                    attributes: [
                        "id",
                        "date",
                        "activity",
                        "description",
                        "created_at",
                        "updated_at",
                    ],
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
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
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

            // Get supervisor with assignment date
            const supervisor = await User.findByPk(supervisorId, {
                attributes: [
                    "id",
                    "division_id",
                    "supervisor_division_assigned_at",
                ],
                raw: true,
            });

            if (!supervisor || !supervisor.division_id) {
                return res.status(404).json({
                    success: false,
                    message: "Divisi supervisor tidak ditemukan",
                });
            }

            // Calculate effective first day based on supervisor assignment date
            let effectiveFirstDay = firstDay;
            if (supervisor.supervisor_division_assigned_at) {
                const assignedDate = new Date(
                    supervisor.supervisor_division_assigned_at,
                );
                assignedDate.setHours(0, 0, 0, 0);
                const firstDayDate = new Date(firstDay);
                firstDayDate.setHours(0, 0, 0, 0);

                // If supervisor was assigned after the month started, use assigned date
                if (assignedDate > firstDayDate) {
                    effectiveFirstDay =
                        WorkCalendarService.formatLocalDate(assignedDate);
                }

                // If supervisor was assigned after the month ended, return empty data
                const lastDayDate = new Date(lastDay);
                lastDayDate.setHours(0, 0, 0, 0);
                if (assignedDate > lastDayDate) {
                    return res.status(200).json({
                        success: true,
                        message: "Data kalender tim berhasil dimuat",
                        data: {
                            period,
                            supervisorAssignedAt:
                                supervisor.supervisor_division_assigned_at,
                            workingDays:
                                await CalendarController.getWorkingDaysConfig(),
                            holidays: [],
                            teamMembers: [],
                            attendances: [],
                            logbooks: [],
                            leaves: [],
                            validationHistory: [],
                            summary: {
                                totalTeamMembers: 0,
                                totalAttendances: 0,
                                totalLogbooks: 0,
                                totalLeaves: 0,
                                pendingValidations: 0,
                            },
                        },
                    });
                }
            }

            // Apply today constraint (don't show future dates)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastDayDate = new Date(lastDay);
            lastDayDate.setHours(0, 0, 0, 0);
            let effectiveLastDay = lastDay;
            if (lastDayDate > today) {
                effectiveLastDay = WorkCalendarService.formatLocalDate(today);
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
                        supervisorAssignedAt:
                            supervisor.supervisor_division_assigned_at,
                        workingDays:
                            await CalendarController.getWorkingDaysConfig(),
                        holidays: [],
                        teamMembers: [],
                        attendances: [],
                        logbooks: [],
                        leaves: [],
                        validationHistory: [],
                        summary: {
                            totalTeamMembers: 0,
                            totalAttendances: 0,
                            totalLogbooks: 0,
                            totalLeaves: 0,
                            pendingValidations: 0,
                        },
                    },
                });
            }

            // Parallel queries with date restrictions
            const [
                workingDays,
                holidays,
                attendances,
                leaves,
                logbooks,
                validationHistory,
            ] = await Promise.all([
                CalendarController.getWorkingDaysConfig(),
                Holiday.findAll({
                    where: {
                        date: {
                            [Op.between]: [effectiveFirstDay, effectiveLastDay],
                        },
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
                        user_id: { [Op.in]: teamMemberIds },
                        date: {
                            [Op.between]: [effectiveFirstDay, effectiveLastDay],
                        },
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
                            {
                                start_date: {
                                    [Op.between]: [
                                        effectiveFirstDay,
                                        effectiveLastDay,
                                    ],
                                },
                            },
                            {
                                end_date: {
                                    [Op.between]: [
                                        effectiveFirstDay,
                                        effectiveLastDay,
                                    ],
                                },
                            },
                            {
                                [Op.and]: [
                                    {
                                        start_date: {
                                            [Op.lte]: effectiveFirstDay,
                                        },
                                    },
                                    {
                                        end_date: {
                                            [Op.gte]: effectiveLastDay,
                                        },
                                    },
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
                Logbook.findAll({
                    where: {
                        user_id: { [Op.in]: teamMemberIds },
                        date: {
                            [Op.between]: [effectiveFirstDay, effectiveLastDay],
                        },
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
                        "description",
                        "status",
                        "created_at",
                    ],
                    order: [["date", "ASC"]],
                }),
                Leave.findAll({
                    where: {
                        reviewed_by: supervisorId,
                        reviewed_at: {
                            [Op.between]: [effectiveFirstDay, effectiveLastDay],
                        },
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

            // Calculate detailed summary for supervisor view
            // Attendance breakdown
            const attendanceStats = {
                total: attendances.length,
                onTime: attendances.filter((a) => a.status === "on-time")
                    .length,
                late: attendances.filter((a) => a.status === "late").length,
            };

            // Logbook breakdown
            const logbookStats = {
                total: logbooks.length,
                pending: logbooks.filter((l) => l.status === "pending").length,
                approved: logbooks.filter((l) => l.status === "approved")
                    .length,
                rejected: logbooks.filter((l) => l.status === "rejected")
                    .length,
            };

            // Leave breakdown
            const leaveStats = {
                total: leaves.length,
                approved: leaves.filter((l) => l.status === "approved").length,
                pending: leaves.filter((l) => l.status === "pending").length,
                rejected: leaves.filter((l) => l.status === "rejected").length,
            };

            // Calculate summary
            const summary = {
                totalTeamMembers: teamMembers.length,
                attendance: attendanceStats,
                logbook: logbookStats,
                leave: leaveStats,
                holidays: {
                    national: holidays.filter((h) => h.is_national).length,
                    custom: holidays.filter((h) => !h.is_national).length,
                },
                pendingValidations: validationHistory.filter(
                    (v) => v.status === "pending",
                ).length,
                // Keep backward compatibility
                totalAttendances: attendanceStats.total,
                totalLogbooks: logbookStats.total,
                totalLeaves: leaveStats.total,
            };

            // If user_id filter is applied, add user-specific summary fields
            if (user_id) {
                const targetUserId = parseInt(user_id);

                // Get selected user info (including created_at for join date validation)
                const selectedUser = await User.findByPk(targetUserId, {
                    attributes: ["id", "name", "email", "created_at"],
                    raw: true,
                });

                const userAttendances = attendances.filter(
                    (a) => a.user_id === targetUserId,
                );
                const lateCount = userAttendances.filter(
                    (a) => a.status === "late",
                ).length;

                // Use AlphaCalculationService as SINGLE SOURCE OF TRUTH (same as getUserCalendar)
                const alphaStats =
                    await AlphaCalculationService.calculateMonthlyAlpha(
                        targetUserId,
                        period.year,
                        period.month,
                    );

                // Build user-specific summary identical to getUserCalendar
                const userSummary = {
                    totalAttendances: userAttendances.length,
                    lateCount,
                    offsiteCount: userAttendances.filter(
                        (a) => a.work_type === "offsite",
                    ).length,
                    totalLogbooks: logbooks.filter(
                        (l) => l.user_id === targetUserId,
                    ).length,
                    totalLeaves: leaves.filter(
                        (l) => l.user_id === targetUserId,
                    ).length,
                    // Alpha stats from centralized service
                    absentCount: alphaStats.alphaCount,
                    expectedWorkingDays: alphaStats.expectedWorkingDays,
                    attendanceDays: alphaStats.attendanceDays,
                    leaveDays: alphaStats.leaveDays,
                    // Alias for frontend compatibility
                    leaveCount: alphaStats.leaveDays,
                };

                // Add user field to response for frontend to identify user-specific view
                return res.status(200).json({
                    success: true,
                    message: "Data kalender tim berhasil dimuat",
                    data: {
                        period,
                        user: selectedUser, // Include user info with created_at
                        supervisorAssignedAt:
                            supervisor.supervisor_division_assigned_at,
                        workingDays,
                        holidays,
                        teamMembers,
                        attendances: userAttendances,
                        logbooks: logbooks.filter(
                            (l) => l.user_id === targetUserId,
                        ),
                        leaves: leaves.filter(
                            (l) => l.user_id === targetUserId,
                        ),
                        validationHistory,
                        summary: userSummary,
                        alphaDetails: alphaStats.details,
                    },
                });
            }

            // Calculate per-member stats for Member Scorecard (team view only)
            const memberStatsPromises = teamMembers.map(async (member) => {
                try {
                    const alphaStats = await AlphaCalculationService.calculateMonthlyAlpha(
                        member.id,
                        period.year,
                        period.month,
                    );
                    const memberAttendances = attendances.filter(a => a.user_id === member.id);
                    const lateDays = memberAttendances.filter(a => a.status === "late").length;
                    const totalWorkingDays = alphaStats.expectedWorkingDays || 1;
                    const attendanceDays = alphaStats.attendanceDays || 0;
                    const attendanceRate = Math.round((attendanceDays / totalWorkingDays) * 100);

                    return {
                        id: member.id,
                        name: member.name,
                        attendanceDays,
                        lateDays,
                        absentDays: alphaStats.alphaCount || 0,
                        leaveDays: alphaStats.leaveDays || 0,
                        attendanceRate: Math.min(100, Math.max(0, attendanceRate)),
                    };
                } catch {
                    return {
                        id: member.id,
                        name: member.name,
                        attendanceDays: 0,
                        lateDays: 0,
                        absentDays: 0,
                        leaveDays: 0,
                        attendanceRate: 0,
                    };
                }
            });
            const memberStats = await Promise.all(memberStatsPromises);

            return res.status(200).json({
                success: true,
                message: "Data kalender tim berhasil dimuat",
                data: {
                    period,
                    supervisorAssignedAt:
                        supervisor.supervisor_division_assigned_at,
                    workingDays,
                    holidays,
                    teamMembers,
                    attendances,
                    logbooks,
                    leaves,
                    validationHistory,
                    summary,
                    memberStats, // Per-member scorecard data
                },
            });

        } catch (error) {
            console.error("Error in getSupervisorCalendar:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memuat data kalender tim",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
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

            // Get working days config to determine if it's a working day
            const workingDays = await CalendarController.getWorkingDaysConfig();

            // Calculate day info
            const targetDate = new Date(date + "T00:00:00");
            const dayOfWeek = targetDate.getDay();
            const isWorkingDay = workingDays.includes(dayOfWeek);

            // ===================================================================
            // USER-SPECIFIC MODE: When user_id is provided
            // Returns format identical to getUserDateDetail for consistent UI
            // ===================================================================
            if (user_id) {
                const targetUserId = parseInt(user_id);

                // Validate user belongs to supervisor's division
                const targetUser = await User.findOne({
                    where: {
                        id: targetUserId,
                        division_id: supervisor.division_id,
                        role: "user",
                    },
                    attributes: ["id", "name", "email", "created_at"],
                    raw: true,
                });

                if (!targetUser) {
                    return res.status(404).json({
                        success: false,
                        message: "User tidak ditemukan di divisi Anda",
                    });
                }

                // Parallel queries - identical to getUserDateDetail
                const [holiday, attendance, logbook, leave] = await Promise.all([
                    Holiday.findOne({
                        where: { date, is_active: true },
                        attributes: [
                            "id", "date", "name", "description", "type", "is_national",
                        ],
                        raw: true,
                    }),
                    Attendance.findOne({
                        where: { user_id: targetUserId, date },
                        attributes: [
                            "id", "date", "check_in_time", "check_out_time",
                            "status", "work_type", "check_in_address",
                            "check_in_photo", "check_out_photo", "notes",
                            "created_at", "updated_at",
                        ],
                    }),
                    Logbook.findOne({
                        where: { user_id: targetUserId, date },
                        attributes: [
                            "id", "date", "activity", "description",
                            "status", "created_at", "updated_at",
                        ],
                    }),
                    Leave.findOne({
                        where: {
                            user_id: targetUserId,
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
                            "id", "start_date", "end_date", "type",
                            "reason", "status", "reviewed_by", "reviewed_at",
                            "review_notes", "created_at",
                        ],
                    }),
                ]);

                return res.status(200).json({
                    success: true,
                    message: "Detail tanggal user berhasil dimuat",
                    data: {
                        date,
                        dayOfWeek,
                        isWorkingDay,
                        holiday,
                        attendance,
                        logbook,
                        leave,
                        // viewMode tells frontend this is user-specific detail
                        viewMode: "user",
                        user: targetUser,
                    },
                });
            }

            // ===================================================================
            // TEAM VIEW MODE: No user_id, show aggregated team stats
            // ===================================================================
            const userWhereClause = {
                division_id: supervisor.division_id,
                role: "user",
            };

            // Get team members
            const teamMembers = await User.findAll({
                where: userWhereClause,
                attributes: ["id", "name", "email"],
                raw: true,
            });

            const teamMemberIds = teamMembers.map((member) => member.id);

            // Parallel queries
            const [holiday, attendances, logbooks, leaves, validations] =
                await Promise.all([
                    Holiday.findOne({
                        where: { date, is_active: true },
                        attributes: [
                            "id", "date", "name", "description", "type", "is_national",
                        ],
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

            // Calculate comprehensive summary for supervisor view
            const attendanceStats = {
                total: attendances.length,
                onTime: attendances.filter((a) => a.status === "on-time").length,
                late: attendances.filter((a) => a.status === "late").length,
                absent:
                    teamMembers.length -
                    attendances.length -
                    leaves.filter((l) => l.status === "approved").length,
            };

            const logbookStats = {
                total: logbooks.length,
                pending: logbooks.filter((l) => l.status === "pending").length,
                approved: logbooks.filter((l) => l.status === "approved").length,
                rejected: logbooks.filter((l) => l.status === "rejected").length,
            };

            const leaveStats = {
                approved: leaves.filter((l) => l.status === "approved").length,
                pending: leaves.filter((l) => l.status === "pending").length,
                rejected: leaves.filter((l) => l.status === "rejected").length,
            };

            const summary = {
                date,
                dayOfWeek,
                isWorkingDay,
                totalTeamMembers: teamMembers.length,
                attendance: attendanceStats,
                logbook: logbookStats,
                leave: leaveStats,
                validationsToday: validations.length,
            };

            return res.status(200).json({
                success: true,
                message: "Detail tanggal tim berhasil dimuat",
                data: {
                    date,
                    dayOfWeek,
                    isWorkingDay,
                    holiday,
                    summary,
                    viewMode: "team",
                    _details: {
                        teamMembers,
                        attendances,
                        logbooks,
                        leaves,
                        validations,
                    },
                },
            });
        } catch (error) {
            console.error("Error in getSupervisorDateDetail:", error);
            return res.status(500).json({
                success: false,
                message: "Gagal memuat detail tanggal tim",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
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
            const [workingDays, holidays, attendances, leaves] =
                await Promise.all([
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
                                {
                                    start_date: {
                                        [Op.between]: [firstDay, lastDay],
                                    },
                                },
                                {
                                    end_date: {
                                        [Op.between]: [firstDay, lastDay],
                                    },
                                },
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
                lateCount: attendances.filter((att) => att.status === "late")
                    .length,
                totalHolidays: holidays.length,
                leaveStats: {
                    pending: leaves.filter((l) => l.status === "pending")
                        .length,
                    approved: leaves.filter((l) => l.status === "approved")
                        .length,
                    rejected: leaves.filter((l) => l.status === "rejected")
                        .length,
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
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
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
            const approvedLeaves = leaves.filter(
                (l) => l.status === "approved",
            );
            const summary = {
                totalUsers: users.length,
                presentCount: attendances.length,
                leaveCount: approvedLeaves.length,
                absentCount:
                    users.length - attendances.length - approvedLeaves.length,
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
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            });
        }
    }
}

export default CalendarController;
