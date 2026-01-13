import axiosInstance from "../utils/axiosInstance";
import { API_URL } from "../utils/Constant";

export const login = async (formData) => {
    const { email, password, remember } = formData;
    const response = await axiosInstance.post("/login", {
        email,
        password,
        remember,
    });
    if (response.data.token) {
        localStorage.setItem("token", response.data.token);
    }
    return response.data;
};

export const logout = async () => {
    await axiosInstance.post("/logout");
    localStorage.removeItem("token");
};

export const getCurrentUser = async () => {
    const response = await axiosInstance.get("/me");
    return response.data;
};

export const googleLogin = () => {
    window.location.href = `${API_URL}/google`;
};

export const authService = {
    login,
    logout,
    getCurrentUser,
    googleLogin,
};
