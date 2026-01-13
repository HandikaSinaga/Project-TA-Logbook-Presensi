import db from "../../database/db.js";

const LeaveModel = (DataTypes) => {
    const Leave = db.define(
        "leaves",
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
            type: {
                type: DataTypes.ENUM("izin_sakit", "izin_keperluan"),
                allowNull: false,
                comment:
                    "Jenis izin: izin_sakit (sakit), izin_keperluan (keperluan lainnya)",
            },
            start_date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            end_date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            duration: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
                comment: "Jumlah hari izin (auto-calculated)",
            },
            total_days: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "Alias untuk duration (backward compatibility)",
            },
            reason: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            attachment: {
                type: DataTypes.STRING(255),
                allowNull: true,
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
            tableName: "leaves",
        }
    );
    return Leave;
};

export default LeaveModel;
