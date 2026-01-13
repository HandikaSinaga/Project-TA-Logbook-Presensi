import { useState, useEffect } from "react";
import { Table, Row, Col, Spinner } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

function validName(text) {
    if (!text) return "Admin";
    const words = text.trim().split(" ");
    return words.slice(0, 2).join(" ");
}

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total_users: 0,
        total_divisions: 0,
        total_locations: 0,
        attendance_today: 0,
    });

    let userData = { name: "Admin" };
    try {
        const stored = localStorage.getItem("user");
        if (stored) {
            userData = JSON.parse(stored);
        }
    } catch (error) {
        console.error("Error parsing user data:", error);
    }

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get("/admin/dashboard");
            const data = response.data.data || response.data;

            if (data && data.stats) {
                setStats(data.stats);
            } else if (data) {
                // Fallback jika stats langsung di root data
                setStats({
                    total_users: data.total_users || 0,
                    total_divisions: data.total_divisions || 0,
                    total_locations: data.total_locations || 0,
                    attendance_today: data.attendance_today || 0,
                });
            } else {
                setStats({
                    total_users: 0,
                    total_divisions: 0,
                    total_locations: 0,
                    attendance_today: 0,
                });
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            setError("Gagal memuat data dashboard");
            toast.error(
                error.response?.data?.message || "Gagal memuat dashboard"
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: "400px" }}
                >
                    <Spinner
                        animation="grow"
                        variant="primary"
                        className="me-2"
                    />
                    <Spinner
                        animation="grow"
                        variant="secondary"
                        className="me-2"
                    />
                    <Spinner animation="grow" variant="success" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard">
                <div
                    className="alert alert-danger d-flex align-items-center"
                    role="alert"
                >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>
                        {error}
                        <button
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={fetchDashboardData}
                        >
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Coba Lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <div className="mb-4">
                <h2 className="page-title mb-1">
                    Hi, {validName(userData.name)}!
                </h2>
                <p className="page-desc text-muted">
                    Welcome to the management dashboard
                </p>
            </div>

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
                <Col md={6} lg={3}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Total Users
                                </p>
                                <h3 className="mb-0 fw-bold text-white">
                                    {stats.total_users || 0}
                                </h3>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-people fs-4 text-primary"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/admin/users"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>Manage
                            Users
                        </NavLink>
                    </div>
                </Col>
                <Col md={6} lg={3}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Total Divisions
                                </p>
                                <h3 className="mb-0 fw-bold text-white">
                                    {stats.total_divisions || 0}
                                </h3>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-building fs-4 text-success"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/admin/divisions"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>Manage
                            Divisions
                        </NavLink>
                    </div>
                </Col>
                <Col md={6} lg={3}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Office Locations
                                </p>
                                <h3 className="mb-0 fw-bold text-white">
                                    {stats.total_locations || 0}
                                </h3>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-geo-alt fs-4 text-info"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/admin/office-locations"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>Manage
                            Locations
                        </NavLink>
                    </div>
                </Col>
                <Col md={6} lg={3}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Attendance Today
                                </p>
                                <h3 className="mb-0 fw-bold text-white">
                                    {stats.attendance_today || 0}
                                </h3>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-calendar-check fs-4 text-warning"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/admin/attendance"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>View
                            Attendance
                        </NavLink>
                    </div>
                </Col>
            </Row>

            {/* Quick Actions */}
            <Row className="g-3 mb-4">
                <Col md={12}>
                    <div className="cards">
                        <div className="cards-body">
                            <h5 className="mb-3">
                                <i className="bi bi-lightning-charge me-2"></i>
                                Quick Actions
                            </h5>
                            <Row className="g-2">
                                <Col xs={6} md={3}>
                                    <NavLink
                                        to="/admin/users"
                                        className="btn btn-outline-primary w-100"
                                    >
                                        <i className="bi bi-person-plus me-2"></i>
                                        Add User
                                    </NavLink>
                                </Col>
                                <Col xs={6} md={3}>
                                    <NavLink
                                        to="/admin/monitoring"
                                        className="btn btn-outline-success w-100"
                                    >
                                        <i className="bi bi-eye me-2"></i>
                                        Monitoring
                                    </NavLink>
                                </Col>
                                <Col xs={6} md={3}>
                                    <NavLink
                                        to="/admin/reports"
                                        className="btn btn-outline-info w-100"
                                    >
                                        <i className="bi bi-file-earmark-text me-2"></i>
                                        Reports
                                    </NavLink>
                                </Col>
                                <Col xs={6} md={3}>
                                    <NavLink
                                        to="/admin/system-settings"
                                        className="btn btn-outline-secondary w-100"
                                    >
                                        <i className="bi bi-gear me-2"></i>
                                        Settings
                                    </NavLink>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Management Overview */}
            <Row className="g-3">
                <Col md={12}>
                    <div className="cards">
                        <div className="cards-title d-flex justify-content-between align-items-center">
                            <h4>
                                <i className="bi bi-list-check me-2"></i>
                                Management Overview
                            </h4>
                            <NavLink
                                to="/admin/attendance"
                                className="text-blue text-decoration-none"
                            >
                                View All <i className="bi bi-arrow-right"></i>
                            </NavLink>
                        </div>
                        <div className="cards-body">
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th width="5%">#</th>
                                            <th>Module</th>
                                            <th
                                                width="15%"
                                                className="text-center"
                                            >
                                                Count
                                            </th>
                                            <th
                                                width="15%"
                                                className="text-center"
                                            >
                                                Status
                                            </th>
                                            <th
                                                width="15%"
                                                className="text-center"
                                            >
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>1</td>
                                            <td>
                                                <i className="bi bi-people me-2 text-primary"></i>
                                                <strong>
                                                    Users Management
                                                </strong>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-primary">
                                                    {stats.total_users || 0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-success">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/admin/users"
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </NavLink>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>2</td>
                                            <td>
                                                <i className="bi bi-building me-2 text-success"></i>
                                                <strong>Divisions</strong>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-success">
                                                    {stats.total_divisions || 0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-success">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/admin/divisions"
                                                    className="btn btn-sm btn-outline-success"
                                                >
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </NavLink>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>3</td>
                                            <td>
                                                <i className="bi bi-geo-alt me-2 text-info"></i>
                                                <strong>
                                                    Office Locations
                                                </strong>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-info">
                                                    {stats.total_locations || 0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-success">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/admin/office-locations"
                                                    className="btn btn-sm btn-outline-info"
                                                >
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </NavLink>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>4</td>
                                            <td>
                                                <i className="bi bi-calendar-check me-2 text-warning"></i>
                                                <strong>
                                                    Today's Attendance
                                                </strong>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-warning text-dark">
                                                    {stats.attendance_today ||
                                                        0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-info">
                                                    Updated
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/admin/attendance"
                                                    className="btn btn-sm btn-outline-warning"
                                                >
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </NavLink>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;
