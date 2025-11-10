"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Profiles", "emailPreferences", {
            type: Sequelize.JSON,
            allowNull: false,
            defaultValue: {
                bidReceived: true,
                itemSold: true,
                bidWon: true,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("Profiles", "emailPreferences");
    },
};
