"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class ProcessedEvent extends Model {}
    ProcessedEvent.init(
        {
            eventId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "ProcessedEvent",
            // Make sure the table name matches the migration exactly
            tableName: "ProcessedEvents",
        }
    );
    return ProcessedEvent;
};
