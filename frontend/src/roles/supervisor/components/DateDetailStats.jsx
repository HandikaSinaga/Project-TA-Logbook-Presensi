import React, { useState } from "react";
import { Card, Row, Col, Badge, Alert, Collapse } from "react-bootstrap";
import moment from "moment";
import "moment/locale/id";

moment.locale("id");

/**
 * DateDetailStats - Supervisor Work Calendar Date Detail Component
 *
 * Supports two view modes:
 * - "user" : User-specific view — identical to UserWorkCalendar date detail
 * - "team" : Aggregated team statistics (default supervisor view)
 *
 * viewMode is determined by dateDetail.viewMode from the API response.
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

    const { viewMode } = dateDetail;

    // =========================================================================
    // USER-SPECIFIC VIEW — identical to UserWorkCalendar detail
    // =========================================================================
    if (viewMode === "user") {
        const { date, dayOfWeek, isWorkingDay, holiday, attendance, logbook, leave, user } = dateDetail;

        const getDayName = (dow) => {
            const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            return days[dow] ?? "";
        };

        const getWorkTypeBadge = (workType) => {
            if (!workType) return null;
            const labels = { onsite: "Onsite", offsite: "Offsite", wfh: "WFH" };
            const variants = { onsite: "success", offsite: "warning", wfh: "info" };
            return (
                <Badge bg={variants[workType] || "secondary"} className="ms-1">
                    {labels[workType] || workType}
                </Badge>
            );
        };

        const getLeaveTypeName = (type) => {
            const map = {
                izin_sakit: "Izin Sakit",
                izin_pribadi: "Izin Pribadi",
                cuti_tahunan: "Cuti Tahunan",
                cuti_lainnya: "Cuti Lainnya",
            };
            return map[type] || type?.replace("izin_", "") || type;
        };

        return (
            <div className="date-detail-container">
                {/* Day Status Header */}
                <Alert variant="light" className="border mb-3 py-2">
                    <strong>{date} — {getDayName(dayOfWeek)}</strong>
                    {user && (
                        <Badge bg="primary" className="ms-2">
                            👤 {user.name}
                        </Badge>
                    )}
                    {holiday ? (
                        <Badge bg="danger" className="ms-2">
                            🎉 {holiday.name}
                        </Badge>
                    ) : isWorkingDay ? (
                        <Badge bg="success" className="ms-2">✓ Hari Kerja</Badge>
                    ) : (
                        <Badge bg="secondary" className="ms-2">📅 Hari Libur</Badge>
                    )}
                </Alert>

                {/* Holiday Detail */}
                {holiday && (
                    <Alert variant="danger" className="mb-3 py-2">
                        <strong>🎉 {holiday.name}</strong>
                        {holiday.description && (
                            <p className="mb-0 mt-1 small text-muted">{holiday.description}</p>
                        )}
                    </Alert>
                )}

                <Row className="g-3">
                    {/* Attendance Card */}
                    <Col md={4}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header
                                className="py-2 text-white fw-bold"
                                style={{
                                    background: attendance
                                        ? attendance.status === "late"
                                            ? "linear-gradient(135deg, #ffc107 0%, #ff8f00 100%)"
                                            : "linear-gradient(135deg, #28a745 0%, #20c997 100%)"
                                        : "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                                    fontSize: "0.85rem",
                                }}
                            >
                                <i className="bi bi-clock me-2"></i>
                                Presensi
                            </Card.Header>
                            <Card.Body className="p-3">
                                {attendance ? (
                                    <>
                                        <div className="mb-2">
                                            <Badge
                                                bg={attendance.status === "late" ? "warning" : "success"}
                                                text={attendance.status === "late" ? "dark" : undefined}
                                                className="mb-2"
                                            >
                                                {attendance.status === "late" ? "⏰ Terlambat" : "✓ Tepat Waktu"}
                                            </Badge>
                                            {getWorkTypeBadge(attendance.work_type)}
                                        </div>
                                        <div className="small">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-muted">Check In:</span>
                                                <strong>{attendance.check_in_time?.substring(0, 5) || "—"}</strong>
                                            </div>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-muted">Check Out:</span>
                                                <strong>{attendance.check_out_time?.substring(0, 5) || "—"}</strong>
                                            </div>
                                            {attendance.check_in_address && (
                                                <div className="mt-2 text-muted" style={{ fontSize: "0.75rem" }}>
                                                    <i className="bi bi-geo-alt me-1"></i>
                                                    {attendance.check_in_address}
                                                </div>
                                            )}
                                            {attendance.notes && (
                                                <div className="mt-2 border-top pt-2" style={{ fontSize: "0.8rem" }}>
                                                    <span className="text-muted">Catatan: </span>
                                                    {attendance.notes}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-2">
                                        <i className="bi bi-x-circle text-secondary" style={{ fontSize: "2rem" }}></i>
                                        <p className="text-muted small mt-2 mb-0">
                                            {holiday
                                                ? "Hari Libur"
                                                : isWorkingDay
                                                  ? "Tidak Ada Presensi"
                                                  : "Hari Non-Kerja"}
                                        </p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Logbook Card */}
                    <Col md={4}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header
                                className="py-2 text-white fw-bold"
                                style={{
                                    background: logbook
                                        ? "linear-gradient(135deg, #17a2b8 0%, #0056b3 100%)"
                                        : "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                                    fontSize: "0.85rem",
                                }}
                            >
                                <i className="bi bi-journal-text me-2"></i>
                                Logbook
                            </Card.Header>
                            <Card.Body className="p-3">
                                {logbook ? (
                                    <>
                                        <Badge
                                            bg={
                                                logbook.status === "approved"
                                                    ? "success"
                                                    : logbook.status === "rejected"
                                                      ? "danger"
                                                      : "warning"
                                            }
                                            text={logbook.status === "warning" ? "dark" : undefined}
                                            className="mb-2"
                                        >
                                            {logbook.status === "approved"
                                                ? "✓ Disetujui"
                                                : logbook.status === "rejected"
                                                  ? "✗ Ditolak"
                                                  : "⏳ Menunggu"}
                                        </Badge>
                                        {logbook.activity && (
                                            <div className="small mb-1">
                                                <span className="text-muted">Aktivitas: </span>
                                                <strong>{logbook.activity}</strong>
                                            </div>
                                        )}
                                        {logbook.description && (
                                            <div
                                                className="small text-muted mt-1"
                                                style={{ lineHeight: "1.4" }}
                                            >
                                                {logbook.description.length > 120
                                                    ? logbook.description.substring(0, 120) + "..."
                                                    : logbook.description}
                                            </div>
                                        )}
                                        <div className="small text-muted mt-2" style={{ fontSize: "0.75rem" }}>
                                            <i className="bi bi-clock me-1"></i>
                                            {moment(logbook.created_at).format("HH:mm")}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-2">
                                        <i className="bi bi-journal text-secondary" style={{ fontSize: "2rem" }}></i>
                                        <p className="text-muted small mt-2 mb-0">Belum Ada Logbook</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Leave Card */}
                    <Col md={4}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header
                                className="py-2 text-white fw-bold"
                                style={{
                                    background: leave
                                        ? "linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)"
                                        : "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                                    fontSize: "0.85rem",
                                }}
                            >
                                <i className="bi bi-calendar-x me-2"></i>
                                Izin / Cuti
                            </Card.Header>
                            <Card.Body className="p-3">
                                {leave ? (
                                    <>
                                        <Badge
                                            bg={
                                                leave.status === "approved"
                                                    ? "success"
                                                    : leave.status === "rejected"
                                                      ? "danger"
                                                      : "warning"
                                            }
                                            className="mb-2"
                                        >
                                            {leave.status === "approved"
                                                ? "✓ Disetujui"
                                                : leave.status === "rejected"
                                                  ? "✗ Ditolak"
                                                  : "⏳ Menunggu"}
                                        </Badge>
                                        <div className="small">
                                            <div className="mb-1">
                                                <span className="text-muted">Jenis: </span>
                                                <strong>{getLeaveTypeName(leave.type)}</strong>
                                            </div>
                                            <div className="mb-1">
                                                <span className="text-muted">Periode: </span>
                                                <strong>
                                                    {moment(leave.start_date).format("D MMM")} –{" "}
                                                    {moment(leave.end_date).format("D MMM YYYY")}
                                                </strong>
                                            </div>
                                            {leave.reason && (
                                                <div className="mt-1 text-muted" style={{ fontSize: "0.8rem" }}>
                                                    <span>Alasan: </span>
                                                    {leave.reason.length > 80
                                                        ? leave.reason.substring(0, 80) + "..."
                                                        : leave.reason}
                                                </div>
                                            )}
                                            {leave.reviewer && (
                                                <div className="mt-1 text-muted" style={{ fontSize: "0.75rem" }}>
                                                    <i className="bi bi-person-check me-1"></i>
                                                    Disetujui oleh: {leave.reviewer.name}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-2">
                                        <i className="bi bi-calendar-check text-secondary" style={{ fontSize: "2rem" }}></i>
                                        <p className="text-muted small mt-2 mb-0">Tidak Ada Izin</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* No Data for working day notice */}
                {isWorkingDay && !holiday && !attendance && !logbook && !leave && (
                    <Alert variant="warning" className="mt-3 mb-0">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Tidak ada data presensi, logbook, maupun izin untuk hari kerja ini.
                    </Alert>
                )}
            </div>
        );
    }

    // =========================================================================
    // TEAM VIEW — aggregated statistics (default supervisor view)
    // =========================================================================
    const { summary, holiday, _details } = dateDetail;

    const getDayName = (dayOfWeek) => {
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        return days[dayOfWeek] ?? "";
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
                                onClick={() => setExpandAttendance(!expandAttendance)}
                            >
                                {expandAttendance ? "- Sembunyikan" : "+ Detail"}
                            </button>

                            <Collapse in={expandAttendance}>
                                <div className="mt-2 pt-2 border-top">
                                    {_details?.attendances?.length > 0 ? (
                                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                            {_details.attendances.map((att) => (
                                                <div key={att.id} className="small mb-1 pb-1 border-bottom">
                                                    <strong className="d-block">{att.user?.name}</strong>
                                                    <small className="text-muted">
                                                        {att.check_in_time} — {att.check_out_time || "..."}
                                                    </small>
                                                    {att.status === "late" && (
                                                        <Badge bg="warning" text="dark" className="ms-1">
                                                            Telat
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <small className="text-muted">Tidak ada data</small>
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
                                    <h4 className="mb-0 text-info">{summary.logbook.total}</h4>
                                    <small className="text-muted">dari {summary.totalTeamMembers}</small>
                                </div>
                                <div className="text-end">
                                    <div className="small mb-1">
                                        <span className="text-success">✓ {summary.logbook.approved}</span>
                                    </div>
                                    <div className="small">
                                        <span className="text-warning">⏳ {summary.logbook.pending}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn btn-link btn-sm mt-2 p-0 w-100 text-start"
                                onClick={() => setExpandLogbook(!expandLogbook)}
                            >
                                {expandLogbook ? "- Sembunyikan" : "+ Detail"}
                            </button>

                            <Collapse in={expandLogbook}>
                                <div className="mt-2 pt-2 border-top">
                                    {_details?.logbooks?.length > 0 ? (
                                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                            {_details.logbooks.map((lb) => (
                                                <div key={lb.id} className="small mb-1 pb-1 border-bottom">
                                                    <strong className="d-block">{lb.user?.name}</strong>
                                                    <small className="text-muted">
                                                        {lb.description?.substring(0, 50)}...
                                                    </small>
                                                    <Badge
                                                        bg={
                                                            lb.status === "approved"
                                                                ? "success"
                                                                : lb.status === "rejected"
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
                                        <small className="text-muted">Tidak ada data</small>
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
                                <h4 className="mb-0 text-primary">{summary.leave.approved}</h4>
                                <small className="text-muted">Tersetujui</small>
                            </div>

                            <button
                                className="btn btn-link btn-sm mt-2 p-0 w-100 text-start"
                                onClick={() => setExpandLeave(!expandLeave)}
                            >
                                {expandLeave ? "- Sembunyikan" : "+ Detail"}
                            </button>

                            <Collapse in={expandLeave}>
                                <div className="mt-2 pt-2 border-top">
                                    <div className="small mb-2">
                                        <span className="text-success">✓ Disetujui: </span>
                                        <strong>{summary.leave.approved}</strong>
                                    </div>
                                    <div className="small mb-2">
                                        <span className="text-warning">⏳ Pending: </span>
                                        <strong>{summary.leave.pending}</strong>
                                    </div>
                                    <div className="small">
                                        <span className="text-danger">✗ Ditolak: </span>
                                        <strong>{summary.leave.rejected}</strong>
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
                                    <strong>Total:</strong> {summary.totalTeamMembers}
                                </div>
                                <div className="mb-2">
                                    <strong>Hadir:</strong>{" "}
                                    <span className="text-success">{summary.attendance.total}</span>
                                </div>
                                <div className="mb-2">
                                    <strong>Izin:</strong>{" "}
                                    <span className="text-primary">{summary.leave.approved}</span>
                                </div>
                                <div>
                                    <strong>Absen:</strong>{" "}
                                    <span className="text-secondary">{summary.attendance.absent}</span>
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
                    <strong>Validasi Menunggu:</strong> {summary.validationsToday} permohonan izin
                </Alert>
            )}
        </div>
    );
};

export default DateDetailStats;
