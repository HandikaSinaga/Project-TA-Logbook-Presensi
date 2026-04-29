"use strict";

/**
 * Migration: Add supervisor_division_assigned_at to users table
 *
 * Purpose: Track when a supervisor was assigned to their division
 * Business Rule: Supervisor can only view team calendar data from this date onwards
 *
 * Changes:
 * - Add supervisor_division_assigned_at TIMESTAMP NULL to users table
 * - Add index idx_users_supervisor_assigned for query performance
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add supervisor_division_assigned_at column
        await queryInterface.addColumn(
            "users",
            "supervisor_division_assigned_at",
            {
                type: Sequelize.DATE,
                allowNull: true,
                comment:
                    "Date when supervisor was assigned to division. Used to restrict calendar data access.",
                after: "supervisor_id",
            },
        );

        // Add index for performance optimization
        await queryInterface.addIndex(
            "users",
            ["supervisor_division_assigned_at"],
            {
                name: "idx_users_supervisor_assigned",
                using: "BTREE",
            },
        );

        console.log(
            "✅ Added supervisor_division_assigned_at column and index to users table",
        );
    },

    async down(queryInterface, Sequelize) {
        // Remove index first
        await queryInterface.removeIndex(
            "users",
            "idx_users_supervisor_assigned",
        );

        // Remove column
        await queryInterface.removeColumn(
            "users",
            "supervisor_division_assigned_at",
        );

        console.log(
            "✅ Removed supervisor_division_assigned_at column and index from users table",
        );
    },
};
