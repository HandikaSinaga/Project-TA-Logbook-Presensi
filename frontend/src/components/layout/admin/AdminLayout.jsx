import React, { useState } from "react";
import Navbar from "./AdminNavbar";
import SideNav from "./AdminSideNav";

const AdminLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="admin-page">
            <div className="container-fluid admin-container">
                <div className="row">
                    <SideNav
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                    <main className="col p-0 overflow-auto">
                        <Navbar onToggleSidebar={toggleSidebar} />
                        <div className="p-4 admin-content">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
