import models from "../models/index.js";

const { User, Attendance, Logbook, Leave, Division, AppSetting } = models;

class SettingsController {
    // Get settings
    async getSettings(req, res) {
        try {
            // Fetch all settings from database
            const settingsData = await AppSetting.findAll();

            // Convert to key-value object
            const settings = {};
            settingsData.forEach((setting) => {
                let value = setting.value;

                // Parse value based on type
                if (setting.type === "boolean") {
                    value = value === "true" || value === "1";
                } else if (setting.type === "number") {
                    value = parseFloat(value);
                } else if (setting.type === "json") {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Keep as string if JSON parse fails
                    }
                }

                settings[setting.key] = value;
            });

            // Set default values if not in database
            const defaults = {
                check_in_start_time: "06:00",
                check_in_end_time: "08:30",
                check_out_start_time: "16:00",
                check_out_end_time: "20:00",
                working_hours_start: "08:00",
                working_hours_end: "17:00",
                late_tolerance_minutes: "15",
                auto_checkout_enabled: false,
                auto_checkout_time: "17:30",
                max_leave_days_per_year: "12", // Izin untuk magang (bukan cuti)
                leave_require_approval: true,
                leave_min_notice_days: "3",
                leave_submission_deadline_hours: "24", // H-1 (24 jam sebelum jam kerja)
                leave_min_reason_chars: "10", // Minimal karakter alasan izin
                notification_enabled: true,
                notification_late_checkout: true,
            };

            // Merge defaults with database settings
            const finalSettings = { ...defaults, ...settings };

            res.json({
                success: true,
                data: finalSettings,
            });
        } catch (error) {
            console.error("Get settings error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get settings",
            });
        }
    }

    // Update settings
    async updateSettings(req, res) {
        try {
            const updates = req.body;

            // Update or create settings
            for (const [key, value] of Object.entries(updates)) {
                let type = "string";
                let stringValue = String(value);

                if (typeof value === "boolean") {
                    type = "boolean";
                    stringValue = value ? "true" : "false";
                } else if (typeof value === "number") {
                    type = "number";
                    stringValue = String(value);
                } else if (typeof value === "object") {
                    type = "json";
                    stringValue = JSON.stringify(value);
                }

                await AppSetting.upsert({
                    key,
                    value: stringValue,
                    type,
                });
            }

            res.json({
                success: true,
                message: "Settings updated successfully",
                data: updates,
            });
        } catch (error) {
            console.error("Update settings error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update settings",
            });
        }
    }

    // Get system info
    async getSystemInfo(req, res) {
        try {
            const [
                totalUsers,
                totalAttendances,
                totalLogbooks,
                totalLeaves,
                totalDivisions,
            ] = await Promise.all([
                User.count(),
                Attendance.count(),
                Logbook.count(),
                Leave.count(),
                Division.count(),
            ]);

            const systemInfo = {
                version: "1.0.0",
                database: {
                    total_users: totalUsers,
                    total_attendances: totalAttendances,
                    total_logbooks: totalLogbooks,
                    total_leaves: totalLeaves,
                    total_divisions: totalDivisions,
                },
                server: {
                    node_version: process.version,
                    platform: process.platform,
                    uptime: process.uptime(),
                    memory_usage: process.memoryUsage(),
                },
            };

            res.json({
                success: true,
                data: systemInfo,
            });
        } catch (error) {
            console.error("Get system info error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get system info",
            });
        }
    }
}

export default new SettingsController();
