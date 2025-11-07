"use strict";
module.exports = {
    async up(queryInterface, Sequelize) {
        // Change this line to use the plural 'EventOutboxes'
        await queryInterface.createTable("EventOutboxes", {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
            },
            topic: { type: Sequelize.STRING, allowNull: false },
            payload: { type: Sequelize.JSON, allowNull: false },
            status: {
                type: Sequelize.STRING,
                defaultValue: "pending",
                allowNull: false,
            },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE },
        });
    },
    async down(queryInterface, Sequelize) {
        // Also update the down function
        await queryInterface.dropTable("EventOutboxes");
    },
};
