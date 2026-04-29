import React, { useState } from "react";
import { Card, Row, Col, Badge, Alert, Collapse } from "react-bootstrap";

/**
 * DateDetailStats - Supervisor Work Calendar Date Detail Component
 *
 * Best Practice Implementation:
 * - Displays aggregated statistics by default
 * - Optional expandable sections for detailed view
 * - Clean separation of concerns (stats vs details)
 * - Responsive layout without changing UI/UX
 */
const DateDetailStats = ({ dateDetail, loading }) => {
    const [expandAttendance, setExpandAttendance] = useState(false);
    const [expandLogbook, setExpandLogbook] = useState(false);
    const [expandLeave, setExpandLeave] = useState(false);

    if (loading) {
        return (
            <div className="text-center py-4">
                <p className="mt-2 text-muted small">Memuat detail...</p>
            </div>
        );
    }

    if (!dateDetail) {
        return null;
    }

    const { summary, holiday, _details } = dateDetail;

    const getDayName = (dayOfWeek) => {
        const days = [
            "Minggu",
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
        ];
        return days[dayOfWeek];
    };

    const getStatusBadge = (status, count) => {
        const variants = {
            onTime: "success",
            late: "warning",
            absent: "secondary",
            pending: "warning",
            approved: "success",
            rejected: "danger",
        };
        return (
            <Badge bg={variants[status] || "secondary"} className="ms-1">
                {count}
            </Badge>
        );
    };

    return (
        <div className="date-detail-container">
            {/* Day Header */}
            <Alert variant="light" className="border mb-3 py-2">
                <strong>
                    {summary.date} - {getDayName(summary.dayOfWeek)}
                </strong>
                {holiday ? (
                    <Badge bg="danger" className="ms-2">
                        🎉 {holiday.name}
                    </Badge>
                ) : summary.isWorkingDay ? (
                    <Badge bg="success" className="ms-2">
                        ✓ Hari Kerja
                    </Badge>
                ) : (
                    <Badge bg="secondary" className="ms-2">
                        📅 Hari Libur
                    </Badge>
                )}
            </Alert>

            {/* Main Statistics Cards */}
            <Row className="g-3 mb-3">
                {/* Attendance Card */}
                <Col md={6} lg={3}>
                    <Card className="border shadow-sm h-100">
                        <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <small className="text-muted d-block mb-2">
                                        <i className="bi bi-clock me-1"></i>
                                        PRESENSI
                                    </small>
                                    <h4 className="mb-0 text-success">
                                        {summary.attendance.total}
                                    </h4>
                                    <small className="text-muted">
                                        dari {summary.totalTeamMembers}
                                    </small>
                                </div>
                                <div className="text-end">
                                    <div className="small mb-1">
                                        <span className="text-success">
                                            ✓ {summary.attendance.onTime}
                                        </span>
                                    </div>
                                    <div className="small">
                                        <span className="text-warning">
                                            ⏰ {summary.attendance.late}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expandable Details */}
                            <button
                                className="btn btn-link btn-sm mt-2 p-0 w-100 text-start"
                                onClick={() =>
                                    setExpandAttendance(!expandAttendance)
                                }
                            >
                                {expandAttendance
                                    ? "- Sembunyikan"
                                    : "+ Detail"}
                            </button>

                            <Collapse in={expandAttendance}>
                                <div className="mt-2 pt-2 border-top">
                                    {_details?.attendances?.length > 0 ? (
                                        <div
                                            style={{
                                                maxHeight: "200px",
                                                overflowY: "auto",
                                            }}
                                        >
                                            {_details.attendances.map((att) => (
                                                <div
                                                    key={att.id}
                                                    className="small mb-1 pb-1 border-bottom"
                                                >
                                                    <strong className="d-block">
                                                        {att.user?.name}
                                                    </strong>
                                                    <small className="text-muted">
                                                        {att.check_in_time} -{" "}
                                                        {att.check_out_time ||
                                                            "..."}
                                                    </small>
                                                    {att.status === "late" && (
                                                        <Badge
                                                            bg="warning"
                                                            text="dark"
                                                            className="ms-1"
                                                        >
                                                            Telat
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <small className="text-muted">
                                            Tidak ada data
                                        </small>
                                    )}
                                </div>
                            </Collapse>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Logbook Card */}
                <Col md={6} lg={3}>
                    <Card className="border shadow-sm h-100">
                        <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <small className="text-muted d-block mb-2">
                                        <i className="bi bi-journal-text me-1"></i>
                                        LOGBOOK
                                    </small>
                                    <h4 className="mb-0 text-info">
                                        {summary.logbook.total}
                                    </h4>
                                    <small className="text-muted">
                                        dari {summary.totalTeamMembers}
                                    </small>
                                </div>
                                <div className="text-end">
                                    <div className="small mb-1">
                                        <span className="text-success">
                                            ✓ {summary.logbook.approved}
                                        </span>
                                    </div>
                                    <div className="small">
                                        <span className="text-warning">
                                            ⏳ {summary.logbook.pending}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expandable Details */}
                            <button
                                className="btn btn-link btn-sm mt-2 p-0 w-100 text-start"
                                onClick={() => setExpandLogbook(!expandLogbook)}
                            >
                                {expandLogbook ? "- Sembunyikan" : "+ Detail"}
                            </button>

                            <Collapse in={expandLogbook}>
                                <div className="mt-2 pt-2 border-top">
                                    {_details?.logbooks?.length > 0 ? (
                                        <div
                                            style={{
                                                maxHeight: "200px",
                                                overflowY: "auto",
                                            }}
                                        >
                                            {_details.logbooks.map((lb) => (
                                                <div
                                                    key={lb.id}
                                                    className="small mb-1 pb-1 border-bottom"
                                                >
                                                    <strong className="d-block">
                                                        {lb.user?.name}
                                                    </strong>
                                                    <small className="text-muted">
                                                        {lb.description?.substring(
                                                            0,
                                                            50,
                                                        )}
                                                        ...
                                                    </small>
                                                    <Badge
                                                        bg={
                                                            lb.status ===
                                                            "approved"
                                                                ? "success"
                                                                : lb.status ===
                                                                    "rejected"
                                                                  ? "danger"
                                                                  : "warning"
                                                        }
                                                        className="ms-1"
                                                    >
                                                        {lb.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <small className="text-muted">
                                            Tidak ada data
                                        </small>
                                    )}
                                </div>
                            </Collapse>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Leave Card */}
                <Col md={6} lg={3}>
                    <Card className="border shadow-sm h-100">
                        <Card.Body className="p-3">
                            <div>
                                <small className="text-muted d-block mb-2">
                                    <i className="bi bi-calendar-x me-1"></i>
                                    IZIN
                                </small>
                                <h4 className="mb-0 text-primary">
                                    {summary.leave.approved}
                                </h4>
                                <small className="text-muted">Tersetujui</small>
                            </div>

                            {/* Expandable Details */}
                            <button
                                className="btn btn-link btn-sm mt-2 p-0 w-100 text-start"
                                onClick={() => setExpandLeave(!expandLeave)}
                            >
                                {expandLeave ? "- Sembunyikan" : "+ Detail"}
                            </button>

                            <Collapse in={expandLeave}>
                                <div className="mt-2 pt-2 border-top">
                                    <div className="small mb-2">
                                        <span className="text-success">
                                            ✓ Disetujui:{" "}
                                        </span>
                                        <strong>
                                            {summary.leave.approved}
                                        </strong>
                                    </div>
                                    <div className="small mb-2">
                                        <span className="text-warning">
                                            ⏳ Pending:{" "}
                                        </span>
                                        <strong>{summary.leave.pending}</strong>
                                    </div>
                                    <div className="small">
                                        <span className="text-danger">
                                            ✗ Ditolak:{" "}
                                        </span>
                                        <strong>
                                            {summary.leave.rejected}
                                        </strong>
                                    </div>
                                </div>
                            </Collapse>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Summary Card */}
                <Col md={6} lg={3}>
                    <Card className="border shadow-sm h-100 bg-light">
                        <Card.Body className="p-3">
                            <small className="text-muted d-block mb-2">
                                <i className="bi bi-graph-up me-1"></i>
                                RINGKASAN TIM
                            </small>
                            <div className="small">
                                <div className="mb-2">
                                    <strong>Total:</strong>{" "}
                                    {summary.totalTeamMembers}
                                </div>
                                <div className="mb-2">
                                    <strong>Hadir:</strong>{" "}
                                    <span className="text-success">
                                        {summary.attendance.total}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>Izin:</strong>{" "}
                                    <span className="text-primary">
                                        {summary.leave.approved}
                                    </span>
                                </div>
                                <div>
                                    <strong>Absen:</strong>{" "}
                                    <span className="text-secondary">
                                        {summary.attendance.absent}
                                    </span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Pending Validations Alert */}
            {summary.validationsToday > 0 && (
                <Alert variant="info" className="mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Validasi Menunggu:</strong>{" "}
                    {summary.validationsToday} permohonan izin
                </Alert>
            )}
        </div>
    );
};

export default DateDetailStats;
