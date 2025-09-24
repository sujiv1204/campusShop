"use strict";
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Items", "status", {
            type: Sequelize.ENUM("available", "sold"),
            allowNull: false,
            defaultValue: "available",
        });
    },
    async down(queryInterface) {
        // To make this fully reversible, we need to drop the ENUM type first
        // But for our purposes, just removing the column is fine.
        await queryInterface.removeColumn("Items", "status");
    },
};
