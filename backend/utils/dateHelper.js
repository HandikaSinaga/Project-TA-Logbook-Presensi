/**
 * Date Helper - Utility untuk handle timezone Jakarta (WIB/GMT+7)
 * Mengatasi masalah timezone di EC2 agar semua timestamp menggunakan WIB
 */

/**
 * Mendapatkan waktu saat ini dalam timezone Jakarta (WIB)
 * @returns {Date} Date object dengan waktu Jakarta
 */
export const getJakartaDate = () => {
    // Buat date object dan konversi ke Jakarta timezone
    const now = new Date();

    // Konversi ke Jakarta timezone menggunakan toLocaleString
    const jakartaTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );

    return jakartaTime;
};

/**
 * Mendapatkan tanggal hari ini di Jakarta (00:00:00)
 * @returns {Date} Date object untuk awal hari di Jakarta
 */
export const getTodayJakarta = () => {
    const today = getJakartaDate();
    today.setHours(0, 0, 0, 0);
    return today;
};

/**
 * Mendapatkan akhir hari ini di Jakarta (23:59:59.999)
 * @returns {Date} Date object untuk akhir hari di Jakarta
 */
export const getEndOfTodayJakarta = () => {
    const today = getJakartaDate();
    today.setHours(23, 59, 59, 999);
    return today;
};

/**
 * Mendapatkan awal bulan di Jakarta
 * @param {number} year - Tahun
 * @param {number} month - Bulan (1-12)
 * @returns {Date} Date object untuk awal bulan
 */
export const getStartOfMonthJakarta = (year, month) => {
    // month adalah 1-based (1 = Januari)
    const date = new Date(year, month - 1, 1);

    // Konversi ke Jakarta timezone
    const jakartaDate = new Date(
        date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );

    jakartaDate.setHours(0, 0, 0, 0);
    return jakartaDate;
};

/**
 * Mendapatkan akhir bulan di Jakarta
 * @param {number} year - Tahun
 * @param {number} month - Bulan (1-12)
 * @returns {Date} Date object untuk akhir bulan
 */
export const getEndOfMonthJakarta = (year, month) => {
    // month adalah 1-based (1 = Januari)
    // Bulan 0 dari bulan berikutnya = hari terakhir bulan ini
    const date = new Date(year, month, 0);

    // Konversi ke Jakarta timezone
    const jakartaDate = new Date(
        date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );

    jakartaDate.setHours(23, 59, 59, 999);
    return jakartaDate;
};

/**
 * Format date string menjadi Date object dengan timezone Jakarta
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @returns {Date} Date object dengan timezone Jakarta
 */
export const parseJakartaDate = (dateString) => {
    const date = new Date(dateString);

    // Konversi ke Jakarta timezone
    const jakartaDate = new Date(
        date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );

    return jakartaDate;
};

/**
 * Get current timestamp in Jakarta timezone as ISO string
 * @returns {string} ISO string dengan waktu Jakarta
 */
export const getJakartaISOString = () => {
    return getJakartaDate().toISOString();
};

/**
 * Format date ke string dengan timezone Jakarta
 * @param {Date} date - Date object
 * @param {string} locale - Locale string (default: 'id-ID')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatJakartaDate = (
    date,
    locale = "id-ID",
    options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
    },
) => {
    return new Date(date).toLocaleString(locale, options);
};

/**
 * Check if a date is in the future (after today in Jakarta timezone)
 * @param {string|Date} dateInput - Date to check (YYYY-MM-DD string or Date object)
 * @returns {boolean} True if date is after today
 */
export const isFutureDate = (dateInput) => {
    const today = getTodayJakarta();
    const checkDate = typeof dateInput === 'string' 
        ? new Date(dateInput + 'T00:00:00')
        : new Date(dateInput);
    
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate > today;
};

/**
 * Check if a date is today or in the past (Jakarta timezone)
 * @param {string|Date} dateInput - Date to check (YYYY-MM-DD string or Date object)
 * @returns {boolean} True if date is today or before today
 */
export const isPastOrToday = (dateInput) => {
    return !isFutureDate(dateInput);
};

/**
 * Check if a date is today (Jakarta timezone)
 * @param {string|Date} dateInput - Date to check (YYYY-MM-DD string or Date object)
 * @returns {boolean} True if date is today
 */
export const isToday = (dateInput) => {
    const today = getTodayJakarta();
    const checkDate = typeof dateInput === 'string' 
        ? new Date(dateInput + 'T00:00:00')
        : new Date(dateInput);
    
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    
    return today.getTime() === checkDate.getTime();
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
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return {
            isValid: false,
            error: 'Tanggal tidak valid'
        };
    }

    // Check if future date
    if (isFutureDate(dateString)) {
        return {
            isValid: false,
            error: 'Tidak dapat mengakses tanggal di masa depan'
        };
    }

    return { isValid: true, error: null };
};

/**
 * Format date to YYYY-MM-DD string (Jakarta timezone)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string YYYY-MM-DD
 */
export const formatDateToString = (date) => {
    const jakartaDate = new Date(
        date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    
    const year = jakartaDate.getFullYear();
    const month = String(jakartaDate.getMonth() + 1).padStart(2, '0');
    const day = String(jakartaDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

export default {
    getJakartaDate,
    getTodayJakarta,
    getEndOfTodayJakarta,
    getStartOfMonthJakarta,
    getEndOfMonthJakarta,
    parseJakartaDate,
    getJakartaISOString,
    formatJakartaDate,
    isFutureDate,
    isPastOrToday,
    isToday,
    validateDateInput,
    formatDateToString,
};
