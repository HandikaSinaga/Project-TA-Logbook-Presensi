import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/id";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, Badge, Spinner, Alert, Row, Col, Form, Button } from "react-bootstrap";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import "./WorkCalendar.css";

moment.locale("id");
const localizer = momentLocalizer(moment);

// Enhanced Color palette with industry best practices
const COLORS = {
    holiday: "#dc3545",       // Red - National holiday (Priority 1)
    holidayCustom: "#fd7e14", // Orange - Custom holiday (Priority 2)
    absent: "#6c757d",        // Gray - Absent/Alpha (Priority 3)
    leave: "#6f42c1",         // Purple - Approved leave (Priority 4)
    late: "#ffc107",          // Yellow - Late (Priority 5)
    present: "#28a745",       // Green - On time (Priority 6 - Lowest)
    weekend: "#f8f9fa",       // Light gray - Weekend
};

const EVENT_PRIORITY = {
    holiday: 1,
    absent: 2,
    leave: 3,
    late: 4,
    present: 5,
};

const AdminWorkCalendar = () => {
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState(null);
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateDetail, setDateDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [selectedDivisionId, setSelectedDivisionId] = useState("");
    const [divisions, setDivisions] = useState([]);
    
    const detailRef = useRef(null);

    // Fetch divisions list
    useEffect(() => {
        const fetchDivisions = async () => {
            try {
                const response = await axiosInstance.get("/admin/divisions");
                if (response.data.success) {
                    setDivisions(response.data.data || response.data.divisions || []);
                }
            } catch (error) {
                console.error("Error fetching divisions:", error);
            }
        };
        fetchDivisions();
    }, []);

    // Fetch calendar data
    const fetchCalendarData = useCallback(async (date) => {
        try {
            setLoading(true);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            const params = { year, month };
            if (selectedDivisionId) {
                params.division_id = selectedDivisionId;
            }

            const response = await axiosInstance.get("/admin/calendar", { params });

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
    }, [selectedDivisionId]);

    // Generate events with full color implementation
    const generateEvents = useCallback((data) => {
        const newEvents = [];

        // Holidays - Red for national, Orange for custom
        data.holidays?.forEach((holiday) => {
            newEvents.push({
                id: `holiday-${holiday.id}`,
                title: `🎉 ${holiday.name}`,
                start: new Date(holiday.date + "T00:00:00"),
                end: new Date(holiday.date + "T23:59:59"),
                allDay: true,
                type: "holiday",
                color: holiday.is_national ? COLORS.holiday : COLORS.holidayCustom,
                resource: holiday,
            });
        });

        // Attendance summary - Green for normal, Yellow if any late
        if (data.attendances) {
            const attendancesByDate = {};
            data.attendances.forEach((attendance) => {
                const date = attendance.date;
                if (!attendancesByDate[date]) {
                    attendancesByDate[date] = { total: 0, late: 0 };
                }
                attendancesByDate[date].total++;
                if (attendance.status === 'late') attendancesByDate[date].late++;
            });

            Object.keys(attendancesByDate).forEach((date) => {
                const stats = attendancesByDate[date];
                newEvents.push({
                    id: `attendance-${date}`,
                    title: `👥 ${stats.total} user${stats.late > 0 ? ` (⚠️${stats.late})` : ""}`,
                    start: new Date(date + "T00:00:00"),
                    end: new Date(date + "T23:59:59"),
                    allDay: true,
                    type: "attendance",
                    color: stats.late > 0 ? COLORS.late : COLORS.present,
                    resource: stats,
                });
            });
        }

        // Leave summary - Purple color
        data.leaves?.forEach((leave) => {
            const userName = leave.user?.name || "User";
            const shortName = userName.length > 15 ? `${userName.substring(0, 15)}...` : userName;
            newEvents.push({
                id: `leave-${leave.id}`,
                title: `🏖️ ${shortName}`,
                start: new Date(leave.start_date + "T00:00:00"),
                end: new Date(leave.end_date + "T23:59:59"),
                allDay: true,
                type: "leave",
                color: COLORS.leave,
                resource: leave,
            });
        });

        setEvents(newEvents);
    }, []);

    // Fetch date detail
    const fetchDateDetail = useCallback(async (date) => {
        try {
            setLoadingDetail(true);
            const dateStr = moment(date).format("YYYY-MM-DD");

            const params = {};
            if (selectedDivisionId) {
                params.division_id = selectedDivisionId;
            }

            const response = await axiosInstance.get(`/admin/calendar/date/${dateStr}`, { params });

            if (response.data.success) {
                setDateDetail(response.data.data);
                // Auto scroll to detail section
                setTimeout(() => {
                    detailRef.current?.scrollIntoView({ 
                        behavior: "smooth", 
                        block: "start" 
                    });
                }, 100);
            }
        } catch (error) {
            console.error("Error fetching date detail:", error);
            toast.error("Gagal memuat detail tanggal");
        } finally {
            setLoadingDetail(false);
        }
    }, [selectedDivisionId]);

    // Handle date/event click
    const handleSelectSlot = useCallback((slotInfo) => {
        setSelectedDate(slotInfo.start);
        fetchDateDetail(slotInfo.start);
    }, [fetchDateDetail]);

    const handleSelectEvent = useCallback((event) => {
        setSelectedDate(event.start);
        fetchDateDetail(event.start);
    }, [fetchDateDetail]);

    const handleNavigate = useCallback((date) => {
        setCurrentDate(date);
        fetchCalendarData(date);
        setSelectedDate(null);
        setDateDetail(null);
    }, [fetchCalendarData]);

    // Handle division filter change
    const handleDivisionFilterChange = useCallback((e) => {
        setSelectedDivisionId(e.target.value);
    }, []);

    // Close detail section
    const handleCloseDetail = useCallback(() => {
        setSelectedDate(null);
        setDateDetail(null);
    }, []);

    // Event styling - Apply colors to all events
    const eventStyleGetter = useCallback((event) => {
        if (!event || !event.color) return {};
        
        return {
            style: {
                backgroundColor: event.color,
                borderRadius: "4px",
                opacity: 0.95,
                color: "white",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: "600",
                padding: "2px 6px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            },
        };
    }, []);

    // Day cell styling
    const dayPropGetter = useCallback((date) => {
        const dayOfWeek = date.getDay();
        const isToday = moment(date).isSame(moment(), "day");
        const isWorkingDay = calendarData?.workingDays?.includes(dayOfWeek);

        let style = {};
        if (isToday) {
            style = {
                backgroundColor: "#e3f2fd",
                fontWeight: "bold",
            };
        } else if (!isWorkingDay) {
            style = {
                backgroundColor: COLORS.weekend,
                color: "#adb5bd",
            };
        }
        return { style };
    }, [calendarData]);

    useEffect(() => {
        fetchCalendarData(currentDate);
    }, [fetchCalendarData, currentDate]);

    // Indonesian messages
    const messages = useMemo(() => ({
        allDay: "Sepanjang Hari",
        previous: "◄",
        next: "►",
        today: "Hari Ini",
        month: "Bulan",
        week: "Minggu",
        day: "Hari",
        agenda: "Agenda",
        date: "Tanggal",
        time: "Waktu",
        event: "Kegiatan",
        noEventsInRange: "Tidak ada kegiatan",
        showMore: (total) => `+${total} lagi`,
    }), []);

    if (loading && !calendarData) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="work-calendar-container p-3">
            {/* Header */}
            <div className="mb-3 d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                    <h3 className="mb-1">
                        <i className="bi bi-calendar-week me-2 text-primary"></i>
                        Kalender Kerja - Monitoring Sistem
                    </h3>
                    <p className="text-muted small mb-0">
                        Monitor seluruh aktivitas organisasi
                    </p>
                </div>
                <Link to="/admin/system-settings" className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-gear me-2"></i>
                    Kelola Hari Libur
                </Link>
            </div>

            {/* Filter - Compact */}
            <Card className="mb-3 border-0 shadow-sm">
                <Card.Body className="p-2">
                    <Row className="g-2 align-items-center">
                        <Col xs={12} md={4}>
                            <Form.Select 
                                size="sm"
                                value={selectedDivisionId} 
                                onChange={handleDivisionFilterChange}
                            >
                                <option value="">📋 Semua Divisi</option>
                                {divisions.map((division) => (
                                    <option key={division.id} value={division.id}>
                                        {division.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Summary Cards - Compact */}
            {calendarData?.statistics && (
                <Row className="g-2 mb-3">
                    <Col xs={3}>
                        <Card className="border-0 shadow-sm border-start border-primary border-3">
                            <Card.Body className="p-2 text-center">
                                <h5 className="mb-0 text-primary">{calendarData.statistics.totalUsers || 0}</h5>
                                <small className="text-muted">Total User</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={3}>
                        <Card className="border-0 shadow-sm border-start border-success border-3">
                            <Card.Body className="p-2 text-center">
                                <h5 className="mb-0 text-success">{calendarData.statistics.attendanceCount || 0}</h5>
                                <small className="text-muted">Kehadiran</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={3}>
                        <Card className="border-0 shadow-sm border-start border-danger border-3">
                            <Card.Body className="p-2 text-center">
                                <h5 className="mb-0 text-danger">{calendarData.holidays?.length || 0}</h5>
                                <small className="text-muted">Hari Libur</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={3}>
                        <Card className="border-0 shadow-sm border-start border-purple border-3">
                            <Card.Body className="p-2 text-center">
                                <h5 className="mb-0 text-purple">{calendarData.leaves?.length || 0}</h5>
                                <small className="text-muted">Cuti</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Legend - Konsisten dengan Prioritas */}
            <Card className="mb-3 border-0 shadow-sm">
                <Card.Body className="py-3 px-3">
                    <h6 className="mb-3">
                        <i className="bi bi-palette me-2"></i>
                        <strong>Keterangan Warna Kalender</strong>
                        <small className="text-muted ms-2">(Urutan Prioritas)</small>
                    </h6>
                    <Row className="g-2">
                        {[
                            { color: COLORS.holiday, label: "Libur Nasional", icon: "🎉", priority: 1 },
                            { color: COLORS.holidayCustom, label: "Hari Libur", icon: "📅", priority: 2 },
                            { color: COLORS.leave, label: "Izin/Cuti Disetujui", icon: "🏖️", priority: 3 },
                            { color: COLORS.late, label: "Ada yang Terlambat", icon: "⏰", priority: 4 },
                            { color: COLORS.present, label: "Presensi Normal", icon: "✓", priority: 5 },
                        ].map((item) => (
                            <Col xs={6} md={4} lg={3} xl={2} key={item.priority}>
                                <div 
                                    className="d-flex align-items-center p-2 rounded"
                                    style={{
                                        border: "1px solid rgba(0,0,0,0.1)",
                                        backgroundColor: "rgba(255,255,255,0.5)",
                                    }}
                                >
                                    <span
                                        className="me-2 flex-shrink-0"
                                        style={{
                                            display: "inline-block",
                                            width: "20px",
                                            height: "20px",
                                            backgroundColor: item.color,
                                            borderRadius: "3px",
                                            border: "2px solid rgba(0,0,0,0.2)",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                        }}
                                    ></span>
                                    <small className="text-nowrap fw-medium">
                                        <span className="me-1">{item.icon}</span>
                                        {item.label}
                                    </small>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            {/* Calendar - Optimized Height */}
            <Card className="border-0 shadow-sm mb-3">
                <Card.Body style={{ height: "500px", padding: "0.75rem" }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: "100%" }}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        onNavigate={handleNavigate}
                        selectable
                        popup
                        eventPropGetter={eventStyleGetter}
                        dayPropGetter={dayPropGetter}
                        messages={messages}
                        views={["month"]}
                        defaultView="month"
                    />
                </Card.Body>
            </Card>

            {/* Detail Section - Below Calendar with Auto Scroll */}
            {selectedDate && (
                <div ref={detailRef} className="detail-section">
                    <Card className="border-0 shadow">
                        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                            <div>
                                <i className="bi bi-calendar-check me-2"></i>
                                <strong>{moment(selectedDate).format("dddd, DD MMMM YYYY")}</strong>
                            </div>
                            <Button 
                                variant="light" 
                                size="sm" 
                                onClick={handleCloseDetail}
                                className="btn-close btn-close-white"
                                aria-label="Close"
                            ></Button>
                        </Card.Header>
                        <Card.Body>
                            {loadingDetail ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" variant="primary" size="sm" />
                                    <p className="mt-2 text-muted small">Memuat detail...</p>
                                </div>
                            ) : dateDetail ? (
                                <>
                                    {/* Statistics Card */}
                                    <Alert variant="light" className="border mb-3 py-2">
                                        <Row className="text-center">
                                            <Col xs={3}>
                                                <h5 className="mb-0 text-primary">{dateDetail.statistics?.totalUsers || 0}</h5>
                                                <small className="text-muted">Total User</small>
                                            </Col>
                                            <Col xs={3}>
                                                <h5 className="mb-0 text-success">{dateDetail.statistics?.presentCount || 0}</h5>
                                                <small className="text-muted">Hadir</small>
                                            </Col>
                                            <Col xs={3}>
                                                <h5 className="mb-0 text-warning">{dateDetail.statistics?.leaveCount || 0}</h5>
                                                <small className="text-muted">Izin</small>
                                            </Col>
                                            <Col xs={3}>
                                                <h5 className="mb-0 text-danger">{dateDetail.statistics?.absentCount || 0}</h5>
                                                <small className="text-muted">Tidak Hadir</small>
                                            </Col>
                                        </Row>
                                        {dateDetail.holiday && (
                                            <div className="mt-2 pt-2 border-top text-center">
                                                <Badge bg="danger">
                                                    🎉 {dateDetail.holiday.name}
                                                </Badge>
                                            </div>
                                        )}
                                    </Alert>

                                    {/* Data Tables */}
                                    <Row className="g-3">
                                        {/* Attendances */}
                                        <Col md={6}>
                                            <h6 className="mb-2">
                                                <i className="bi bi-people me-2 text-success"></i>
                                                Presensi ({dateDetail.attendances?.length || 0})
                                            </h6>
                                            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                                                {dateDetail.attendances?.length > 0 ? (
                                                    dateDetail.attendances.map((att) => (
                                                        <Card key={att.id} className="mb-2 border">
                                                            <Card.Body className="p-2">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <div>
                                                                        <strong className="small">{att.user?.name || "User"}</strong>
                                                                        <br />
                                                                        <small className="text-muted">
                                                                            {att.check_in_time || "N/A"} - {att.check_out_time || "Belum"}
                                                                        </small>
                                                                    </div>
                                                                    <div>
                                                                        {att.status === 'late' && (
                                                                            <Badge bg="warning" text="dark">⏰ Late</Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    ))
                                                ) : (
                                                    <Alert variant="secondary" className="py-2 small mb-0">
                                                        <i className="bi bi-info-circle me-1"></i>
                                                        Tidak ada presensi
                                                    </Alert>
                                                )}
                                            </div>
                                        </Col>

                                        {/* Leaves */}
                                        <Col md={6}>
                                            <h6 className="mb-2">
                                                <i className="bi bi-calendar-x me-2 text-purple"></i>
                                                Izin/Cuti ({dateDetail.leaves?.length || 0})
                                            </h6>
                                            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                                                {dateDetail.leaves?.length > 0 ? (
                                                    dateDetail.leaves.map((leave) => (
                                                        <Card key={leave.id} className="mb-2 border">
                                                            <Card.Body className="p-2">
                                                                <div className="d-flex justify-content-between">
                                                                    <div>
                                                                        <strong className="small">{leave.user?.name || "User"}</strong>
                                                                        <br />
                                                                        <small className="text-muted">{leave.type}</small>
                                                                    </div>
                                                                    <Badge bg={leave.status === "approved" ? "success" : leave.status === "rejected" ? "danger" : "warning"}>
                                                                        {leave.status}
                                                                    </Badge>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    ))
                                                ) : (
                                                    <Alert variant="secondary" className="py-2 small mb-0">
                                                        <i className="bi bi-info-circle me-1"></i>
                                                        Tidak ada izin/cuti
                                                    </Alert>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                </>
                            ) : (
                                <Alert variant="danger" className="mb-0">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    Gagal memuat detail tanggal
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AdminWorkCalendar;
