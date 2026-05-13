import models from "../models/index.js";
import AttendanceService from "../services/AttendanceService.js";
import { Op } from "sequelize";
import {
    getJakartaDate,
    getTodayJakarta,
    getStartOfMonthJakarta,
    getEndOfMonthJakarta,
} from "../utils/dateHelper.js";

const { User, Attendance, Logbook, Leave, Division } = models;

class DashboardController {
    // User Dashboard
    async getUserDashboard(req, res) {
        try {
            const userId = req.user.id;
            const now = getJakartaDate();
            const today = getTodayJakarta();
            const startOfMonth = getStartOfMonthJakarta(
                now.getFullYear(),
                now.getMonth() + 1,
            );
            const endOfMonth = getEndOfMonthJakarta(
                now.getFullYear(),
                now.getMonth() + 1,
            );

            // Backfill missing absences for current month
            try {
                await AttendanceService.ensureAttendanceRecords(userId, startOfMonth, endOfMonth);
            } catch (backfillError) {
                // Continue loading dashboard even if backfill fails
            }

            // Get user with division
            const user = await User.findByPk(userId, {
                include: [
                    { association: "division", attributes: ["id", "name"] },
                ],
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Check today's attendance
            const todayStart = getTodayJakarta();
            const todayEnd = getTodayJakarta();
            todayEnd.setHours(23, 59, 59, 999);

            const todayAttendance = await Attendance.findOne({
                where: {
                    user_id: userId,
                    date: {
                        [Op.between]: [todayStart, todayEnd],
                    },
                },
            });

            // Check today's logbook
            const todayLogbook = await Logbook.findOne({
                where: {
                    user_id: userId,
                    date: {
                        [Op.between]: [todayStart, todayEnd],
                    },
                },
            });

            // Total attendance this month
            const totalAttendance = await Attendance.count({
                where: {
                    user_id: userId,
                    date: {
                        [Op.between]: [startOfMonth, endOfMonth],
                    },
                    status: { [Op.ne]: "absent" },
                },
            });

            // Monthly logbooks
            const monthlyLogbooks = await Logbook.count({
                where: {
                    user_id: userId,
                    date: {
                        [Op.between]: [startOfMonth, endOfMonth],
                    },
                },
            });

            // Pending leaves
            const pendingLeaves = await Leave.count({
                where: {
                    user_id: userId,
                    status: "pending",
                },
            });

            // Calculate attendance rate
            const workDays = DashboardController.getWorkDaysInMonth(now);
            const attendanceRate =
                workDays > 0
                    ? ((totalAttendance / workDays) * 100).toFixed(1)
                    : 0;

            // Division members count
            let divisionMembers = 0;
            if (user.division_id) {
                divisionMembers = await User.count({
                    where: { division_id: user.division_id, is_active: true },
                });
            }

            // Determine attendance status
            let attendanceStatus = "Belum Presensi";
            if (todayAttendance) {
                if (todayAttendance.check_out_time) {
                    attendanceStatus = "Sudah Check Out";
                } else {
                    attendanceStatus = "Sudah Check In";
                }
            }

            // Determine logbook status
            const logbookStatus = todayLogbook
                ? "Sudah Mengisi"
                : "Belum Mengisi";

            console.log(`[DashboardController] Sending success response for user ${userId}`);
            res.json({
                success: true,
                data: {
                    user: {
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        avatar: user.avatar,
                    },
                    stats: {
                        attendance_status: attendanceStatus,
                        logbook_status: logbookStatus,
                        leave_pending: pendingLeaves,
                        total_attendance: totalAttendance,
                        monthly_logbooks: monthlyLogbooks,
                        attendance_rate: attendanceRate,
                        division_name: user.division?.name || "No Division",
                        division_members: divisionMembers,
                    },
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to get dashboard data",
            });
        }
    }

    // Supervisor Dashboard
    async getSupervisorDashboard(req, res) {
        try {
            const userId = req.user.id;
            const now = getJakartaDate();
            const today = getTodayJakarta();

            // Get supervisor's division
            const supervisor = await User.findByPk(userId, {
                include: [{ association: "division" }],
            });

            if (!supervisor.division_id) {
                return res.status(400).json({
                    success: false,
                    message: "No division assigned to supervisor",
                });
            }

            // Team members
            const teamMembers = await User.count({
                where: {
                    division_id: supervisor.division_id,
                    is_active: true,
                    role: "user",
                },
            });

            // Pending approvals
            const pendingApprovals = await Leave.count({
                where: {
                    status: "pending",
                },
                include: [
                    {
                        model: User,
                        as: "user",
                        where: { division_id: supervisor.division_id },
                    },
                ],
            });

            // Today's attendance
            const todayStart = getTodayJakarta();
            const todayEnd = getTodayJakarta();
            todayEnd.setHours(23, 59, 59, 999);

            const todayAttendance = await Attendance.count({
                where: {
                    date: {
                        [Op.between]: [todayStart, todayEnd],
                    },
                    status: { [Op.ne]: "absent" },
                },
                include: [
                    {
                        model: User,
                        as: "user",
                        where: { division_id: supervisor.division_id },
                    },
                ],
            });

            // Calculate average attendance rate
            const avgAttendanceRate =
                teamMembers > 0
                    ? ((todayAttendance / teamMembers) * 100).toFixed(1)
                    : 0;

            // Get pending approval details
            const pendingList = await Leave.findAll({
                where: { status: "pending" },
                include: [
                    {
                        model: User,
                        as: "user",
                        where: { division_id: supervisor.division_id },
                        attributes: ["id", "name", "email", "avatar"],
                    },
                ],
                limit: 5,
                order: [["created_at", "DESC"]],
            });

            // Pending logbooks for supervisor's team
            const pendingLogbooks = await Logbook.count({
                where: { status: "pending" },
                include: [
                    {
                        model: User,
                        as: "user",
                        where: { division_id: supervisor.division_id },
                    },
                ],
            });

            res.json({
                success: true,
                data: {
                    stats: {
                        team_members: teamMembers,
                        present_today: todayAttendance,
                        pending_approvals: pendingApprovals,
                        active_tasks: pendingLogbooks,
                    },
                    pending_approvals: pendingList.map((leave) => ({
                        user_id: leave.user.id,
                        user_name: leave.user.name,
                        user_email: leave.user.email,
                        user_avatar: leave.user.avatar,
                        type: leave.type,
                        date: leave.start_date,
                        status: leave.status,
                    })),
                },
            });
        } catch (error) {
            console.error("Get supervisor dashboard error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get dashboard data",
            });
        }
    }

    // Admin Dashboard
    async getAdminDashboard(req, res) {
        try {
            const now = getJakartaDate();
            const today = getTodayJakarta();
            const startOfMonth = getStartOfMonthJakarta(
                now.getFullYear(),
                now.getMonth() + 1,
            );

            // Total users (all)
            const totalUsers = await User.count();

            // Total active users
            const activeUsers = await User.count({
                where: { is_active: true },
            });

            // New users this month
            const newUsersThisMonth = await User.count({
                where: {
                    created_at: { [Op.gte]: startOfMonth },
                    is_active: true,
                },
            });

            // Total divisions
            const totalDivisions = await Division.count();

            // Total locations from OfficeNetwork
            const OfficeNetwork = models.OfficeNetwork;
            const totalLocations = await OfficeNetwork.count();

            // Today's attendance
            const todayStart = getTodayJakarta();
            const todayEnd = getTodayJakarta();
            todayEnd.setHours(23, 59, 59, 999);

            const todayAttendance = await Attendance.count({
                where: {
                    date: {
                        [Op.between]: [todayStart, todayEnd],
                    },
                    status: { [Op.ne]: "absent" },
                },
            });

            // Pending leaves
            const pendingLeaves = await Leave.count({
                where: { status: "pending" },
            });

            // Pending logbooks
            const pendingLogbooks = await Logbook.count({
                where: { status: "pending" },
            });

            // Average attendance rate
            const avgAttendanceRate =
                activeUsers > 0
                    ? ((todayAttendance / activeUsers) * 100).toFixed(1)
                    : 0;

            // Recent activities from real data
            const recentAttendances = await Attendance.findAll({
                where: {
                    date: {
                        [Op.between]: [todayStart, todayEnd],
                    },
                },
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["name"],
                    },
                ],
                order: [["created_at", "DESC"]],
                limit: 5,
            });

            const recentActivities = recentAttendances.map((att) => ({
                type: "attendance",
                icon: "calendar-check",
                description: `${att.user?.name || "User"} recorded attendance`,
                time: new Date(att.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                }),
            }));

            res.json({
                success: true,
                data: {
                    stats: {
                        total_users: totalUsers,
                        active_users: activeUsers,
                        new_users_this_month: newUsersThisMonth,
                        total_divisions: totalDivisions,
                        total_locations: totalLocations,
                        attendance_today: todayAttendance,
                        pending_leaves: pendingLeaves,
                        pending_logbooks: pendingLogbooks,
                        avg_attendance_rate: avgAttendanceRate,
                    },
                    recent_activities: recentActivities,
                },
            });
        } catch (error) {
            console.error("Get admin dashboard error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get dashboard data",
            });
        }
    }

    // Helper: Get work days in month
    static getWorkDaysInMonth(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        let workDays = 0;

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const dayOfWeek = currentDate.getDay();

            // Skip Sundays (0) and Saturdays (6)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workDays++;
            }
        }

        return workDays;
    }
}

export default new DashboardController();
