"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class EventOutbox extends Model {}
    EventOutbox.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            topic: { type: DataTypes.STRING, allowNull: false },
            payload: { type: DataTypes.JSON, allowNull: false },
            status: {
                type: DataTypes.STRING,
                defaultValue: "pending",
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "EventOutbox",
            tableName: "EventOutboxes", // Ensure it matches the migration
        }
    );
    return EventOutbox;
};
