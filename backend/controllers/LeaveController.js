import models from "../models/index.js";
import { Op } from "sequelize";
import { getPublicPath } from "../utils/uploadHelper.js";
import { getJakartaDate } from "../utils/dateHelper.js";

const { Leave, User, AppSetting } = models;

class LeaveController {
    // Get leave quota for user
    async getQuota(req, res) {
        try {
            const userId = req.user.id;

            // Get quota from app_settings
            const quotaSetting = await AppSetting.findOne({
                where: { key: "max_leave_days_per_year" },
            });

            const quota = {
                quota: quotaSetting ? parseInt(quotaSetting.value) : 12, // Default 12 if not set
                period: "year",
                description: "Kuota izin tahunan untuk karyawan magang",
            };

            res.json({
                success: true,
                data: quota,
            });
        } catch (error) {
            console.error(
                "[LeaveController.getQuota] Error:",
                error.name,
                "-",
                error.message,
            );
            res.status(500).json({
                success: false,
                message: "Failed to get leave quota",
            });
        }
    }

    // Get user's leaves
    async getUserLeaves(req, res) {
        try {
            const userId = req.user.id;
            const { status, date_from, date_to } = req.query;

            const whereClause = { user_id: userId };

            if (status && status !== "all") {
                whereClause.status = status;
            }

            // Filter by date range - check for overlap
            if (date_from || date_to) {
                if (date_from && date_to) {
                    const filterStart = new Date(date_from);
                    const filterEnd = new Date(date_to);
                    filterEnd.setHours(23, 59, 59, 999);

                    whereClause[Op.and] = [
                        { start_date: { [Op.lte]: filterEnd } },
                        { end_date: { [Op.gte]: filterStart } },
                    ];
                } else if (date_from) {
                    whereClause.end_date = { [Op.gte]: new Date(date_from) };
                } else if (date_to) {
                    const filterEnd = new Date(date_to);
                    filterEnd.setHours(23, 59, 59, 999);
                    whereClause.start_date = { [Op.lte]: filterEnd };
                }
            }

            const leaves = await Leave.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: "reviewer",
                        attributes: ["id", "name"],
                    },
                ],
                order: [["created_at", "DESC"]],
            });

            res.json({
                success: true,
                data: leaves,
            });
        } catch (error) {
            console.error(
                "[LeaveController.getUserLeaves] Error:",
                error.name,
                "-",
                error.message,
            );
            res.status(500).json({
                success: false,
                message: "Failed to get leave requests",
            });
        }
    }

    // Get user's pending leaves
    async getUserPendingLeaves(req, res) {
        try {
            const userId = req.user.id;

            const leaves = await Leave.findAll({
                where: {
                    user_id: userId,
                    status: "pending",
                },
                order: [["created_at", "DESC"]],
            });

            res.json({
                success: true,
                data: leaves,
            });
        } catch (error) {
            console.error("Get user pending leaves error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get pending leave requests",
            });
        }
    }

    // Create leave request
    async create(req, res) {
        try {
            const userId = req.user.id;
            const { type, start_date, end_date, reason } = req.body;

            if (!type || !start_date || !end_date || !reason) {
                return res.status(400).json({
                    success: false,
                    message: "Type, dates, and reason are required",
                });
            }

            // Map frontend type to backend enum
            const typeMapping = {
                sakit: "izin_sakit",
                izin: "izin_keperluan",
                izin_sakit: "izin_sakit",
                izin_keperluan: "izin_keperluan",
            };

            const mappedType = typeMapping[type] || "izin_keperluan";

            // Calculate total days
            const start = new Date(start_date);
            const end = new Date(end_date);
            const diffTime = Math.abs(end - start);
            const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            // Get attachment from uploaded file with organized path
            const attachmentPath = req.file
                ? getPublicPath(req.file.path)
                : null;

            const leave = await Leave.create({
                user_id: userId,
                type: mappedType,
                start_date,
                end_date,
                duration: totalDays,
                reason,
                attachment: attachmentPath,
                status: "pending",
            });

            res.status(201).json({
                success: true,
                message: "Leave request submitted successfully",
                data: leave,
            });
        } catch (error) {
            console.error("Create leave error:", error);
            console.error("Error details:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to create leave request",
                error: error.message,
            });
        }
    }

    // Get leave by ID
    async getById(req, res) {
        try {
            const { id } = req.params;

            const leave = await Leave.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "email", "avatar", "nip"],
                    },
                    {
                        model: User,
                        as: "reviewer",
                        attributes: ["id", "name"],
                    },
                ],
            });

            if (!leave) {
                return res.status(404).json({
                    success: false,
                    message: "Leave request not found",
                });
            }

            // Check permission
            if (req.user.role === "user" && leave.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            res.json({
                success: true,
                data: leave,
            });
        } catch (error) {
            console.error("Get leave by ID error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get leave request",
            });
        }
    }

    // Update leave request
    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { type, start_date, end_date, reason, attachment } = req.body;

            const leave = await Leave.findByPk(id);

            if (!leave) {
                return res.status(404).json({
                    success: false,
                    message: "Leave request not found",
                });
            }

            if (leave.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            // Cannot update if not pending
            if (leave.status !== "pending") {
                return res.status(400).json({
                    success: false,
                    message: "Can only update pending requests",
                });
            }

            // Recalculate total days if dates changed
            let totalDays = leave.duration;
            if (start_date && end_date) {
                const start = new Date(start_date);
                const end = new Date(end_date);
                const diffTime = Math.abs(end - start);
                totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }

            await leave.update({
                type: type || leave.type,
                start_date: start_date || leave.start_date,
                end_date: end_date || leave.end_date,
                duration: totalDays,
                reason: reason || leave.reason,
                attachment: attachment || leave.attachment,
            });

            res.json({
                success: true,
                message: "Leave request updated successfully",
                data: leave,
            });
        } catch (error) {
            console.error("Update leave error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update leave request",
            });
        }
    }

    // Delete leave request
    async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const leave = await Leave.findByPk(id);

            if (!leave) {
                return res.status(404).json({
                    success: false,
                    message: "Leave request not found",
                });
            }

            if (leave.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            if (leave.status !== "pending") {
                return res.status(400).json({
                    success: false,
                    message: "Can only delete pending requests",
                });
            }

            await leave.destroy();

            res.json({
                success: true,
                message: "Leave request deleted successfully",
            });
        } catch (error) {
            console.error("Delete leave error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete leave request",
            });
        }
    }

    // Get team leaves (Supervisor) - WITH PAGINATION
    async getTeamLeaves(req, res) {
        try {
            const supervisorId = req.user.id;
            const supervisor = await User.findByPk(supervisorId);

            if (!supervisor.division_id) {
                return res.status(400).json({
                    success: false,
                    message: "No division assigned",
                });
            }

            const {
                status,
                type,
                date_from,
                date_to,
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

            if (status && status !== "all") {
                whereClause.status = status;
            }

            if (type && type !== "all") {
                whereClause.type = type;
            }

            // Filter by date range - check for overlap
            // A leave overlaps with filter if: start_date <= date_to AND end_date >= date_from
            if (date_from || date_to) {
                if (date_from && date_to) {
                    // Both dates provided - find leaves that overlap with this range
                    const filterStart = new Date(date_from);
                    const filterEnd = new Date(date_to);
                    filterEnd.setHours(23, 59, 59, 999);

                    whereClause[Op.and] = [
                        { start_date: { [Op.lte]: filterEnd } },
                        { end_date: { [Op.gte]: filterStart } },
                    ];
                } else if (date_from) {
                    // Only start date - find leaves that end on or after this date
                    whereClause.end_date = { [Op.gte]: new Date(date_from) };
                } else if (date_to) {
                    // Only end date - find leaves that start on or before this date
                    const filterEnd = new Date(date_to);
                    filterEnd.setHours(23, 59, 59, 999);
                    whereClause.start_date = { [Op.lte]: filterEnd };
                }
            }

            // Get total count for pagination
            const totalRecords = await Leave.count({
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
            const leaves = await Leave.findAll({
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
                            "periode",
                            "sumber_magang",
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
                        as: "reviewer",
                        attributes: ["id", "name", "avatar"],
                        required: false,
                    },
                ],
                order: [["created_at", "DESC"]],
                limit: limitNum,
                offset: offset,
            });

            const totalPages = Math.ceil(totalRecords / limitNum);

            res.json({
                success: true,
                data: leaves,
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
                "[LeaveController.getTeamLeaves] Error:",
                error.name,
                "-",
                error.message,
            );
            res.status(500).json({
                success: false,
                message: "Failed to get team leaves",
            });
        }
    }

    // Get pending leaves
    async getPendingLeaves(req, res) {
        try {
            const supervisorId = req.user.id;
            const supervisor = await User.findByPk(supervisorId);

            const leaves = await Leave.findAll({
                where: { status: "pending" },
                include: [
                    {
                        model: User,
                        as: "user",
                        where: { division_id: supervisor.division_id },
                        attributes: ["id", "name", "email"],
                    },
                ],
                order: [["created_at", "ASC"]],
            });

            res.json({
                success: true,
                data: leaves,
            });
        } catch (error) {
            console.error("Get pending leaves error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get pending leaves",
            });
        }
    }

    // Approve leave (Supervisor)
    async approve(req, res) {
        try {
            const { id } = req.params;
            const supervisorId = req.user.id;

            const leave = await Leave.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["division_id"],
                    },
                ],
            });

            if (!leave) {
                return res.status(404).json({
                    success: false,
                    message: "Leave request not found",
                });
            }

            if (leave.status !== "pending") {
                return res.status(400).json({
                    success: false,
                    message: "Leave request already processed",
                });
            }

            // Check if supervisor manages this user
            const supervisor = await User.findByPk(supervisorId);
            if (leave.user.division_id !== supervisor.division_id) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            await leave.update({
                status: "approved",
                reviewed_by: supervisorId,
                reviewed_at: getJakartaDate(),
            });

            res.json({
                success: true,
                message: "Leave request approved",
                data: leave,
            });
        } catch (error) {
            console.error("Approve leave error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to approve leave",
            });
        }
    }

    // Reject leave (Supervisor)
    async reject(req, res) {
        try {
            const { id } = req.params;
            const supervisorId = req.user.id;
            const { rejection_reason } = req.body;

            const leave = await Leave.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["division_id"],
                    },
                ],
            });

            if (!leave) {
                return res.status(404).json({
                    success: false,
                    message: "Leave request not found",
                });
            }

            if (leave.status !== "pending") {
                return res.status(400).json({
                    success: false,
                    message: "Leave request already processed",
                });
            }

            const supervisor = await User.findByPk(supervisorId);
            if (leave.user.division_id !== supervisor.division_id) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            await leave.update({
                status: "rejected",
                reviewed_by: supervisorId,
                reviewed_at: getJakartaDate(),
                review_notes: rejection_reason || "No reason provided",
            });

            res.json({
                success: true,
                message: "Leave request rejected",
                data: leave,
            });
        } catch (error) {
            console.error("Reject leave error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to reject leave",
            });
        }
    }

    // Get leave report
    async getLeaveReport(req, res) {
        try {
            const { start_date, end_date, division_id, status } = req.query;

            const whereClause = {};
            if (start_date && end_date) {
                whereClause.start_date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
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
                        "division_id",
                        "avatar",
                        "nip",
                    ],
                },
            ];

            if (division_id) {
                include[0].where = { division_id };
            }

            const leaves = await Leave.findAll({
                where: whereClause,
                include,
                order: [["created_at", "DESC"]],
            });

            res.json({
                success: true,
                data: leaves,
            });
        } catch (error) {
            console.error("Get leave report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate report",
            });
        }
    }

    // Get all leaves (Admin) - WITH PAGINATION
    async getAllLeaves(req, res) {
        try {
            const {
                start_date,
                end_date,
                date_from,
                date_to,
                status,
                division_id,
                type,
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

            // Standardize to date_from/date_to (support old start_date/end_date for backward compatibility)
            const dateFrom = date_from || start_date;
            const dateTo = date_to || end_date;

            // Filter by date range - check for overlap with leave period
            if (dateFrom || dateTo) {
                if (dateFrom && dateTo) {
                    const filterStart = new Date(dateFrom);
                    const filterEnd = new Date(dateTo);
                    filterEnd.setHours(23, 59, 59, 999);

                    whereClause[Op.and] = [
                        { start_date: { [Op.lte]: filterEnd } },
                        { end_date: { [Op.gte]: filterStart } },
                    ];
                } else if (dateFrom) {
                    whereClause.end_date = { [Op.gte]: new Date(dateFrom) };
                } else if (dateTo) {
                    const filterEnd = new Date(dateTo);
                    filterEnd.setHours(23, 59, 59, 999);
                    whereClause.start_date = { [Op.lte]: filterEnd };
                }
            }

            // Filter by status if provided
            if (status && status !== "all") {
                whereClause.status = status;
            }

            // Filter by type if provided
            if (type && type !== "all") {
                whereClause.type = type;
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
                        "periode",
                        "sumber_magang",
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
                    as: "reviewer",
                    attributes: ["id", "name"],
                    required: false,
                },
            ];

            // Get total count for pagination
            const totalRecords = await Leave.count({
                where: whereClause,
                include: includeClause,
            });

            // Get paginated data
            const leaves = await Leave.findAll({
                where: whereClause,
                include: includeClause,
                order: [["created_at", "DESC"]],
                limit: limitNum,
                offset: offset,
            });

            const totalPages = Math.ceil(totalRecords / limitNum);

            res.json({
                success: true,
                data: leaves,
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
                "[LeaveController.getAllLeaves] Error:",
                error.name,
                "-",
                error.message,
            );
            res.status(500).json({
                success: false,
                message: "Failed to get leave requests",
            });
        }
    }
}

export default new LeaveController();
