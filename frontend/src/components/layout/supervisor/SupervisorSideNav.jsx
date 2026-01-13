import React, { useState } from "react";
import { Nav, Form, InputGroup, Collapse } from "react-bootstrap";
import { NavLink } from "react-router-dom";

const SupervisorSideNav = () => {
    const [open1, setOpen1] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        if (!isMinimized) {
            setOpen1(false);
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
                    <h5 className="mb-0 fw-bold text-success">Supervisor</h5>
                    <i
                        className="bi bi-caret-left-square text-grey cursor-pointer"
                        onClick={toggleMinimize}
                    ></i>
                </div>

                <Nav className="nav-container flex-column px-3">
                    <div className="menu-box">
                        <Nav.Link
                            as={NavLink}
                            to="/supervisor/dashboard"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-house me-2"></i>
                            <span className="text-truncate">Dashboard</span>
                        </Nav.Link>

                        <Nav.Link
                            as={NavLink}
                            to="/supervisor/division"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-building me-2"></i>
                            <span className="text-truncate">Division Info</span>
                        </Nav.Link>

                        <Nav.Link
                            as={NavLink}
                            to="/supervisor/manage-division"
                            className="rounded rounded-35"
                        >
                            <i className="bi bi-people me-2"></i>
                            <span className="text-truncate">
                                Manage Division
                            </span>
                        </Nav.Link>

                        <>
                            <Nav.Link
                                className={`drop-menu rounded rounded-35 d-flex justify-content-between align-items-center ${
                                    open1 ? `active-border` : ` `
                                }`}
                                onClick={() => {
                                    if (isMinimized) {
                                        toggleMinimize();
                                        setOpen1(!open1);
                                    } else {
                                        setOpen1(!open1);
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
                                {open1 ? (
                                    <i className="chrevon bi bi-chevron-up"></i>
                                ) : (
                                    <i className="chrevon bi bi-chevron-down"></i>
                                )}
                            </Nav.Link>
                            <Collapse className="submenu" in={open1}>
                                <div>
                                    <Nav.Link
                                        as={NavLink}
                                        to="/supervisor/attendance"
                                        className="rounded rounded-35"
                                    >
                                        Attendance
                                    </Nav.Link>
                                    <Nav.Link
                                        as={NavLink}
                                        to="/supervisor/logbooks"
                                        className="rounded rounded-35"
                                    >
                                        Logbooks
                                    </Nav.Link>
                                    <Nav.Link
                                        as={NavLink}
                                        to="/supervisor/leaves"
                                        className="rounded rounded-35"
                                    >
                                        Leaves
                                    </Nav.Link>
                                </div>
                            </Collapse>
                        </>
                    </div>

                    <div className="setting-box">
                        <Nav.Link
                            as={NavLink}
                            to="/supervisor/profile"
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

export default SupervisorSideNav;
