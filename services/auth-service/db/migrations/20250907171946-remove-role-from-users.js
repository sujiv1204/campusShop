"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // First, get a description of the 'Users' table
        const tableInfo = await queryInterface.describeTable("Users");

        // Check if the 'role' column exists in the table description
        if (tableInfo.role) {
            // If the column exists, then remove it.
            console.log('Found "role" column in Users table, removing it.');
            await queryInterface.removeColumn("Users", "role");
        } else {
            // If the column does not exist, do nothing and log a message.
            console.log('Skipping migration: "role" column not found.');
        }
    },

    async down(queryInterface, Sequelize) {
        // The 'down' function remains the same.
        // It will add the column back if you ever need to revert.
        const tableInfo = await queryInterface.describeTable("Users");
        if (!tableInfo.role) {
            await queryInterface.addColumn("Users", "role", {
                type: Sequelize.ENUM("buyer", "seller"),
                allowNull: true,
            });
        }
    },
};
