"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add periode column
        await queryInterface.addColumn("users", "periode", {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: "Batch/angkatan user (contoh: 2024-01, Angkatan 15)",
            after: "division_id",
        });

        // Add is_active_periode column
        await queryInterface.addColumn("users", "is_active_periode", {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment:
                "Status aktif dalam periode ini (true=aktif, false=historis)",
            after: "periode",
        });

        // Add index for efficient filtering
        await queryInterface.addIndex(
            "users",
            ["periode", "is_active_periode"],
            {
                name: "idx_users_periode_active",
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex("users", "idx_users_periode_active");
        await queryInterface.removeColumn("users", "is_active_periode");
        await queryInterface.removeColumn("users", "periode");
    },
};
