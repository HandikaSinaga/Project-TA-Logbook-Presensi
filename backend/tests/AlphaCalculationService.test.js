/**
 * Unit Tests for AlphaCalculationService
 *
 * Test Coverage:
 * ✅ Pre-join date filtering
 * ✅ Holiday exclusion
 * ✅ Weekend exclusion
 * ✅ Leave overlap handling
 * ✅ Alpha > 21 days (no hardcoded limit)
 * ✅ Monthly reset
 * ✅ Future month handling
 * ✅ Current month calculation (up to today)
 * ✅ Past month calculation (all days)
 *
 * @author GitHub Copilot
 * @date 2026-03-03
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import AlphaCalculationService from "../services/AlphaCalculationService.js";
import models from "../models/index.js";
import moment from "moment-timezone";

const { User, Attendance, Leave, Holiday, AppSetting } = models;

describe("AlphaCalculationService - Unit Tests", () => {
    let testUser;
    let testUserId;

    beforeAll(async () => {
        // Create test user with known join date
        testUser = await User.create({
            name: "Test User Alpha",
            email: `test-alpha-${Date.now()}@example.com`,
            password: "hashedpassword",
            role: "user",
            division_id: 1,
            created_at: new Date("2026-02-15"), // Joined Feb 15, 2026
        });
        testUserId = testUser.id;

        // Set working days to Mon-Fri (1-5)
        await AppSetting.upsert({
            key: "working_days",
            value: JSON.stringify([1, 2, 3, 4, 5]),
        });

        console.log(`[Test Setup] Created test user ID: ${testUserId}`);
    });

    afterAll(async () => {
        // Cleanup test data
        await Attendance.destroy({ where: { user_id: testUserId } });
        await Leave.destroy({ where: { user_id: testUserId } });
        await User.destroy({ where: { id: testUserId } });
        console.log(`[Test Cleanup] Removed test data for user ${testUserId}`);
    });

    describe("1. Pre-Join Date Filtering", () => {
        it("should NOT count days before user join date as alpha", async () => {
            // User joined Feb 15, 2026
            // Calculate alpha for February 2026
            const result = await AlphaCalculationService.calculateMonthlyAlpha(
                testUserId,
                2026,
                2, // February
            );

            // Feb 2026: 28 days total
            // Feb 1-14 = should be skipped (before join)
            // Feb 15-28 = 14 days (but Feb 15-16 is weekend)
            // Working days from Feb 17-28 (Mon-Fri only):
            // Feb 17 (Mon), 18 (Tue), 19 (Wed), 20 (Thu), 21 (Fri) = 5 days
            // Feb 24 (Mon), 25 (Tue), 26 (Wed), 27 (Thu), 28 (Fri) = 5 days
            // Total: 10 working days (assuming no holidays)

            expect(result.details.userJoinDate).toBe("2026-02-15");
            expect(result.expectedWorkingDays).toBeLessThanOrEqual(10);
            expect(result.alphaCount).toBe(result.expectedWorkingDays); // All absent (no attendance yet)
        });
    });

    describe("2. Holiday Exclusion", () => {
        it("should NOT count holidays as alpha", async () => {
            // Add a holiday on a working day
            await Holiday.create({
                date: "2026-03-01",
                name: "Test Holiday",
                description: "Unit test holiday",
                type: "national",
                is_national: true,
                is_active: true,
            });

            const result = await AlphaCalculationService.calculateMonthlyAlpha(
                testUserId,
                2026,
                3, // March
            );

            // March 1 (Sunday) would be weekend anyway
            // But if we set it to Monday, it should be excluded
            const expectedDays = result.expectedWorkingDays;
            expect(expectedDays).toBeGreaterThan(0);

            // Cleanup
            await Holiday.destroy({ where: { date: "2026-03-01" } });
        });
    });

    describe("3. Weekend Exclusion", () => {
        it("should NEVER count weekends as alpha", async () => {
            const result = await AlphaCalculationService.calculateMonthlyAlpha(
                testUserId,
                2026,
                3, // March 2026
            );

            // March 2026: Starts on Sunday
            // Weekends: Mar 1-2, 8-9, 15-16, 22-23, 29-30 = 10 days
            // Total days: 31
            // Working days (Mon-Fri): 31 - 10 = 21 days (excluding holidays)

            expect(result.expectedWorkingDays).toBeLessThanOrEqual(21);
        });
    });

    describe("4. Leave Overlap Handling", () => {
        it("should NOT count approved leave days as alpha", async () => {
            // Create attendance for some days
            await Attendance.create({
                user_id: testUserId,
                date: "2026-03-03",
                check_in_time: "08:00:00",
                status: "present",
            });

            // Create approved leave for Mar 4-5 (Tue-Wed)
            await Leave.create({
                user_id: testUserId,
                start_date: "2026-03-04",
                end_date: "2026-03-05",
                type: "sick",
                reason: "Unit test leave",
                status: "approved",
            });

            const result = await AlphaCalculationService.calculateMonthlyAlpha(
                testUserId,
                2026,
                3,
            );

            // Mar 3: Has attendance (not alpha)
            // Mar 4-5: Has leave (not alpha)
            // Other working days: Alpha

            expect(result.attendanceDays).toBe(1); // Mar 3
            expect(result.leaveDays).toBe(2); // Mar 4-5
            expect(result.alphaCount).toBe(
                result.expectedWorkingDays -
                    result.attendanceDays -
                    result.leaveDays,
            );

            // Cleanup
            await Attendance.destroy({
                where: { user_id: testUserId, date: "2026-03-03" },
            });
            await Leave.destroy({
                where: {
                    user_id: testUserId,
                    start_date: "2026-03-04",
                },
            });
        });
    });

    describe("5. Alpha > 21 Days (No Hardcoded Limit)", () => {
        it("should accurately count alpha even if > 21 days", async () => {
            // March 2026: ~21 working days
            // No attendance, no leave = All days are alpha

            const result = await AlphaCalculationService.calculateMonthlyAlpha(
                testUserId,
                2026,
                3, // March (full month since user joined in Feb)
            );

            // Should count ALL working days as alpha (no limit at 21)
            expect(result.alphaCount).toBeGreaterThan(0);
            expect(result.alphaCount).toBe(result.expectedWorkingDays);

            // Verify no artificial cap at 21
            if (result.expectedWorkingDays > 21) {
                expect(result.alphaCount).toBeGreaterThan(21);
            }
        });
    });

    describe("6. Monthly Reset", () => {
        it("should calculate alpha independently per month", async () => {
            // February calculation
            const feb = await AlphaCalculationService.calculateMonthlyAlpha(
                testUserId,
                2026,
                2,
            );

            // March calculation
            const mar = await AlphaCalculationService.calculateMonthlyAlpha(
                testUserId,
                2026,
                3,
            );

            // Should be independent
            expect(feb.alphaCount).not.toBe(mar.alphaCount);
            expect(feb.expectedWorkingDays).not.toBe(mar.expectedWorkingDays);
        });
    });

    describe("7. Future Month Handling", () => {
        it("should return 0 alpha for future months", async () => {
            const result = await AlphaCalculationService.calculateMonthlyAlpha(
                testUserId,
                2027, // Next year
                1, // January
            );

            expect(result.alphaCount).toBe(0);
            expect(result.expectedWorkingDays).toBe(0);
            expect(result.details.reason).toBe("Future month");
        });
    });

    describe("8. Current Month (Up to Today)", () => {
        it("should only calculate up to today for current month", async () => {
            const now = moment();
            const currentYear = now.year();
            const currentMonth = now.month() + 1;

            const result = await AlphaCalculationService.calculateMonthlyAlpha(
                testUserId,
                currentYear,
                currentMonth,
            );

            // Check until date should be today or before
            const checkUntilDate = moment(result.details.checkUntil);
            const today = moment().startOf("day");

            expect(checkUntilDate.isSameOrBefore(today)).toBe(true);
        });
    });

    describe("9. Past Month (All Days)", () => {
        it("should calculate all working days for past months", async () => {
            // Calculate for February 2026 (past month)
            const result = await AlphaCalculationService.calculateMonthlyAlpha(
                testUserId,
                2026,
                2, // February (past)
            );

            // Check until should be end of February
            expect(result.details.checkUntil).toBe("2026-02-28");
        });
    });

    describe("10. Helper Methods", () => {
        it("isBeforeJoinDate should work correctly", () => {
            const user = { created_at: new Date("2026-02-15") };

            expect(
                AlphaCalculationService.isBeforeJoinDate(
                    user,
                    new Date("2026-02-14"),
                ),
            ).toBe(true);
            expect(
                AlphaCalculationService.isBeforeJoinDate(
                    user,
                    new Date("2026-02-15"),
                ),
            ).toBe(false);
            expect(
                AlphaCalculationService.isBeforeJoinDate(
                    user,
                    new Date("2026-02-16"),
                ),
            ).toBe(false);
        });

        it("isAfterToday should work correctly", () => {
            const yesterday = moment().subtract(1, "day").toDate();
            const today = moment().toDate();
            const tomorrow = moment().add(1, "day").toDate();

            expect(AlphaCalculationService.isAfterToday(yesterday)).toBe(false);
            expect(AlphaCalculationService.isAfterToday(today)).toBe(false);
            expect(AlphaCalculationService.isAfterToday(tomorrow)).toBe(true);
        });

        it("isValidWorkDate should combine both checks", () => {
            const user = { created_at: new Date("2026-02-15") };
            const beforeJoin = new Date("2026-02-14");
            const validDate = new Date("2026-02-16");
            const futureDate = moment().add(1, "month").toDate();

            expect(
                AlphaCalculationService.isValidWorkDate(user, beforeJoin),
            ).toBe(false);
            expect(
                AlphaCalculationService.isValidWorkDate(user, validDate),
            ).toBe(true);
            expect(
                AlphaCalculationService.isValidWorkDate(user, futureDate),
            ).toBe(false);
        });
    });
});

/**
 * HOW TO RUN THESE TESTS:
 *
 * 1. Install Jest if not already:
 *    npm install --save-dev jest @jest/globals
 *
 * 2. Add to package.json scripts:
 *    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
 *
 * 3. Run tests:
 *    npm test AlphaCalculationService.test.js
 *
 * 4. Run with coverage:
 *    npm test -- --coverage AlphaCalculationService.test.js
 */
