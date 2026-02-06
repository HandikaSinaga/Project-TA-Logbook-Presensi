import models from "../models/index.js";
import { Op } from "sequelize";
import ExportService from "../services/ExportService.js";
import {
    getTodayJakarta,
    getJakartaDate,
    getStartOfMonthJakarta,
    getEndOfMonthJakarta,
} from "../utils/dateHelper.js";

const { Attendance, Logbook, Leave, User, Division } = models;

class ReportController {
    // Attendance Report
    async getAttendanceReport(req, res) {
        try {
            const {
                start_date,
                end_date,
                division_id,
                user_id,
                status,
                work_type,
                approval_status,
                periode,
                sumber_magang,
            } = req.query;

            const whereClause = {};

            if (start_date && end_date) {
                whereClause.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }

            if (user_id) {
                whereClause.user_id = user_id;
            }

            if (status) {
                whereClause.status = status;
            }

            if (approval_status) {
                whereClause.approval_status = approval_status;
            }

            if (work_type) {
                whereClause.work_type = work_type;
            }

            const include = [
                {
                    model: User,
                    as: "user",
                    attributes: [
                        "id",
                        "name",
                        "email",
                        "division_id",
                        "avatar",
                        "nip",
                        "periode",
                        "sumber_magang",
                    ],
                    include: [
                        {
                            model: Division,
                            as: "division",
                            attributes: ["id", "name"],
                        },
                    ],
                },
            ];

            // Build user where clause for filters
            const userWhere = {};
            if (division_id) userWhere.division_id = division_id;
            if (periode) userWhere.periode = periode;
            if (sumber_magang) userWhere.sumber_magang = sumber_magang;

            if (Object.keys(userWhere).length > 0) {
                include[0].where = userWhere;
            }

            const attendances = await Attendance.findAll({
                where: whereClause,
                include,
                order: [["date", "DESC"]],
            });

            // Calculate statistics
            const stats = {
                total_records: attendances.length,
                present: attendances.filter((a) => a.status === "present")
                    .length,
                late: attendances.filter((a) => a.status === "late").length,
                early: attendances.filter((a) => a.status === "early").length,
                absent: attendances.filter((a) => a.status === "absent").length,
                leave: attendances.filter((a) => a.status === "leave").length,
                approved: attendances.filter(
                    (a) => a.approval_status === "approved"
                ).length,
                pending: attendances.filter(
                    (a) => a.approval_status === "pending"
                ).length,
                rejected: attendances.filter(
                    (a) => a.approval_status === "rejected"
                ).length,
            };

            res.json({
                success: true,
                summary: {
                    total: stats.total_records,
                    present: stats.present,
                    late: stats.late,
                    early: stats.early,
                    absent: stats.absent,
                    leave: stats.leave,
                    approved: stats.approved,
                    pending: stats.pending,
                    rejected: stats.rejected,
                },
                data: attendances,
            });
        } catch (error) {
            console.error("Get attendance report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate attendance report",
            });
        }
    }

    // Logbook Report
    async getLogbookReport(req, res) {
        try {
            const {
                start_date,
                end_date,
                division_id,
                user_id,
                status,
                periode,
                sumber_magang,
            } = req.query;

            const whereClause = {};

            if (start_date && end_date) {
                whereClause.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }

            if (user_id) {
                whereClause.user_id = user_id;
            }

            if (status) {
                whereClause.status = status;
            }

            const include = [
                {
                    model: User,
                    as: "user",
                    attributes: [
                        "id",
                        "name",
                        "email",
                        "nip",
                        "division_id",
                        "periode",
                        "sumber_magang",
                    ],
                    include: [
                        {
                            model: Division,
                            as: "division",
                            attributes: ["id", "name"],
                        },
                    ],
                },
                {
                    model: User,
                    as: "reviewer",
                    attributes: ["id", "name"],
                    required: false,
                },
            ];

            // Build user where clause for filters (logbook)
            const userWhere = {};
            if (division_id) userWhere.division_id = division_id;
            if (periode) userWhere.periode = periode;
            if (sumber_magang) userWhere.sumber_magang = sumber_magang;

            if (Object.keys(userWhere).length > 0) {
                include[0].where = userWhere;
            }

            const logbooks = await Logbook.findAll({
                where: whereClause,
                include,
                order: [["date", "DESC"]],
            });

            const stats = {
                total_records: logbooks.length,
                pending: logbooks.filter((l) => l.status === "pending").length,
                approved: logbooks.filter((l) => l.status === "approved")
                    .length,
                rejected: logbooks.filter((l) => l.status === "rejected")
                    .length,
            };

            res.json({
                success: true,
                summary: {
                    total: stats.total_records,
                    approved: stats.approved,
                    pending: stats.pending,
                    rejected: stats.rejected,
                },
                data: logbooks,
            });
        } catch (error) {
            console.error("Get logbook report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate logbook report",
            });
        }
    }

    // Leave Report
    async getLeaveReport(req, res) {
        try {
            const {
                start_date,
                end_date,
                division_id,
                user_id,
                status,
                type,
                periode,
                sumber_magang,
            } = req.query;

            const whereClause = {};

            if (start_date && end_date) {
                whereClause.start_date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }

            if (user_id) {
                whereClause.user_id = user_id;
            }

            if (status) {
                whereClause.status = status;
            }

            if (type) {
                whereClause.type = type;
            }

            const include = [
                {
                    model: User,
                    as: "user",
                    attributes: [
                        "id",
                        "name",
                        "email",
                        "nip",
                        "division_id",
                        "periode",
                        "sumber_magang",
                    ],
                    include: [
                        {
                            model: Division,
                            as: "division",
                            attributes: ["id", "name"],
                        },
                    ],
                },
                {
                    model: User,
                    as: "reviewer",
                    attributes: ["id", "name"],
                    required: false,
                },
            ];

            // Build user where clause for filters (leave)
            const userWhere = {};
            if (division_id) userWhere.division_id = division_id;
            if (periode) userWhere.periode = periode;
            if (sumber_magang) userWhere.sumber_magang = sumber_magang;

            if (Object.keys(userWhere).length > 0) {
                include[0].where = userWhere;
            }

            const leaves = await Leave.findAll({
                where: whereClause,
                include,
                order: [["created_at", "DESC"]],
            });

            const stats = {
                total_records: leaves.length,
                pending: leaves.filter((l) => l.status === "pending").length,
                approved: leaves.filter((l) => l.status === "approved").length,
                rejected: leaves.filter((l) => l.status === "rejected").length,
                total_days: leaves.reduce(
                    (sum, l) => sum + (l.duration || 0),
                    0
                ),
                by_type: {
                    izin_sakit: leaves.filter((l) => l.type === "izin_sakit")
                        .length,
                    izin_keperluan: leaves.filter(
                        (l) => l.type === "izin_keperluan"
                    ).length,
                },
            };

            res.json({
                success: true,
                summary: {
                    total: stats.total_records,
                    approved: stats.approved,
                    pending: stats.pending,
                    rejected: stats.rejected,
                    total_days: stats.total_days,
                    izin_sakit: stats.by_type.izin_sakit,
                    izin_keperluan: stats.by_type.izin_keperluan,
                },
                data: leaves,
            });
        } catch (error) {
            console.error("Get leave report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate leave report",
            });
        }
    }

    // Summary Report - Overall statistics
    async getSummaryReport(req, res) {
        try {
            const {
                start_date,
                end_date,
                division_id,
                periode,
                sumber_magang,
            } = req.query;

            // Build user where clause for filters
            const userWhere = {};
            if (division_id) userWhere.division_id = division_id;
            if (periode) userWhere.periode = periode;
            if (sumber_magang) userWhere.sumber_magang = sumber_magang;

            // Build attendance where clause
            const attendanceWhere = {};
            if (start_date && end_date) {
                attendanceWhere.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }

            // Build logbook where clause
            const logbookWhere = {};
            if (start_date && end_date) {
                logbookWhere.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }

            // Build leave where clause
            const leaveWhere = {};
            if (start_date && end_date) {
                leaveWhere.start_date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }

            // Get attendance data
            const attendances = await Attendance.findAll({
                where: attendanceWhere,
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: [
                            "id",
                            "name",
                            "nip",
                            "periode",
                            "sumber_magang",
                        ],
                        include: [
                            {
                                model: Division,
                                as: "division",
                                attributes: ["id", "name"],
                            },
                        ],
                        where:
                            Object.keys(userWhere).length > 0
                                ? userWhere
                                : undefined,
                        required: Object.keys(userWhere).length > 0,
                    },
                ],
                order: [["date", "DESC"]],
            });

            // Get logbook data
            const logbooks = await Logbook.findAll({
                where: logbookWhere,
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: [
                            "id",
                            "name",
                            "nip",
                            "periode",
                            "sumber_magang",
                        ],
                        include: [
                            {
                                model: Division,
                                as: "division",
                                attributes: ["id", "name"],
                            },
                        ],
                        where:
                            Object.keys(userWhere).length > 0
                                ? userWhere
                                : undefined,
                        required: Object.keys(userWhere).length > 0,
                    },
                    {
                        model: User,
                        as: "reviewer",
                        attributes: ["id", "name"],
                        required: false,
                    },
                ],
                order: [["date", "DESC"]],
            });

            // Get leave data
            const leaves = await Leave.findAll({
                where: leaveWhere,
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: [
                            "id",
                            "name",
                            "nip",
                            "periode",
                            "sumber_magang",
                        ],
                        include: [
                            {
                                model: Division,
                                as: "division",
                                attributes: ["id", "name"],
                            },
                        ],
                        where:
                            Object.keys(userWhere).length > 0
                                ? userWhere
                                : undefined,
                        required: Object.keys(userWhere).length > 0,
                    },
                    {
                        model: User,
                        as: "reviewer",
                        attributes: ["id", "name"],
                        required: false,
                    },
                ],
                order: [["start_date", "DESC"]],
            });

            // Calculate statistics
            const summary = {
                total: {
                    attendance: attendances.length,
                    logbook: logbooks.length,
                    leave: leaves.length,
                },
                attendance: {
                    total: attendances.length,
                    present: attendances.filter((a) => a.status === "present")
                        .length,
                    late: attendances.filter((a) => a.status === "late").length,
                    early: attendances.filter((a) => a.status === "early")
                        .length,
                    absent: attendances.filter((a) => a.status === "absent")
                        .length,
                    leave: attendances.filter((a) => a.status === "leave")
                        .length,
                    approved: attendances.filter(
                        (a) => a.approval_status === "approved"
                    ).length,
                    pending: attendances.filter(
                        (a) => a.approval_status === "pending"
                    ).length,
                    rejected: attendances.filter(
                        (a) => a.approval_status === "rejected"
                    ).length,
                },
                logbook: {
                    total: logbooks.length,
                    approved: logbooks.filter((l) => l.status === "approved")
                        .length,
                    pending: logbooks.filter((l) => l.status === "pending")
                        .length,
                    rejected: logbooks.filter((l) => l.status === "rejected")
                        .length,
                },
                leave: {
                    total: leaves.length,
                    approved: leaves.filter((l) => l.status === "approved")
                        .length,
                    pending: leaves.filter((l) => l.status === "pending")
                        .length,
                    rejected: leaves.filter((l) => l.status === "rejected")
                        .length,
                    total_days: leaves.reduce(
                        (sum, l) => sum + (l.duration || 0),
                        0
                    ),
                },
            };

            res.json({
                success: true,
                summary,
                data: {
                    attendances,
                    logbooks,
                    leaves,
                },
            });
        } catch (error) {
            console.error("Get summary report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate summary report",
            });
        }
    }

    // Export Summary Report
    async exportSummaryReport(req, res) {
        try {
            const {
                start_date,
                end_date,
                division_id,
                periode,
                sumber_magang,
            } = req.query;

            // Build user where clause for filters
            const userWhere = {};
            if (division_id) userWhere.division_id = division_id;
            if (periode) userWhere.periode = periode;
            if (sumber_magang) userWhere.sumber_magang = sumber_magang;

            // Build attendance where clause
            const attendanceWhere = {};
            if (start_date && end_date) {
                attendanceWhere.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }

            // Build logbook where clause
            const logbookWhere = {};
            if (start_date && end_date) {
                logbookWhere.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }

            // Build leave where clause
            const leaveWhere = {};
            if (start_date && end_date) {
                leaveWhere.start_date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }

            // Get attendance data
            const attendances = await Attendance.findAll({
                where: attendanceWhere,
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: [
                            "id",
                            "name",
                            "email",
                            "nip",
                            "division_id",
                            "periode",
                            "sumber_magang",
                        ],
                        where:
                            Object.keys(userWhere).length > 0
                                ? userWhere
                                : undefined,
                        required: Object.keys(userWhere).length > 0,
                        include: [
                            {
                                model: Division,
                                as: "division",
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                ],
                order: [["date", "DESC"]],
            });

            // Get logbook data
            const logbooks = await Logbook.findAll({
                where: logbookWhere,
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: [
                            "id",
                            "name",
                            "email",
                            "nip",
                            "division_id",
                            "periode",
                            "sumber_magang",
                        ],
                        where:
                            Object.keys(userWhere).length > 0
                                ? userWhere
                                : undefined,
                        required: Object.keys(userWhere).length > 0,
                        include: [
                            {
                                model: Division,
                                as: "division",
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                    {
                        model: User,
                        as: "reviewer",
                        attributes: ["id", "name"],
                        required: false,
                    },
                ],
                order: [["date", "DESC"]],
            });

            // Get leave data
            const leaves = await Leave.findAll({
                where: leaveWhere,
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: [
                            "id",
                            "name",
                            "email",
                            "nip",
                            "division_id",
                            "periode",
                            "sumber_magang",
                        ],
                        where:
                            Object.keys(userWhere).length > 0
                                ? userWhere
                                : undefined,
                        required: Object.keys(userWhere).length > 0,
                        include: [
                            {
                                model: Division,
                                as: "division",
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                    {
                        model: User,
                        as: "reviewer",
                        attributes: ["id", "name"],
                        required: false,
                    },
                ],
                order: [["created_at", "DESC"]],
            });

            // Generate Excel file with all data
            const buffer = await ExportService.exportSummaryToExcel(
                {
                    attendances,
                    logbooks,
                    leaves,
                },
                { start_date, end_date }
            );

            // Set response headers
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=Laporan_Summary_${start_date}_${end_date}.xlsx`
            );

            res.send(buffer);
        } catch (error) {
            console.error("Export summary report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export summary report",
            });
        }
    }

    // Division Report
    async getDivisionReport(req, res) {
        try {
            const divisions = await Division.findAll({
                include: [
                    {
                        model: User,
                        as: "members",
                        attributes: ["id"],
                    },
                ],
                where: { is_active: true },
            });

            const divisionStats = await Promise.all(
                divisions.map(async (division) => {
                    const membersCount = await User.count({
                        where: { division_id: division.id, is_active: true },
                    });

                    const today = getTodayJakarta();

                    const todayStart = getTodayJakarta();
                    const todayEnd = getTodayJakarta();
                    todayEnd.setHours(23, 59, 59, 999);

                    const todayAttendance = await Attendance.count({
                        where: {
                            date: {
                                [Op.between]: [todayStart, todayEnd],
                            },
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                where: { division_id: division.id },
                            },
                        ],
                    });

                    const startOfMonth = getStartOfMonthJakarta(
                        today.getFullYear(),
                        today.getMonth() + 1
                    );
                    const endOfMonth = getEndOfMonthJakarta(
                        today.getFullYear(),
                        today.getMonth() + 1
                    );

                    const monthlyAttendance = await Attendance.count({
                        where: {
                            date: { [Op.between]: [startOfMonth, endOfMonth] },
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                where: { division_id: division.id },
                            },
                        ],
                    });

                    const workDays = this.getWorkDaysInMonth(today);
                    const attendanceRate =
                        membersCount > 0 && workDays > 0
                            ? (
                                  (monthlyAttendance /
                                      (membersCount * workDays)) *
                                  100
                              ).toFixed(1)
                            : 0;

                    return {
                        division_id: division.id,
                        division_name: division.name,
                        total_members: membersCount,
                        today_attendance: todayAttendance,
                        monthly_attendance: monthlyAttendance,
                        attendance_rate: attendanceRate,
                    };
                })
            );

            res.json({
                success: true,
                data: divisionStats,
            });
        } catch (error) {
            console.error("Get division report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate division report",
            });
        }
    }

    // Export report (CSV/Excel placeholder)
    async exportReport(req, res) {
        try {
            const { type, format } = req.query;

            // TODO: Implement CSV/Excel export

            res.json({
                success: true,
                message: "Export feature coming soon",
                data: {
                    type,
                    format,
                },
            });
        } catch (error) {
            console.error("Export report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export report",
            });
        }
    }

    // Export Attendance Report to Excel
    async exportAttendanceReport(req, res) {
        try {
            const {
                start_date,
                end_date,
                division_id,
                user_id,
                status,
                work_type,
                approval_status,
                periode,
                sumber_magang,
                format = "xlsx",
            } = req.query;

            // Get attendance data (reuse logic from getAttendanceReport)
            const whereClause = {};
            if (start_date && end_date) {
                whereClause.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }
            if (user_id) {
                whereClause.user_id = user_id;
            }
            if (status) {
                whereClause.status = status;
            }
            if (approval_status) {
                whereClause.approval_status = approval_status;
            }
            if (work_type) {
                whereClause.work_type = work_type;
            }

            const include = [
                {
                    model: User,
                    as: "user",
                    attributes: [
                        "id",
                        "name",
                        "email",
                        "nip",
                        "division_id",
                        "periode",
                        "sumber_magang",
                    ],
                    include: [
                        {
                            model: Division,
                            as: "division",
                            attributes: ["id", "name"],
                        },
                    ],
                },
            ];

            // Build user where clause for filters
            const userWhere = {};
            if (division_id) userWhere.division_id = division_id;
            if (periode) userWhere.periode = periode;
            if (sumber_magang) userWhere.sumber_magang = sumber_magang;

            if (Object.keys(userWhere).length > 0) {
                include[0].where = userWhere;
            }

            const attendances = await Attendance.findAll({
                where: whereClause,
                include,
                order: [["date", "DESC"]],
            });

            // Generate Excel file
            const buffer = await ExportService.exportAttendanceToExcel(
                attendances,
                { start_date, end_date }
            );

            // Set response headers
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=Laporan_Presensi_${start_date}_${end_date}.xlsx`
            );

            res.send(buffer);
        } catch (error) {
            console.error("Export attendance report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export attendance report",
            });
        }
    }

    // Export Logbook Report to Excel
    async exportLogbookReport(req, res) {
        try {
            const {
                start_date,
                end_date,
                division_id,
                user_id,
                status,
                periode,
                sumber_magang,
                format = "xlsx",
            } = req.query;

            // Get logbook data
            const whereClause = {};
            if (start_date && end_date) {
                whereClause.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }
            if (user_id) {
                whereClause.user_id = user_id;
            }
            if (status) {
                whereClause.status = status;
            }

            const include = [
                {
                    model: User,
                    as: "user",
                    attributes: [
                        "id",
                        "name",
                        "email",
                        "nip",
                        "division_id",
                        "periode",
                        "sumber_magang",
                    ],
                    include: [
                        {
                            model: Division,
                            as: "division",
                            attributes: ["id", "name"],
                        },
                    ],
                },
                {
                    model: User,
                    as: "reviewer",
                    attributes: ["id", "name"],
                },
            ];

            // Build user where clause for filters
            const userWhere = {};
            if (division_id) userWhere.division_id = division_id;
            if (periode) userWhere.periode = periode;
            if (sumber_magang) userWhere.sumber_magang = sumber_magang;

            if (Object.keys(userWhere).length > 0) {
                include[0].where = userWhere;
            }

            const logbooks = await Logbook.findAll({
                where: whereClause,
                include,
                order: [["date", "DESC"]],
            });

            // Generate Excel file
            const buffer = await ExportService.exportLogbookToExcel(logbooks, {
                start_date,
                end_date,
            });

            // Set response headers
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=Laporan_Logbook_${start_date}_${end_date}.xlsx`
            );

            res.send(buffer);
        } catch (error) {
            console.error("Export logbook report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export logbook report",
            });
        }
    }

    // Export Leave Report to Excel
    async exportLeaveReport(req, res) {
        try {
            const {
                start_date,
                end_date,
                division_id,
                user_id,
                status,
                type,
                periode,
                sumber_magang,
                format = "xlsx",
            } = req.query;

            // Get leave data
            const whereClause = {};
            if (start_date && end_date) {
                whereClause.start_date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }
            if (user_id) {
                whereClause.user_id = user_id;
            }
            if (status) {
                whereClause.status = status;
            }
            if (type) {
                whereClause.type = type;
            }

            const include = [
                {
                    model: User,
                    as: "user",
                    attributes: [
                        "id",
                        "name",
                        "email",
                        "nip",
                        "division_id",
                        "periode",
                        "sumber_magang",
                    ],
                    include: [
                        {
                            model: Division,
                            as: "division",
                            attributes: ["id", "name"],
                        },
                    ],
                },
                {
                    model: User,
                    as: "reviewer",
                    attributes: ["id", "name"],
                },
            ];

            // Build user where clause for filters
            const userWhere = {};
            if (division_id) userWhere.division_id = division_id;
            if (periode) userWhere.periode = periode;
            if (sumber_magang) userWhere.sumber_magang = sumber_magang;

            if (Object.keys(userWhere).length > 0) {
                include[0].where = userWhere;
            }

            const leaves = await Leave.findAll({
                where: whereClause,
                include,
                order: [["created_at", "DESC"]],
            });

            // Generate Excel file
            const buffer = await ExportService.exportLeaveToExcel(leaves, {
                start_date,
                end_date,
            });

            // Set response headers
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=Laporan_Izin_Cuti_${start_date}_${end_date}.xlsx`
            );

            res.send(buffer);
        } catch (error) {
            console.error("Export leave report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export leave report",
            });
        }
    }

    // Export Division Report to Excel
    async exportDivisionReport(req, res) {
        try {
            // Get division stats (reuse logic from getDivisionReport)
            const divisions = await Division.findAll({
                include: [
                    {
                        model: User,
                        as: "members",
                        attributes: ["id"],
                    },
                ],
                where: { is_active: true },
            });

            const divisionStats = await Promise.all(
                divisions.map(async (division) => {
                    const membersCount = await User.count({
                        where: { division_id: division.id, is_active: true },
                    });

                    const today = getTodayJakarta();

                    const todayStart = getTodayJakarta();
                    const todayEnd = getTodayJakarta();
                    todayEnd.setHours(23, 59, 59, 999);

                    const todayAttendance = await Attendance.count({
                        where: {
                            date: {
                                [Op.between]: [todayStart, todayEnd],
                            },
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                where: { division_id: division.id },
                            },
                        ],
                    });

                    const startOfMonth = getStartOfMonthJakarta(
                        today.getFullYear(),
                        today.getMonth() + 1
                    );
                    const endOfMonth = getEndOfMonthJakarta(
                        today.getFullYear(),
                        today.getMonth() + 1
                    );

                    const monthlyAttendance = await Attendance.count({
                        where: {
                            date: { [Op.between]: [startOfMonth, endOfMonth] },
                        },
                        include: [
                            {
                                model: User,
                                as: "user",
                                where: { division_id: division.id },
                            },
                        ],
                    });

                    const workDays = this.getWorkDaysInMonth(today);
                    const attendanceRate =
                        membersCount > 0 && workDays > 0
                            ? (
                                  (monthlyAttendance /
                                      (membersCount * workDays)) *
                                  100
                              ).toFixed(1)
                            : 0;

                    return {
                        division_id: division.id,
                        division_name: division.name,
                        total_members: membersCount,
                        today_attendance: todayAttendance,
                        monthly_attendance: monthlyAttendance,
                        attendance_rate: attendanceRate,
                    };
                })
            );

            // Generate Excel file
            const buffer = await ExportService.exportDivisionToExcel(
                divisionStats
            );

            // Set response headers
            const jakartaNow = getJakartaDate();
            const today = jakartaNow.toISOString().split("T")[0];
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=Laporan_Divisi_${today}.xlsx`
            );

            res.send(buffer);
        } catch (error) {
            console.error("Export division report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export division report",
            });
        }
    }

    // Helper: Get work days in month
    getWorkDaysInMonth(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        let workDays = 0;

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dayOfWeek = currentDate.getDay();

            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workDays++;
            }
        }

        return workDays;
    }
}

export default new ReportController();
