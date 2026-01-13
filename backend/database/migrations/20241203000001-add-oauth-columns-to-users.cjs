"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("users", "oauth_provider", {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: "remember_token",
        });

        await queryInterface.addColumn("users", "oauth_id", {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: "oauth_provider",
        });

        // Add index for oauth lookups
        await queryInterface.addIndex("users", ["oauth_provider", "oauth_id"], {
            name: "idx_users_oauth",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex("users", "idx_users_oauth");
        await queryInterface.removeColumn("users", "oauth_id");
        await queryInterface.removeColumn("users", "oauth_provider");
    },
};
