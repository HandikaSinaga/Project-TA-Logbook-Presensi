/**
 * Geolocation Helper Utilities
 * Centralized geolocation functions for consistent location handling
 */

/**
 * Get current GPS position
 * @returns {Promise<GeolocationPosition>}
 */
export const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation tidak didukung oleh browser Anda"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => {
                let errorMessage = "Gagal mendapatkan lokasi";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage =
                            "Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Informasi lokasi tidak tersedia";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Waktu permintaan lokasi habis";
                        break;
                }
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
};

/**
 * Get formatted location object with coordinates
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const getFormattedLocation = async () => {
    try {
        const position = await getCurrentPosition();
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const ╧å1 = (lat1 * Math.PI) / 180;
    const ╧å2 = (lat2 * Math.PI) / 180;
    const ╬ö╧å = ((lat2 - lat1) * Math.PI) / 180;
    const ╬ö╬╗ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(╬ö╧å / 2) * Math.sin(╬ö╧å / 2) +
        Math.cos(╧å1) * Math.cos(╧å2) * Math.sin(╬ö╬╗ / 2) * Math.sin(╬ö╬╗ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

/**
 * Format coordinates for display
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string} Formatted coordinates
 */
export const formatCoordinates = (latitude, longitude) => {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

/**
 * Check if user is within allowed radius
 * @param {number} userLat - User latitude
 * @param {number} userLon - User longitude
 * @param {number} officeLat - Office latitude
 * @param {number} officeLon - Office longitude
 * @param {number} allowedRadius - Allowed radius in meters
 * @returns {boolean}
 */
export const isWithinRadius = (
    userLat,
    userLon,
    officeLat,
    officeLon,
    allowedRadius
) => {
    const distance = calculateDistance(userLat, userLon, officeLat, officeLon);
    return distance <= allowedRadius;
};
