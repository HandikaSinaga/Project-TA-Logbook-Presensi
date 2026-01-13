import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Navbar, Nav, Dropdown, Badge } from "react-bootstrap";
import { logout } from "../../../services/authService";
import toast from "react-hot-toast";

const SupervisorLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);

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
                        to="/supervisor/dashboard"
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
                                        className="avatar bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                        }}
                                    >
                                        {user.name?.charAt(0).toUpperCase() ||
                                            "S"}
                                    </div>
                                    <div className="d-none d-md-block text-start">
                                        <div className="fw-semibold small">
                                            {user.name || "Supervisor"}
                                        </div>
                                        <div
                                            className="text-secondary"
                                            style={{ fontSize: "0.75rem" }}
                                        >
                                            Supervisor
                                        </div>
                                    </div>
                                </div>
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item
                                    as={Link}
                                    to="/supervisor/profile"
                                >
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
                            to="/supervisor/dashboard"
                            className={`rounded-3 mb-2 ${
                                isActive("/supervisor/dashboard")
                                    ? "bg-success text-white"
                                    : "text-dark"
                            }`}
                        >
                            <i className="bi bi-speedometer2 me-2"></i>
                            Dashboard
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/supervisor/attendance"
                            className={`rounded-3 mb-2 ${
                                isActive("/supervisor/attendance")
                                    ? "bg-success text-white"
                                    : "text-dark"
                            }`}
                        >
                            <i className="bi bi-list-check me-2"></i>
                            Presensi Tim
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/supervisor/logbook"
                            className={`rounded-3 mb-2 ${
                                isActive("/supervisor/logbook")
                                    ? "bg-success text-white"
                                    : "text-dark"
                            }`}
                        >
                            <i className="bi bi-journal-text me-2"></i>
                            Logbook Tim
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/supervisor/leave"
                            className={`rounded-3 mb-2 position-relative ${
                                isActive("/supervisor/leave")
                                    ? "bg-success text-white"
                                    : "text-dark"
                            }`}
                        >
                            <i className="bi bi-clipboard-check me-2"></i>
                            Approval Izin
                            {pendingCount > 0 && (
                                <Badge
                                    bg="danger"
                                    pill
                                    className="position-absolute top-0 end-0 mt-2 me-2"
                                >
                                    {pendingCount}
                                </Badge>
                            )}
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/supervisor/division"
                            className={`rounded-3 mb-2 ${
                                isActive("/supervisor/division")
                                    ? "bg-success text-white"
                                    : "text-dark"
                            }`}
                        >
                            <i className="bi bi-people me-2"></i>
                            Kelola Tim
                        </Nav.Link>
                    </Nav>
                </div>

                {/* Main Content */}
                <div className="flex-grow-1">{children || <Outlet />}</div>
            </div>
        </div>
    );
};

export default SupervisorLayout;
