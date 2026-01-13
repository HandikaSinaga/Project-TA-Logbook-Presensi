import db from "../../database/db.js";

const DivisionModel = (DataTypes) => {
    const Division = db.define(
        "divisions",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            supervisor_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            periode: {
                type: DataTypes.STRING(50),
                allowNull: true,
                comment: "Batch/periode divisi (contoh: 2024-01, Q1-2024)",
            },
            is_active_periode: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                comment:
                    "Status aktif dalam periode ini (true=aktif, false=historis)",
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            tableName: "divisions",
        }
    );
    return Division;
};

export default DivisionModel;
