import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const insertSettings = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "db_presensi_ta",
    });

    try {
        console.log("Connected to database...");

        // Check if table exists
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'app_settings'"
        );
        if (tables.length === 0) {
            console.log("Table app_settings not found. Creating...");
            await connection.query(`
                CREATE TABLE app_settings (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    \`key\` VARCHAR(255) NOT NULL UNIQUE,
                    value TEXT,
                    type VARCHAR(255) DEFAULT 'string',
                    description VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log("Table created!");
        }

        // Insert or update settings
        const settings = [
            ["check_in_start_time", "06:00", "time", "Waktu mulai check-in"],
            [
                "check_in_end_time",
                "08:30",
                "time",
                "Waktu batas akhir check-in",
            ],
            ["check_out_start_time", "16:00", "time", "Waktu mulai check-out"],
            [
                "check_out_end_time",
                "20:00",
                "time",
                "Waktu batas akhir check-out",
            ],
            ["working_hours_start", "08:00", "time", "Jam mulai kerja resmi"],
            ["working_hours_end", "17:00", "time", "Jam selesai kerja resmi"],
            [
                "late_tolerance_minutes",
                "15",
                "number",
                "Toleransi keterlambatan",
            ],
            [
                "auto_checkout_enabled",
                "false",
                "boolean",
                "Auto checkout otomatis",
            ],
            ["auto_checkout_time", "17:30", "time", "Waktu auto checkout"],
            [
                "max_leave_days_per_year",
                "12",
                "number",
                "Max hari cuti per tahun",
            ],
            [
                "leave_require_approval",
                "true",
                "boolean",
                "Cuti perlu approval",
            ],
            [
                "leave_min_notice_days",
                "3",
                "number",
                "Min hari pemberitahuan cuti",
            ],
            ["notification_enabled", "true", "boolean", "Aktifkan notifikasi"],
            [
                "notification_late_checkout",
                "true",
                "boolean",
                "Notifikasi checkout terlambat",
            ],
        ];

        for (const [key, value, type, description] of settings) {
            await connection.query(
                "INSERT INTO app_settings (`key`, `value`, `type`, `description`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE `value` = ?, `type` = ?, `description` = ?, `updated_at` = NOW()",
                [key, value, type, description, value, type, description]
            );
            console.log(`✓ ${key} = ${value}`);
        }

        console.log("\nAll settings inserted successfully!");
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await connection.end();
    }
};

insertSettings();
