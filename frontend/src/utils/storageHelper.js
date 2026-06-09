export const setAuthData = (token, user, remember) => {
    if (remember) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        // Remove any old session storage just in case
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
    } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        // Remove any old local storage just in case
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }
};

export const getStorageToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
};

export const getStorageUser = () => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
};

// Raw string user for backward compatibility in some files
export const getStorageUserString = () => {
    return localStorage.getItem("user") || sessionStorage.getItem("user");
};

export const updateStorageToken = (token) => {
    if (localStorage.getItem("token")) {
        localStorage.setItem("token", token);
    } else if (sessionStorage.getItem("token")) {
        sessionStorage.setItem("token", token);
    }
};

export const updateStorageUser = (user) => {
    if (localStorage.getItem("user")) {
        localStorage.setItem("user", JSON.stringify(user));
    } else if (sessionStorage.getItem("user")) {
        sessionStorage.setItem("user", JSON.stringify(user));
    }
};

export const clearStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
};
