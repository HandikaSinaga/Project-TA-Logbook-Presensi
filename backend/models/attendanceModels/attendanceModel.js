import db from "../../database/db.js";

const AttendanceModel = (DataTypes) => {
    const Attendance = db.define(
        "attendances",
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
            check_in_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            check_out_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            check_in_latitude: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: true,
            },
            check_in_longitude: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: true,
            },
            check_out_latitude: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: true,
            },
            check_out_longitude: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: true,
            },
            work_type: {
                type: DataTypes.ENUM("onsite", "offsite"),
                allowNull: true,
                comment:
                    "ONSITE: WiFi kantor atau dalam radius. OFFSITE: di luar kantor",
            },
            offsite_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: "Keterangan wajib untuk OFFSITE check-in",
            },
            checkout_offsite_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment:
                    "Keterangan OFFSITE khusus untuk check-out (terpisah dari check-in)",
            },
            check_in_photo: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Path foto check-in untuk OFFSITE",
            },
            check_out_photo: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Path foto check-out untuk OFFSITE",
            },
            check_in_address: {
                type: DataTypes.STRING(500),
                allowNull: true,
                comment: "Alamat lokasi check-in",
            },
            check_out_address: {
                type: DataTypes.STRING(500),
                allowNull: true,
                comment: "Alamat lokasi check-out",
            },
            check_in_ip: {
                type: DataTypes.STRING(45),
                allowNull: true,
                comment: "IP address saat check-in (IPv4/IPv6)",
            },
            check_out_ip: {
                type: DataTypes.STRING(45),
                allowNull: true,
                comment: "IP address saat check-out",
            },
            status: {
                type: DataTypes.ENUM("present", "late", "early", "absent"),
                defaultValue: "present",
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            approved_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "ID supervisor yang menyetujui",
            },
            approved_at: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: "Waktu persetujuan",
            },
            rejected_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "ID supervisor yang menolak",
            },
            rejected_at: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: "Waktu penolakan",
            },
            rejection_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: "Alasan penolakan",
            },
            approval_status: {
                type: DataTypes.ENUM("pending", "approved", "rejected"),
                defaultValue: "pending",
                comment: "Status approval oleh supervisor",
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            tableName: "attendances",
        }
    );
    return Attendance;
};

export default AttendanceModel;
