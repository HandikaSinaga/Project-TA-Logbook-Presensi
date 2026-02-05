import React, { useState, useEffect } from "react";
import { Nav, Form, InputGroup, Collapse, Modal, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { logout } from "../../../services/authService";
import logo from "../../../assets/images/logo.png";
import logoutIllustration from "../../../assets/images/logout.png";

const AdminSideNav = ({ isOpen, onClose }) => {
    const [openManagement, setOpenManagement] = useState(false);
    const [openMonitoring, setOpenMonitoring] = useState(false);
    const [openReports, setOpenReports] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        if (!isMinimized) {
            setOpenManagement(false);
            setOpenMonitoring(false);
            setOpenReports(false);
        }
    };

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && window.innerWidth < 768) {
                const sidebar = document.getElementById("sidebarMenu");
                if (sidebar && !sidebar.contains(e.target)) {
                    onClose();
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    // Close sidebar on navigation for mobile
    const handleNavClick = () => {
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div 
                    className="sidebar-overlay d-lg-none"
                    onClick={onClose}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 1040
                    }}
                />
            )}
            
            <nav
                id="sidebarMenu"
                className={`col-md-3 col-lg-2 sticky-top bg-white shadow-end sidebar sidebar-admin ${
                    isMinimized ? "minimized" : ""
                } ${isOpen ? "show" : ""}`}
                style={{
                    position: window.innerWidth < 768 ? "fixed" : "sticky",
                    left: isOpen || window.innerWidth >= 768 ? 0 : "-100%",
                    top: 0,
                    height: "100vh",
                    zIndex: 1050,
                    transition: "left 0.3s ease-in-out"
                }}
            >
            <div className="position-sticky">
                <div className="d-flex align-items-center top-logo px-3" style={{ justifyContent: isMinimized ? 'center' : 'space-between' }}>
                    {!isMinimized && (
                        <img 
                            src={logo} 
                            alt="Logo" 
                            height="32"
                        />
                    )}
                    {!isMinimized && (
                        <div className="d-flex align-items-center">
                            <i
                                className="bi bi-x-lg text-grey cursor-pointer d-lg-none me-3"
                                onClick={onClose}
                                style={{ fontSize: "1.2rem" }}
                            ></i>
                            <i
                                className="bi bi-caret-left-square text-grey cursor-pointer d-none d-lg-block"
                                onClick={toggleMinimize}
                            ></i>
                        </div>
                    )}
                    {isMinimized && (
                        <i
                            className="bi bi-caret-right-square text-grey cursor-pointer d-none d-lg-block"
                            onClick={toggleMinimize}
                        ></i>
                    )}
                </div>

                <Nav className="nav-container flex-column px-3">
                    <div className="menu-box">
                        {/* Home */}
                        <Nav.Link
                            as={NavLink}
                            to="/admin/dashboard"
                            className="rounded rounded-35"
                            onClick={handleNavClick}
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
                                    onClick={handleNavClick}
                                >
                                    Users
                                </Nav.Link>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/divisions"
                                    className="rounded rounded-35"
                                    onClick={handleNavClick}
                                >
                                    Divisions
                                </Nav.Link>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/office-locations"
                                    className="rounded rounded-35"
                                    onClick={handleNavClick}
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
                                    onClick={handleNavClick}
                                >
                                    Attendance
                                </Nav.Link>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/logbook"
                                    className="rounded rounded-35"
                                    onClick={handleNavClick}
                                >
                                    Logbook
                                </Nav.Link>
                                <Nav.Link
                                    as={NavLink}
                                    to="/admin/leave"
                                    className="rounded rounded-35"
                                    onClick={handleNavClick}
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
                                    onClick={handleNavClick}
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
                            onClick={handleNavClick}
                        >
                            <i className="bi bi-gear-fill me-2"></i>
                            <span className="text-truncate">
                                System Settings
                            </span>
                        </Nav.Link>
                    </div>

                    {/* Profile & Logout Section */}
                    <div className="setting-box">
                        <Nav.Link
                            as={NavLink}
                            to="/admin/profile"
                            className="rounded rounded-35"
                            onClick={handleNavClick}
                        >
                            <i className="bi bi-person-circle me-2"></i>
                            <span className="text-truncate">Profile</span>
                        </Nav.Link>
                        
                        <Nav.Link
                            className="rounded rounded-35"
                            onClick={handleShow}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="bi bi-box-arrow-right me-2 text-danger"></i>
                            <span className="text-truncate">Logout</span>
                        </Nav.Link>
                    </div>
                </Nav>
            </div>
        </nav>
        
        {/* Logout Modal */}
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Body className="p-4 d-flex flex-column items-center">
                <h4 className="mb-4 fw-bold text-dark">
                    Time to <span className="text-red">logout</span>?
                </h4>
                <img src={logoutIllustration} alt="" />
                <p className="my-3 text-muted fw-light">
                    Confirm logout? We'll be here when you return.
                </p>
                <div className="mt-4 w-100 d-flex justify-content-center">
                    <Button
                        variant="outline-muted"
                        className="py-2 px-5 mx-1 rounded-35"
                        onClick={handleClose}
                    >
                        No, I'll stay
                    </Button>
                    <Button
                        variant="red"
                        className="py-2 px-5 mx-1 rounded-35"
                        onClick={handleLogout}
                    >
                        Yes, I'm done
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
        </>
    );
};

export default AdminSideNav;
