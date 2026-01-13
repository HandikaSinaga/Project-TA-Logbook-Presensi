"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            "attendances",
            "checkout_offsite_reason",
            {
                type: Sequelize.TEXT,
                allowNull: true,
                comment:
                    "Keterangan OFFSITE khusus untuk check-out (terpisah dari check-in)",
                after: "offsite_reason",
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            "attendances",
            "checkout_offsite_reason"
        );
    },
};
