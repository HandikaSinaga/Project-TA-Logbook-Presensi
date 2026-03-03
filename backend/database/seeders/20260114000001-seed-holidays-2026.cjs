"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const holidays2026 = [
            // Tahun Baru
            {
                date: "2026-01-01",
                name: "Tahun Baru Masehi 2026",
                description: "Hari libur nasional perayaan Tahun Baru Masehi",
                type: "national",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Imlek
            {
                date: "2026-02-17",
                name: "Tahun Baru Imlek 2577 Kongzili",
                description:
                    "Perayaan Tahun Baru China/Imlek bagi umat Tionghoa",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Nyepi
            {
                date: "2026-03-19",
                name: "Hari Suci Nyepi Tahun Baru Saka 1948",
                description:
                    "Hari Raya Nyepi bagi umat Hindu, merayakan tahun baru Saka",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Wafat Isa Al Masih
            {
                date: "2026-04-03",
                name: "Wafat Isa Al Masih",
                description: "Peringatan Wafat Yesus Kristus bagi umat Kristen",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Idul Fitri (estimasi, bisa berubah sesuai keputusan pemerintah)
            {
                date: "2026-03-31",
                name: "Hari Raya Idul Fitri 1447 H",
                description:
                    "Hari Raya Idul Fitri (hari pertama) setelah bulan Ramadan",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            {
                date: "2026-04-01",
                name: "Hari Raya Idul Fitri 1447 H (Hari Kedua)",
                description: "Hari kedua perayaan Idul Fitri",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Cuti Bersama Idul Fitri
            {
                date: "2026-03-30",
                name: "Cuti Bersama Idul Fitri",
                description: "Cuti bersama sebelum Idul Fitri",
                type: "national",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            {
                date: "2026-04-02",
                name: "Cuti Bersama Idul Fitri",
                description: "Cuti bersama setelah Idul Fitri",
                type: "national",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Buruh Internasional
            {
                date: "2026-05-01",
                name: "Hari Buruh Internasional",
                description: "Peringatan Hari Buruh Sedunia",
                type: "national",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Kenaikan Yesus Kristus
            {
                date: "2026-05-14",
                name: "Kenaikan Yesus Kristus",
                description:
                    "Peringatan Kenaikan Isa Al Masih bagi umat Kristen",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Waisak
            {
                date: "2026-05-23",
                name: "Hari Raya Waisak 2570 BE",
                description:
                    "Perayaan Hari Raya Waisak bagi umat Buddha memperingati kelahiran, pencerahan, dan wafatnya Buddha Gautama",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Pancasila
            {
                date: "2026-06-01",
                name: "Hari Lahir Pancasila",
                description: "Peringatan Hari Lahir Pancasila",
                type: "national",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Idul Adha (estimasi)
            {
                date: "2026-06-07",
                name: "Hari Raya Idul Adha 1447 H",
                description:
                    "Hari Raya Idul Adha atau Hari Raya Kurban bagi umat Islam",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Tahun Baru Islam (estimasi)
            {
                date: "2026-06-27",
                name: "Tahun Baru Islam 1448 H",
                description: "Tahun Baru Hijriah 1448 H bagi umat Islam",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // HUT RI
            {
                date: "2026-08-17",
                name: "Hari Kemerdekaan Republik Indonesia",
                description:
                    "Peringatan Proklamasi Kemerdekaan Republik Indonesia ke-81",
                type: "national",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Maulid Nabi Muhammad (estimasi)
            {
                date: "2026-09-05",
                name: "Maulid Nabi Muhammad SAW",
                description:
                    "Peringatan Kelahiran Nabi Muhammad SAW bagi umat Islam",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Natal
            {
                date: "2026-12-25",
                name: "Hari Raya Natal",
                description: "Perayaan Hari Natal bagi umat Kristen",
                type: "religious",
                is_national: true,
                is_active: true,
                year: 2026,
            },
            // Cuti Bersama Natal & Tahun Baru (opsional, sesuai kebijakan pemerintah)
            {
                date: "2026-12-24",
                name: "Cuti Bersama Natal",
                description: "Cuti bersama sebelum Natal",
                type: "national",
                is_national: true,
                is_active: true,
                year: 2026,
            },
        ];

        // Add timestamps
        const now = new Date();
        const holidaysWithTimestamps = holidays2026.map((holiday) => ({
            ...holiday,
            created_at: now,
            updated_at: now,
        }));

        await queryInterface.bulkInsert("holidays", holidaysWithTimestamps, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("holidays", { year: 2026 }, {});
    },
};
