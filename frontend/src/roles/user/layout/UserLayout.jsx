import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Navbar, Nav, Dropdown } from "react-bootstrap";
import { logout } from "../../../services/authService";
import toast from "react-hot-toast";

const UserLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logout berhasil");
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Logout error:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
        }
    };

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <div className="min-vh-100 bg-light">
            {/* Top Navbar */}
            <Navbar bg="white" className="border-bottom shadow-sm">
                <Container fluid>
                    <Navbar.Brand
                        as={Link}
                        to="/user/dashboard"
                        className="fw-bold text-primary"
                    >
                        <i className="bi bi-calendar-check me-2"></i>
                        Attendance System
                    </Navbar.Brand>

                    <Nav className="ms-auto align-items-center">
                        <Dropdown align="end">
                            <Dropdown.Toggle
                                variant="link"
                                className="text-decoration-none text-dark"
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <div
                                        className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                        }}
                                    >
                                        {user.name?.charAt(0).toUpperCase() ||
                                            "U"}
                                    </div>
                                    <div className="d-none d-md-block text-start">
                                        <div className="fw-semibold small">
                                            {user.name || "User"}
                                        </div>
                                        <div
                                            className="text-secondary"
                                            style={{ fontSize: "0.75rem" }}
                                        >
                                            {user.role || "user"}
                                        </div>
                                    </div>
                                </div>
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item as={Link} to="/user/profile">
                                    <i className="bi bi-person me-2"></i>
                                    Profile
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={handleLogout}>
                                    <i className="bi bi-box-arrow-right me-2"></i>
                                    Logout
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Container>
            </Navbar>

            <div className="d-flex">
                {/* Sidebar */}
                <div
                    className="bg-white border-end"
                    style={{ width: "250px", minHeight: "calc(100vh - 56px)" }}
                >
                    <Nav className="flex-column p-3">
                        <Nav.Link
                            as={Link}
                            to="/user/dashboard"
                            className={`rounded-3 mb-2 ${
                                isActive("/user/dashboard")
                                    ? "bg-primary text-white"
                                    : "text-dark"
                            }`}
                        >
                            <i className="bi bi-speedometer2 me-2"></i>
                            Dashboard
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/user/attendance"
                            className={`rounded-3 mb-2 ${
                                isActive("/user/attendance")
                                    ? "bg-primary text-white"
                                    : "text-dark"
                            }`}
                        >
                            <i className="bi bi-geo-alt me-2"></i>
                            Presensi
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/user/logbook"
                            className={`rounded-3 mb-2 ${
                                isActive("/user/logbook")
                                    ? "bg-primary text-white"
                                    : "text-dark"
                            }`}
                        >
                            <i className="bi bi-journal-text me-2"></i>
                            Logbook
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/user/leave"
                            className={`rounded-3 mb-2 ${
                                isActive("/user/leave")
                                    ? "bg-primary text-white"
                                    : "text-dark"
                            }`}
                        >
                            <i className="bi bi-calendar-event me-2"></i>
                            Izin/Cuti
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/user/division"
                            className={`rounded-3 mb-2 ${
                                isActive("/user/division")
                                    ? "bg-primary text-white"
                                    : "text-dark"
                            }`}
                        >
                            <i className="bi bi-building me-2"></i>
                            Divisi
                        </Nav.Link>
                    </Nav>
                </div>

                {/* Main Content */}
                <div className="flex-grow-1">{children || <Outlet />}</div>
            </div>
        </div>
    );
};

export default UserLayout;
