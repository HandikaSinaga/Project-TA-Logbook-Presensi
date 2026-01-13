import React from "react";
import Navbar from "./UserNavbar";
import SideNav from "./UserSideNav";

const UserLayout = ({ children }) => {
    return (
        <div className="admin-page user-page">
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

export default UserLayout;
