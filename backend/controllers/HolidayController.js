import models from "../models/index.js";
import { Op } from "sequelize";

const { Holiday, User } = models;

/**
 * Holiday Controller
 * Mengelola hari libur nasional dan custom holidays untuk sistem presensi
 */
class HolidayController {
    /**
     * Get all holidays dengan filtering
     * Query params: year, month, type, is_national, is_active
     */
    static async getAllHolidays(req, res) {
        try {
            const {
                year,
                month,
                type,
                is_national,
                is_active,
                page = 1,
                limit = 50,
            } = req.query;

            const where = {};

            // Filter by year
            if (year) {
                where.year = parseInt(year);
            }

            // Filter by month
            if (month && year) {
                const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
                const endDate = new Date(year, month, 0); // Last day of month
                const endDateStr = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

                where.date = {
                    [Op.between]: [startDate, endDateStr],
                };
            }

            // Filter by type
            if (type) {
                where.type = type;
            }

            // Filter by is_national
            if (is_national !== undefined) {
                where.is_national = is_national === "true";
            }

            // Filter by is_active
            if (is_active !== undefined) {
                where.is_active = is_active === "true";
            } else {
                // Default only show active holidays
                where.is_active = true;
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { count, rows } = await Holiday.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: "creator",
                        attributes: ["id", "name", "email"],
                    },
                ],
                order: [["date", "ASC"]],
                limit: parseInt(limit),
                offset,
            });

            res.json({
                success: true,
                data: {
                    holidays: rows,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total_pages: Math.ceil(count / parseInt(limit)),
                    },
                },
            });
        } catch (error) {
            console.error("Get holidays error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal mengambil data hari libur",
                error: error.message,
            });
        }
    }

    /**
     * Get holiday by ID
     */
    static async getHolidayById(req, res) {
        try {
            const { id } = req.params;

            const holiday = await Holiday.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "creator",
                        attributes: ["id", "name", "email"],
                    },
                ],
            });

            if (!holiday) {
                return res.status(404).json({
                    success: false,
                    message: "Hari libur tidak ditemukan",
                });
            }

            res.json({
                success: true,
                data: holiday,
            });
        } catch (error) {
            console.error("Get holiday by ID error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal mengambil data hari libur",
                error: error.message,
            });
        }
    }

    /**
     * Check if a specific date is holiday
     */
    static async checkIsHoliday(req, res) {
        try {
            const { date } = req.query; // Format: YYYY-MM-DD

            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: "Parameter date (YYYY-MM-DD) diperlukan",
                });
            }

            const holiday = await Holiday.findOne({
                where: {
                    date,
                    is_active: true,
                },
            });

            const isHoliday = !!holiday;

            res.json({
                success: true,
                data: {
                    date,
                    is_holiday: isHoliday,
                    holiday: isHoliday ? holiday : null,
                },
            });
        } catch (error) {
            console.error("Check holiday error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal memeriksa hari libur",
                error: error.message,
            });
        }
    }

    /**
     * Get upcoming holidays
     */
    static async getUpcomingHolidays(req, res) {
        try {
            const { limit = 5 } = req.query;
            const today = new Date().toISOString().split("T")[0];

            const holidays = await Holiday.findAll({
                where: {
                    date: {
                        [Op.gte]: today,
                    },
                    is_active: true,
                },
                order: [["date", "ASC"]],
                limit: parseInt(limit),
            });

            res.json({
                success: true,
                data: holidays,
            });
        } catch (error) {
            console.error("Get upcoming holidays error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal mengambil data hari libur mendatang",
                error: error.message,
            });
        }
    }

    /**
     * Create new holiday (Admin only)
     */
    static async createHoliday(req, res) {
        try {
            const { date, name, description, type, is_national } = req.body;
            const userId = req.user.id;

            // Validation
            if (!date || !name || !type) {
                return res.status(400).json({
                    success: false,
                    message: "Field date, name, dan type wajib diisi",
                });
            }

            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({
                    success: false,
                    message: "Format tanggal harus YYYY-MM-DD",
                });
            }

            // Extract year from date
            const year = new Date(date).getFullYear();

            // Check if holiday already exists on this date
            const existingHoliday = await Holiday.findOne({
                where: { date },
            });

            if (existingHoliday) {
                return res.status(400).json({
                    success: false,
                    message: `Hari libur sudah terdaftar pada tanggal ${date}: ${existingHoliday.name}`,
                });
            }

            const holiday = await Holiday.create({
                date,
                name,
                description,
                type,
                is_national: is_national || false,
                is_active: true,
                year,
                created_by: userId,
            });

            const createdHoliday = await Holiday.findByPk(holiday.id, {
                include: [
                    {
                        model: User,
                        as: "creator",
                        attributes: ["id", "name", "email"],
                    },
                ],
            });

            res.status(201).json({
                success: true,
                message: "Hari libur berhasil ditambahkan",
                data: createdHoliday,
            });
        } catch (error) {
            console.error("Create holiday error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal menambahkan hari libur",
                error: error.message,
            });
        }
    }

    /**
     * Update holiday (Admin only)
     */
    static async updateHoliday(req, res) {
        try {
            const { id } = req.params;
            const { date, name, description, type, is_national, is_active } =
                req.body;

            const holiday = await Holiday.findByPk(id);

            if (!holiday) {
                return res.status(404).json({
                    success: false,
                    message: "Hari libur tidak ditemukan",
                });
            }

            // Validate date format if provided
            if (date) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(date)) {
                    return res.status(400).json({
                        success: false,
                        message: "Format tanggal harus YYYY-MM-DD",
                    });
                }

                // Check if new date conflicts with existing holiday
                if (date !== holiday.date) {
                    const existingHoliday = await Holiday.findOne({
                        where: {
                            date,
                            id: { [Op.ne]: id },
                        },
                    });

                    if (existingHoliday) {
                        return res.status(400).json({
                            success: false,
                            message: `Hari libur sudah terdaftar pada tanggal ${date}: ${existingHoliday.name}`,
                        });
                    }
                }
            }

            // Extract year if date changed
            const year = date ? new Date(date).getFullYear() : holiday.year;

            await holiday.update({
                date: date || holiday.date,
                name: name || holiday.name,
                description:
                    description !== undefined
                        ? description
                        : holiday.description,
                type: type || holiday.type,
                is_national:
                    is_national !== undefined
                        ? is_national
                        : holiday.is_national,
                is_active:
                    is_active !== undefined ? is_active : holiday.is_active,
                year,
            });

            const updatedHoliday = await Holiday.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "creator",
                        attributes: ["id", "name", "email"],
                    },
                ],
            });

            res.json({
                success: true,
                message: "Hari libur berhasil diupdate",
                data: updatedHoliday,
            });
        } catch (error) {
            console.error("Update holiday error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal mengupdate hari libur",
                error: error.message,
            });
        }
    }

    /**
     * Delete holiday (Admin only)
     */
    static async deleteHoliday(req, res) {
        try {
            const { id } = req.params;

            const holiday = await Holiday.findByPk(id);

            if (!holiday) {
                return res.status(404).json({
                    success: false,
                    message: "Hari libur tidak ditemukan",
                });
            }

            // Don't allow deleting national holidays (optional protection)
            if (holiday.is_national) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Hari libur nasional tidak dapat dihapus. Gunakan toggle active/inactive.",
                });
            }

            await holiday.destroy();

            res.json({
                success: true,
                message: "Hari libur berhasil dihapus",
            });
        } catch (error) {
            console.error("Delete holiday error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal menghapus hari libur",
                error: error.message,
            });
        }
    }

    /**
     * Toggle holiday active status (Admin only)
     */
    static async toggleHolidayStatus(req, res) {
        try {
            const { id } = req.params;

            const holiday = await Holiday.findByPk(id);

            if (!holiday) {
                return res.status(404).json({
                    success: false,
                    message: "Hari libur tidak ditemukan",
                });
            }

            await holiday.update({
                is_active: !holiday.is_active,
            });

            res.json({
                success: true,
                message: `Hari libur berhasil ${holiday.is_active ? "diaktifkan" : "dinonaktifkan"}`,
                data: holiday,
            });
        } catch (error) {
            console.error("Toggle holiday status error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal mengubah status hari libur",
                error: error.message,
            });
        }
    }

    /**
     * Bulk import holidays from array (Admin only)
     */
    static async bulkImportHolidays(req, res) {
        try {
            const { holidays } = req.body;
            const userId = req.user.id;

            if (!Array.isArray(holidays) || holidays.length === 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Data holidays harus berupa array dan tidak boleh kosong",
                });
            }

            const createdHolidays = [];
            const errors = [];

            for (const holiday of holidays) {
                try {
                    const { date, name, description, type, is_national } =
                        holiday;

                    // Validate required fields
                    if (!date || !name || !type) {
                        errors.push({
                            data: holiday,
                            error: "Field date, name, dan type wajib diisi",
                        });
                        continue;
                    }

                    // Check if already exists
                    const existing = await Holiday.findOne({ where: { date } });
                    if (existing) {
                        errors.push({
                            data: holiday,
                            error: `Sudah ada: ${existing.name}`,
                        });
                        continue;
                    }

                    const year = new Date(date).getFullYear();

                    const created = await Holiday.create({
                        date,
                        name,
                        description,
                        type,
                        is_national: is_national || false,
                        is_active: true,
                        year,
                        created_by: userId,
                    });

                    createdHolidays.push(created);
                } catch (err) {
                    errors.push({
                        data: holiday,
                        error: err.message,
                    });
                }
            }

            res.json({
                success: true,
                message: `Berhasil import ${createdHolidays.length} hari libur`,
                data: {
                    created: createdHolidays,
                    errors: errors.length > 0 ? errors : null,
                },
            });
        } catch (error) {
            console.error("Bulk import holidays error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal import hari libur",
                error: error.message,
            });
        }
    }
}

export default HolidayController;
