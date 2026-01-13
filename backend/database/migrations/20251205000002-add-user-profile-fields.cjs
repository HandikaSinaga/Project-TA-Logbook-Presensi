"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add NIP column
        await queryInterface.addColumn("users", "nip", {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: "email",
        });

        // Add position column
        await queryInterface.addColumn("users", "position", {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: "phone",
        });

        // Add social media columns
        await queryInterface.addColumn("users", "linkedin_url", {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: "address",
        });

        await queryInterface.addColumn("users", "github_url", {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: "linkedin_url",
        });

        await queryInterface.addColumn("users", "instagram_url", {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: "github_url",
        });

        await queryInterface.addColumn("users", "telegram_url", {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: "instagram_url",
        });

        await queryInterface.addColumn("users", "other_url", {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: "telegram_url",
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("users", "nip");
        await queryInterface.removeColumn("users", "position");
        await queryInterface.removeColumn("users", "linkedin_url");
        await queryInterface.removeColumn("users", "github_url");
        await queryInterface.removeColumn("users", "instagram_url");
        await queryInterface.removeColumn("users", "telegram_url");
        await queryInterface.removeColumn("users", "other_url");
    },
};
