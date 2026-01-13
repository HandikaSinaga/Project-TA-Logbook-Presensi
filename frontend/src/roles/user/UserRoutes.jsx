import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import UserLayout from "../../components/layout/user/UserLayout";
import ProtectedRoute from "../../utils/ProtectedRoute";
import "../../assets/styles/admin.css";
import "../../assets/styles/user.css";

import Dashboard from "./Dashboard";
import Attendance from "./Attendance";
import Logbook from "./Logbook";
import Leave from "./Leave";
import Division from "./Division";
import Profile from "./Profile";

const UserRoutes = () => {
    return (
        <UserLayout>
            <Routes>
                <Route element={<ProtectedRoute role="user" />}>
                    <Route
                        path="/"
                        element={<Navigate to="dashboard" replace />}
                    />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="logbook" element={<Logbook />} />
                    <Route path="leave" element={<Leave />} />
                    <Route path="division" element={<Division />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
        </UserLayout>
    );
};

export default UserRoutes;
