"use strict";

/**
 * Migration: Add Division Performance Indexes
 *
 * Purpose: Add division_id indexes for supervisor team queries
 * Business Rule: Optimize queries filtering by division_id for supervisor calendar
 *
 * Changes:
 * - Add idx_users_division on users(division_id) - For team member queries
 * - Add idx_attendances_division_date on attendances(division_id, date) - For team attendance queries
 *
 * Note: idx_attendances_user_date and other indexes already exist from previous migration
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            console.log("[Migration] Adding division performance indexes...");

            // 1. Check if idx_users_division exists
            const usersDivisionIndex = await queryInterface.sequelize.query(
                `SHOW INDEX FROM users WHERE Key_name = 'idx_users_division';`,
                { type: Sequelize.QueryTypes.SELECT, transaction },
            );

            if (usersDivisionIndex.length === 0) {
                await queryInterface.addIndex("users", ["division_id"], {
                    name: "idx_users_division",
                    using: "BTREE",
                    transaction,
                });
                console.log("[Migration] ✅ Added index: idx_users_division");
            } else {
                console.log(
                    "[Migration] ⏭️  Index idx_users_division already exists",
                );
            }

            // 2. Check if idx_attendances_division_date exists
            const attendancesDivisionDateIndex =
                await queryInterface.sequelize.query(
                    `SHOW INDEX FROM attendances WHERE Key_name = 'idx_attendances_division_date';`,
                    { type: Sequelize.QueryTypes.SELECT, transaction },
                );

            // Note: We need to add division_id column to attendances first via JOIN with users
            // For now, skip this index as attendances doesn't have direct division_id column
            // Queries will use idx_attendances_user_date (already exists) + users.division_id JOIN
            console.log(
                "[Migration] ⏭️  Skipping idx_attendances_division_date (attendances uses user_id JOIN)",
            );

            await transaction.commit();
            console.log(
                "[Migration] ✅ Division performance indexes added successfully!",
            );
        } catch (error) {
            await transaction.rollback();
            console.error("[Migration] ❌ Error adding indexes:", error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            console.log("[Migration] Removing division performance indexes...");

            // Remove idx_users_division
            try {
                await queryInterface.removeIndex(
                    "users",
                    "idx_users_division",
                    { transaction },
                );
                console.log("[Migration] ✅ Removed index: idx_users_division");
            } catch (error) {
                console.log(
                    "[Migration] ⏭️  Index idx_users_division does not exist",
                );
            }

            await transaction.commit();
            console.log(
                "[Migration] ✅ Division indexes removed successfully!",
            );
        } catch (error) {
            await transaction.rollback();
            console.error("[Migration] ❌ Error removing indexes:", error);
            throw error;
        }
    },
};
