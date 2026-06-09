import models from "../models/index.js";
import { Op } from "sequelize";
import { getJakartaDate, getTodayJakarta } from "../utils/dateHelper.js";
import LogbookService from "../services/LogbookService.js";

const { Logbook, User, Division } = models;

class LogbookController {
    // Get user's logbooks - with pagination, search, and stats
    async getUserLogbooks(req, res) {
        try {
            const userId = req.user.id;
            const { month, year, date_from, date_to, status, search, page = 1, limit = 15 } = req.query;

            // Build base date filter (shared between stats and main query)
            let dateFilter = {};
            if (date_from || date_to) {
                dateFilter = {};
                if (date_from) dateFilter[Op.gte] = new Date(date_from);
                if (date_to) {
                    const endDate = new Date(date_to);
                    endDate.setHours(23, 59, 59, 999);
                    dateFilter[Op.lte] = endDate;
                }
            } else if (month && year) {
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59, 999);
                dateFilter = { [Op.between]: [startDate, endDate] };
            }

            // Backfill not_filled records untuk hari kerja yang terlewat (sama seperti presensi)
            if (Object.keys(dateFilter).length > 0) {
                const startD = dateFilter[Op.gte] || dateFilter[Op.between]?.[0];
                const endD = dateFilter[Op.lte] || dateFilter[Op.between]?.[1] || new Date();
                if (startD) {
                    await LogbookService.ensureLogbookRecords(userId, startD, endD);
                }
            } else {
                // Tanpa filter tanggal: backfill 30 hari terakhir
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                await LogbookService.ensureLogbookRecords(userId, start, end);
            }

            const statsBase = {
                user_id: userId,
                ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
            };

            // Run stats and paginated query in parallel
            const [totalAll, totalApproved, totalPending, totalRejected, totalNotFilled] = await Promise.all([
                Logbook.count({ where: statsBase }),
                Logbook.count({ where: { ...statsBase, status: "approved" } }),
                Logbook.count({ where: { ...statsBase, status: "pending" } }),
                Logbook.count({ where: { ...statsBase, status: "rejected" } }),
                Logbook.count({ where: { ...statsBase, status: "not_filled" } }),
            ]);

            // Build main where clause (adds status filter & search on top of dateFilter)
            const whereClause = { ...statsBase };
            if (status && status !== "all") {
                whereClause.status = status;
            }
            if (search && search.trim() !== "") {
                const term = `%${search.trim()}%`;
                whereClause[Op.or] = [
                    { activity: { [Op.like]: term } },
                    { description: { [Op.like]: term } },
                ];
            }

            // Pagination
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 15;
            const offset = (pageNum - 1) * limitNum;

            const totalRecords = await Logbook.count({ where: whereClause });

            const logbooks = await Logbook.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: "reviewer",
                        attributes: ["id", "name"],
                    },
                ],
                order: [["date", "DESC"], ["created_at", "DESC"]],
                limit: limitNum,
                offset: offset,
            });

            const totalPages = Math.ceil(totalRecords / limitNum);

            res.json({
                success: true,
                data: logbooks,
                stats: {
                    total: totalAll,
                    approved: totalApproved,
                    pending: totalPending,
                    rejected: totalRejected,
                    not_filled: totalNotFilled,
                },
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
            const todayStart = getTodayJakarta();
            const todayEnd = getTodayJakarta();
            todayEnd.setHours(23, 59, 59, 999);

            console.log(
                `[getTodayLogbook] User: ${userId}, Date range: ${todayStart} to ${todayEnd}`,
            );

            const logbook = await Logbook.findOne({
                where: {
                    user_id: userId,
                    date: {
                        [Op.between]: [todayStart, todayEnd],
                    },
                },
            });

            console.log(
                `[getTodayLogbook] Found: ${logbook ? "YES" : "NO"}`,
                logbook ? `ID: ${logbook.id}` : "",
            );

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

            // Check if user has division
            const user = await User.findByPk(userId);
            if (!user.division_id) {
                return res.status(403).json({
                    success: false,
                    message: "Anda belum ditempatkan di divisi mana pun. Silakan hubungi admin.",
                });
            }

            // Check if division is active
            const division = await Division.findByPk(user.division_id);
            if (!division || !division.is_active) {
                return res.status(403).json({
                    success: false,
                    message: "Divisi Anda sedang dinonaktifkan atau Anda telah dikeluarkan dari divisi. Silakan hubungi admin.",
                });
            }

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

            // If there's a system-generated 'not_filled' record for this date, delete it first
            const existingNotFilled = await Logbook.findOne({
                where: {
                    user_id: userId,
                    date: date,
                    status: "not_filled",
                    is_system_generated: true,
                },
            });
            if (existingNotFilled) {
                await existingNotFilled.destroy();
                console.log(`[LogbookController] Removed not_filled record for user ${userId} on ${date}`);
            }

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

            // Cannot update if approved
            if (logbook.status === "approved") {
                return res.status(400).json({
                    success: false,
                    message: "Cannot update approved logbook",
                });
            }

            // Cannot update system-generated not_filled logbook
            if (logbook.status === "not_filled" || logbook.is_system_generated) {
                return res.status(400).json({
                    success: false,
                    message: "Logbook yang dibuat otomatis oleh sistem tidak dapat diubah",
                });
            }

            await logbook.update({
                date: date || logbook.date,
                activity: activity || logbook.activity,
                description: description || logbook.description,
                location: location || logbook.location,
                attachments: attachments || logbook.attachments,
                status: "pending", // Reset status back to pending so supervisor can re-review
                review_notes: null, // Clear old review notes
                reviewed_by: null,
                reviewed_at: null,
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

            // Cannot delete system-generated not_filled logbook
            if (logbook.status === "not_filled" || logbook.is_system_generated) {
                return res.status(400).json({
                    success: false,
                    message: "Logbook yang dibuat otomatis oleh sistem tidak dapat dihapus",
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
                user_ids,
                periode,
                sumber_magang,
                page = 1,
                limit = 20,
            } = req.query;

            // Parse pagination
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            const offset = (pageNum - 1) * limitNum;

            const whereClause = {};
            const userWhereClause = { division_id: supervisor.division_id };

            if (periode) userWhereClause.periode = periode;
            if (sumber_magang) userWhereClause.sumber_magang = sumber_magang;

            // Support single user_id or multi user_ids[]
            const userIdsRaw = user_ids;
            const userIdsList = userIdsRaw
                ? (Array.isArray(userIdsRaw) 
                    ? userIdsRaw 
                    : typeof userIdsRaw === "string" 
                        ? userIdsRaw.split(",") 
                        : [userIdsRaw]
                  ).map(Number).filter(Boolean)
                : [];

            if (userIdsList.length > 0) {
                whereClause.user_id = { [Op.in]: userIdsList };
            } else if (search && search.trim() !== "") {
                // Server-side search for user name, email, NIP
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

    // Get team logbook stats (Supervisor) - accurate counts per status
    async getTeamLogbookStats(req, res) {
        try {
            const supervisorId = req.user.id;
            const supervisor = await User.findByPk(supervisorId);
            if (!supervisor.division_id) {
                return res.json({ success: true, data: { total: 0, pending: 0, approved: 0, rejected: 0, not_filled: 0 } });
            }

            const { date_from, date_to, search } = req.query;
            const userWhereClause = { division_id: supervisor.division_id };
            if (search && search.trim()) {
                const term = `%${search.trim()}%`;
                userWhereClause[Op.or] = [
                    { name: { [Op.like]: term } },
                    { email: { [Op.like]: term } },
                    { nip: { [Op.like]: term } },
                ];
            }

            let dateFilter = {};
            if (date_from || date_to) {
                if (date_from) dateFilter[Op.gte] = new Date(date_from);
                if (date_to) {
                    const end = new Date(date_to);
                    end.setHours(23, 59, 59, 999);
                    dateFilter[Op.lte] = end;
                }
            }

            const baseWhere = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};
            const userInclude = { model: User, as: "user", where: userWhereClause, attributes: [] };

            const [total, pending, approved, rejected, not_filled] = await Promise.all([
                Logbook.count({ where: baseWhere, include: [userInclude] }),
                Logbook.count({ where: { ...baseWhere, status: "pending" }, include: [userInclude] }),
                Logbook.count({ where: { ...baseWhere, status: "approved" }, include: [userInclude] }),
                Logbook.count({ where: { ...baseWhere, status: "rejected" }, include: [userInclude] }),
                Logbook.count({ where: { ...baseWhere, status: "not_filled" }, include: [userInclude] }),
            ]);

            res.json({ success: true, data: { total, pending, approved, rejected, not_filled } });
        } catch (error) {
            console.error("Get team logbook stats error:", error);
            res.status(500).json({ success: false, message: "Failed to get stats" });
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
            const { start_date, end_date, division_id, user_id, periode, sumber_magang } = req.query;

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

            const userWhereClause = {};
            if (division_id) userWhereClause.division_id = division_id;
            if (periode) userWhereClause.periode = periode;
            if (sumber_magang) userWhereClause.sumber_magang = sumber_magang;
            
            if (Object.keys(userWhereClause).length > 0) {
                include[0].where = userWhereClause;
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
                review_notes: feedback,
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

    // Get admin logbook stats - accurate counts per status
    async getAdminLogbookStats(req, res) {
        try {
            const { start_date, end_date, date_from, date_to, division_id, search, periode, sumber_magang } = req.query;

            const userWhereClause = {};
            if (search && search.trim()) {
                const term = `%${search.trim()}%`;
                userWhereClause[Op.or] = [
                    { name: { [Op.like]: term } },
                    { email: { [Op.like]: term } },
                    { nip: { [Op.like]: term } },
                ];
            }
            if (division_id) userWhereClause.division_id = division_id;
            if (periode) userWhereClause.periode = periode;
            if (sumber_magang) userWhereClause.sumber_magang = sumber_magang;

            const dateFrom = date_from || start_date;
            const dateTo = date_to || end_date;
            let dateFilter = {};
            if (dateFrom || dateTo) {
                if (dateFrom) dateFilter[Op.gte] = new Date(dateFrom);
                if (dateTo) {
                    const end = new Date(dateTo);
                    end.setHours(23, 59, 59, 999);
                    dateFilter[Op.lte] = end;
                }
            }

            const baseWhere = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};
            const userInclude = {
                model: User,
                as: "user",
                where: Object.keys(userWhereClause).length > 0 ? userWhereClause : undefined,
                attributes: [],
            };

            const [total, pending, approved, rejected, not_filled] = await Promise.all([
                Logbook.count({ where: baseWhere, include: [userInclude] }),
                Logbook.count({ where: { ...baseWhere, status: "pending" }, include: [userInclude] }),
                Logbook.count({ where: { ...baseWhere, status: "approved" }, include: [userInclude] }),
                Logbook.count({ where: { ...baseWhere, status: "rejected" }, include: [userInclude] }),
                Logbook.count({ where: { ...baseWhere, status: "not_filled" }, include: [userInclude] }),
            ]);

            res.json({ success: true, data: { total, pending, approved, rejected, not_filled } });
        } catch (error) {
            console.error("Get admin logbook stats error:", error);
            res.status(500).json({ success: false, message: "Failed to get stats" });
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
                user_ids,
                periode,
                sumber_magang,
                page = 1,
                limit = 20,
            } = req.query;

            // Parse pagination
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            const offset = (pageNum - 1) * limitNum;

            const whereClause = {};
            const userWhereClause = {};

            if (periode) userWhereClause.periode = periode;
            if (sumber_magang) userWhereClause.sumber_magang = sumber_magang;

            // Support single user_id or multi user_ids[]
            const userIdsRaw = user_ids;
            const userIdsList = userIdsRaw
                ? (Array.isArray(userIdsRaw) 
                    ? userIdsRaw 
                    : typeof userIdsRaw === "string" 
                        ? userIdsRaw.split(",") 
                        : [userIdsRaw]
                  ).map(Number).filter(Boolean)
                : [];

            if (userIdsList.length > 0) {
                whereClause.user_id = { [Op.in]: userIdsList };
            } else if (search && search.trim() !== "") {
                // Server-side search for user name, email, NIP
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
