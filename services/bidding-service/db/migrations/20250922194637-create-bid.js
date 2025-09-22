'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bids', {
      id: {
        allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4
      },
      itemId: { type: Sequelize.UUID, allowNull: false },
      bidderId: { type: Sequelize.UUID, allowNull: false },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bids');
  }
};