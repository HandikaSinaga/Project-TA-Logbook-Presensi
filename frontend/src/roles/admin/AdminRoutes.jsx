import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../../components/layout/admin/AdminLayout";
import ProtectedRoute from "../../utils/ProtectedRoute";
import "../../assets/styles/admin.css";

import Dashboard from "./Dashboard";
import Users from "./Users";
import Divisions from "./Divisions";
import OfficeLocations from "./OfficeLocations"; // Unified WiFi + GPS Management
import Monitoring from "./Monitoring"; // Real-time attendance monitoring
import Attendance from "./Attendance";
import Logbook from "./Logbook";
import Leave from "./Leave";
import Reports from "./Reports";
import Settings from "./Settings"; // Modern settings with Tabs and enhanced UI/UX
import Profile from "./Profile";

const AdminRoutes = () => {
    return (
        <AdminLayout>
            <Routes>
                <Route element={<ProtectedRoute role="admin" />}>
                    <Route
                        path="/"
                        element={<Navigate to="dashboard" replace />}
                    />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="users" element={<Users />} />
                    <Route path="divisions" element={<Divisions />} />
                    <Route
                        path="office-locations"
                        element={<OfficeLocations />}
                    />
                    <Route path="monitoring" element={<Monitoring />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="logbook" element={<Logbook />} />
                    <Route path="leave" element={<Leave />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="system-settings" element={<Settings />} />
                    <Route
                        path="settings"
                        element={<Navigate to="system-settings" replace />}
                    />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
        </AdminLayout>
    );
};

export default AdminRoutes;
