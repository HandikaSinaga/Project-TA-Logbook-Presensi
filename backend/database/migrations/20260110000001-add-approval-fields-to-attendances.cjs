"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("attendances", "approved_by", {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: "ID supervisor yang menyetujui",
            references: {
                model: "users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        });

        await queryInterface.addColumn("attendances", "approved_at", {
            type: Sequelize.DATE,
            allowNull: true,
            comment: "Waktu persetujuan",
        });

        await queryInterface.addColumn("attendances", "rejected_by", {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: "ID supervisor yang menolak",
            references: {
                model: "users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        });

        await queryInterface.addColumn("attendances", "rejected_at", {
            type: Sequelize.DATE,
            allowNull: true,
            comment: "Waktu penolakan",
        });

        await queryInterface.addColumn("attendances", "rejection_reason", {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: "Alasan penolakan",
        });

        await queryInterface.addColumn("attendances", "approval_status", {
            type: Sequelize.ENUM("pending", "approved", "rejected"),
            defaultValue: "pending",
            comment: "Status approval oleh supervisor",
        });

        // Update existing records to have default approval_status
        await queryInterface.sequelize.query(
            "UPDATE attendances SET approval_status = 'approved' WHERE approval_status IS NULL"
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("attendances", "approval_status");
        await queryInterface.removeColumn("attendances", "rejection_reason");
        await queryInterface.removeColumn("attendances", "rejected_at");
        await queryInterface.removeColumn("attendances", "rejected_by");
        await queryInterface.removeColumn("attendances", "approved_at");
        await queryInterface.removeColumn("attendances", "approved_by");

        // Remove ENUM type
        await queryInterface.sequelize.query(
            "DROP TYPE IF EXISTS enum_attendances_approval_status"
        );
    },
};
