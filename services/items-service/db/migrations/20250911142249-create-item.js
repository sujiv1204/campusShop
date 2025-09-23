"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Items", {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
            },
            price: {
                type: Sequelize.DECIMAL(10, 2), // Better for currency
                allowNull: false,
            },
            imageUrl: {
                type: Sequelize.STRING,
            },
            sellerId: {
                type: Sequelize.UUID, // This will link to the User ID from the auth-service
                allowNull: false,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Items");
    },
};
// 'use strict';
// /** @type {import('sequelize-cli').Migration} */
// module.exports = {
//   async up(queryInterface, Sequelize) {
//     await queryInterface.createTable('Items', {
//       id: {
//         allowNull: false,
//         autoIncrement: true,
//         primaryKey: true,
//         type: Sequelize.INTEGER
//       },
//       title: {
//         type: Sequelize.STRING
//       },
//       description: {
//         type: Sequelize.TEXT
//       },
//       price: {
//         type: Sequelize.DECIMAL
//       },
//       imageUrl: {
//         type: Sequelize.STRING
//       },
//       sellerId: {
//         type: Sequelize.UUID
//       },
//       createdAt: {
//         allowNull: false,
//         type: Sequelize.DATE
//       },
//       updatedAt: {
//         allowNull: false,
//         type: Sequelize.DATE
//       }
//     });
//   },
//   async down(queryInterface, Sequelize) {
//     await queryInterface.dropTable('Items');
//   }
// };
