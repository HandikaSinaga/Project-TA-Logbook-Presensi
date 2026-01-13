import models from "../models/index.js";

const { AppSetting } = models;

const defaultSettings = [
    {
        key: "check_in_start_time",
        value: "06:00",
        type: "string",
        description: "Waktu mulai check-in",
    },
    {
        key: "check_in_end_time",
        value: "08:30",
        type: "string",
        description: "Batas akhir check-in",
    },
    {
        key: "check_out_start_time",
        value: "16:00",
        type: "string",
        description: "Waktu mulai check-out",
    },
    {
        key: "check_out_end_time",
        value: "20:00",
        type: "string",
        description: "Batas akhir check-out",
    },
    {
        key: "working_hours_start",
        value: "08:00",
        type: "string",
        description: "Jam kerja mulai",
    },
    {
        key: "working_hours_end",
        value: "17:00",
        type: "string",
        description: "Jam kerja selesai",
    },
    {
        key: "late_tolerance_minutes",
        value: "15",
        type: "number",
        description: "Toleransi keterlambatan (menit)",
    },
    {
        key: "auto_checkout_enabled",
        value: "false",
        type: "boolean",
        description: "Auto checkout aktif",
    },
    {
        key: "auto_checkout_time",
        value: "17:30",
        type: "string",
        description: "Waktu auto checkout",
    },
    {
        key: "max_leave_days_per_year",
        value: "12",
        type: "number",
        description: "Maksimal cuti per tahun (hari)",
    },
    {
        key: "leave_require_approval",
        value: "true",
        type: "boolean",
        description: "Cuti wajib persetujuan",
    },
    {
        key: "leave_min_notice_days",
        value: "3",
        type: "number",
        description: "Minimal pemberitahuan cuti (hari)",
    },
    {
        key: "leave_submission_deadline_hours",
        value: "24",
        type: "number",
        description:
            "Batas waktu pengajuan izin (jam sebelum tanggal izin) - 24 jam = H-1",
    },
    {
        key: "leave_min_reason_chars",
        value: "10",
        type: "number",
        description: "Minimal karakter untuk alasan pengajuan izin",
    },
    {
        key: "notification_enabled",
        value: "true",
        type: "boolean",
        description: "Notifikasi aktif",
    },
    {
        key: "notification_late_checkout",
        value: "true",
        type: "boolean",
        description: "Notifikasi checkout terlambat",
    },
];

async function seedSystemSettings() {
    try {
        console.log("🌱 Starting system settings seeder...");

        for (const setting of defaultSettings) {
            const [instance, created] = await AppSetting.findOrCreate({
                where: { key: setting.key },
                defaults: setting,
            });

            if (created) {
                console.log(`✅ Created: ${setting.key} = ${setting.value}`);
            } else {
                console.log(`⏭️  Exists: ${setting.key} = ${instance.value}`);
            }
        }

        console.log("✅ System settings seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeder error:", error);
        process.exit(1);
    }
}

seedSystemSettings();
