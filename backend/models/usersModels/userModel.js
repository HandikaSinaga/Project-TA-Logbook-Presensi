import db from "../../database/db.js";

const UserModel = (DataTypes) => {
    const User = db.define(
        "users",
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
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM("user", "supervisor", "admin"),
                defaultValue: "user",
            },
            division_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            periode: {
                type: DataTypes.STRING(50),
                allowNull: true,
                comment: "Batch/angkatan user (contoh: 2024-01, Angkatan 15)",
            },
            is_active_periode: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                comment:
                    "Status aktif dalam periode ini (true=aktif, false=historis)",
            },
            sumber_magang: {
                type: DataTypes.ENUM(
                    "pemerintah",
                    "swasta",
                    "internal",
                    "kampus",
                    "umum"
                ),
                allowNull: true,
                comment:
                    "Sumber magang/asal user (pemerintah, swasta, internal, kampus, umum)",
            },
            supervisor_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            avatar: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            phone: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            nip: {
                type: DataTypes.STRING(50),
                allowNull: true,
                comment: "Nomor Induk Pegawai/Peserta",
            },
            linkedin: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "LinkedIn profile URL",
            },
            instagram: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Instagram username or URL",
            },
            telegram: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Telegram username or URL",
            },
            github: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "GitHub profile URL",
            },
            twitter: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Twitter/X username or URL",
            },
            facebook: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Facebook profile URL",
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: "User biography/description",
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            email_verified_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            remember_token: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
        },
        {
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            tableName: "users",
        }
    );
    return User;
};

export default UserModel;
