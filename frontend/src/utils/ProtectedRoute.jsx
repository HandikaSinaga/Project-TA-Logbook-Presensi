import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getStorageToken, clearStorage } from "./storageHelper";

const ProtectedRoute = ({ role }) => {
    const token = getStorageToken();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
            clearStorage();
            return <Navigate to="/login" replace />;
        }

        // Redirect to correct dashboard if role mismatch
        if (role && decoded.role !== role) {
            const roleDashboard = {
                user: "/user/dashboard",
                supervisor: "/supervisor/dashboard",
                admin: "/admin/dashboard",
            };

            const targetPath = roleDashboard[decoded.role];
            if (targetPath) {
                return <Navigate to={targetPath} replace />;
            }

            // If role not recognized, logout
            clearStorage();
            return <Navigate to="/login" replace />;
        }

        return <Outlet />;
    } catch (error) {
        clearStorage();
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;
