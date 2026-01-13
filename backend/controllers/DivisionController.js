import models from "../models/index.js";

const { Division, User } = models;

class DivisionController {
    // Get user's division
    async getUserDivision(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findByPk(userId, {
                include: [
                    {
                        model: Division,
                        as: "division",
                        include: [
                            {
                                model: User,
                                as: "supervisor",
                                attributes: ["id", "name", "email", "avatar"],
                            },
                        ],
                    },
                ],
            });

            if (!user.division) {
                return res.status(404).json({
                    success: false,
                    message: "No division assigned",
                });
            }

            // Get division members count
            const membersCount = await User.count({
                where: {
                    division_id: user.division.id,
                    is_active: true,
                },
            });

            const divisionData = {
                ...user.division.toJSON(),
                members_count: membersCount,
            };

            res.json({
                success: true,
                data: divisionData,
            });
        } catch (error) {
            console.error("Get user division error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get division",
            });
        }
    }

    // Get my division with members
    async getMyDivisionWithMembers(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findByPk(userId);

            if (!user.division_id) {
                return res.status(404).json({
                    success: false,
                    message: "No division assigned",
                });
            }

            const division = await Division.findByPk(user.division_id, {
                include: [
                    {
                        model: User,
                        as: "members",
                        attributes: [
                            "id",
                            "name",
                            "email",
                            "role",
                            "avatar",
                            "bio",
                            "phone",
                            "nip",
                            "position",
                            "instagram",
                            "linkedin",
                            "twitter",
                            "facebook",
                            "telegram",
                            "github",
                        ],
                        where: { is_active: true },
                    },
                    {
                        model: User,
                        as: "supervisor",
                        attributes: [
                            "id",
                            "name",
                            "email",
                            "avatar",
                            "bio",
                            "phone",
                            "position",
                            "instagram",
                            "linkedin",
                            "twitter",
                            "facebook",
                            "telegram",
                            "github",
                        ],
                    },
                ],
            });

            res.json({
                success: true,
                data: division,
            });
        } catch (error) {
            console.error("Get my division with members error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get division with members",
            });
        }
    }

    // Get supervisor's division
    async getSupervisorDivision(req, res) {
        try {
            const supervisorId = req.user.id;

            const user = await User.findByPk(supervisorId, {
                include: [
                    {
                        model: Division,
                        as: "division",
                        include: [
                            {
                                model: User,
                                as: "members",
                                attributes: [
                                    "id",
                                    "name",
                                    "email",
                                    "role",
                                    "avatar",
                                    "bio",
                                    "phone",
                                    "nip",
                                    "position",
                                    "instagram",
                                    "linkedin",
                                    "twitter",
                                    "facebook",
                                    "telegram",
                                    "github",
                                ],
                            },
                        ],
                    },
                ],
            });

            if (!user.division) {
                return res.status(404).json({
                    success: false,
                    message: "No division assigned",
                });
            }

            res.json({
                success: true,
                division: user.division,
                members: user.division.members || [],
            });
        } catch (error) {
            console.error("Get supervisor division error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get division",
            });
        }
    }

    // Get division members
    async getDivisionMembers(req, res) {
        try {
            const supervisorId = req.user.id;

            const supervisor = await User.findByPk(supervisorId);

            if (!supervisor.division_id) {
                return res.status(400).json({
                    success: false,
                    message: "No division assigned",
                });
            }

            const members = await User.findAll({
                where: {
                    division_id: supervisor.division_id,
                    is_active: true,
                },
                attributes: [
                    "id",
                    "name",
                    "email",
                    "role",
                    "avatar",
                    "bio",
                    "phone",
                    "nip",
                    "position",
                    "created_at",
                ],
                order: [["name", "ASC"]],
            });

            res.json({
                success: true,
                data: members,
            });
        } catch (error) {
            console.error("Get division members error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get division members",
            });
        }
    }

    // Get all divisions (Admin)
    async getAll(req, res) {
        try {
            const { periode, is_active_periode } = req.query;

            const whereClause = {};

            if (periode !== undefined) {
                whereClause.periode = periode;
            }

            if (is_active_periode !== undefined) {
                whereClause.is_active_periode = is_active_periode === "true";
            }

            const divisions = await Division.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: "supervisor",
                        attributes: ["id", "name", "email", "avatar"],
                    },
                    {
                        model: User,
                        as: "members",
                        attributes: ["id", "name", "email", "role", "avatar"],
                        where: { is_active: true },
                        required: false,
                    },
                ],
                order: [["name", "ASC"]],
            });

            res.json(divisions);
        } catch (error) {
            console.error("Get all divisions error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get divisions",
            });
        }
    }

    // Create division (Admin)
    async create(req, res) {
        try {
            const { name, description, supervisor_id, periode, is_active } =
                req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: "Division name is required",
                });
            }

            // Check if supervisor exists
            if (supervisor_id) {
                const supervisor = await User.findByPk(supervisor_id);
                if (!supervisor) {
                    return res.status(404).json({
                        success: false,
                        message: "Supervisor not found",
                    });
                }
            }

            const division = await Division.create({
                name,
                description,
                supervisor_id: supervisor_id || null,
                periode: periode || null,
                is_active_periode: true,
                is_active: is_active !== undefined ? is_active : true,
            });

            res.status(201).json({
                success: true,
                message: "Division created successfully",
                data: division,
            });
        } catch (error) {
            console.error("Create division error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create division",
            });
        }
    }

    // Get division by ID (Admin)
    async getById(req, res) {
        try {
            const { id } = req.params;

            const division = await Division.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: "supervisor",
                        attributes: ["id", "name", "email"],
                    },
                    {
                        model: User,
                        as: "members",
                        attributes: ["id", "name", "email", "role"],
                    },
                ],
            });

            if (!division) {
                return res.status(404).json({
                    success: false,
                    message: "Division not found",
                });
            }

            res.json({
                success: true,
                data: division,
            });
        } catch (error) {
            console.error("Get division by ID error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get division",
            });
        }
    }

    // Update division (Admin)
    async update(req, res) {
        try {
            const { id } = req.params;
            const {
                name,
                description,
                supervisor_id,
                periode,
                is_active_periode,
                is_active,
            } = req.body;

            const division = await Division.findByPk(id);

            if (!division) {
                return res.status(404).json({
                    success: false,
                    message: "Division not found",
                });
            }

            if (supervisor_id) {
                const supervisor = await User.findByPk(supervisor_id);
                if (!supervisor) {
                    return res.status(404).json({
                        success: false,
                        message: "Supervisor not found",
                    });
                }
            }

            await division.update({
                name: name || division.name,
                description:
                    description !== undefined
                        ? description
                        : division.description,
                supervisor_id:
                    supervisor_id !== undefined
                        ? supervisor_id
                        : division.supervisor_id,
                periode: periode !== undefined ? periode : division.periode,
                is_active_periode:
                    is_active_periode !== undefined
                        ? is_active_periode
                        : division.is_active_periode,
                is_active:
                    is_active !== undefined ? is_active : division.is_active,
            });

            res.json({
                success: true,
                message: "Division updated successfully",
                data: division,
            });
        } catch (error) {
            console.error("Update division error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update division",
            });
        }
    }

    // Delete division (Admin)
    async delete(req, res) {
        try {
            const { id } = req.params;

            const division = await Division.findByPk(id);

            if (!division) {
                return res.status(404).json({
                    success: false,
                    message: "Division not found",
                });
            }

            // Check if division has members
            const membersCount = await User.count({
                where: { division_id: id },
            });

            if (membersCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete division with ${membersCount} members. Please reassign them first.`,
                });
            }

            await division.destroy();

            res.json({
                success: true,
                message: "Division deleted successfully",
            });
        } catch (error) {
            console.error("Delete division error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete division",
            });
        }
    }

    // Get members of specific division (Admin)
    async getMembers(req, res) {
        try {
            const { id } = req.params;

            const division = await Division.findByPk(id);

            if (!division) {
                return res.status(404).json({
                    success: false,
                    message: "Division not found",
                });
            }

            const members = await User.findAll({
                where: { division_id: id },
                attributes: [
                    "id",
                    "name",
                    "email",
                    "role",
                    "is_active",
                    "created_at",
                ],
                order: [["name", "ASC"]],
            });

            res.json({
                success: true,
                data: members,
            });
        } catch (error) {
            console.error("Get division members error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get division members",
            });
        }
    }

    // Get available users (Supervisor) - users without division or supervisor
    async getAvailableUsers(req, res) {
        try {
            const supervisorId = req.user.id;

            const availableUsers = await User.findAll({
                where: {
                    role: "user",
                    is_active: true,
                    division_id: null,
                },
                attributes: [
                    "id",
                    "name",
                    "email",
                    "role",
                    "avatar",
                    "bio",
                    "phone",
                    "nip",
                    "position",
                    "created_at",
                ],
                order: [["name", "ASC"]],
            });

            res.json({
                success: true,
                data: availableUsers,
            });
        } catch (error) {
            console.error("Get available users error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get available users",
            });
        }
    }

    // Assign user to division (Supervisor)
    async assignUserToDivision(req, res) {
        try {
            const supervisorId = req.user.id;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required",
                });
            }

            // Get supervisor's division
            const supervisor = await User.findByPk(supervisorId);

            if (!supervisor.division_id) {
                return res.status(400).json({
                    success: false,
                    message: "Supervisor has no division assigned",
                });
            }

            // Get the user to assign
            const user = await User.findByPk(user_id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (user.role !== "user") {
                return res.status(400).json({
                    success: false,
                    message: "Can only assign users with role 'user'",
                });
            }

            if (user.division_id) {
                return res.status(400).json({
                    success: false,
                    message: "User is already assigned to a division",
                });
            }

            // Assign user to division
            await user.update({
                division_id: supervisor.division_id,
                supervisor_id: supervisorId,
            });

            res.json({
                success: true,
                message: "User assigned to division successfully",
                data: user,
            });
        } catch (error) {
            console.error("Assign user to division error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to assign user to division",
            });
        }
    }

    // Assign users to division (Admin)
    async assignUsersToDivision(req, res) {
        try {
            const { id } = req.params; // division_id
            const { user_ids } = req.body;

            // Validate division exists
            const division = await Division.findByPk(id);
            if (!division) {
                return res.status(404).json({
                    success: false,
                    message: "Division not found",
                });
            }

            // Validate user_ids is provided and is array
            if (
                !user_ids ||
                !Array.isArray(user_ids) ||
                user_ids.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "User IDs array is required and must not be empty",
                });
            }

            // Validate users exist
            const users = await User.findAll({
                where: { id: user_ids },
            });

            if (users.length !== user_ids.length) {
                return res.status(400).json({
                    success: false,
                    message: "Some users not found",
                });
            }

            // Check if any user already has a division
            const usersWithDivision = users.filter(
                (u) => u.division_id !== null
            );
            if (usersWithDivision.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `${usersWithDivision.length} user(s) already have a division`,
                    users_with_division: usersWithDivision.map((u) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                    })),
                });
            }

            // Bulk update users to assign them to division
            await User.update({ division_id: id }, { where: { id: user_ids } });

            res.json({
                success: true,
                message: `Successfully assigned ${user_ids.length} user(s) to division`,
                data: {
                    division_id: id,
                    assigned_count: user_ids.length,
                },
            });
        } catch (error) {
            console.error("Assign users to division error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to assign users to division",
            });
        }
    }

    // Remove user from division (Supervisor)
    async removeUserFromDivision(req, res) {
        try {
            const supervisorId = req.user.id;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required",
                });
            }

            // Get the user
            const user = await User.findByPk(user_id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Verify user is supervised by this supervisor
            if (user.supervisor_id !== supervisorId) {
                return res.status(403).json({
                    success: false,
                    message: "You can only remove users you supervise",
                });
            }

            // Remove user from division
            await user.update({
                division_id: null,
                supervisor_id: null,
            });

            res.json({
                success: true,
                message: "User removed from division successfully",
            });
        } catch (error) {
            console.error("Remove user from division error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to remove user from division",
            });
        }
    }
}

export default new DivisionController();
