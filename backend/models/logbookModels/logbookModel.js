import db from "../../database/db.js";

const LogbookModel = (DataTypes) => {
    const Logbook = db.define(
        "logbooks",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            time: {
                type: DataTypes.TIME,
                allowNull: false,
            },
            activity: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Nama kegiatan/aktivitas yang dilakukan",
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            location: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Lokasi kegiatan",
            },
            attachments: {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
                comment: "Array of attachment URLs",
            },
            status: {
                type: DataTypes.ENUM("pending", "approved", "rejected"),
                defaultValue: "pending",
            },
            reviewed_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            review_notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            reviewed_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            tableName: "logbooks",
        }
    );
    return Logbook;
};

export default LogbookModel;
