"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Step 1: Change type to VARCHAR to allow data migration
        await queryInterface.sequelize.query(`
      ALTER TABLE leaves 
      MODIFY COLUMN type VARCHAR(50) NOT NULL;
    `);

        // Step 2: Update existing 'keperluan' to 'izin'
        await queryInterface.sequelize.query(`
      UPDATE leaves 
      SET type = 'izin' 
      WHERE type = 'keperluan';
    `);

        // Step 3: Apply new ENUM with all leave types
        await queryInterface.sequelize.query(`
      ALTER TABLE leaves 
      MODIFY COLUMN type ENUM('sakit', 'izin', 'cuti_tahunan', 'cuti_bersama', 'keperluan_keluarga', 'lainnya') 
      NOT NULL;
    `);
    },

    down: async (queryInterface, Sequelize) => {
        // Revert back to original ENUM values
        await queryInterface.sequelize.query(`
      ALTER TABLE leaves 
      MODIFY COLUMN type ENUM('sakit', 'keperluan') 
      NOT NULL;
    `);
    },
};
