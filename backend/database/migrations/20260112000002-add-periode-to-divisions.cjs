"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add periode column
        await queryInterface.addColumn("divisions", "periode", {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: "Batch/periode divisi (contoh: 2024-01, Q1-2024)",
            after: "supervisor_id",
        });

        // Add is_active_periode column
        await queryInterface.addColumn("divisions", "is_active_periode", {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment:
                "Status aktif dalam periode ini (true=aktif, false=historis)",
            after: "periode",
        });

        // Add index for efficient filtering
        await queryInterface.addIndex(
            "divisions",
            ["periode", "is_active_periode"],
            {
                name: "idx_divisions_periode_active",
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex(
            "divisions",
            "idx_divisions_periode_active"
        );
        await queryInterface.removeColumn("divisions", "is_active_periode");
        await queryInterface.removeColumn("divisions", "periode");
    },
};
