"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("attendances", "work_type", {
            type: Sequelize.ENUM("onsite", "offsite"),
            allowNull: true,
            comment:
                "ONSITE: WiFi kantor atau dalam radius. OFFSITE: di luar kantor",
            after: "check_out_longitude",
        });

        await queryInterface.addColumn("attendances", "offsite_reason", {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: "Keterangan wajib untuk OFFSITE attendance",
            after: "work_type",
        });

        await queryInterface.addColumn("attendances", "check_in_photo", {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: "Path foto check-in untuk OFFSITE",
            after: "offsite_reason",
        });

        await queryInterface.addColumn("attendances", "check_out_photo", {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: "Path foto check-out untuk OFFSITE",
            after: "check_in_photo",
        });

        await queryInterface.addColumn("attendances", "check_in_address", {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: "Alamat lokasi check-in",
            after: "check_out_photo",
        });

        await queryInterface.addColumn("attendances", "check_out_address", {
            type: Sequelize.STRING(500),
            allowNull: true,
            comment: "Alamat lokasi check-out",
            after: "check_in_address",
        });

        await queryInterface.addColumn("attendances", "check_in_ip", {
            type: Sequelize.STRING(45),
            allowNull: true,
            comment: "IP address saat check-in (IPv4/IPv6)",
            after: "check_out_address",
        });

        await queryInterface.addColumn("attendances", "check_out_ip", {
            type: Sequelize.STRING(45),
            allowNull: true,
            comment: "IP address saat check-out",
            after: "check_in_ip",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("attendances", "check_out_ip");
        await queryInterface.removeColumn("attendances", "check_in_ip");
        await queryInterface.removeColumn("attendances", "check_out_address");
        await queryInterface.removeColumn("attendances", "check_in_address");
        await queryInterface.removeColumn("attendances", "check_out_photo");
        await queryInterface.removeColumn("attendances", "check_in_photo");
        await queryInterface.removeColumn("attendances", "offsite_reason");
        await queryInterface.removeColumn("attendances", "work_type");
    },
};
