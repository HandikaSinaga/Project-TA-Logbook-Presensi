import React, { useState } from "react";
import { Nav, Form, InputGroup } from "react-bootstrap";
import { NavLink } from "react-router-dom";

const UserSideNav = () => {
    const [isMinimized, setIsMinimized] = useState(false);

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    return (
        <nav
            id="sidebarMenu"
            className={`col-md-3 col-lg-2 sticky-top d-md-block bg-white shadow-end sidebar sidebar-admin ${
                isMinimized ? "minimized" : ""
            }`}
        >
            <div className="position-sticky">
                <div className="d-flex justify-content-between align-items-center top-logo px-3">
                    <h5 className="mb-0 fw-bold text-info">Employee</h5>
                    <i
                        className="bi bi-caret-left-square text-grey cursor-pointer"
                        onClick={toggleMinimize}
                    ></i>
                </div>

                <Nav className="nav-container flex-column px-3">
                    <div className="menu-box">
                        <Nav.Link
                            as={NavLink}
                            to="/user/dashboard"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-house me-2"></i>
                            <span className="text-truncate">Dashboard</span>
                        </Nav.Link>

                        <Nav.Link
                            as={NavLink}
                            to="/user/attendance"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-calendar-check me-2"></i>
                            <span className="text-truncate">Attendance</span>
                        </Nav.Link>

                        <Nav.Link
                            as={NavLink}
                            to="/user/logbook"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-journal-text me-2"></i>
                            <span className="text-truncate">Logbook</span>
                        </Nav.Link>

                        <Nav.Link
                            as={NavLink}
                            to="/user/leave"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-calendar-x me-2"></i>
                            <span className="text-truncate">Leave Request</span>
                        </Nav.Link>

                        <Nav.Link
                            as={NavLink}
                            to="/user/division"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-people me-2"></i>
                            <span className="text-truncate">My Division</span>
                        </Nav.Link>
                    </div>

                    <div className="setting-box">
                        <Nav.Link
                            as={NavLink}
                            to="/user/profile"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-person-circle me-2"></i>
                            <span className="text-truncate">Profile</span>
                        </Nav.Link>
                    </div>
                </Nav>
            </div>
        </nav>
    );
};

export default UserSideNav;
