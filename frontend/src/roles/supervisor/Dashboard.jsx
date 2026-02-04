import { useState, useEffect } from "react";
import { Table, Row, Col, Spinner } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

function validName(text) {
    if (!text) return "Supervisor";
    const words = text.trim().split(" ");
    return words.slice(0, 2).join(" ");
}

const SupervisorDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        team_members: 0,
        present_today: 0,
        pending_approvals: 0,
        active_tasks: 0,
    });
    const [recentActivities, setRecentActivities] = useState([]);

    let userData = { name: "Supervisor" };
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
            const response = await axiosInstance.get("/supervisor/dashboard");
            const data = response.data.data || response.data;

            if (data && data.stats) {
                setStats(data.stats);
            } else {
                setStats({
                    team_members: 0,
                    present_today: 0,
                    pending_approvals: 0,
                    active_tasks: 0,
                });
            }
            setRecentActivities(data.pending_approvals || []);
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            toast.error(
                error.response?.data?.message || "Gagal memuat dashboard",
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard supervisor-dashboard">
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

    return (
        <div className="admin-dashboard supervisor-dashboard">
            {/* Header */}
            <div className="mb-4">
                <h2 className="page-title mb-1">
                    Hi, {validName(userData.name)}!
                </h2>
                <p className="page-desc text-muted">
                    Monitor and manage your team effectively
                </p>
            </div>

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
                <Col md={6} lg={3}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Team Members
                                </p>
                                <h3 className="mb-0 fw-bold text-white">
                                    {stats.team_members || 0}
                                </h3>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-people fs-4 text-primary"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/supervisor/manage-division"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>Manage
                            Team
                        </NavLink>
                    </div>
                </Col>
                <Col md={6} lg={3}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Present Today
                                </p>
                                <h3 className="mb-0 fw-bold text-white">
                                    {stats.present_today || 0}
                                </h3>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-calendar-check fs-4 text-success"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/supervisor/attendance"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>View
                            Attendance
                        </NavLink>
                    </div>
                </Col>
                <Col md={6} lg={3}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Pending Approvals
                                </p>
                                <h3 className="mb-0 fw-bold text-white">
                                    {stats.pending_approvals || 0}
                                </h3>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-exclamation-circle fs-4 text-warning"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/supervisor/leaves"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>Review
                            Requests
                        </NavLink>
                    </div>
                </Col>
                <Col md={6} lg={3}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Active Tasks
                                </p>
                                <h3 className="mb-0 fw-bold text-white">
                                    {stats.active_tasks || 0}
                                </h3>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-list-check fs-4 text-info"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/supervisor/logbooks"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>View
                            Logbooks
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
                                        to="/supervisor/attendance"
                                        className="btn btn-outline-primary w-100"
                                    >
                                        <i className="bi bi-calendar-check me-2"></i>
                                        Attendance
                                    </NavLink>
                                </Col>
                                <Col xs={6} md={3}>
                                    <NavLink
                                        to="/supervisor/logbooks"
                                        className="btn btn-outline-success w-100"
                                    >
                                        <i className="bi bi-journal-text me-2"></i>
                                        Logbooks
                                    </NavLink>
                                </Col>
                                <Col xs={6} md={3}>
                                    <NavLink
                                        to="/supervisor/leaves"
                                        className="btn btn-outline-warning w-100"
                                    >
                                        <i className="bi bi-calendar-x me-2"></i>
                                        Leave Requests
                                    </NavLink>
                                </Col>
                                <Col xs={6} md={3}>
                                    <NavLink
                                        to="/supervisor/division"
                                        className="btn btn-outline-info w-100"
                                    >
                                        <i className="bi bi-people me-2"></i>
                                        Division Info
                                    </NavLink>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Team Overview */}
            <Row className="g-3">
                <Col md={12}>
                    <div className="cards">
                        <div className="cards-title d-flex justify-content-between align-items-center">
                            <h4>
                                <i className="bi bi-list-check me-2"></i>
                                Team Overview
                            </h4>
                            <NavLink
                                to="/supervisor/attendance"
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
                                                <strong>Team Members</strong>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-primary">
                                                    {stats.team_members || 0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-success">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/supervisor/manage-division"
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </NavLink>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>2</td>
                                            <td>
                                                <i className="bi bi-calendar-check me-2 text-success"></i>
                                                <strong>Present Today</strong>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-success">
                                                    {stats.present_today || 0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-info">
                                                    Updated
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/supervisor/attendance"
                                                    className="btn btn-sm btn-outline-success"
                                                >
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </NavLink>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>3</td>
                                            <td>
                                                <i className="bi bi-exclamation-circle me-2 text-warning"></i>
                                                <strong>
                                                    Pending Approvals
                                                </strong>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-warning text-dark">
                                                    {stats.pending_approvals ||
                                                        0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-warning">
                                                    Pending
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/supervisor/leaves"
                                                    className="btn btn-sm btn-outline-warning"
                                                >
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </NavLink>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>4</td>
                                            <td>
                                                <i className="bi bi-list-check me-2 text-info"></i>
                                                <strong>Active Tasks</strong>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-info">
                                                    {stats.active_tasks || 0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-success">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/supervisor/logbooks"
                                                    className="btn btn-sm btn-outline-info"
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

export default SupervisorDashboard;
