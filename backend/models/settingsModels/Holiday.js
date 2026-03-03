import { DataTypes } from "sequelize";
import db from "../../database/db.js";

const Holiday = db.define(
    "Holiday",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            unique: true,
            comment: "Tanggal libur (YYYY-MM-DD)",
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: "Nama hari libur",
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Deskripsi detail tentang hari libur",
        },
        type: {
            type: DataTypes.ENUM(
                "national",
                "religious",
                "company",
                "regional",
            ),
            allowNull: false,
            defaultValue: "company",
            comment:
                "Tipe libur: national (libur nasional), religious (keagamaan), company (perusahaan), regional (daerah)",
        },
        is_national: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment:
                "Apakah ini hari libur nasional resmi dari kalender Indonesia",
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: "Status aktif libur (bisa dinonaktifkan tanpa hapus)",
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "Tahun untuk filtering dan indexing",
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "users",
                key: "id",
            },
        },
    },
    {
        tableName: "holidays",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ["date"] },
            { fields: ["year"] },
            { fields: ["is_national"] },
            { fields: ["is_active"] },
            { fields: ["type"] },
        ],
    },
);

// Static helper methods
Holiday.isHolidayDate = async function (date) {
    const holiday = await this.findOne({
        where: {
            date: date,
            is_active: true,
        },
        raw: true,
    });
    return holiday !== null;
};

Holiday.getHolidayByDate = async function (date) {
    return await this.findOne({
        where: {
            date: date,
            is_active: true,
        },
        raw: true,
    });
};

Holiday.getHolidaysInRange = async function (startDate, endDate) {
    const { Op } = await import("sequelize");
    return await this.findAll({
        where: {
            date: {
                [Op.between]: [startDate, endDate],
            },
            is_active: true,
        },
        order: [["date", "ASC"]],
        raw: true,
    });
};

// Note: Association with User will be defined in models/index.js to avoid circular dependency

export default Holiday;
