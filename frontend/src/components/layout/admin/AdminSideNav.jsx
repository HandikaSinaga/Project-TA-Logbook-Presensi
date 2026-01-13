import React, { useState } from "react";
import { Nav, Form, InputGroup, Collapse } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import logo from "../../../assets/images/logo.png";

const AdminSideNav = () => {
    const [openManagement, setOpenManagement] = useState(false);
    const [openMonitoring, setOpenMonitoring] = useState(false);
    const [openReports, setOpenReports] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        if (!isMinimized) {
            setOpenManagement(false);
            setOpenMonitoring(false);
            setOpenReports(false);
        }
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
                    <img src={logo} alt="Logo" height="32" />
                    <i
                        className="bi bi-caret-left-square text-grey cursor-pointer"
                        onClick={toggleMinimize}
                    ></i>
                </div>

                <Nav className="nav-container flex-column px-3">
                    <div className="menu-box">
                        {/* Home */}
                        <Nav.Link
                            as={NavLink}
                            to="/admin/dashboard"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-house me-2"></i>
                            <span className="text-truncate">Home</span>
                        </Nav.Link>

                        {/* Management Dropdown */}
                        <Nav.Link
                            className={`drop-menu rounded rounded-35 d-flex justify-content-between align-items-center ${
                                openManagement ? `active-border` : ``
                            }`}
                            onClick={() => {
                                if (isMinimized) {
                                    toggleMinimize();
                                    setOpenManagement(!openManagement);
                                } else {
                                    setOpenManagement(!openManagement);
                                }
                            }}
                        >
                            <div
                                className={`w-100 d-flex align-items-center ${
                                    isMinimized
                                        ? `justify-content-center`
                                        : `justify-content-start`
                                }`}
                            >
                                <i className="bi bi-people me-2"></i>
                                <span className="text-truncate">
                                    Management
                                </span>
                            </div>
                            {openManagement ? (
                                <i className="chrevon bi bi-chevron-up"></i>
                            ) : (
                                <i className="chrevon bi bi-chevron-down"></i>
                            )}
                        </Nav.Link>
                        <Collapse className="submenu" in={openManagement}>
                            <div>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/users"
                                    className="rounded rounded-35"
                                >
                                    Users
                                </Nav.Link>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/divisions"
                                    className="rounded rounded-35"
                                >
                                    Divisions
                                </Nav.Link>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/office-locations"
                                    className="rounded rounded-35"
                                >
                                    <i className="bi bi-building me-2"></i>
                                    Lokasi Kantor
                                </Nav.Link>
                            </div>
                        </Collapse>

                        {/* Monitoring Dropdown */}
                        <Nav.Link
                            className={`drop-menu rounded rounded-35 d-flex justify-content-between align-items-center ${
                                openMonitoring ? `active-border` : ``
                            }`}
                            onClick={() => {
                                if (isMinimized) {
                                    toggleMinimize();
                                    setOpenMonitoring(!openMonitoring);
                                } else {
                                    setOpenMonitoring(!openMonitoring);
                                }
                            }}
                        >
                            <div
                                className={`w-100 d-flex align-items-center ${
                                    isMinimized
                                        ? `justify-content-center`
                                        : `justify-content-start`
                                }`}
                            >
                                <i className="bi bi-calendar-check me-2"></i>
                                <span className="text-truncate">
                                    Monitoring
                                </span>
                            </div>
                            {openMonitoring ? (
                                <i className="chrevon bi bi-chevron-up"></i>
                            ) : (
                                <i className="chrevon bi bi-chevron-down"></i>
                            )}
                        </Nav.Link>
                        <Collapse className="submenu" in={openMonitoring}>
                            <div>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/attendance"
                                    className="rounded rounded-35"
                                >
                                    Attendance
                                </Nav.Link>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/logbook"
                                    className="rounded rounded-35"
                                >
                                    Logbook
                                </Nav.Link>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/leave"
                                    className="rounded rounded-35"
                                >
                                    Leave Requests
                                </Nav.Link>
                            </div>
                        </Collapse>

                        {/* Reports & Export Dropdown */}
                        <Nav.Link
                            className={`drop-menu rounded rounded-35 d-flex justify-content-between align-items-center ${
                                openReports ? `active-border` : ``
                            }`}
                            onClick={() => {
                                if (isMinimized) {
                                    toggleMinimize();
                                    setOpenReports(!openReports);
                                } else {
                                    setOpenReports(!openReports);
                                }
                            }}
                        >
                            <div
                                className={`w-100 d-flex align-items-center ${
                                    isMinimized
                                        ? `justify-content-center`
                                        : `justify-content-start`
                                }`}
                            >
                                <i className="bi bi-file-earmark-text me-2"></i>
                                <span className="text-truncate">
                                    Reports & Export
                                </span>
                            </div>
                            {openReports ? (
                                <i className="chrevon bi bi-chevron-up"></i>
                            ) : (
                                <i className="chrevon bi bi-chevron-down"></i>
                            )}
                        </Nav.Link>
                        <Collapse className="submenu" in={openReports}>
                            <div>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/reports"
                                    className="rounded rounded-35"
                                >
                                    All Reports
                                </Nav.Link>
                            </div>
                        </Collapse>

                        {/* System Settings - Standalone Menu */}
                        <Nav.Link
                            as={NavLink}
                            to="/admin/system-settings"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-gear-fill me-2"></i>
                            <span className="text-truncate">
                                System Settings
                            </span>
                        </Nav.Link>
                    </div>

                    {/* Profile Section */}
                    <div className="setting-box">
                        <Nav.Link
                            as={NavLink}
                            to="/admin/profile"
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

export default AdminSideNav;
