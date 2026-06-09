import React, { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { getStorageToken, getStorageUserString, updateStorageUser, clearStorage, setAuthData } from "../utils/storageHelper";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        try {
            const token = getStorageToken();
            const userData = getStorageUserString();

            if (token && userData) {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decoded.exp > currentTime) {
                    setUser(JSON.parse(userData));
                } else {
                    logout();
                }
            }
        } catch (error) {
            console.error("Auth check error:", error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (token, userData, remember = true) => {
        setAuthData(token, userData, remember);
        setUser(userData);
    };

    const logout = () => {
        clearStorage();
        setUser(null);
    };

    const updateUser = (userData) => {
        updateStorageUser(userData);
        setUser(userData);
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, logout, updateUser, checkAuth }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
