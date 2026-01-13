/**
 * Attendance Location Helper
 * Utilities untuk validasi ONSITE/OFFSITE berdasarkan IP dan koordinat GPS
 */

import models from "../models/index.js";
const { OfficeNetwork } = models;

class LocationHelper {
    /**
     * Hitung jarak antara 2 koordinat (Haversine formula)
     * @param {number} lat1 - Latitude point 1
     * @param {number} lon1 - Longitude point 1
     * @param {number} lat2 - Latitude point 2
     * @param {number} lon2 - Longitude point 2
     * @returns {number} Jarak dalam meter
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Check apakah IP address dalam range
     * @param {string} ip - IP address to check
     * @param {string} rangeStart - Range start IP
     * @param {string} rangeEnd - Range end IP
     * @returns {boolean}
     */
    static isIpInRange(ip, rangeStart, rangeEnd) {
        if (!ip || !rangeStart || !rangeEnd) return false;

        const ipNum = this.ipToNumber(ip);
        const startNum = this.ipToNumber(rangeStart);
        const endNum = this.ipToNumber(rangeEnd);

        return ipNum >= startNum && ipNum <= endNum;
    }

    /**
     * Convert IP address to number untuk comparison
     * @param {string} ip
     * @returns {number}
     */
    static ipToNumber(ip) {
        return ip
            .split(".")
            .reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
    }

    /**
     * Validasi apakah attendance ONSITE atau OFFSITE
     * LOGIC:
     * 1. Priority 1: Cek WiFi kantor (IP Address) → ONSITE
     * 2. Priority 2: Jika bukan WiFi kantor, cek koordinat GPS dalam radius → ONSITE
     * 3. Jika keduanya tidak valid → OFFSITE
     *
     * @param {string} userIp - IP address user
     * @param {number} latitude - User latitude
     * @param {number} longitude - User longitude
     * @returns {Promise<{isOnsite: boolean, reason: string, office: object|null, distance: number|null}>}
     */
    static async validateAttendanceLocation(userIp, latitude, longitude) {
        try {
            const activeOffices = await OfficeNetwork.findAll({
                where: { is_active: true },
            });

            if (!activeOffices || activeOffices.length === 0) {
                return {
                    isOnsite: false,
                    reason: "No active office locations configured",
                    office: null,
                    distance: null,
                };
            }

            // ========== PRIORITY 1: Check WiFi Kantor (IP Address) ==========
            if (userIp) {
                for (const office of activeOffices) {
                    // Direct IP match
                    if (office.ip_address && userIp === office.ip_address) {
                        console.log(
                            `[ONSITE] Matched office IP: ${office.name} (${userIp})`
                        );
                        return {
                            isOnsite: true,
                            reason: `WiFi Kantor: ${office.name}`,
                            office: office,
                            distance: null,
                            detectionMethod: "ip_direct",
                        };
                    }

                    // IP Range match
                    if (
                        office.ip_range_start &&
                        office.ip_range_end &&
                        this.isIpInRange(
                            userIp,
                            office.ip_range_start,
                            office.ip_range_end
                        )
                    ) {
                        console.log(
                            `[ONSITE] IP in range: ${office.name} (${userIp})`
                        );
                        return {
                            isOnsite: true,
                            reason: `WiFi Kantor: ${office.name}`,
                            office: office,
                            distance: null,
                            detectionMethod: "ip_range",
                        };
                    }
                }
            }

            // ========== PRIORITY 2: Check GPS Coordinates (Radius kantor) ==========
            // Hanya cek GPS jika IP BUKAN dari kantor
            if (latitude && longitude) {
                for (const office of activeOffices) {
                    if (
                        office.latitude &&
                        office.longitude &&
                        office.radius_meters
                    ) {
                        const distance = this.calculateDistance(
                            latitude,
                            longitude,
                            parseFloat(office.latitude),
                            parseFloat(office.longitude)
                        );

                        if (distance <= office.radius_meters) {
                            console.log(
                                `[ONSITE] Within radius: ${
                                    office.name
                                } (${Math.round(distance)}m)`
                            );
                            return {
                                isOnsite: true,
                                reason: `Lokasi dalam radius ${
                                    office.name
                                } (${Math.round(distance)}m)`,
                                office: office,
                                distance: Math.round(distance),
                                detectionMethod: "gps_radius",
                            };
                        }
                    }
                }
            }

            // ========== OFFSITE: Tidak match IP dan tidak dalam radius ==========
            console.log(
                `[OFFSITE] IP: ${userIp || "N/A"}, GPS: ${
                    latitude && longitude ? "provided" : "N/A"
                }`
            );
            return {
                isOnsite: false,
                reason: "Bukan WiFi kantor dan lokasi diluar radius kantor",
                office: null,
                distance: null,
                detectionMethod: "offsite",
            };
        } catch (error) {
            console.error(
                "[LocationHelper.validateAttendanceLocation] Error:",
                error.message
            );
            return {
                isOnsite: false,
                reason: "Validation error",
                office: null,
                distance: null,
                detectionMethod: "error",
            };
        }
    }

    /**
     * Get client IP dari request (handle proxy/forwarded IPs)
     * @param {object} req - Express request object
     * @returns {string|null}
     */
    static getClientIp(req) {
        return (
            req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
            req.headers["x-real-ip"] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            null
        );
    }
}

export default LocationHelper;
