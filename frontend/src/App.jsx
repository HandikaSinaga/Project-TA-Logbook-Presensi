import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import PublicRoutes from "./roles/public/PublicRoutes";
import UserRoutes from "./roles/user/UserRoutes";
import SupervisorRoutes from "./roles/supervisor/SupervisorRoutes";
import AdminRoutes from "./roles/admin/AdminRoutes";

const App = () => {
    return (
        <Router>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "#333",
                        color: "#fff",
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: "#10b981",
                            secondary: "#fff",
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: "#ef4444",
                            secondary: "#fff",
                        },
                    },
                }}
            />
            <Routes>
                <Route path="/*" element={<PublicRoutes />} />
                <Route path="/user/*" element={<UserRoutes />} />
                <Route path="/supervisor/*" element={<SupervisorRoutes />} />
                <Route path="/admin/*" element={<AdminRoutes />} />
            </Routes>
        </Router>
    );
};

export default App;
