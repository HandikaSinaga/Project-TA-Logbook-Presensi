import React from "react";
import Navbar from "./AdminNavbar";
import SideNav from "./AdminSideNav";

const AdminLayout = ({ children }) => {
    return (
        <div className="admin-page">
            <div className="container-fluid admin-container">
                <div className="row">
                    <SideNav />
                    <main className="col p-0 overflow-auto">
                        <Navbar />
                        <div className="p-4 admin-content">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
