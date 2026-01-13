import db from "../../database/db.js";

const OfficeNetworkModel = (DataTypes) => {
    const OfficeNetwork = db.define(
        "OfficeNetwork",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                comment: 'Nama lokasi kantor (e.g., "HQ Jakarta")',
            },
            ip_address: {
                type: DataTypes.STRING(45),
                allowNull: true,
                comment: "IP address kantor untuk validasi ONSITE",
            },
            ip_range_start: {
                type: DataTypes.STRING(45),
                allowNull: true,
                comment: "Range IP awal untuk subnet kantor",
            },
            ip_range_end: {
                type: DataTypes.STRING(45),
                allowNull: true,
                comment: "Range IP akhir untuk subnet kantor",
            },
            latitude: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: true,
                comment: "Koordinat kantor untuk validasi radius",
            },
            longitude: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: true,
                comment: "Koordinat kantor untuk validasi radius",
            },
            radius_meters: {
                type: DataTypes.INTEGER,
                defaultValue: 100,
                comment: "Radius dalam meter untuk validasi lokasi ONSITE",
            },
            ssid: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "WiFi SSID kantor (deprecated - gunakan IP/koordinat)",
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            tableName: "office_networks",
            timestamps: true,
            underscored: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    return OfficeNetwork;
};

export default OfficeNetworkModel;
