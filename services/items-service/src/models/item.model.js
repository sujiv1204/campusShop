"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Item extends Model {}
    Item.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: DataTypes.TEXT,
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            imageUrl: DataTypes.STRING,
            sellerId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "Item",
        }
    );
    return Item;
};
