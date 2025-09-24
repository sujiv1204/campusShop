"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Profile extends Model {}
    Profile.init(
        {
            userId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
            },
            displayName: { type: DataTypes.STRING, allowNull: false },
            phoneNumber: DataTypes.STRING,
        },
        { sequelize, modelName: "Profile" }
    );
    return Profile;
};
