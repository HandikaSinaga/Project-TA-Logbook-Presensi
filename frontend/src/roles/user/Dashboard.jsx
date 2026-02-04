import { useState, useEffect } from "react";
import { Table, Row, Col, Spinner } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

function validName(text) {
    if (!text) return "User";
    const words = text.trim().split(" ");
    return words.slice(0, 2).join(" ");
}

const UserDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        attendance_status: "Belum Presensi",
        logbook_status: "Belum Mengisi",
        leave_pending: 0,
    });

    let userData = { name: "User" };
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
            const response = await axiosInstance.get("/user/dashboard");
            const data = response.data.data || response.data;

            if (data && data.stats) {
                setStats(data.stats);
            } else {
                setStats({
                    attendance_status: "Belum Presensi",
                    logbook_status: "Belum Mengisi",
                    leave_pending: 0,
                });
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            setError("Gagal memuat data dashboard");
            toast.error(
                error.response?.data?.message || "Gagal memuat dashboard",
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
                    Welcome to your employee portal
                </p>
            </div>

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
                <Col md={6} lg={4}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Attendance Today
                                </p>
                                <h4 className="mb-0 fw-bold text-white">
                                    {stats.attendance_status}
                                </h4>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-calendar-check fs-4 text-primary"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/user/attendance"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>Check
                            In/Out
                        </NavLink>
                    </div>
                </Col>
                <Col md={6} lg={4}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Logbook Today
                                </p>
                                <h4 className="mb-0 fw-bold text-white">
                                    {stats.logbook_status}
                                </h4>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-journal-text fs-4 text-success"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/user/logbook"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>Fill
                            Logbook
                        </NavLink>
                    </div>
                </Col>
                <Col md={6} lg={4}>
                    <div className="mini-cards h-100">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="text-white mb-1 small opacity-75">
                                    Pending Leave
                                </p>
                                <h4 className="mb-0 fw-bold text-white">
                                    {stats.leave_pending || 0}
                                </h4>
                            </div>
                            <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                <i className="bi bi-calendar-x fs-4 text-warning"></i>
                            </div>
                        </div>
                        <NavLink
                            to="/user/leave"
                            className="text-decoration-none text-white small d-block"
                        >
                            <i className="bi bi-arrow-right me-1"></i>
                            Request Leave
                        </NavLink>
                    </div>
                </Col>
            </Row>

            {/* Info Banner - Helper Tips */}
            {(stats.attendance_status === "Belum Presensi" ||
                stats.logbook_status === "Belum Mengisi") && (
                <Row className="g-3 mb-4">
                    <Col md={12}>
                        <div className="alert alert-info border-0 shadow-sm d-flex align-items-start mb-0">
                            <i className="bi bi-info-circle-fill fs-5 me-3 mt-1"></i>
                            <div>
                                <h6 className="alert-heading mb-2">
                                    <strong>Reminder Hari Ini</strong>
                                </h6>
                                <p className="mb-0 small">
                                    {stats.attendance_status ===
                                        "Belum Presensi" && (
                                        <>
                                            <i className="bi bi-dot"></i> Jangan
                                            lupa untuk{" "}
                                            <NavLink
                                                to="/user/attendance"
                                                className="alert-link fw-bold"
                                            >
                                                melakukan presensi
                                            </NavLink>{" "}
                                            hari ini.
                                            <br />
                                        </>
                                    )}
                                    {stats.logbook_status ===
                                        "Belum Mengisi" && (
                                        <>
                                            <i className="bi bi-dot"></i> Anda
                                            belum{" "}
                                            <NavLink
                                                to="/user/logbook"
                                                className="alert-link fw-bold"
                                            >
                                                mengisi logbook
                                            </NavLink>{" "}
                                            hari ini.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </Col>
                </Row>
            )}

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
                                        to="/user/attendance"
                                        className="btn btn-outline-primary w-100"
                                    >
                                        <i className="bi bi-calendar-check me-2"></i>
                                        Attendance
                                    </NavLink>
                                </Col>
                                <Col xs={6} md={3}>
                                    <NavLink
                                        to="/user/logbook"
                                        className="btn btn-outline-success w-100"
                                    >
                                        <i className="bi bi-journal-text me-2"></i>
                                        Logbook
                                    </NavLink>
                                </Col>
                                <Col xs={6} md={3}>
                                    <NavLink
                                        to="/user/leave"
                                        className="btn btn-outline-warning w-100"
                                    >
                                        <i className="bi bi-calendar-x me-2"></i>
                                        Leave Request
                                    </NavLink>
                                </Col>
                                <Col xs={6} md={3}>
                                    <NavLink
                                        to="/user/division"
                                        className="btn btn-outline-info w-100"
                                    >
                                        <i className="bi bi-people me-2"></i>My
                                        Division
                                    </NavLink>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Personal Overview */}
            <Row className="g-3">
                <Col md={12}>
                    <div className="cards">
                        <div className="cards-title d-flex justify-content-between align-items-center">
                            <h4>
                                <i className="bi bi-list-check me-2"></i>
                                My Activities
                            </h4>
                            <NavLink
                                to="/user/attendance"
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
                                            <th>Activity</th>
                                            <th
                                                width="20%"
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
                                                <i className="bi bi-calendar-check me-2 text-primary"></i>
                                                <strong>Attendance</strong>
                                            </td>
                                            <td className="text-center">
                                                <span
                                                    className={`badge ${
                                                        stats.attendance_status ===
                                                            "Sudah Check-in" ||
                                                        stats.attendance_status ===
                                                            "Sudah Check-out"
                                                            ? "bg-success"
                                                            : stats.attendance_status ===
                                                                "Belum Presensi"
                                                              ? "bg-danger"
                                                              : "bg-warning text-dark"
                                                    }`}
                                                >
                                                    {stats.attendance_status}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/user/attendance"
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </NavLink>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>2</td>
                                            <td>
                                                <i className="bi bi-journal-text me-2 text-success"></i>
                                                <strong>Logbook</strong>
                                            </td>
                                            <td className="text-center">
                                                <span
                                                    className={`badge ${
                                                        stats.logbook_status ===
                                                        "Sudah Mengisi"
                                                            ? "bg-success"
                                                            : stats.logbook_status ===
                                                                "Belum Mengisi"
                                                              ? "bg-danger"
                                                              : "bg-warning text-dark"
                                                    }`}
                                                >
                                                    {stats.logbook_status}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/user/logbook"
                                                    className="btn btn-sm btn-outline-success"
                                                >
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </NavLink>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>3</td>
                                            <td>
                                                <i className="bi bi-calendar-x me-2 text-warning"></i>
                                                <strong>Leave Requests</strong>
                                            </td>
                                            <td className="text-center">
                                                <span
                                                    className={`badge ${
                                                        stats.leave_pending > 0
                                                            ? "bg-warning text-dark"
                                                            : "bg-secondary"
                                                    }`}
                                                >
                                                    {stats.leave_pending || 0}{" "}
                                                    Pending
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <NavLink
                                                    to="/user/leave"
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

export default UserDashboard;
