import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/id";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, Badge, Spinner, Alert, Modal, Row, Col } from "react-bootstrap";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import "./WorkCalendar.css";

moment.locale("id");
const localizer = momentLocalizer(moment);

const UserWorkCalendar = () => {
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateDetail, setDateDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Fetch calendar data for current month
    const fetchCalendarData = useCallback(async (date) => {
        try {
            setLoading(true);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            const response = await axiosInstance.get("/user/calendar", {
                params: { year, month },
            });

            if (response.data.success) {
                setCalendarData(response.data.data);
                generateEvents(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching calendar:", error);
            toast.error(error.response?.data?.message || "Gagal memuat kalender");
        } finally {
            setLoading(false);
        }
    }, []);

    // Generate events for calendar view - optimized
    const generateEvents = useCallback((data) => {
        const newEvents = [];

        // Holidays - red/orange badges
        data.holidays?.forEach((holiday) => {
            newEvents.push({
                id: `holiday-${holiday.id}`,
                title: `🎉 ${holiday.name}`,
                start: new Date(holiday.date + "T00:00:00"),
                end: new Date(holiday.date + "T23:59:59"),
                allDay: true,
                type: "holiday",
                color: holiday.is_national ? "#dc3545" : "#fd7e14",
                data: holiday,
            });
        });

        // Attendances - green (on-time) / yellow (late)
        data.attendances?.forEach((attendance) => {
            const time = attendance.check_in_time?.substring(0, 5) || "N/A";
            newEvents.push({
                id: `attendance-${attendance.id}`,
                title: attendance.is_late ? `⏰ ${time}` : `✓ ${time}`,
                start: new Date(attendance.attendance_date + "T" + (attendance.check_in_time || "08:00:00")),
                end: new Date(attendance.attendance_date + "T" + (attendance.check_out_time || "17:00:00")),
                allDay: false,
                type: "attendance",
                color: attendance.is_late ? "#ffc107" : "#28a745",
                data: attendance,
            });
        });

        // Logbooks - blue
        data.logbooks?.forEach((logbook) => {
            newEvents.push({
                id: `logbook-${logbook.id}`,
                title: `📝 ${logbook.activity.substring(0, 20)}...`,
                start: new Date(logbook.date + "T12:00:00"),
                end: new Date(logbook.date + "T12:30:00"),
                allDay: false,
                type: "logbook",
                color: "#17a2b8",
                data: logbook,
            });
        });

        // Leaves - purple, multi-day span
        data.leaves?.forEach((leave) => {
            newEvents.push({
                id: `leave-${leave.id}`,
                title: `🏖️ ${leave.type}`,
                start: new Date(leave.start_date + "T00:00:00"),
                end: new Date(leave.end_date + "T23:59:59"),
                allDay: true,
                type: "leave",
                color: leave.status === "approved" ? "#6f42c1" : leave.status === "rejected" ? "#6c757d" : "#0d6efd",
                data: leave,
            });
        });

        setEvents(newEvents);
    }, []);

    // Fetch detail for selected date
    const fetchDateDetail = useCallback(async (date) => {
        try {
            setLoadingDetail(true);
            const dateStr = moment(date).format("YYYY-MM-DD");

            const response = await axiosInstance.get(
                `/user/calendar/date/${dateStr}`,
            );

            if (response.data.success) {
                setDateDetail(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching date detail:", error);
            toast.error(error.response?.data?.message || "Gagal memuat detail");
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    // Handle date click
    const handleSelectSlot = useCallback((slotInfo) => {
        setSelectedDate(slotInfo.start);
        setShowDetailModal(true);
        fetchDateDetail(slotInfo.start);
    }, [fetchDateDetail]);

    // Handle event click
    const handleSelectEvent = useCallback((event) => {
        setSelectedDate(event.start);
        setShowDetailModal(true);
        fetchDateDetail(event.start);
    }, [fetchDateDetail]);

    // Handle month navigation
    const handleNavigate = useCallback((date) => {
        setCurrentDate(date);
        fetchCalendarData(date);
    }, [fetchCalendarData]);

    // Handle modal close
    const handleCloseModal = useCallback(() => {
        setShowDetailModal(false);
        setDateDetail(null);
    }, []);

    // Custom event style
    const eventStyleGetter = useCallback((event) => ({
        style: {
            backgroundColor: event.color,
            borderRadius: "5px",
            opacity: 0.8,
            color: "white",
            border: "0px",
            display: "block",
            fontSize: "0.85rem",
            padding: "2px 5px",
        },
    }), []);

    // Custom day cell style
    const dayPropGetter = useCallback((date) => {
        const dayOfWeek = date.getDay();
        const isToday = moment(date).isSame(moment(), "day");
        const isWorkingDay = calendarData?.workingDays?.includes(dayOfWeek);

        let style = {};

        if (isToday) {
            style.backgroundColor = "#e3f2fd";
            style.border = "2px solid #2196f3";
        } else if (!isWorkingDay) {
            style.backgroundColor = "#f8f9fa";
            style.color = "#6c757d";
        }

        return { style };
    }, [calendarData]);

    useEffect(() => {
        fetchCalendarData(currentDate);
    }, [fetchCalendarData, currentDate]);

    const messages = useMemo(
        () => ({
            allDay: "Sepanjang Hari",
            previous: "Sebelumnya",
            next: "Selanjutnya",
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari",
            agenda: "Agenda",
            date: "Tanggal",
            time: "Waktu",
            event: "Kegiatan",
            noEventsInRange: "Tidak ada kegiatan dalam rentang tanggal ini.",
            showMore: (total) => `+${total} lainnya`,
        }),
        [],
    );

    // Summary statistics from API
    const summary = useMemo(() => calendarData?.summary || {}, [calendarData]);

    if (loading && !calendarData) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "500px" }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="user-work-calendar p-3 p-md-4">
            {/* Header */}
            <div className="mb-4">
                <h2 className="mb-2">
                    <i className="bi bi-calendar-week me-2 text-primary"></i>
                    Kalender Kerja
                </h2>
                <p className="text-muted mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Lihat jadwal kerja, hari libur, dan riwayat aktivitas Anda
                </p>
                <hr />
            </div>

            {/* Summary Cards */}
            <Row className="g-3 mb-4">
                <Col md={3} xs={6}>
                    <Card className="border-0 shadow-sm border-start border-success border-3 h-100">
                        <Card.Body className="text-center">
                            <i className="bi bi-check-circle fs-3 text-success mb-2 d-block"></i>
                            <h4 className="mb-1 text-success">{summary.totalAttendances || 0}</h4>
                            <small className="text-muted">Total Kehadiran</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} xs={6}>
                    <Card className="border-0 shadow-sm border-start border-warning border-3 h-100">
                        <Card.Body className="text-center">
                            <i className="bi bi-clock-history fs-3 text-warning mb-2 d-block"></i>
                            <h4 className="mb-1 text-warning">{summary.lateCount || 0}</h4>
                            <small className="text-muted">Terlambat</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} xs={6}>
                    <Card className="border-0 shadow-sm border-start border-info border-3 h-100">
                        <Card.Body className="text-center">
                            <i className="bi bi-journal-text fs-3 text-info mb-2 d-block"></i>
                            <h4 className="mb-1 text-info">{summary.logbookCount || 0}</h4>
                            <small className="text-muted">Logbook</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} xs={6}>
                    <Card className="border-0 shadow-sm border-start border-purple border-3 h-100">
                        <Card.Body className="text-center">
                            <i className="bi bi-calendar-x fs-3 text-purple mb-2 d-block"></i>
                            <h4 className="mb-1 text-purple">{summary.leaveCount || 0}</h4>
                            <small className="text-muted">Cuti/Izin</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Legend */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                    <h6 className="mb-3">
                        <i className="bi bi-palette me-2"></i>
                        Keterangan Warna
                    </h6>
                    <Row className="g-2">
                        <Col md={2} xs={6}>
                            <div className="d-flex align-items-center">
                                <Badge bg="danger" className="me-2" style={{ width: "20px", height: "20px" }}></Badge>
                                <small>Libur Nasional</small>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="d-flex align-items-center">
                                <Badge bg="success" className="me-2" style={{ width: "20px", height: "20px" }}></Badge>
                                <small>Tepat Waktu</small>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="d-flex align-items-center">
                                <Badge bg="warning" className="me-2" style={{ width: "20px", height: "20px" }}></Badge>
                                <small>Terlambat</small>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="d-flex align-items-center">
                                <Badge bg="info" className="me-2" style={{ width: "20px", height: "20px" }}></Badge>
                                <small>Logbook</small>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="d-flex align-items-center">
                                <Badge className="bg-purple me-2" style={{ width: "20px", height: "20px" }}></Badge>
                                <small>Izin/Cuti</small>
                            </div>
                        </Col>
                        <Col md={2} xs={6}>
                            <div className="d-flex align-items-center">
                                <Badge bg="secondary" className="me-2" style={{ width: "20px", height: "20px" }}></Badge>
                                <small>Hari Libur</small>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Calendar */}
            <Card className="border-0 shadow-sm">
                <Card.Body style={{ height: "650px" }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        views={["month", "week", "day", "agenda"]}
                        defaultView="month"
                        selectable
                        popup
                        step={60}
                        showMultiDayTimes
                        messages={messages}
                        eventPropGetter={eventStyleGetter}
                        dayPropGetter={dayPropGetter}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        onNavigate={handleNavigate}
                        style={{ height: "100%" }}
                    />
                </Card.Body>
            </Card>

            {/* Detail Modal */}
            <Modal show={showDetailModal} onHide={handleCloseModal} size="lg" centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title>
                        <i className="bi bi-calendar-check me-2"></i>
                        {selectedDate && moment(selectedDate).format("dddd, DD MMMM YYYY")}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingDetail ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : dateDetail ? (
                        <>
                            {/* Day Status */}
                            <Alert variant="light" className="border">
                                <Row>
                                    <Col md={6}>
                                        <strong>Hari:</strong> {moment(selectedDate).format("dddd")}
                                    </Col>
                                    <Col md={6}>
                                        <strong>Status:</strong>{" "}
                                        {dateDetail.holiday ? (
                                            <Badge bg="danger">Hari Libur</Badge>
                                        ) : dateDetail.isWorkingDay ? (
                                            <Badge bg="success">Hari Kerja</Badge>
                                        ) : (
                                            <Badge bg="secondary">Hari Libur</Badge>
                                        )}
                                    </Col>
                                </Row>
                                {dateDetail.holiday && (
                                    <div className="mt-2 pt-2 border-top">
                                        <strong className="text-danger">🎉 {dateDetail.holiday.name}</strong>
                                        {dateDetail.holiday.description && (
                                            <p className="mb-0 small text-muted mt-1">{dateDetail.holiday.description}</p>
                                        )}
                                    </div>
                                )}
                            </Alert>

                            {/* Attendance Section */}
                            <div className="mb-3">
                                <h6 className="mb-3">
                                    <i className="bi bi-clock me-2 text-success"></i>
                                    Presensi
                                </h6>
                                {dateDetail.attendance ? (
                                    <Card>
                                        <Card.Body>
                                            <Row>
                                                <Col xs={6}>
                                                    <small className="text-muted d-block">Check In</small>
                                                    <strong>{dateDetail.attendance.check_in_time || "N/A"}</strong>
                                                </Col>
                                                <Col xs={6}>
                                                    <small className="text-muted d-block">Check Out</small>
                                                    <strong>{dateDetail.attendance.check_out_time || "Belum checkout"}</strong>
                                                </Col>
                                            </Row>
                                            <div className="mt-2">
                                                <Badge bg={dateDetail.attendance.is_late ? "warning" : "success"}>
                                                    {dateDetail.attendance.is_late ? "Terlambat" : "Tepat Waktu"}
                                                </Badge>
                                                {dateDetail.attendance.is_offsite && (
                                                    <Badge bg="info" className="ms-2">Offsite</Badge>
                                                )}
                                            </div>
                                            {dateDetail.attendance.notes && (
                                                <div className="mt-2 pt-2 border-top">
                                                    <small className="text-muted">Catatan:</small>
                                                    <p className="mb-0 small">{dateDetail.attendance.notes}</p>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                ) : (
                                    <Alert variant="secondary" className="mb-0">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Tidak ada data presensi pada tanggal ini
                                    </Alert>
                                )}
                            </div>

                            {/* Logbook Section */}
                            <div className="mb-3">
                                <h6 className="mb-3">
                                    <i className="bi bi-journal-text me-2 text-info"></i>
                                    Logbook
                                </h6>
                                {dateDetail.logbook ? (
                                    <Card>
                                        <Card.Body>
                                            <h6 className="card-title">{dateDetail.logbook.activity}</h6>
                                            <p className="card-text text-muted small">{dateDetail.logbook.description}</p>
                                            <small className="text-muted">
                                                Dibuat: {moment(dateDetail.logbook.created_at).format("DD MMM YYYY HH:mm")}
                                            </small>
                                        </Card.Body>
                                    </Card>
                                ) : (
                                    <Alert variant="secondary" className="mb-0">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Tidak ada logbook pada tanggal ini
                                    </Alert>
                                )}
                            </div>

                            {/* Leave Section */}
                            <div className="mb-0">
                                <h6 className="mb-3">
                                    <i className="bi bi-calendar-x me-2 text-purple"></i>
                                    Perizinan
                                </h6>
                                {dateDetail.leave ? (
                                    <Card>
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 className="card-title">{dateDetail.leave.type}</h6>
                                                    <p className="card-text small">
                                                        {moment(dateDetail.leave.start_date).format("DD MMM")} - {moment(dateDetail.leave.end_date).format("DD MMM YYYY")}
                                                    </p>
                                                </div>
                                                <Badge bg={dateDetail.leave.status === "approved" ? "success" : dateDetail.leave.status === "rejected" ? "danger" : "warning"}>
                                                    {dateDetail.leave.status}
                                                </Badge>
                                            </div>
                                            <p className="mb-0 small text-muted">
                                                <strong>Alasan:</strong> {dateDetail.leave.reason}
                                            </p>
                                            {dateDetail.leave.approver && (
                                                <p className="mb-0 small text-muted mt-2">
                                                    <strong>Disetujui oleh:</strong> {dateDetail.leave.approver.name}
                                                </p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                ) : (
                                    <Alert variant="secondary" className="mb-0">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Tidak ada perizinan pada tanggal ini
                                    </Alert>
                                )}
                            </div>
                        </>
                    ) : (
                        <Alert variant="warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Gagal memuat detail tanggal
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <button className="btn btn-secondary" onClick={handleCloseModal}>
                        Tutup
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UserWorkCalendar;
