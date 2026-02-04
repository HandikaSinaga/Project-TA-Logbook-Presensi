import axios from "axios";
import { API_URL } from "./Constant";

const axiosInstance = axios.create({
    baseURL: API_URL,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

const refreshAccessToken = async () => {
    try {
        const response = await axios.post(
            `${API_URL}/refresh`,
            {},
            { withCredentials: true },
        );
        const token = response.data.payload.TOKEN;

        localStorage.setItem("token", token);
        console.log("token refreshed");
        return token;
    } catch (error) {
        console.error("Failed to refresh token", error);
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw error;
    }
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Network error
        if (!error.response) {
            console.error("Network error or server is down");
            return Promise.reject({
                message:
                    "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
                isNetworkError: true,
            });
        }

        // Skip token refresh for login/auth endpoints
        const authEndpoints = [
            "/login",
            "/google-idtoken",
            "/register",
            "/forgot-password",
        ];
        const isAuthEndpoint = authEndpoints.some((endpoint) =>
            originalRequest.url?.includes(endpoint),
        );

        // Unauthorized - token expired or invalid (but not for login endpoints)
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthEndpoint
        ) {
            originalRequest._retry = true;

            try {
                const newAccessToken = await refreshAccessToken();
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosInstance(originalRequest);
            } catch (err) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;
