"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("holidays", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                unique: true,
                comment: "Tanggal libur (YYYY-MM-DD)",
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: "Nama hari libur",
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: "Deskripsi detail tentang hari libur",
            },
            type: {
                type: Sequelize.ENUM(
                    "national",
                    "religious",
                    "company",
                    "regional",
                ),
                allowNull: false,
                defaultValue: "company",
                comment:
                    "Tipe libur: national (libur nasional), religious (keagamaan), company (perusahaan), regional (daerah)",
            },
            is_national: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment:
                    "Apakah ini hari libur nasional resmi dari kalender Indonesia",
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: "Status aktif libur (bisa dinonaktifkan tanpa hapus)",
            },
            year: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: "Tahun untuk filtering dan indexing",
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
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
                    "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
                ),
            },
        });

        // Add indexes for better performance
        await queryInterface.addIndex("holidays", ["date"]);
        await queryInterface.addIndex("holidays", ["year"]);
        await queryInterface.addIndex("holidays", ["is_national"]);
        await queryInterface.addIndex("holidays", ["is_active"]);
        await queryInterface.addIndex("holidays", ["type"]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("holidays");
    },
};
