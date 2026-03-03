/**
 * Frontend Date Helper - Timezone-aware date utilities for Jakarta/WIB
 * Synchronized with backend date validation logic
 */

import moment from 'moment-timezone';

// Set default timezone to Jakarta
moment.tz.setDefault('Asia/Jakarta');

/**
 * Get current date in Jakarta timezone
 * @returns {Date} Current date in Jakarta
 */
export const getJakartaDate = () => {
    return moment.tz('Asia/Jakarta').toDate();
};

/**
 * Get today's date at 00:00:00 in Jakarta timezone
 * @returns {Date} Today at midnight
 */
export const getTodayJakarta = () => {
    return moment.tz('Asia/Jakarta').startOf('day').toDate();
};

/**
 * Check if a date is in the future (after today)
 * @param {string|Date} dateInput - Date to check (YYYY-MM-DD string or Date object)
 * @returns {boolean} True if date is after today
 */
export const isFutureDate = (dateInput) => {
    const today = moment.tz('Asia/Jakarta').startOf('day');
    const checkDate = moment.tz(dateInput, 'Asia/Jakarta').startOf('day');
    
    return checkDate.isAfter(today);
};

/**
 * Check if a date is today or in the past
 * @param {string|Date} dateInput - Date to check (YYYY-MM-DD string or Date object)
 * @returns {boolean} True if date is today or before today
 */
export const isPastOrToday = (dateInput) => {
    return !isFutureDate(dateInput);
};

/**
 * Check if a date is today
 * @param {string|Date} dateInput - Date to check (YYYY-MM-DD string or Date object)
 * @returns {boolean} True if date is today
 */
export const isToday = (dateInput) => {
    const today = moment.tz('Asia/Jakarta').startOf('day');
    const checkDate = moment.tz(dateInput, 'Asia/Jakarta').startOf('day');
    
    return checkDate.isSame(today);
};

/**
 * Format date to YYYY-MM-DD string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string YYYY-MM-DD
 */
export const formatDateToString = (date) => {
    return moment.tz(date, 'Asia/Jakarta').format('YYYY-MM-DD');
};

/**
 * Validate date input format and value
 * @param {string} dateString - Date string to validate (YYYY-MM-DD)
 * @returns {Object} Validation result { isValid: boolean, error: string|null }
 */
export const validateDateInput = (dateString) => {
    // Check format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return {
            isValid: false,
            error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD'
        };
    }

    // Check if valid date
    const date = moment(dateString, 'YYYY-MM-DD', true);
    if (!date.isValid()) {
        return {
            isValid: false,
            error: 'Tanggal tidak valid'
        };
    }

    // Check if future date (for calendar access restriction)
    if (isFutureDate(dateString)) {
        return {
            isValid: false,
            error: 'Tidak dapat mengakses tanggal di masa depan'
        };
    }

    return { isValid: true, error: null };
};

/**
 * Get month and year from date
 * @param {Date} date - Date object
 * @returns {Object} { month: number (1-12), year: number }
 */
export const getMonthYear = (date) => {
    const momentDate = moment.tz(date, 'Asia/Jakarta');
    return {
        month: momentDate.month() + 1, // moment months are 0-indexed
        year: momentDate.year()
    };
};

/**
 * Get first day of month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Date} First day of month
 */
export const getFirstDayOfMonth = (year, month) => {
    return moment.tz(`${year}-${String(month).padStart(2, '0')}-01`, 'Asia/Jakarta').startOf('day').toDate();
};

/**
 * Get last day of month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Date} Last day of month
 */
export const getLastDayOfMonth = (year, month) => {
    return moment.tz(`${year}-${String(month).padStart(2, '0')}-01`, 'Asia/Jakarta').endOf('month').startOf('day').toDate();
};

export default {
    getJakartaDate,
    getTodayJakarta,
    isFutureDate,
    isPastOrToday,
    isToday,
    formatDateToString,
    validateDateInput,
    getMonthYear,
    getFirstDayOfMonth,
    getLastDayOfMonth,
};
