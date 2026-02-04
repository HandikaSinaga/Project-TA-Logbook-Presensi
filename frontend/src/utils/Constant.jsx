// Auto-detect API URL based on environment
export const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "production"
        ? "/api"
        : "http://localhost:3001/api");

export const ROLES = {
    USER: "user",
    SUPERVISOR: "supervisor",
    ADMIN: "admin",
};

export const slugify = (text) => {
    if (!text) {
        return "";
    }

    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
};

export const unSlugify = (text) => {
    if (!text) {
        return "";
    }

    return text
        .toString()
        .toLowerCase()
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

export const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const getAvatarUrl = (user) => {
    if (!user) {
        return "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=128";
    }
    if (user.avatar) {
        // If avatar starts with http/https, use as is (external URL or full URL)
        if (user.avatar.startsWith("http")) {
            return user.avatar;
        }
        // If avatar is a local path, prepend backend URL
        return `${API_URL.replace("/api", "")}${user.avatar}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name || "User",
    )}&background=random&color=fff&size=128`;
};

export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) {
        return imagePath;
    }
    return `${API_URL.replace("/api", "")}${imagePath}`;
};
