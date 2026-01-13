"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("logbooks", "activity", {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: "time",
            comment: "Nama kegiatan/aktivitas yang dilakukan",
        });

        // Set default value untuk existing records
        await queryInterface.sequelize.query(
            `UPDATE logbooks SET activity = 'Kegiatan Harian' WHERE activity IS NULL`
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("logbooks", "activity");
    },
};
