"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "office_networks",
            [
                {
                    name: "Kantor Pusat Jakarta",
                    ip_address: "192.168.1.1",
                    ip_range_start: "192.168.1.1",
                    ip_range_end: "192.168.1.254",
                    latitude: -6.2,
                    longitude: 106.816666,
                    radius_meters: 100,
                    ssid: "Office-WiFi-Main",
                    description:
                        "Lokasi kantor pusat di Jakarta dengan validasi IP dan GPS",
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    name: "Branch Office Bandung",
                    ip_address: "192.168.2.1",
                    ip_range_start: "192.168.2.1",
                    ip_range_end: "192.168.2.254",
                    latitude: -6.914744,
                    longitude: 107.60981,
                    radius_meters: 150,
                    ssid: "Office-WiFi-Bandung",
                    description: "Kantor cabang Bandung",
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("office_networks", null, {});
    },
};
