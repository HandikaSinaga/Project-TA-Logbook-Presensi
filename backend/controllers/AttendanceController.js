import models from "../models/index.js";
import { Op } from "sequelize";
import LocationHelper from "../utils/locationHelper.js";
import {
    createUploadMiddleware,
    getPublicPath,
} from "../utils/uploadHelper.js";
import { getJakartaDate, getTodayJakarta } from "../utils/dateHelper.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Attendance, User, Logbook, Division } = models;

class AttendanceController {
    // Get user's attendance records
    async getUserAttendance(req, res) {
        try {
            const userId = req.user.id;
            const { month, year, date_from, date_to } = req.query;

            const whereClause = { user_id: userId };

            // Priority: date_from/date_to over month/year
            if (date_from || date_to) {
                whereClause.date = {};
                if (date_from) {
                    whereClause.date[Op.gte] = new Date(date_from);
                }
                if (date_to) {
                    const endDate = new Date(date_to);
                    endDate.setHours(23, 59, 59, 999);
                    whereClause.date[Op.lte] = endDate;
                }
            } else if (month && year) {
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59, 999);
                whereClause.date = { [Op.between]: [startDate, endDate] };
            }

            const attendances = await Attendance.findAll({
                where: whereClause,
                order: [["date", "DESC"]],
                limit: 100,
            });

            res.json({
                success: true,
                data: attendances,
            });
        } catch (error) {
            console.error("Get user attendance error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get attendance records",
            });
        }
    }

    // Get today's attendance
    async getTodayAttendance(req, res) {
        try {
            const userId = req.user.id;
            const today = getTodayJakarta();

            const attendance = await Attendance.findOne({
                where: {
                    user_id: userId,
                    date: today,
                },
            });

            res.json({
                success: true,
                data: attendance,
            });
        } catch (error) {
            console.error("Get today attendance error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get today's attendance",
            });
        }
    }

    // Pre-check work type (ONSITE/OFFSITE) sebelum check-in/check-out
    async preCheckWorkType(req, res) {
        try {
            const { latitude, longitude } = req.body;

            // GPS opsional - WiFi/IP sebagai prioritas utama
            // Untuk admin testing, bisa tanpa GPS

            // Get client IP
            const clientIp = LocationHelper.getClientIp(req);
            console.log(
                `[Pre-check] IP: ${clientIp} | GPS: ${latitude || "none"},${
                    longitude || "none"
                }`,
            );

            // Validate location (GPS opsional)
            const locationValidation =
                await LocationHelper.validateAttendanceLocation(
                    clientIp,
                    latitude || null,
                    longitude || null,
                );

            const workType = locationValidation.isOnsite ? "onsite" : "offsite";

            res.json({
                success: true,
                workType: workType,
                isOnsite: locationValidation.isOnsite,
                reason: locationValidation.reason,
                office: locationValidation.office
                    ? {
                          id: locationValidation.office.id,
                          name: locationValidation.office.name,
                      }
                    : null,
                distance: locationValidation.distance,
                detectionMethod: locationValidation.detectionMethod,
                requiresPhoto: !locationValidation.isOnsite,
                requiresReason: !locationValidation.isOnsite,
            });
        } catch (error) {
            console.error(
                "[AttendanceController.preCheckWorkType] Error:",
                error,
            );
            res.status(500).json({
                success: false,
                message: "Gagal mendeteksi work type",
                error: error.message,
            });
        }
    }

    // Check-in with ONSITE/OFFSITE detection
    async checkIn(req, res) {
        try {
            const userId = req.user.id;
            const { latitude, longitude, address, offsite_reason } = req.body;
            const today = getTodayJakarta();

            // Check if already checked in
            const existing = await Attendance.findOne({
                where: {
                    user_id: userId,
                    date: today,
                },
            });

            if (existing && existing.check_in_time) {
                return res.status(400).json({
                    success: false,
                    message: "Anda sudah melakukan check-in hari ini",
                });
            }

            // Get client IP (WiFi detection adalah prioritas utama)
            const clientIp = LocationHelper.getClientIp(req);
            console.log(
                `[Check-in] User ${userId} | IP: ${clientIp} | GPS: ${
                    latitude || "none"
                },${longitude || "none"}`,
            );

            // Validate location (ONSITE vs OFFSITE)
            // Priority: WiFi kantor (IP) → ONSITE, jika bukan → cek GPS (optional) → jika diluar/tidak ada → OFFSITE
            // GPS tidak mandatory, hanya sebagai validator kedua
            const locationValidation =
                await LocationHelper.validateAttendanceLocation(
                    clientIp,
                    latitude || null,
                    longitude || null,
                );

            const workType = locationValidation.isOnsite ? "onsite" : "offsite";

            // ========== VALIDATION OFFSITE ==========
            // Jika OFFSITE, WAJIB ada keterangan dan foto
            if (workType === "offsite") {
                if (!offsite_reason || offsite_reason.trim() === "") {
                    return res.status(400).json({
                        success: false,
                        message: "Keterangan wajib diisi untuk absen OFFSITE",
                        workType: "offsite",
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: "Foto wajib diunggah untuk absen OFFSITE",
                        workType: "offsite",
                    });
                }
            }

            // ========== VALIDATION ONSITE ==========
            // Jika ONSITE, tidak perlu keterangan/foto - langsung check-in saja
            // GPS opsional, WiFi/IP sebagai prioritas utama

            const now = getJakartaDate();
            const checkInTime = `${now
                .getHours()
                .toString()
                .padStart(2, "0")}:${now
                .getMinutes()
                .toString()
                .padStart(2, "0")}:${now
                .getSeconds()
                .toString()
                .padStart(2, "0")}`;

            // Determine status (late if after 08:00)
            const hour = now.getHours();
            const minute = now.getMinutes();
            const isLate = hour > 8 || (hour === 8 && minute > 0);

            const attendanceData = {
                user_id: userId,
                date: today,
                check_in_time: checkInTime,
                check_in_latitude: latitude,
                check_in_longitude: longitude,
                check_in_address: address || null,
                check_in_ip: clientIp,
                work_type: workType,
                offsite_reason: workType === "offsite" ? offsite_reason : null,
                check_in_photo: req.file ? getPublicPath(req.file.path) : null,
                status: isLate ? "late" : "present",
            };

            let attendance;
            if (existing) {
                await existing.update(attendanceData);
                attendance = existing;
            } else {
                attendance = await Attendance.create(attendanceData);
            }

            console.log(
                `[Check-in Success] User ${userId} | Type: ${workType.toUpperCase()} | Status: ${
                    attendance.status
                }`,
            );

            res.json({
                success: true,
                message: `Check-in berhasil (${workType.toUpperCase()})`,
                data: {
                    ...attendance.toJSON(),
                    location_validation: locationValidation,
                },
            });
        } catch (error) {
            console.error(
                "[AttendanceController.checkIn] Error:",
                error.message,
            );
            res.status(500).json({
                success: false,
                message: "Check-in gagal",
                error: error.message,
            });
        }
    }

    // Check-out with ONSITE/OFFSITE detection
    async checkOut(req, res) {
        try {
            const userId = req.user.id;
            const { latitude, longitude, address, offsite_reason } = req.body;

            console.log("[Check-out Request]", {
                userId,
                latitude,
                longitude,
                address,
                offsite_reason,
                hasFile: !!req.file,
            });

            const today = getTodayJakarta();

            const attendance = await Attendance.findOne({
                where: {
                    user_id: userId,
                    date: today,
                },
            });

            if (!attendance || !attendance.check_in_time) {
                return res.status(400).json({
                    success: false,
                    message: "Anda belum melakukan check-in hari ini",
                });
            }

            if (attendance.check_out_time) {
                return res.status(400).json({
                    success: false,
                    message: "Anda sudah melakukan check-out",
                });
            }

            // Validate logbook - user must have logbook entry today before checkout
            const todayStart = getTodayJakarta();
            const todayEnd = getTodayJakarta();
            todayEnd.setHours(23, 59, 59, 999);

            console.log(`[Checkout Validation] User: ${userId}, Date range: ${todayStart} to ${todayEnd}`);

            const todayLogbook = await Logbook.findOne({
                where: {
                    user_id: userId,
                    date: {
                        [Op.between]: [todayStart, todayEnd],
                    },
                },
            });

            console.log(`[Checkout Validation] Logbook found: ${todayLogbook ? 'YES' : 'NO'}`, todayLogbook ? `ID: ${todayLogbook.id}, Date: ${todayLogbook.date}` : '');

            if (!todayLogbook) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Anda harus mengisi logbook terlebih dahulu sebelum check-out",
                });
            }

            // Get client IP (WiFi detection adalah prioritas utama)
            const clientIp = LocationHelper.getClientIp(req);
            console.log(
                `[Check-out] User ${userId} | IP: ${clientIp} | GPS: ${
                    latitude || "none"
                },${longitude || "none"}`,
            );

            // Validate location untuk check-out (bisa berbeda dari check-in)
            // GPS tidak mandatory, WiFi/IP sebagai prioritas
            const locationValidation =
                await LocationHelper.validateAttendanceLocation(
                    clientIp,
                    latitude || null,
                    longitude || null,
                );

            const workType = locationValidation.isOnsite ? "onsite" : "offsite";

            // ========== VALIDATION OFFSITE ==========
            // Jika check-out OFFSITE, wajib foto dan keterangan
            if (workType === "offsite") {
                if (!offsite_reason || offsite_reason.trim() === "") {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Keterangan wajib diisi untuk check-out OFFSITE",
                        workType: "offsite",
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: "Foto wajib diunggah untuk check-out OFFSITE",
                        workType: "offsite",
                    });
                }
            }

            const now = getJakartaDate();
            const checkOutTime = `${now
                .getHours()
                .toString()
                .padStart(2, "0")}:${now
                .getMinutes()
                .toString()
                .padStart(2, "0")}:${now
                .getSeconds()
                .toString()
                .padStart(2, "0")}`;

            // Calculate work hours
            const checkIn = new Date(`2000-01-01 ${attendance.check_in_time}`);
            const checkOut = new Date(`2000-01-01 ${checkOutTime}`);
            const diffMs = checkOut - checkIn;
            const workHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

            await attendance.update({
                check_out_time: checkOutTime,
                check_out_latitude: latitude,
                check_out_longitude: longitude,
                check_out_address: address || null,
                check_out_ip: clientIp,
                check_out_photo: req.file ? getPublicPath(req.file.path) : null,
                checkout_offsite_reason:
                    workType === "offsite" ? offsite_reason : null,
                work_hours: workHours,
            });

            console.log(
                `[Check-out Success] User ${userId} | Type: ${workType.toUpperCase()} | Hours: ${workHours} | Checkout Reason: ${
                    workType === "offsite" ? offsite_reason : "N/A"
                }`,
            );

            // Debug: Log updated attendance data
            const updatedAttendance = await Attendance.findOne({
                where: { user_id: userId, date: today },
            });
            console.log("[Updated Attendance]", {
                checkout_offsite_reason:
                    updatedAttendance.checkout_offsite_reason,
                check_out_photo: updatedAttendance.check_out_photo,
            });

            res.json({
                success: true,
                message: `Check-out berhasil (${workType.toUpperCase()})`,
                data: {
                    ...attendance.toJSON(),
                    work_hours: workHours,
                    location_validation: locationValidation,
                },
            });
        } catch (error) {
            console.error(
                "[AttendanceController.checkOut] Error:",
                error.message,
            );
            res.status(500).json({
                success: false,
                message: "Check-out gagal",
                error: error.message,
            });
        }
    }

    // Get team attendance (Supervisor) - WITH PAGINATION
    async getTeamAttendance(req, res) {
        try {
            const supervisorId = req.user.id;

            // Get supervisor's division
            const supervisor = await User.findByPk(supervisorId);
            if (!supervisor.division_id) {
                return res.status(400).json({
                    success: false,
                    message: "No division assigned",
                });
            }

            const {
                month,
                year,
                date_from,
                date_to,
                approval_status,
                work_type,
                status,
                search,
                page = 1,
                limit = 20,
            } = req.query;

            // Parse pagination
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            const offset = (pageNum - 1) * limitNum;

            const whereClause = {};
            const userWhereClause = { division_id: supervisor.division_id };

            // Server-side search for user name, email, NIP
            if (search && search.trim() !== "") {
                const searchTerm = `%${search.trim()}%`;
                userWhereClause[Op.or] = [
                    { name: { [Op.like]: searchTerm } },
                    { email: { [Op.like]: searchTerm } },
                    { nip: { [Op.like]: searchTerm } },
                ];
            }

            // Priority: date_from/date_to over month/year
            if (date_from || date_to) {
                whereClause.date = {};
                if (date_from) {
                    whereClause.date[Op.gte] = new Date(date_from);
                }
                if (date_to) {
                    // Add end of day to include the entire end date
                    const endDate = new Date(date_to);
                    endDate.setHours(23, 59, 59, 999);
                    whereClause.date[Op.lte] = endDate;
                }
            } else if (month && year) {
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59, 999);
                whereClause.date = { [Op.between]: [startDate, endDate] };
            }

            // Filter by work type
            if (work_type && work_type !== "all") {
                whereClause.work_type = work_type;
            }

            // Filter by status
            if (status && status !== "all") {
                whereClause.status = status;
            }

            // Filter by approval status if provided
            if (approval_status) {
                whereClause.approval_status = approval_status;
            }

            // Get total count for pagination
            const totalRecords = await Attendance.count({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: "user",
                        where: userWhereClause,
                        attributes: [],
                    },
                ],
            });

            // Get paginated data
            const attendances = await Attendance.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: "user",
                        where: userWhereClause,
                        attributes: [
                            "id",
                            "name",
                            "email",
                            "avatar",
                            "nip",
                            "position",
                        ],
                        include: [
                            {
                                association: "division",
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                    {
                        model: User,
                        as: "approver",
                        attributes: ["id", "name", "email", "avatar"],
                        required: false,
                    },
                    {
                        model: User,
                        as: "rejector",
                        attributes: ["id", "name", "email", "avatar"],
                        required: false,
                    },
                ],
                order: [
                    ["date", "DESC"],
                    ["check_in_time", "DESC"],
                ],
                limit: limitNum,
                offset: offset,
            });

            const totalPages = Math.ceil(totalRecords / limitNum);

            res.json({
                success: true,
                data: attendances,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total_records: totalRecords,
                    total_pages: totalPages,
                    has_next: pageNum < totalPages,
                    has_prev: pageNum > 1,
                },
            });
        } catch (error) {
            console.error(
                "[AttendanceController.getTeamAttendance] Error:",
                error.name,
                "-",
                error.message,
            );
            res.status(500).json({
                success: false,
                message: "Failed to get team attendance",
            });
        }
    }

    // Get team today attendance
    async getTeamTodayAttendance(req, res) {
        try {
            const supervisorId = req.user.id;

            const supervisor = await User.findByPk(supervisorId);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const attendances = await Attendance.findAll({
                where: { date: today },
                include: [
                    {
                        model: User,
                        as: "user",
                        where: { division_id: supervisor.division_id },
                        attributes: [
                            "id",
                            "name",
                            "email",
                            "avatar",
                            "nip",
                            "position",
                        ],
                    },
                ],
            });

            res.json({
                success: true,
                data: attendances,
            });
        } catch (error) {
            console.error("Get team today attendance error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get team attendance",
            });
        }
    }

    // Get all attendance (Admin) - WITH PAGINATION
    async getAllAttendance(req, res) {
        try {
            const {
                month,
                year,
                user_id,
                date,
                date_from,
                date_to,
                division_id,
                status,
                work_type,
                search,
                page = 1,
                limit = 20,
            } = req.query;

            // Parse pagination
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            const offset = (pageNum - 1) * limitNum;

            const whereClause = {};
            const userWhereClause = {};

            // Server-side search for user name, email, NIP
            if (search && search.trim() !== "") {
                const searchTerm = `%${search.trim()}%`;
                userWhereClause[Op.or] = [
                    { name: { [Op.like]: searchTerm } },
                    { email: { [Op.like]: searchTerm } },
                    { nip: { [Op.like]: searchTerm } },
                ];
            }

            // Priority: date_from/date_to > date > month/year
            if (date_from || date_to) {
                whereClause.date = {};
                if (date_from) {
                    whereClause.date[Op.gte] = new Date(date_from);
                }
                if (date_to) {
                    const endDate = new Date(date_to);
                    endDate.setHours(23, 59, 59, 999);
                    whereClause.date[Op.lte] = endDate;
                }
            } else if (date) {
                // Filter by specific date
                const targetDate = new Date(date);
                targetDate.setHours(0, 0, 0, 0);
                const endTargetDate = new Date(date);
                endTargetDate.setHours(23, 59, 59, 999);
                whereClause.date = {
                    [Op.between]: [targetDate, endTargetDate],
                };
            } else if (month && year) {
                // Filter by month & year
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59, 999);
                whereClause.date = { [Op.between]: [startDate, endDate] };
            }

            if (user_id) {
                whereClause.user_id = user_id;
            }

            if (status && status !== "all") {
                whereClause.status = status;
            }

            if (work_type && work_type !== "all") {
                whereClause.work_type = work_type;
            }

            // Filter by division if provided
            if (division_id) {
                userWhereClause.division_id = division_id;
            }

            const includeClause = [
                {
                    model: User,
                    as: "user",
                    where:
                        Object.keys(userWhereClause).length > 0
                            ? userWhereClause
                            : undefined,
                    attributes: [
                        "id",
                        "name",
                        "email",
                        "division_id",
                        "avatar",
                        "nip",
                        "role",
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

            // Get total count for pagination
            const totalRecords = await Attendance.count({
                where: whereClause,
                include: includeClause,
            });

            // Get paginated data
            const attendances = await Attendance.findAll({
                where: whereClause,
                include: includeClause,
                order: [
                    ["date", "DESC"],
                    ["check_in_time", "DESC"],
                ],
                limit: limitNum,
                offset: offset,
            });

            const totalPages = Math.ceil(totalRecords / limitNum);

            res.json({
                success: true,
                data: attendances,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total_records: totalRecords,
                    total_pages: totalPages,
                    has_next: pageNum < totalPages,
                    has_prev: pageNum > 1,
                },
            });
        } catch (error) {
            console.error("Get all attendance error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get attendance records",
            });
        }
    }

    // Get today all attendance (Admin)
    async getTodayAllAttendance(req, res) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const attendances = await Attendance.findAll({
                where: { date: today },
                include: [
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
                        ],
                    },
                ],
            });

            res.json({
                success: true,
                data: attendances,
            });
        } catch (error) {
            console.error("Get today all attendance error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get attendance",
            });
        }
    }

    // Get attendance report
    async getAttendanceReport(req, res) {
        try {
            const { start_date, end_date, division_id } = req.query;

            const whereClause = {};
            if (start_date && end_date) {
                whereClause.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
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
                    ],
                },
            ];

            if (division_id) {
                include[0].where = { division_id };
            }

            const attendances = await Attendance.findAll({
                where: whereClause,
                include,
                order: [["date", "DESC"]],
            });

            res.json({
                success: true,
                data: attendances,
            });
        } catch (error) {
            console.error("Get attendance report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate report",
            });
        }
    }

    // Get recent attendance
    async getRecentAttendance(req, res) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 10;

            const attendances = await Attendance.findAll({
                where: { user_id: userId },
                order: [["date", "DESC"]],
                limit: limit,
            });

            res.json({
                success: true,
                data: attendances,
            });
        } catch (error) {
            console.error("Get recent attendance error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get recent attendance",
            });
        }
    }

    // Export attendance
    async exportAttendance(req, res) {
        try {
            // Placeholder for CSV/Excel export
            res.json({
                success: true,
                message: "Export feature coming soon",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Export failed",
            });
        }
    }

    // Approve attendance (Supervisor)
    async approveAttendance(req, res) {
        try {
            const { id } = req.params;
            const supervisorId = req.user.id;

            // Get attendance with user
            const attendance = await Attendance.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "division_id"],
                    },
                ],
            });

            if (!attendance) {
                return res.status(404).json({
                    success: false,
                    message: "Attendance not found",
                });
            }

            // Verify supervisor has authority
            const supervisor = await User.findByPk(supervisorId);
            if (attendance.user.division_id !== supervisor.division_id) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to approve this attendance",
                });
            }

            // Check if already approved or rejected
            if (attendance.approval_status === "approved") {
                return res.status(400).json({
                    success: false,
                    message: "Attendance already approved",
                });
            }

            // Update attendance approval status
            await attendance.update({
                approval_status: "approved",
                approved_by: supervisorId,
                approved_at: new Date(),
                rejected_by: null,
                rejected_at: null,
                rejection_reason: null,
            });

            res.json({
                success: true,
                message: "Attendance approved successfully",
                data: attendance,
            });
        } catch (error) {
            console.error("Approve attendance error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to approve attendance",
            });
        }
    }

    // Reject attendance (Supervisor)
    async rejectAttendance(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const supervisorId = req.user.id;

            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: "Rejection reason is required",
                });
            }

            // Get attendance with user
            const attendance = await Attendance.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "division_id"],
                    },
                ],
            });

            if (!attendance) {
                return res.status(404).json({
                    success: false,
                    message: "Attendance not found",
                });
            }

            // Verify supervisor has authority
            const supervisor = await User.findByPk(supervisorId);
            if (attendance.user.division_id !== supervisor.division_id) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to reject this attendance",
                });
            }

            // Check if already rejected
            if (attendance.approval_status === "rejected") {
                return res.status(400).json({
                    success: false,
                    message: "Attendance already rejected",
                });
            }

            // Update attendance rejection status
            await attendance.update({
                approval_status: "rejected",
                rejected_by: supervisorId,
                rejected_at: new Date(),
                rejection_reason: reason,
                approved_by: null,
                approved_at: null,
            });

            res.json({
                success: true,
                message: "Attendance rejected successfully",
                data: attendance,
            });
        } catch (error) {
            console.error("Reject attendance error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to reject attendance",
            });
        }
    }
}

// Export organized upload middleware for attendance photos
// Structure: public/uploads/attendance/{year}/{month}/{division-id}/user-{id}-{timestamp}.jpg
export const uploadAttendancePhoto = createUploadMiddleware(
    "attendance",
    "photo",
    {
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    },
);

export default new AttendanceController();
