"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Step 1: Fix any NULL type values (set default to keperluan)
        await queryInterface.sequelize.query(`
            UPDATE leaves 
            SET type = 'keperluan' 
            WHERE type IS NULL
        `);

        // Step 2: Add new column with izin terminology
        await queryInterface.addColumn("leaves", "type_new", {
            type: Sequelize.ENUM("izin_sakit", "izin_keperluan"),
            allowNull: true,
            after: "user_id",
        });

        // Step 3: Migrate data from old to new
        await queryInterface.sequelize.query(`
            UPDATE leaves 
            SET type_new = CASE 
                WHEN type = 'sakit' THEN 'izin_sakit'
                WHEN type = 'keperluan' THEN 'izin_keperluan'
                ELSE 'izin_keperluan'
            END
        `);

        // Step 4: Remove old column
        await queryInterface.removeColumn("leaves", "type");

        // Step 5: Rename new column to type
        await queryInterface.renameColumn("leaves", "type_new", "type");

        // Step 6: Make it NOT NULL (since we migrated all data)
        await queryInterface.changeColumn("leaves", "type", {
            type: Sequelize.ENUM("izin_sakit", "izin_keperluan"),
            allowNull: false,
        });
    },

    async down(queryInterface, Sequelize) {
        // Step 1: Add old column
        await queryInterface.addColumn("leaves", "type_old", {
            type: Sequelize.ENUM("sakit", "keperluan"),
            allowNull: true,
            after: "user_id",
        });

        // Step 2: Migrate data back
        await queryInterface.sequelize.query(`
            UPDATE leaves 
            SET type_old = CASE 
                WHEN type = 'izin_sakit' THEN 'sakit'
                WHEN type = 'izin_keperluan' THEN 'keperluan'
            END
        `);

        // Step 3: Remove new column
        await queryInterface.removeColumn("leaves", "type");

        // Step 4: Rename old column to type
        await queryInterface.renameColumn("leaves", "type_old", "type");

        // Step 5: Make it NOT NULL
        await queryInterface.changeColumn("leaves", "type", {
            type: Sequelize.ENUM("sakit", "keperluan"),
            allowNull: false,
        });
    },
};
