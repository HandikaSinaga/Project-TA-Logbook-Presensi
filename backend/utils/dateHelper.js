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
        now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
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
        date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
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
        date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
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
        date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
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
    }
) => {
    return new Date(date).toLocaleString(locale, options);
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
};
