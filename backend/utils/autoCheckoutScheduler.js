import cron from "node-cron";
import models from "../models/index.js";
import { Op } from "sequelize";
import { getJakartaDate, getTodayJakarta, formatDateToString } from "./dateHelper.js";

const { Attendance, AppSetting, User, Division, Leave, Holiday, Logbook } = models;


let cronJob = null;
let midnightCronJob = null;
let absenceCronJob = null;
let logbookScheduler = null;


/**
 * Auto Checkout Scheduler
 * Automatically checks out users who haven't checked out by the configured time
 */
export const startAutoCheckoutScheduler = async () => {
    try {
        // Stop existing job if running
        if (cronJob) {
            cronJob.stop();
            console.log("[AutoCheckout] Stopping existing scheduler");
        }

        // Get auto checkout settings
        const [autoCheckoutEnabledSetting, autoCheckoutTimeSetting] =
            await Promise.all([
                AppSetting.findOne({
                    where: { key: "auto_checkout_enabled" },
                }),
                AppSetting.findOne({
                    where: { key: "auto_checkout_time" },
                }),
            ]);

        const isEnabled =
            autoCheckoutEnabledSetting?.value === "true" ||
            autoCheckoutEnabledSetting?.value === true;
        const autoCheckoutTime = autoCheckoutTimeSetting?.value || "20:00";

        if (!isEnabled) {
            console.log("[AutoCheckout] Auto checkout is disabled");
            // Don't return - continue to setup midnight force checkout
        } else {
            // Parse time (format: HH:MM)
            const [hours, minutes] = autoCheckoutTime.split(":").map(Number);

            if (
                isNaN(hours) ||
                isNaN(minutes) ||
                hours < 0 ||
                hours > 23 ||
                minutes < 0 ||
                minutes > 59
            ) {
                console.error(
                    `[AutoCheckout] Invalid time format: ${autoCheckoutTime}`
                );
                return;
            }

            // Create cron expression: run at specified time every day
            const cronExpression = `${minutes} ${hours} * * *`;

            console.log(
                `[AutoCheckout] Scheduler configured to run at ${autoCheckoutTime} (${cronExpression})`
            );

            // Start cron job
            cronJob = cron.schedule(
                cronExpression,
                async () => {
                    await performAutoCheckout(false); // false = regular auto checkout
                },
                {
                    scheduled: true,
                    timezone: "Asia/Jakarta",
                }
            );

            console.log(
                `[AutoCheckout] Scheduler started successfully at ${autoCheckoutTime}`
            );
        }

        // ALWAYS setup end-of-day force checkout (regardless of auto_checkout_enabled)
        startMidnightForceCheckout();

        // Setup end-of-day absence marking
        startAbsenceScheduler();

        // Setup end-of-day logbook missing marker
        startLogbookMissingScheduler();
    } catch (error) {
        console.error("[AutoCheckout] Failed to start scheduler:", error);
    }
};

/**
 * Start end-of-day force checkout scheduler
 * This runs at 23:59:59 to force checkout users who forgot, with "Tidak Checkout" status
 */
const startMidnightForceCheckout = () => {
    try {
        // Stop existing midnight job if running
        if (midnightCronJob) {
            midnightCronJob.stop();
            console.log("[ForceCheckout] Stopping existing midnight scheduler");
        }

        // Run at 23:59:59 every day (end of day)
        const cronExpression = "59 59 23 * * *";

        midnightCronJob = cron.schedule(
            cronExpression,
            async () => {
                await performAutoCheckout(true); // true = force checkout (end of day)
            },
            {
                scheduled: true,
                timezone: "Asia/Jakarta",
            }
        );

        console.log(
            "[ForceCheckout] Force checkout scheduler started (23:59:59)"
        );
    } catch (error) {
        console.error(
            "[ForceCheckout] Failed to start midnight scheduler:",
            error
        );
    }
};

/**
 * Perform auto checkout for users who haven't checked out
 * @param {boolean} isForceCheckout - If true, marks as "Tidak Checkout" instead of "Auto Checkout"
 */
const performAutoCheckout = async (isForceCheckout = false) => {
    try {
        const checkoutType = isForceCheckout ? "ForceCheckout" : "AutoCheckout";
        console.log(
            `[${checkoutType}] Running ${isForceCheckout ? "force" : "auto"
            } checkout process...`
        );

        // For force checkout at end of day (23:59:59), we check TODAY's data
        const targetDate = new Date();
        if (isForceCheckout) {
            // End of day (23:59:59), check today's attendance
            // No need to adjust date
        }
        targetDate.setHours(0, 0, 0, 0);

        // Find all attendances where:
        // - Date is target date (today for auto, yesterday for force)
        // - Has check_in_time
        // - Does NOT have check_out_time
        const pendingAttendances = await Attendance.findAll({
            where: {
                date: targetDate,
                check_in_time: {
                    [Op.ne]: null,
                },
                check_out_time: null,
            },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name", "email"],
                },
            ],
        });

        if (pendingAttendances.length === 0) {
            console.log(`[${checkoutType}] No pending check-outs found`);
            return;
        }

        console.log(
            `[${checkoutType}] Found ${pendingAttendances.length} users to ${isForceCheckout ? "force" : "auto"
            } checkout`
        );

        const now = new Date();
        const checkOutTime = `${now
            .getHours()
            .toString()
            .padStart(2, "0")}:${now
                .getMinutes()
                .toString()
                .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

        let successCount = 0;
        let failCount = 0;

        // Determine checkout address and notes based on type
        const checkoutAddress = isForceCheckout
            ? "Sistem (Force Checkout)"
            : "Sistem (Auto Checkout)";
        const checkoutNotes = isForceCheckout
            ? "Checkout otomatis oleh sistem pada akhir hari (23:59:59) karena user lupa checkout"
            : "Checkout otomatis oleh sistem sesuai jadwal yang ditentukan admin";

        // Auto checkout each pending attendance
        for (const attendance of pendingAttendances) {
            try {
                // Calculate work hours
                const checkIn = new Date(
                    `2000-01-01 ${attendance.check_in_time}`
                );
                const checkOut = new Date(`2000-01-01 ${checkOutTime}`);
                const diffMs = checkOut - checkIn;
                const workHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

                await attendance.update({
                    check_out_time: checkOutTime,
                    check_out_latitude: null,
                    check_out_longitude: null,
                    check_out_address: checkoutAddress,
                    check_out_ip: null,
                    check_out_photo: null,
                    work_hours: workHours,
                    notes: checkoutNotes,
                });

                console.log(
                    `[${checkoutType}] Γ£ô ${isForceCheckout ? "Force" : "Auto"
                    } checked out user: ${attendance.user?.name || attendance.user_id
                    } with status "${checkoutAddress}"`
                );
                successCount++;
            } catch (error) {
                console.error(
                    `[${checkoutType}] Γ£ù Failed to checkout user ${attendance.user_id}:`,
                    error.message
                );
                failCount++;
            }
        }

        console.log(
            `[${checkoutType}] Process completed: ${successCount} success, ${failCount} failed`
        );
    } catch (error) {
        console.error(
            `[${isForceCheckout ? "ForceCheckout" : "AutoCheckout"
            }] Error during checkout:`,
            error
        );
    }
};

/**
 * Start absence marking scheduler
 * Runs at 23:59 every day to mark users who didn't check in as absent
 */
const startAbsenceScheduler = () => {
    try {
        if (absenceCronJob) {
            absenceCronJob.stop();
        }

        // Run at 23:59 every day
        const cronExpression = "59 23 * * *";

        absenceCronJob = cron.schedule(
            cronExpression,
            async () => {
                await markAbsences();
            },
            {
                scheduled: true,
                timezone: "Asia/Jakarta",
            }
        );

        console.log("[AbsenceTracker] Absence scheduler started (23:59)");
    } catch (error) {
        console.error("[AbsenceTracker] Failed to start absence scheduler:", error);
    }
};

/**
 * Mark absences for users who didn't check in today
 */
const markAbsences = async () => {
    try {
        console.log("[AbsenceTracker] Running absence check...");
        const today = getTodayJakarta();
        const dateString = formatDateToString(today);

        // Check if today is a holiday
        const holiday = await Holiday.findOne({
            where: { date: dateString }
        });
        if (holiday) {
            console.log(`[AbsenceTracker] Today is a holiday: ${holiday.name}. Skipping.`);
            return;
        }

        // Check if today is weekend
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1-5 = Mon-Fri, 6 = Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            console.log("[AbsenceTracker] Today is weekend. Skipping.");
            return;
        }

        // Find all active users with active divisions
        // Only those who were assigned to a division on or before today
        const users = await User.findAll({
            where: {
                is_active: true,
                division_id: { [Op.ne]: null },
                [Op.or]: [
                    { division_assigned_at: { [Op.lte]: today } },
                    { division_assigned_at: null } // Fallback for old users
                ]
            },
            include: [{
                model: Division,
                as: 'division',
                where: { is_active: true }
            }]
        });

        console.log(`[AbsenceTracker] Checking ${users.length} users for absence...`);

        for (const user of users) {
            // Check if user already has attendance today
            const attendance = await Attendance.findOne({
                where: {
                    user_id: user.id,
                    date: today
                }
            });

            if (!attendance) {
                // Check if user is on leave (approved)
                const leave = await Leave.findOne({
                    where: {
                        user_id: user.id,
                        status: 'approved',
                        start_date: { [Op.lte]: today },
                        end_date: { [Op.gte]: today }
                    }
                });

                if (!leave) {
                    // Create absent record
                    await Attendance.create({
                        user_id: user.id,
                        division_id: user.division_id,
                        date: today,
                        status: 'absent',
                        notes: 'Tidak melakukan presensi (Sistem)',
                        approval_status: 'approved' // Automatically approved as absent
                    });
                    console.log(`[AbsenceTracker] Marked user ${user.name} as absent`);
                } else {
                    console.log(`[AbsenceTracker] User ${user.name} is on leave. Skipping.`);
                }
            }
        }
        console.log("[AbsenceTracker] Absence check completed");
    } catch (error) {
        console.error("[AbsenceTracker] Error marking absences:", error);
    }
};

/**
 * Start scheduler untuk menandai logbook yang tidak diisi
 * Berjalan setelah absenceScheduler (23:56) setiap hari kerja
 */
const startLogbookMissingScheduler = () => {
    try {
        if (logbookScheduler) {
            logbookScheduler.stop();
        }

        // Run at 23:59 every day (same time as absence marking)
        const cronExpression = "59 23 * * *";

        logbookScheduler = cron.schedule(
            cronExpression,
            async () => {
                await markMissingLogbooks();
            },
            {
                scheduled: true,
                timezone: "Asia/Jakarta",
            }
        );

        console.log("[LogbookTracker] Logbook missing scheduler started (23:59)");
    } catch (error) {
        console.error("[LogbookTracker] Failed to start logbook scheduler:", error);
    }
};

/**
 * Tandai logbook yang tidak diisi pada hari kerja
 * Membuat record logbook dengan status 'not_filled' dan is_system_generated = true
 * untuk setiap user aktif yang tidak mengisi logbook pada hari ini
 */
const markMissingLogbooks = async () => {
    try {
        console.log("[LogbookTracker] Running logbook missing check...");
        const today = getTodayJakarta();
        const dateString = formatDateToString(today);

        // Check if today is a holiday
        const holiday = await Holiday.findOne({
            where: { date: dateString }
        });
        if (holiday) {
            console.log(`[LogbookTracker] Today is a holiday: ${holiday.name}. Skipping.`);
            return;
        }

        // Check if today is weekend
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            console.log("[LogbookTracker] Today is weekend. Skipping.");
            return;
        }

        // Find all active users with active divisions
        const users = await User.findAll({
            where: {
                is_active: true,
                division_id: { [Op.ne]: null },
                [Op.or]: [
                    { division_assigned_at: { [Op.lte]: today } },
                    { division_assigned_at: null } // Fallback for old users
                ]
            },
            include: [{
                model: Division,
                as: 'division',
                where: { is_active: true }
            }]
        });

        console.log(`[LogbookTracker] Checking ${users.length} users for missing logbook...`);

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        for (const user of users) {
            // Check if user already has a logbook for today (including not_filled ones)
            const existingLogbook = await Logbook.findOne({
                where: {
                    user_id: user.id,
                    date: dateString
                }
            });

            if (!existingLogbook) {
                // Create 'not_filled' logbook record
                await Logbook.create({
                    user_id: user.id,
                    date: dateString,
                    time: currentTime,
                    activity: 'Tidak Mengisi Logbook',
                    description: 'User tidak mengisi logbook pada hari ini (dicatat otomatis oleh sistem)',
                    status: 'not_filled',
                    is_system_generated: true,
                    attachments: []
                });
                console.log(`[LogbookTracker] Marked user ${user.name} as not_filled logbook`);
            } else {
                console.log(`[LogbookTracker] User ${user.name} already has logbook. Skipping.`);
            }
        }
        console.log("[LogbookTracker] Logbook missing check completed");
    } catch (error) {
        console.error("[LogbookTracker] Error marking missing logbooks:", error);
    }
};

/**
 * Stop the auto checkout scheduler
 */
export const stopAutoCheckoutScheduler = () => {
    if (cronJob) {
        cronJob.stop();
        console.log("[AutoCheckout] Scheduler stopped");
        cronJob = null;
    }
    if (midnightCronJob) {
        midnightCronJob.stop();
        console.log("[ForceCheckout] Midnight scheduler stopped");
        midnightCronJob = null;
    }
    if (absenceCronJob) {
        absenceCronJob.stop();
        console.log("[AbsenceTracker] Absence scheduler stopped");
        absenceCronJob = null;
    }
    if (logbookScheduler) {
        logbookScheduler.stop();
        console.log("[LogbookTracker] Logbook scheduler stopped");
        logbookScheduler = null;
    }
};

/**
 * Restart scheduler (useful when settings change)
 */
export const restartAutoCheckoutScheduler = async () => {
    console.log("[AutoCheckout] Restarting scheduler...");
    stopAutoCheckoutScheduler();
    await startAutoCheckoutScheduler();
};

/**
 * Get scheduler status
 */
export const getSchedulerStatus = () => {
    return {
        isRunning: cronJob !== null,
        cronJob: cronJob ? "Active" : "Inactive",
    };
};
