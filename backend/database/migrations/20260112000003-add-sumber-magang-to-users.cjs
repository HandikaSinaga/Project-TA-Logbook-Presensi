"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add sumber_magang column with ENUM
        await queryInterface.addColumn("users", "sumber_magang", {
            type: Sequelize.ENUM(
                "pemerintah",
                "swasta",
                "internal",
                "kampus",
                "umum"
            ),
            allowNull: true,
            comment:
                "Sumber magang/asal user (pemerintah, swasta, internal, kampus, umum)",
            after: "is_active_periode",
        });

        // Add index for filtering by sumber_magang
        await queryInterface.addIndex("users", ["sumber_magang"], {
            name: "idx_users_sumber_magang",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex("users", "idx_users_sumber_magang");
        await queryInterface.removeColumn("users", "sumber_magang");
    },
};
