import models from "../models/index.js";

const { OfficeNetwork } = models;

class OfficeNetworkController {
    // Get all office networks
    async getAll(req, res) {
        try {
            const networks = await OfficeNetwork.findAll({
                order: [
                    ["is_active", "DESC"],
                    ["ssid", "ASC"],
                ],
            });

            res.json({
                success: true,
                data: networks,
            });
        } catch (error) {
            console.error("Get office networks error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get office networks",
            });
        }
    }

    // Create new office network
    async create(req, res) {
        try {
            const {
                name,
                description,
                ip_address,
                ip_range_start,
                ip_range_end,
                latitude,
                longitude,
                radius_meters,
                is_active,
            } = req.body;

            // Validate required fields
            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Nama kantor wajib diisi",
                });
            }

            // Validate at least one detection method
            const hasIP =
                ip_address ||
                (ip_range_start && ip_range_end);
            const hasGPS = latitude && longitude;

            if (!hasIP && !hasGPS) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Minimal harus mengisi IP Address ATAU Koordinat GPS",
                });
            }

            // Check if name already exists
            const existing = await OfficeNetwork.findOne({
                where: { name: name.trim() },
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "Nama kantor sudah digunakan",
                });
            }

            const network = await OfficeNetwork.create({
                name: name.trim(),
                description: description ? description.trim() : null,
                ip_address: ip_address ? ip_address.trim() : null,
                ip_range_start: ip_range_start ? ip_range_start.trim() : null,
                ip_range_end: ip_range_end ? ip_range_end.trim() : null,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                radius_meters: radius_meters ? parseInt(radius_meters) : 100,
                is_active: is_active !== undefined ? is_active : true,
            });

            res.status(201).json({
                success: true,
                message: "Lokasi kantor berhasil ditambahkan",
                data: network,
            });
        } catch (error) {
            console.error("Create office network error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal menambahkan lokasi kantor",
                error: error.message,
            });
        }
    }

    // Update office network
    async update(req, res) {
        try {
            const { id } = req.params;
            const {
                name,
                description,
                ip_address,
                ip_range_start,
                ip_range_end,
                latitude,
                longitude,
                radius_meters,
                is_active,
            } = req.body;

            const network = await OfficeNetwork.findByPk(id);

            if (!network) {
                return res.status(404).json({
                    success: false,
                    message: "Lokasi kantor tidak ditemukan",
                });
            }

            // Validate name if provided
            if (name && name.trim()) {
                // Check uniqueness if name changed
                if (name.trim() !== network.name) {
                    const existing = await OfficeNetwork.findOne({
                        where: { name: name.trim() },
                    });

                    if (existing) {
                        return res.status(400).json({
                            success: false,
                            message: "Nama kantor sudah digunakan",
                        });
                    }
                }
            }

            await network.update({
                name: name ? name.trim() : network.name,
                description:
                    description !== undefined
                        ? description?.trim() || null
                        : network.description,
                ip_address: ip_address !== undefined ? ip_address?.trim() || null : network.ip_address,
                ip_range_start:
                    ip_range_start !== undefined
                        ? ip_range_start?.trim() || null
                        : network.ip_range_start,
                ip_range_end:
                    ip_range_end !== undefined
                        ? ip_range_end?.trim() || null
                        : network.ip_range_end,
                latitude:
                    latitude !== undefined
                        ? latitude ? parseFloat(latitude) : null
                        : network.latitude,
                longitude:
                    longitude !== undefined
                        ? longitude ? parseFloat(longitude) : null
                        : network.longitude,
                radius_meters:
                    radius_meters !== undefined
                        ? parseInt(radius_meters) || 100
                        : network.radius_meters,
                is_active:
                    is_active !== undefined ? is_active : network.is_active,
            });

            res.json({
                success: true,
                message: "Lokasi kantor berhasil diupdate",
                data: network,
            });
        } catch (error) {
            console.error("Update office network error:", error);
            res.status(500).json({
                success: false,
                message: "Gagal update lokasi kantor",
                error: error.message,
            });
        }
    }

    // Delete office network
    async delete(req, res) {
        try {
            const { id } = req.params;

            const network = await OfficeNetwork.findByPk(id);

            if (!network) {
                return res.status(404).json({
                    success: false,
                    message: "Office network not found",
                });
            }

            await network.destroy();

            res.json({
                success: true,
                message: "Office network deleted successfully",
            });
        } catch (error) {
            console.error("Delete office network error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete office network",
            });
        }
    }

    // Get active networks (for attendance validation)
    async getActive(req, res) {
        try {
            const networks = await OfficeNetwork.findAll({
                where: { is_active: true },
                attributes: ["id", "ssid"],
                order: [["ssid", "ASC"]],
            });

            res.json({
                success: true,
                data: networks,
            });
        } catch (error) {
            console.error("Get active networks error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get active networks",
            });
        }
    }
}

export default new OfficeNetworkController();
