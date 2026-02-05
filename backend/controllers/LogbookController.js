import models from "../models/index.js";
import { Op } from "sequelize";
import { getJakartaDate, getTodayJakarta } from "../utils/dateHelper.js";

const { Logbook, User } = models;

class LogbookController {
    // Get user's logbooks
    async getUserLogbooks(req, res) {
        try {
            const userId = req.user.id;
            const { month, year, date_from, date_to, status } = req.query;

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

            // Filter by status
            if (status && status !== "all") {
                whereClause.status = status;
            }

            const logbooks = await Logbook.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: "reviewer",
                        attributes: ["id", "name"],
                    },
                ],
                order: [["date", "DESC"]],
                limit: 100,
            });

            res.json({
                success: true,
                data: logbooks,
            });
        } catch (error) {
            console.error("Get user logbooks error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get logbooks",
            });
        }
    }

    // Get today's logbook
    async getTodayLogbook(req, res) {
        try {
            const userId = req.user.id;
            const today = getTodayJakarta();

            const logbook = await Logbook.findOne({
                where: {
                    user_id: userId,
                    date: today,
                },
            });

            res.json({
                success: true,
                data: logbook,
            });
        } catch (error) {
            console.error("Get today logbook error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get today's logbook",
            });
        }
    }

    // Get recent logbooks
    async getRecentLogbooks(req, res) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 10;

            const logbooks = await Logbook.findAll({
                where: { user_id: userId },
                order: [["date", "DESC"]],
                limit: limit,
            });

            res.json({
                success: true,
                data: logbooks,
            });
        } catch (error) {
            console.error("Get recent logbooks error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get recent logbooks",
            });
        }
    }

    // Create logbook
    async create(req, res) {
        try {
            const userId = req.user.id;
            const { date, time, activity, description, location, attachments } =
                req.body;

            // Validate required fields
            if (!date || !activity) {
                return res.status(400).json({
                    success: false,
                    message: "Date and activity are required",
                });
            }

            // Set time to current time if not provided
            const now = getJakartaDate();
            const logbookTime =
                time ||
                `${now.getHours().toString().padStart(2, "0")}:${now
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}:${now
                    .getSeconds()
                    .toString()
                    .padStart(2, "0")}`;

            const logbook = await Logbook.create({
                user_id: userId,
                date,
                time: logbookTime,
                activity,
                description,
                location,
                attachments: attachments || [],
                status: "pending",
            });

            res.status(201).json({
                success: true,
                message: "Logbook created successfully",
                data: logbook,
            });
        } catch (error) {
            console.error(
                "[LogbookController.create] Error:",
                error.name,
                "-",
                error.message,
            );
            if (error.name === "SequelizeValidationError") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Validation error: " +
                        error.errors.map((e) => e.message).join(", "),
                });
            }
            res.status(500).json({
                success: false,
                message: "Failed to create logbook",
            });
        }
    }

    // Get logbook by ID
    async getById(req, res) {
        try {
            const { id } = req.params;

            const logbook = await Logbook.findByPk(id, {
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

            if (!logbook) {
                return res.status(404).json({
                    success: false,
                    message: "Logbook not found",
                });
            }

            // Check permission
            if (req.user.role === "user" && logbook.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            res.json({
                success: true,
                data: logbook,
            });
        } catch (error) {
            console.error("Get logbook by ID error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get logbook",
            });
        }
    }

    // Update logbook
    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { date, activity, description, location, attachments } =
                req.body;

            const logbook = await Logbook.findByPk(id);

            if (!logbook) {
                return res.status(404).json({
                    success: false,
                    message: "Logbook not found",
                });
            }

            // Only owner can update
            if (logbook.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            // Cannot update if reviewed
            if (logbook.status === "reviewed") {
                return res.status(400).json({
                    success: false,
                    message: "Cannot update reviewed logbook",
                });
            }

            await logbook.update({
                date: date || logbook.date,
                activity: activity || logbook.activity,
                description: description || logbook.description,
                location: location || logbook.location,
                attachments: attachments || logbook.attachments,
            });

            res.json({
                success: true,
                message: "Logbook updated successfully",
                data: logbook,
            });
        } catch (error) {
            console.error("Update logbook error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update logbook",
            });
        }
    }

    // Delete logbook
    async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const logbook = await Logbook.findByPk(id);

            if (!logbook) {
                return res.status(404).json({
                    success: false,
                    message: "Logbook not found",
                });
            }

            if (logbook.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            if (logbook.status === "reviewed") {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete reviewed logbook",
                });
            }

            await logbook.destroy();

            res.json({
                success: true,
                message: "Logbook deleted successfully",
            });
        } catch (error) {
            console.error("Delete logbook error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete logbook",
            });
        }
    }

    // Get team logbooks (Supervisor) - WITH PAGINATION
    async getTeamLogbooks(req, res) {
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
                month,
                year,
                date_from,
                date_to,
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

            // Filter by status
            if (status && status !== "all") {
                whereClause.status = status;
            }

            // Get total count for pagination
            const totalRecords = await Logbook.count({
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
            const logbooks = await Logbook.findAll({
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
                order: [
                    ["date", "DESC"],
                    ["time", "DESC"],
                ],
                limit: limitNum,
                offset: offset,
            });

            const totalPages = Math.ceil(totalRecords / limitNum);

            res.json({
                success: true,
                data: logbooks,
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
            console.error("Get team logbooks error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get team logbooks",
            });
        }
    }

    // Review logbook (Supervisor)
    async reviewLogbook(req, res) {
        try {
            const { id } = req.params;
            const supervisorId = req.user.id;
            const { review_notes } = req.body;

            const logbook = await Logbook.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["division_id"],
                    },
                ],
            });

            if (!logbook) {
                return res.status(404).json({
                    success: false,
                    message: "Logbook not found",
                });
            }

            // Check if supervisor manages this user's division
            const supervisor = await User.findByPk(supervisorId);
            if (logbook.user.division_id !== supervisor.division_id) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }

            await logbook.update({
                reviewed_by: supervisorId,
                reviewed_at: new Date(),
                review_notes: review_notes || null,
            });

            res.json({
                success: true,
                message: "Logbook reviewed successfully",
                data: logbook,
            });
        } catch (error) {
            console.error("Review logbook error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to review logbook",
            });
        }
    }

    // Get logbook report
    async getLogbookReport(req, res) {
        try {
            const { start_date, end_date, division_id, user_id } = req.query;

            const whereClause = {};
            if (start_date && end_date) {
                whereClause.date = {
                    [Op.between]: [new Date(start_date), new Date(end_date)],
                };
            }

            if (user_id) {
                whereClause.user_id = user_id;
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

            const logbooks = await Logbook.findAll({
                where: whereClause,
                include,
                order: [["date", "DESC"]],
            });

            res.json({
                success: true,
                data: logbooks,
            });
        } catch (error) {
            console.error("Get logbook report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate report",
            });
        }
    }

    // Approve logbook (Supervisor)
    async approveLogbook(req, res) {
        try {
            const { id } = req.params;
            const supervisorId = req.user.id;

            const logbook = await Logbook.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "division_id"],
                    },
                ],
            });

            if (!logbook) {
                return res.status(404).json({
                    success: false,
                    message: "Logbook not found",
                });
            }

            // Verify supervisor has authority
            const supervisor = await User.findByPk(supervisorId);
            if (logbook.user.division_id !== supervisor.division_id) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to approve this logbook",
                });
            }

            await logbook.update({
                status: "approved",
                reviewed_by: supervisorId,
                reviewed_at: new Date(),
            });

            res.json({
                success: true,
                message: "Logbook approved successfully",
                data: logbook,
            });
        } catch (error) {
            console.error("Approve logbook error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to approve logbook",
            });
        }
    }

    // Reject logbook (Supervisor)
    async rejectLogbook(req, res) {
        try {
            const { id } = req.params;
            const { feedback } = req.body;
            const supervisorId = req.user.id;

            if (!feedback) {
                return res.status(400).json({
                    success: false,
                    message: "Feedback is required for rejection",
                });
            }

            const logbook = await Logbook.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "division_id"],
                    },
                ],
            });

            if (!logbook) {
                return res.status(404).json({
                    success: false,
                    message: "Logbook not found",
                });
            }

            // Verify supervisor has authority
            const supervisor = await User.findByPk(supervisorId);
            if (logbook.user.division_id !== supervisor.division_id) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to reject this logbook",
                });
            }

            await logbook.update({
                status: "rejected",
                reviewed_by: supervisorId,
                reviewed_at: new Date(),
                feedback: feedback,
            });

            res.json({
                success: true,
                message: "Logbook rejected successfully",
                data: logbook,
            });
        } catch (error) {
            console.error("Reject logbook error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to reject logbook",
            });
        }
    }

    // Get all logbooks (Admin) - WITH PAGINATION
    async getAllLogbooks(req, res) {
        try {
            const {
                start_date,
                end_date,
                date_from,
                date_to,
                status,
                division_id,
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

            // Filter by date range if provided
            if (dateFrom || dateTo) {
                whereClause.date = {};
                if (dateFrom) {
                    whereClause.date[Op.gte] = new Date(dateFrom);
                }
                if (dateTo) {
                    const endDate = new Date(dateTo);
                    endDate.setHours(23, 59, 59, 999);
                    whereClause.date[Op.lte] = endDate;
                }
            }

            // Filter by status if provided
            if (status && status !== "all") {
                whereClause.status = status;
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
            const totalRecords = await Logbook.count({
                where: whereClause,
                include: includeClause,
            });

            // Get paginated data
            const logbooks = await Logbook.findAll({
                where: whereClause,
                include: includeClause,
                order: [
                    ["date", "DESC"],
                    ["time", "DESC"],
                ],
                limit: limitNum,
                offset: offset,
            });

            const totalPages = Math.ceil(totalRecords / limitNum);

            res.json({
                success: true,
                data: logbooks,
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
            console.error("[getAllLogbooks] Error:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to get logbooks",
            });
        }
    }
}

export default new LogbookController();
