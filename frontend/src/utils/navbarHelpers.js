// Shared utility functions for navbar components

export function validName(fullName, defaultName = "User") {
    if (!fullName) return defaultName;
    const nameArray = fullName.split(" ");
    const firstTwoWords = nameArray.slice(0, 2).join(" ");
    return firstTwoWords;
}

export function getDateNow() {
    const days = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
    ];
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
    ];

    const now = new Date();
    const dayName = days[now.getDay()];
    const day = String(now.getDate()).padStart(2, "0");
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    return `${dayName}, ${day} ${monthName} ${year}`;
}

export function loadUserData() {
    try {
        const stored = localStorage.getItem("user");
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error("Error parsing user data:", error);
    }
    return null;
}
