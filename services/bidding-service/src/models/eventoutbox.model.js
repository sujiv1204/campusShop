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
            topic: DataTypes.STRING,
            payload: DataTypes.JSON,
            status: DataTypes.STRING,
        },
        { sequelize, modelName: "EventOutbox" }
    );
    return EventOutbox;
};
