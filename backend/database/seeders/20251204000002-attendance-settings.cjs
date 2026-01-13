"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Insert default attendance settings
        await queryInterface.bulkInsert(
            "app_settings",
            [
                // Attendance time windows
                {
                    key: "check_in_start_time",
                    value: "06:00",
                    type: "time",
                    description: "Waktu mulai check-in (format HH:mm)",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    key: "check_in_end_time",
                    value: "08:30",
                    type: "time",
                    description: "Waktu batas akhir check-in (format HH:mm)",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    key: "check_out_start_time",
                    value: "16:00",
                    type: "time",
                    description: "Waktu mulai check-out (format HH:mm)",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    key: "check_out_end_time",
                    value: "20:00",
                    type: "time",
                    description: "Waktu batas akhir check-out (format HH:mm)",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                // Working hours
                {
                    key: "working_hours_start",
                    value: "08:00",
                    type: "time",
                    description: "Jam mulai kerja resmi (format HH:mm)",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    key: "working_hours_end",
                    value: "17:00",
                    type: "time",
                    description: "Jam selesai kerja resmi (format HH:mm)",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                // Late tolerance
                {
                    key: "late_tolerance_minutes",
                    value: "15",
                    type: "number",
                    description: "Toleransi keterlambatan dalam menit",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                // Auto checkout
                {
                    key: "auto_checkout_enabled",
                    value: "false",
                    type: "boolean",
                    description: "Aktifkan auto checkout otomatis",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    key: "auto_checkout_time",
                    value: "17:30",
                    type: "time",
                    description: "Waktu auto checkout (format HH:mm)",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                // Leave settings
                {
                    key: "max_leave_days_per_year",
                    value: "12",
                    type: "number",
                    description: "Maksimal hari cuti per tahun",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    key: "leave_require_approval",
                    value: "true",
                    type: "boolean",
                    description: "Cuti memerlukan approval",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    key: "leave_min_notice_days",
                    value: "3",
                    type: "number",
                    description: "Minimal hari pemberitahuan cuti",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                // Notification settings
                {
                    key: "notification_enabled",
                    value: "true",
                    type: "boolean",
                    description: "Aktifkan notifikasi",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    key: "notification_late_checkout",
                    value: "true",
                    type: "boolean",
                    description: "Notifikasi checkout terlambat",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete(
            "app_settings",
            {
                key: [
                    "check_in_start_time",
                    "check_in_end_time",
                    "check_out_start_time",
                    "check_out_end_time",
                    "working_hours_start",
                    "working_hours_end",
                    "late_tolerance_minutes",
                    "auto_checkout_enabled",
                    "auto_checkout_time",
                    "max_leave_days_per_year",
                    "leave_require_approval",
                    "leave_min_notice_days",
                    "notification_enabled",
                    "notification_late_checkout",
                ],
            },
            {}
        );
    },
};
