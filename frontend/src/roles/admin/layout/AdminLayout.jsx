import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Navbar, Nav, Dropdown } from "react-bootstrap";
import { logout } from "../../../services/authService";
import toast from "react-hot-toast";

const AdminLayout = ({ children }) => {
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
            <Navbar bg="dark" variant="dark" className="shadow-sm">
                <Container fluid>
                    <Navbar.Brand
                        as={Link}
                        to="/admin/dashboard"
                        className="fw-bold"
                    >
                        <i className="bi bi-shield-check me-2"></i>
                        Admin Panel
                    </Navbar.Brand>

                    <Nav className="ms-auto align-items-center">
                        <Dropdown align="end">
                            <Dropdown.Toggle
                                variant="link"
                                className="text-decoration-none text-white"
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <div
                                        className="avatar bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                        }}
                                    >
                                        {user.name?.charAt(0).toUpperCase() ||
                                            "A"}
                                    </div>
                                    <div className="d-none d-md-block text-start">
                                        <div className="fw-semibold small">
                                            {user.name || "Admin"}
                                        </div>
                                        <div
                                            className="text-white-50"
                                            style={{ fontSize: "0.75rem" }}
                                        >
                                            Administrator
                                        </div>
                                    </div>
                                </div>
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item as={Link} to="/admin/profile">
                                    <i className="bi bi-person me-2"></i>
                                    Profile
                                </Dropdown.Item>
                                <Dropdown.Item as={Link} to="/admin/settings">
                                    <i className="bi bi-gear me-2"></i>
                                    Settings
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
                    className="bg-dark text-white"
                    style={{ width: "250px", minHeight: "calc(100vh - 56px)" }}
                >
                    <Nav className="flex-column p-3">
                        <Nav.Link
                            as={Link}
                            to="/admin/dashboard"
                            className={`rounded-3 mb-2 text-white ${
                                isActive("/admin/dashboard") ? "bg-danger" : ""
                            }`}
                        >
                            <i className="bi bi-speedometer2 me-2"></i>
                            Dashboard
                        </Nav.Link>

                        <div className="text-white-50 small mt-3 mb-2 px-2">
                            MANAGEMENT
                        </div>
                        <Nav.Link
                            as={Link}
                            to="/admin/users"
                            className={`rounded-3 mb-2 text-white ${
                                isActive("/admin/users") ? "bg-danger" : ""
                            }`}
                        >
                            <i className="bi bi-people me-2"></i>
                            Users
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/admin/divisions"
                            className={`rounded-3 mb-2 text-white ${
                                isActive("/admin/divisions") ? "bg-danger" : ""
                            }`}
                        >
                            <i className="bi bi-building me-2"></i>
                            Divisions
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/admin/office-locations"
                            className={`rounded-3 mb-2 text-white ${
                                isActive("/admin/office-locations")
                                    ? "bg-danger"
                                    : ""
                            }`}
                        >
                            <i className="bi bi-geo-alt me-2"></i>
                            Office Locations
                        </Nav.Link>

                        <div className="text-white-50 small mt-3 mb-2 px-2">
                            MONITORING
                        </div>
                        <Nav.Link
                            as={Link}
                            to="/admin/monitoring"
                            className={`rounded-3 mb-2 text-white ${
                                isActive("/admin/monitoring") ? "bg-danger" : ""
                            }`}
                        >
                            <i className="bi bi-monitor me-2"></i>
                            Real-Time Monitoring
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/admin/attendance"
                            className={`rounded-3 mb-2 text-white ${
                                isActive("/admin/attendance") ? "bg-danger" : ""
                            }`}
                        >
                            <i className="bi bi-calendar-check me-2"></i>
                            Attendance
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/admin/reports"
                            className={`rounded-3 mb-2 text-white ${
                                isActive("/admin/reports") ? "bg-danger" : ""
                            }`}
                        >
                            <i className="bi bi-file-earmark-bar-graph me-2"></i>
                            Reports
                        </Nav.Link>
                    </Nav>
                </div>

                {/* Main Content */}
                <div className="flex-grow-1">{children || <Outlet />}</div>
            </div>
        </div>
    );
};

export default AdminLayout;
