import models from "../models/index.js";
import bcrypt from "bcryptjs";
import ImportExportUserService from "../services/ImportExportUserService.js";

const { User } = models;

class UserController {
    // Get all users (Admin)
    async getAll(req, res) {
        try {
            const {
                role,
                division_id,
                is_active,
                periode,
                is_active_periode,
                sumber_magang,
            } = req.query;

            const whereClause = {};

            if (role) {
                whereClause.role = role;
            }

            if (division_id) {
                whereClause.division_id = division_id;
            }

            if (is_active !== undefined) {
                whereClause.is_active = is_active === "true";
            }

            if (periode !== undefined) {
                whereClause.periode = periode;
            }

            if (is_active_periode !== undefined) {
                whereClause.is_active_periode = is_active_periode === "true";
            }

            if (sumber_magang) {
                whereClause.sumber_magang = sumber_magang;
            }

            const users = await User.findAll({
                where: whereClause,
                include: [
                    {
                        association: "division",
                        attributes: ["id", "name"],
                    },
                ],
                attributes: [
                    "id",
                    "name",
                    "email",
                    "role",
                    "division_id",
                    "periode",
                    "is_active_periode",
                    "sumber_magang",
                    "is_active",
                    "avatar",
                    "created_at",
                ],
                order: [["created_at", "DESC"]],
            });

            res.json({
                success: true,
                data: users,
            });
        } catch (error) {
            console.error("Get all users error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get users",
            });
        }
    }

    // Create user (Admin)
    async create(req, res) {
        try {
            const {
                name,
                email,
                password,
                role,
                division_id,
                periode,
                sumber_magang,
            } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Name, email, and password are required",
                });
            }

            // Check if email already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Email already registered",
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                name,
                email,
                password: hashedPassword,
                role: role || "user",
                division_id: division_id || null,
                periode: periode || null,
                is_active_periode: true,
                sumber_magang: sumber_magang || null,
                is_active: true,
            });

            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    division_id: user.division_id,
                    periode: user.periode,
                    sumber_magang: user.sumber_magang,
                },
            });
        } catch (error) {
            console.error("Create user error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create user",
            });
        }
    }

    // Get user by ID (Admin)
    async getById(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id, {
                include: [
                    {
                        association: "division",
                        attributes: ["id", "name"],
                    },
                ],
                attributes: [
                    "id",
                    "name",
                    "email",
                    "role",
                    "division_id",
                    "is_active",
                    "avatar",
                    "created_at",
                ],
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            console.error("Get user by ID error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get user",
            });
        }
    }

    // Update user (Admin)
    async update(req, res) {
        try {
            const { id } = req.params;
            const {
                name,
                email,
                role,
                division_id,
                periode,
                is_active_periode,
                sumber_magang,
                is_active,
            } = req.body;

            const user = await User.findByPk(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Check if email is being changed and already exists
            if (email && email !== user.email) {
                const existingUser = await User.findOne({ where: { email } });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: "Email already registered",
                    });
                }
            }

            await user.update({
                name: name || user.name,
                email: email || user.email,
                role: role || user.role,
                division_id:
                    division_id !== undefined ? division_id : user.division_id,
                periode: periode !== undefined ? periode : user.periode,
                is_active_periode:
                    is_active_periode !== undefined
                        ? is_active_periode
                        : user.is_active_periode,
                sumber_magang:
                    sumber_magang !== undefined
                        ? sumber_magang
                        : user.sumber_magang,
                is_active: is_active !== undefined ? is_active : user.is_active,
            });

            res.json({
                success: true,
                message: "User updated successfully",
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    division_id: user.division_id,
                    periode: user.periode,
                    is_active_periode: user.is_active_periode,
                    sumber_magang: user.sumber_magang,
                    is_active: user.is_active,
                },
            });
        } catch (error) {
            console.error("Update user error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update user",
            });
        }
    }

    // Delete user (Admin)
    async delete(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Prevent deleting yourself
            if (user.id === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete your own account",
                });
            }

            await user.destroy();

            res.json({
                success: true,
                message: "User deleted successfully",
            });
        } catch (error) {
            console.error("Delete user error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete user",
            });
        }
    }

    // Toggle user status (Admin)
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (user.id === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot toggle your own status",
                });
            }

            await user.update({
                is_active: !user.is_active,
            });

            res.json({
                success: true,
                message: `User ${
                    user.is_active ? "activated" : "deactivated"
                } successfully`,
                data: {
                    id: user.id,
                    is_active: user.is_active,
                },
            });
        } catch (error) {
            console.error("Toggle status error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to toggle user status",
            });
        }
    }

    // Reset user password (Admin)
    async resetPassword(req, res) {
        try {
            const { id } = req.params;
            const { new_password } = req.body;

            if (!new_password || new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters",
                });
            }

            const user = await User.findByPk(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);

            await user.update({
                password: hashedPassword,
            });

            res.json({
                success: true,
                message: "Password reset successfully",
            });
        } catch (error) {
            console.error("Reset password error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to reset password",
            });
        }
    }

    // Download user import template (Admin)
    async downloadImportTemplate(req, res) {
        try {
            console.log("Generating user template...");
            const workbook =
                await ImportExportUserService.generateUserTemplate();

            console.log(
                "Template generated successfully, sending to client...",
            );

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=Template_Import_User.xlsx",
            );

            await workbook.xlsx.write(res);
            res.end();

            console.log("Template sent successfully");
        } catch (error) {
            console.error("Download template error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to download template",
                error: error.message,
            });
        }
    }

    // Export users by periode (Admin)
    async exportUsers(req, res) {
        try {
            const {
                periode,
                role,
                division_id,
                sumber_magang,
                is_active,
                is_active_periode,
            } = req.query;

            console.log("Export users with filters:", req.query);

            // Build filter object
            const filters = {};
            if (periode) filters.periode = periode;
            if (role) filters.role = role;
            if (division_id) filters.division_id = parseInt(division_id);
            if (sumber_magang) filters.sumber_magang = sumber_magang;
            if (is_active !== undefined && is_active !== "")
                filters.is_active = is_active === "1" || is_active === "true";
            if (is_active_periode !== undefined && is_active_periode !== "")
                filters.is_active_periode =
                    is_active_periode === "1" || is_active_periode === "true";

            console.log("Parsed filters:", filters);

            const workbook =
                await ImportExportUserService.exportUsersByPeriode(filters);

            // Generate dynamic filename
            let filename = "Export_Users";
            if (periode) filename += `_${periode}`;
            if (role) filename += `_${role}`;
            if (sumber_magang) filename += `_${sumber_magang}`;
            filename += `.xlsx`;

            console.log("Generated filename:", filename);

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${filename}`,
            );

            await workbook.xlsx.write(res);
            res.end();

            console.log("Export completed successfully");
        } catch (error) {
            console.error("Export users error:", error);
            console.error("Error stack:", error.stack);
            res.status(500).json({
                success: false,
                message: "Failed to export users",
                error: error.message,
            });
        }
    }

    // Import users from Excel (Admin)
    async importUsers(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "File Excel wajib diupload",
                });
            }

            const result = await ImportExportUserService.importUsersFromExcel(
                req.file.buffer,
            );

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error("Import users error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to import users",
            });
        }
    }
}

export default new UserController();
