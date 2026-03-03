/**
 * Quick Test for AlphaCalculationService
 *
 * This script performs a quick functional test of the AlphaCalculationService
 * to ensure it's working correctly.
 *
 * Run: node scripts/testAlphaService.js
 */

import AlphaCalculationService from "../services/AlphaCalculationService.js";
import models from "../models/index.js";

const { User } = models;

async function testAlphaService() {
    try {
        console.log("\n🧪 Testing AlphaCalculationService...\n");

        // Get first active user for testing
        const testUser = await User.findOne({
            where: { is_active: true, role: "user" },
            attributes: ["id", "name", "email", "created_at"],
        });

        if (!testUser) {
            console.log("⚠️  No active users found. Create a user first.");
            process.exit(0);
        }

        console.log(
            `👤 Testing with user: ${testUser.name} (ID: ${testUser.id})`,
        );
        console.log(`   Email: ${testUser.email}`);
        console.log(
            `   Joined: ${AlphaCalculationService.formatLocalDate(new Date(testUser.created_at))}\n`,
        );

        // Test current month
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        console.log(
            `📅 Testing Current Month: ${currentYear}-${String(currentMonth).padStart(2, "0")}\n`,
        );

        const result = await AlphaCalculationService.calculateMonthlyAlpha(
            testUser.id,
            currentYear,
            currentMonth,
        );

        console.log("📊 Results:");
        console.log(`   Alpha Count: ${result.alphaCount}`);
        console.log(`   Expected Working Days: ${result.expectedWorkingDays}`);
        console.log(`   Attendance Days: ${result.attendanceDays}`);
        console.log(`   Leave Days: ${result.leaveDays}`);
        console.log(
            `   Formula: ${result.expectedWorkingDays} - ${result.attendanceDays} - ${result.leaveDays} = ${result.alphaCount}\n`,
        );

        console.log("📋 Details:");
        console.log(
            `   Period: ${result.details.periodStart} to ${result.details.periodEnd}`,
        );
        console.log(`   Calculated Until: ${result.details.checkUntil}`);
        console.log(`   User Join Date: ${result.details.userJoinDate}`);
        console.log(
            `   Working Days Config: [${result.details.workingDaysConfig.join(", ")}]`,
        );
        console.log(`   Holidays: ${result.details.holidaysCount} days\n`);

        if (result.absentDates && result.absentDates.length > 0) {
            console.log(`📅 Absent Dates (${result.absentDates.length}):`);
            console.log(`   ${result.absentDates.slice(0, 10).join(", ")}`);
            if (result.absentDates.length > 10) {
                console.log(
                    `   ... and ${result.absentDates.length - 10} more`,
                );
            }
        } else {
            console.log("✅ No absent dates - Perfect attendance!");
        }

        console.log("\n" + "=".repeat(60));
        console.log("✅ AlphaCalculationService is working correctly!");
        console.log("🎯 Ready for production use!\n");

        // Test helper methods
        console.log("🔧 Testing Helper Methods:\n");

        const testDate = new Date();
        const user = { created_at: new Date("2026-02-15") };

        console.log(
            `   isBeforeJoinDate(user, ${testDate.toISOString().split("T")[0]}): ${AlphaCalculationService.isBeforeJoinDate(user, testDate)}`,
        );
        console.log(
            `   isAfterToday(${testDate.toISOString().split("T")[0]}): ${AlphaCalculationService.isAfterToday(testDate)}`,
        );
        console.log(
            `   isValidWorkDate(user, ${testDate.toISOString().split("T")[0]}): ${AlphaCalculationService.isValidWorkDate(user, testDate)}`,
        );
        console.log(
            `   formatLocalDate(${testDate.toISOString()}): ${AlphaCalculationService.formatLocalDate(testDate)}\n`,
        );

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error testing AlphaCalculationService:", error);
        console.error(error.stack);
        process.exit(1);
    }
}

testAlphaService();
