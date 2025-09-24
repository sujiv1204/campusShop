"use strict";
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Profiles", {
            userId: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
            },
            displayName: { type: Sequelize.STRING, allowNull: false },
            phoneNumber: { type: Sequelize.STRING, allowNull: true },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Profiles");
    },
};
