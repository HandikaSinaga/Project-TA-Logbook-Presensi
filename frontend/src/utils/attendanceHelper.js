/**
 * Attendance Helper Utilities
 * Centralized attendance-related functions
 */

/**
 * Get status badge configuration
 * @param {string} status
 * @returns {{bg: string, text: string}}
 */
export const getStatusBadge = (status) => {
    const badges = {
        present: { bg: "success", text: "Hadir" },
        late: { bg: "warning", text: "Terlambat" },
        absent: { bg: "danger", text: "Tidak Hadir" },
        leave: { bg: "info", text: "Izin/Cuti" },
    };
    return badges[status] || { bg: "secondary", text: "Unknown" };
};

/**
 * Get work type badge configuration
 * @param {string} workType
 * @returns {{bg: string, text: string, icon: string}}
 */
export const getWorkTypeBadge = (workType) => {
    const badges = {
        onsite: {
            bg: "primary",
            text: "Onsite",
            icon: "bi-building",
        },
        offsite: {
            bg: "warning",
            text: "Offsite",
            icon: "bi-geo-alt",
        },
    };
    return (
        badges[workType] || {
            bg: "secondary",
            text: "Unknown",
            icon: "bi-question",
        }
    );
};

/**
 * Format work hours duration
 * @param {string} checkInTime - TIME format (HH:MM:SS) or datetime
 * @param {string} checkOutTime - TIME format (HH:MM:SS) or datetime
 * @returns {string}
 */
export const formatWorkHours = (checkInTime, checkOutTime) => {
    if (!checkInTime) return "-";
    if (!checkOutTime) return "Belum checkout";

    // Handle TIME format (HH:MM:SS)
    const parseTime = (timeStr) => {
        if (
            typeof timeStr === "string" &&
            timeStr.match(/^\d{2}:\d{2}(:\d{2})?$/)
        ) {
            const [hours, minutes, seconds = 0] = timeStr
                .split(":")
                .map(Number);
            return hours * 3600 + minutes * 60 + seconds;
        }
        // Handle full datetime
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return 0;
        return date.getTime() / 1000;
    };

    const checkInSeconds = parseTime(checkInTime);
    const checkOutSeconds = parseTime(checkOutTime);

    let diffSeconds = checkOutSeconds - checkInSeconds;

    // Handle midnight crossover (force checkout at 00:00)
    // If checkout is earlier than checkin (negative), assume next day
    if (diffSeconds < 0) {
        diffSeconds += 24 * 3600; // Add 24 hours
    }

    const diffHours = Math.floor(diffSeconds / 3600);
    const diffMinutes = Math.floor((diffSeconds % 3600) / 60);

    if (diffHours === 0) {
        return `${diffMinutes} menit`;
    }

    return `${diffHours} jam ${diffMinutes} menit`;
};

/**
 * Calculate total work hours in hours (decimal)
 * @param {string} checkInTime - TIME format (HH:MM:SS) or datetime
 * @param {string} checkOutTime - TIME format (HH:MM:SS) or datetime
 * @returns {number}
 */
export const calculateWorkHours = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return 0;

    // Handle TIME format (HH:MM:SS)
    const parseTime = (timeStr) => {
        if (
            typeof timeStr === "string" &&
            timeStr.match(/^\d{2}:\d{2}(:\d{2})?$/)
        ) {
            const [hours, minutes, seconds = 0] = timeStr
                .split(":")
                .map(Number);
            return hours * 3600 + minutes * 60 + seconds;
        }
        // Handle full datetime
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return 0;
        return date.getTime() / 1000;
    };

    const checkInSeconds = parseTime(checkInTime);
    const checkOutSeconds = parseTime(checkOutTime);

    let diffSeconds = checkOutSeconds - checkInSeconds;

    // Handle midnight crossover (force checkout at 00:00)
    if (diffSeconds < 0) {
        diffSeconds += 24 * 3600; // Add 24 hours
    }

    return diffSeconds / 3600; // Convert to hours
};

/**
 * Check if attendance is late
 * @param {string} checkInTime
 * @param {string} scheduleTime - Expected check-in time (e.g., "08:00")
 * @returns {boolean}
 */
export const isLate = (checkInTime, scheduleTime = "08:00") => {
    if (!checkInTime) return false;

    const checkIn = new Date(checkInTime);
    const [scheduleHour, scheduleMinute] = scheduleTime.split(":").map(Number);

    const scheduledTime = new Date(checkIn);
    scheduledTime.setHours(scheduleHour, scheduleMinute, 0, 0);

    return checkIn > scheduledTime;
};

/**
 * Get late duration in minutes
 * @param {string} checkInTime
 * @param {string} scheduleTime
 * @returns {number}
 */
export const getLateDuration = (checkInTime, scheduleTime = "08:00") => {
    if (!isLate(checkInTime, scheduleTime)) return 0;

    const checkIn = new Date(checkInTime);
    const [scheduleHour, scheduleMinute] = scheduleTime.split(":").map(Number);

    const scheduledTime = new Date(checkIn);
    scheduledTime.setHours(scheduleHour, scheduleMinute, 0, 0);

    const diffMs = checkIn - scheduledTime;
    return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
};

/**
 * Format late duration for display
 * @param {number} minutes
 * @returns {string}
 */
export const formatLateDuration = (minutes) => {
    if (minutes === 0) return "Tepat waktu";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
        return `Terlambat ${mins} menit`;
    }

    return `Terlambat ${hours} jam ${mins} menit`;
};
