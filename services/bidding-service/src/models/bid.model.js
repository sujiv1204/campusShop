"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Bid extends Model {}
    Bid.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            itemId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            bidderId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "Bid",
        }
    );
    return Bid;
};
