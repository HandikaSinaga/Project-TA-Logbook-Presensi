import models from "../models/index.js";
import { getTimeValidationSettings } from "../utils/timeValidationHelper.js";

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

            // ========== VALIDATE TIME SETTINGS ==========
            const timeKeys = [
                "check_in_start_time",
                "check_in_end_time",
                "check_out_start_time",
                "check_out_end_time",
                "working_hours_start",
                "working_hours_end",
                "auto_checkout_time",
            ];

            // Validate time format (HH:MM)
            const timeFormatRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

            for (const key of timeKeys) {
                if (updates[key] && !timeFormatRegex.test(updates[key])) {
                    return res.status(400).json({
                        success: false,
                        message: `Format waktu tidak valid untuk ${key}. Gunakan format HH:MM (contoh: 08:00)`,
                        field: key,
                    });
                }
            }

            // Validate time logic (start < end)
            const timeToMinutes = (time) => {
                const [h, m] = time.split(":").map(Number);
                return h * 60 + m;
            };

            // Check-in window
            if (updates.check_in_start_time && updates.check_in_end_time) {
                const start = timeToMinutes(updates.check_in_start_time);
                const end = timeToMinutes(updates.check_in_end_time);
                if (start >= end) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Waktu mulai check-in harus lebih awal dari waktu akhir check-in",
                    });
                }
            }

            // Check-out window
            if (updates.check_out_start_time && updates.check_out_end_time) {
                const start = timeToMinutes(updates.check_out_start_time);
                const end = timeToMinutes(updates.check_out_end_time);
                if (start >= end) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Waktu mulai check-out harus lebih awal dari waktu akhir check-out",
                    });
                }
            }

            // Working hours
            if (updates.working_hours_start && updates.working_hours_end) {
                const start = timeToMinutes(updates.working_hours_start);
                const end = timeToMinutes(updates.working_hours_end);
                if (start >= end) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Waktu mulai kerja harus lebih awal dari waktu selesai kerja",
                    });
                }
            }

            // Validate numeric values
            if (
                updates.late_tolerance_minutes &&
                (isNaN(updates.late_tolerance_minutes) ||
                    updates.late_tolerance_minutes < 0)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Toleransi keterlambatan harus berupa angka positif",
                });
            }

            if (
                updates.max_leave_days_per_year &&
                (isNaN(updates.max_leave_days_per_year) ||
                    updates.max_leave_days_per_year < 0)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maksimal hari izin per tahun harus berupa angka positif",
                });
            }

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

    // Get time validation settings (for frontend)
    async getTimeValidationSettings(req, res) {
        try {
            const settings = await getTimeValidationSettings();

            if (!settings) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to get time validation settings",
                });
            }

            res.json({
                success: true,
                data: settings,
            });
        } catch (error) {
            console.error("Get time validation settings error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get time validation settings",
            });
        }
    }
}

export default new SettingsController();
