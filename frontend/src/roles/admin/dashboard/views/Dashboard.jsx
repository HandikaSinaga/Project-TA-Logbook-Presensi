import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Table,
    Badge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import axiosInstance from "../../../../utils/axiosInstance.jsx";
import Skeleton from "react-loading-skeleton";

const Dashboard = () => {
    const [stats, setStats] = useState({});
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axiosInstance.get("/admin/dashboard");
            setStats(response.data.stats);
            setRecentActivities(response.data.recent_activities || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container className="py-4">
                <Skeleton height={50} className="mb-4" />
                <Row>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Col md={4} key={i}>
                            <Skeleton height={130} className="mb-3 rounded-4" />
                        </Col>
                    ))}
                </Row>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h1 className="fw-bold mb-1">Admin Dashboard</h1>
            <p className="text-secondary">System overview and management</p>

            <Row className="mt-4 g-3">
                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 card-soft-blue">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-uppercase small fw-semibold mb-1 opacity-75">
                                        Total Users
                                    </p>
                                    <h2 className="fw-bold mb-0">
                                        {stats.total_users || 0}
                                    </h2>
                                    <small className="text-success">
                                        <i className="bi bi-arrow-up"></i>{" "}
                                        {stats.new_users_this_month || 0} this
                                        month
                                    </small>
                                </div>
                                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                                    <i className="bi bi-people fs-2"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 card-soft-green">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-uppercase small fw-semibold mb-1 opacity-75">
                                        Total Divisions
                                    </p>
                                    <h2 className="fw-bold mb-0">
                                        {stats.total_divisions || 0}
                                    </h2>
                                    <small className="text-secondary">
                                        Active divisions
                                    </small>
                                </div>
                                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                                    <i className="bi bi-building fs-2"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 card-soft-amber">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-uppercase small fw-semibold mb-1 opacity-75">
                                        Locations
                                    </p>
                                    <h2 className="fw-bold mb-0">
                                        {stats.total_locations || 0}
                                    </h2>
                                    <small className="text-secondary">
                                        Active locations
                                    </small>
                                </div>
                                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                                    <i className="bi bi-geo-alt fs-2"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 card-soft-purple">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-uppercase small fw-semibold mb-1 opacity-75">
                                        Today Attendance
                                    </p>
                                    <h2 className="fw-bold mb-0">
                                        {stats.today_attendance || 0}
                                    </h2>
                                    <small className="text-secondary">
                                        Out of {stats.total_users || 0} users
                                    </small>
                                </div>
                                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                                    <i className="bi bi-calendar-check fs-2"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 card-soft-pink">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-uppercase small fw-semibold mb-1 opacity-75">
                                        Pending Leaves
                                    </p>
                                    <h2 className="fw-bold mb-0">
                                        {stats.pending_leaves || 0}
                                    </h2>
                                    <small className="text-warning">
                                        Needs review
                                    </small>
                                </div>
                                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                                    <i className="bi bi-clipboard-check fs-2"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-4 card-soft-teal">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-uppercase small fw-semibold mb-1 opacity-75">
                                        Avg Attendance Rate
                                    </p>
                                    <h2 className="fw-bold mb-0">
                                        {stats.avg_attendance_rate || 0}%
                                    </h2>
                                    <small className="text-success">
                                        This month
                                    </small>
                                </div>
                                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                                    <i className="bi bi-graph-up fs-2"></i>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mt-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4">Recent Activities</h5>

                            {recentActivities.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-clock-history text-secondary fs-1"></i>
                                    <p className="text-secondary mt-3">
                                        No recent activities
                                    </p>
                                </div>
                            ) : (
                                <div className="activity-timeline">
                                    {recentActivities.map((activity, idx) => (
                                        <div
                                            key={idx}
                                            className="activity-item d-flex gap-3 pb-3 mb-3 border-bottom"
                                        >
                                            <div
                                                className={`activity-icon bg-${
                                                    activity.type === "user"
                                                        ? "primary"
                                                        : activity.type ===
                                                          "attendance"
                                                        ? "success"
                                                        : "warning"
                                                } bg-opacity-10 text-${
                                                    activity.type === "user"
                                                        ? "primary"
                                                        : activity.type ===
                                                          "attendance"
                                                        ? "success"
                                                        : "warning"
                                                } rounded-circle p-2`}
                                            >
                                                <i
                                                    className={`bi bi-${activity.icon}`}
                                                ></i>
                                            </div>
                                            <div className="flex-grow-1">
                                                <p className="mb-1">
                                                    {activity.description}
                                                </p>
                                                <small className="text-secondary">
                                                    {activity.time}
                                                </small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="border-0 shadow-sm rounded-4 mb-3">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4">Quick Actions</h5>
                            <div className="d-grid gap-3">
                                <Button
                                    as={Link}
                                    to="/admin/users"
                                    variant="outline-primary"
                                    className="rounded-3"
                                >
                                    <i className="bi bi-person-plus me-2"></i>
                                    Manage Users
                                </Button>
                                <Button
                                    as={Link}
                                    to="/admin/divisions"
                                    variant="outline-success"
                                    className="rounded-3"
                                >
                                    <i className="bi bi-building me-2"></i>
                                    Manage Divisions
                                </Button>
                                <Button
                                    as={Link}
                                    to="/admin/office-locations"
                                    variant="outline-warning"
                                    className="rounded-3"
                                >
                                    <i className="bi bi-geo-alt me-2"></i>
                                    Manage Office Locations
                                </Button>
                                <Button
                                    as={Link}
                                    to="/admin/reports"
                                    variant="outline-secondary"
                                    className="rounded-3"
                                >
                                    <i className="bi bi-file-earmark-bar-graph me-2"></i>
                                    View Reports
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm rounded-4">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3">System Health</h5>
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <small>Database</small>
                                    <small className="text-success">
                                        Healthy
                                    </small>
                                </div>
                                <div
                                    className="progress"
                                    style={{ height: "8px" }}
                                >
                                    <div
                                        className="progress-bar bg-success"
                                        style={{ width: "100%" }}
                                    ></div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <small>API Response</small>
                                    <small className="text-success">
                                        {stats.api_response_time || 45}ms
                                    </small>
                                </div>
                                <div
                                    className="progress"
                                    style={{ height: "8px" }}
                                >
                                    <div
                                        className="progress-bar bg-success"
                                        style={{ width: "90%" }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="d-flex justify-content-between mb-1">
                                    <small>Active Sessions</small>
                                    <small className="text-warning">
                                        {stats.active_sessions || 12}
                                    </small>
                                </div>
                                <div
                                    className="progress"
                                    style={{ height: "8px" }}
                                >
                                    <div
                                        className="progress-bar bg-warning"
                                        style={{ width: "60%" }}
                                    ></div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;
