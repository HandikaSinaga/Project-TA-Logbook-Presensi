import cron from "node-cron";
import models from "../models/index.js";
import { Op } from "sequelize";

const { Attendance, AppSetting, User } = models;

let cronJob = null;
let midnightCronJob = null;

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
            `[${checkoutType}] Running ${
                isForceCheckout ? "force" : "auto"
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
            `[${checkoutType}] Found ${pendingAttendances.length} users to ${
                isForceCheckout ? "force" : "auto"
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
                    `[${checkoutType}] Γ£ô ${
                        isForceCheckout ? "Force" : "Auto"
                    } checked out user: ${
                        attendance.user?.name || attendance.user_id
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
            `[${
                isForceCheckout ? "ForceCheckout" : "AutoCheckout"
            }] Error during checkout:`,
            error
        );
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
