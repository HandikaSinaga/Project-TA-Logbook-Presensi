'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Update ENUM untuk status logbook agar support 'not_filled'
        await queryInterface.sequelize.query(`
            ALTER TABLE logbooks MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'not_filled') DEFAULT 'pending'
        `);

        // 2. Tambah kolom is_system_generated untuk menandai record yang dibuat otomatis
        await queryInterface.addColumn('logbooks', 'is_system_generated', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            after: 'status',
            comment: 'True jika record ini dibuat otomatis oleh sistem (not_filled)'
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove is_system_generated column
        await queryInterface.removeColumn('logbooks', 'is_system_generated');

        // Revert ENUM back to original
        await queryInterface.sequelize.query(`
            ALTER TABLE logbooks MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
        `);
    }
};
