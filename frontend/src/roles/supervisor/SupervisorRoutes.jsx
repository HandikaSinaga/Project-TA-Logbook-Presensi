import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SupervisorLayout from "../../components/layout/supervisor/SupervisorLayout";
import ProtectedRoute from "../../utils/ProtectedRoute";
import "../../assets/styles/admin.css";
import "../../assets/styles/supervisor.css";

import Dashboard from "./Dashboard";
import Attendance from "./Attendance";
import Logbook from "./Logbook";
import Leave from "./Leave";
import Division from "./Division";
import Profile from "./Profile";
import ManageDivision from "./ManageDivision";

const SupervisorRoutes = () => {
    return (
        <SupervisorLayout>
            <Routes>
                <Route element={<ProtectedRoute role="supervisor" />}>
                    <Route
                        path="/"
                        element={<Navigate to="dashboard" replace />}
                    />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="logbooks" element={<Logbook />} />
                    <Route path="leaves" element={<Leave />} />
                    <Route path="division" element={<Division />} />
                    <Route
                        path="manage-division"
                        element={<ManageDivision />}
                    />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
        </SupervisorLayout>
    );
};

export default SupervisorRoutes;
