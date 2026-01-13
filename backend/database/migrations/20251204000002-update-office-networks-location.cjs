"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Drop existing table to recreate with new schema
        await queryInterface.dropTable("office_networks");

        // Recreate with enhanced fields
        await queryInterface.createTable("office_networks", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: 'Nama lokasi kantor (e.g., "HQ Jakarta")',
            },
            ip_address: {
                type: Sequelize.STRING(45),
                allowNull: true,
                comment: "IP address kantor untuk validasi ONSITE",
            },
            ip_range_start: {
                type: Sequelize.STRING(45),
                allowNull: true,
                comment: "Range IP awal untuk subnet kantor",
            },
            ip_range_end: {
                type: Sequelize.STRING(45),
                allowNull: true,
                comment: "Range IP akhir untuk subnet kantor",
            },
            latitude: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true,
                comment: "Koordinat kantor untuk validasi radius",
            },
            longitude: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true,
                comment: "Koordinat kantor untuk validasi radius",
            },
            radius_meters: {
                type: Sequelize.INTEGER,
                defaultValue: 100,
                comment: "Radius dalam meter untuk validasi lokasi ONSITE",
            },
            ssid: {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: "WiFi SSID kantor (deprecated - gunakan IP/koordinat)",
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal(
                    "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                ),
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("office_networks");

        // Recreate old schema
        await queryInterface.createTable("office_networks", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            ssid: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal(
                    "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                ),
            },
        });
    },
};
