// Utility function untuk mendapatkan tanggal dalam timezone Jakarta (WIB/UTC+7)
export const getJakartaDate = (date = new Date()) => {
    // Convert to Jakarta timezone (UTC+7)
    const jakartaTime = new Date(
        date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );

    // Format to YYYY-MM-DD
    const year = jakartaTime.getFullYear();
    const month = String(jakartaTime.getMonth() + 1).padStart(2, "0");
    const day = String(jakartaTime.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// Get first day of current month in Jakarta timezone
export const getJakartaFirstDayOfMonth = () => {
    const jakartaTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    jakartaTime.setDate(1);

    const year = jakartaTime.getFullYear();
    const month = String(jakartaTime.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}-01`;
};

// Get current date and time in Jakarta timezone
export const getJakartaDateTime = () => {
    return new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
};

// Get current time in HH:mm:ss format (Jakarta timezone)
export const getJakartaTime = () => {
    const jakartaTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const hours = String(jakartaTime.getHours()).padStart(2, "0");
    const minutes = String(jakartaTime.getMinutes()).padStart(2, "0");
    const seconds = String(jakartaTime.getSeconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
};

export default {
    getJakartaDate,
    getJakartaFirstDayOfMonth,
    getJakartaDateTime,
    getJakartaTime,
};
