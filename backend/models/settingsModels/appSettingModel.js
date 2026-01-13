import db from "../../database/db.js";

const AppSettingModel = (DataTypes) => {
    const AppSetting = db.define(
        "app_settings",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            key: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            value: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            type: {
                type: DataTypes.STRING,
                defaultValue: "string",
            },
            description: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            tableName: "app_settings",
        }
    );
    return AppSetting;
};

export default AppSettingModel;
