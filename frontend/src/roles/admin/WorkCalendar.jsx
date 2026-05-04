import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/id";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
    Card,
    Badge,
    Spinner,
    Alert,
    Row,
    Col,
    Form,
    Button,
    InputGroup,
} from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import {
    isFutureDate,
    isToday as checkIsToday,
    formatDateToString,
} from "../../utils/dateHelper";
import "./WorkCalendar.css";

moment.locale("id");
const localizer = momentLocalizer(moment);

// Enhanced Color palette with industry best practices
const COLORS = {
    holiday: "#dc3545", // Red - National holiday (Priority 1)
    holidayCustom: "#fd7e14", // Orange - Custom holiday (Priority 2)
    absent: "#6c757d", // Gray - Absent/Alpha (Priority 3)
    leave: "#6f42c1", // Purple - Approved leave (Priority 4)
    late: "#ffc107", // Yellow - Late (Priority 5)
    present: "#28a745", // Green - On time (Priority 6)
    logbook: "#17a2b8", // Cyan - Logbook (Priority 7)
    weekend: "#f8f9fa", // Light gray - Weekend
};

const EVENT_PRIORITY = {
    holiday: 1,
    absent: 2,
    leave: 3,
    late: 4,
    present: 5,
};

const AdminWorkCalendar = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(() => {
        // Initialize from URL params if available
        const urlMonth = searchParams.get("month");
        const urlYear = searchParams.get("year");
        if (urlMonth && urlYear) {
            return new Date(parseInt(urlYear), parseInt(urlMonth) - 1, 1);
        }
        return new Date();
    });
    const [calendarData, setCalendarData] = useState(null);
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateDetail, setDateDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [selectedDivisionId, setSelectedDivisionId] = useState("");
    const [divisions, setDivisions] = useState([]);

    // Filter states
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const urlMonth = searchParams.get("month");
        return urlMonth || String(new Date().getMonth() + 1).padStart(2, "0");
    });
    const [selectedYear, setSelectedYear] = useState(() => {
        const urlYear = searchParams.get("year");
        return urlYear || String(new Date().getFullYear());
    });

    const detailRef = useRef(null);

    // Fetch divisions list
    useEffect(() => {
        const fetchDivisions = async () => {
            try {
                const response = await axiosInstance.get("/admin/divisions");
                if (response.data.success) {
                    setDivisions(
                        response.data.data || response.data.divisions || [],
                    );
                }
            } catch (error) {
                console.error("Error fetching divisions:", error);
            }
        };
        fetchDivisions();
    }, []);

    // Fetch calendar data with comprehensive error handling and retry logic
    const fetchCalendarData = useCallback(
        async (date) => {
            try {
                setLoading(true);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;

                const params = { year, month };
                if (selectedDivisionId) {
                    params.division_id = parseInt(selectedDivisionId);
                }

                const response = await axiosInstance.get("/admin/calendar", {
                    params,
                });

                if (response.data.success && response.data.data) {
                    setCalendarData(response.data.data);
                    generateEvents(response.data.data);

                    // Log data for debugging
                    console.log("✅ Calendar Data Loaded:", {
                        period: response.data.data.period,
                        divisionFilter: selectedDivisionId || "all",
                        users: response.data.data.memberStats?.length || 0,
                        totalAttendances:
                            response.data.data.attendances?.length || 0,
                        totalLeaves: response.data.data.leaves?.length || 0,
                        totalLogbooks: response.data.data.logbooks?.length || 0,
                        divisionStats:
                            response.data.data.divisionStats?.length || 0,
                    });
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (error) {
                console.error("❌ Error fetching calendar:", error);
                toast.error(
                    error.response?.data?.message || "Gagal memuat kalender",
                );
                setCalendarData(null);
            } finally {
                setLoading(false);
            }
        },
        [selectedDivisionId],
    );

    // Enhanced event generation with priority-based conflict resolution
    // For admin view: shows organization-wide aggregated data
    const generateEvents = useCallback((data) => {
        if (!data || !data.holidays) {
            console.warn("❌ Invalid calendar data structure");
            setEvents([]);
            return;
        }

        const eventsByDate = {}; // Group events by date to handle conflicts

        console.log("👨‍💼 Admin Calendar Event Generation:", {
            hasHolidays: !!data.holidays?.length,
            hasAttendances: !!data.attendances?.length,
            hasLeaves: !!data.leaves?.length,
            totalHolidays: data.holidays?.length || 0,
            totalAttendances: data.attendances?.length || 0,
            totalLeaves: data.leaves?.length || 0,
        });

        // Helper function to add event with priority check
        const addEvent = (date, event, priority) => {
            const dateKey = moment(date).format("YYYY-MM-DD");
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push({ ...event, priority });
        };

        // 1. Holidays - Red for national, Orange for custom (Highest Priority)
        if (Array.isArray(data.holidays)) {
            data.holidays.forEach((holiday) => {
                const date = holiday.date;
                addEvent(
                    date,
                    {
                        id: `holiday-${holiday.id}`,
                        title: `🎉 ${holiday.name}`,
                        start: new Date(date + "T00:00:00"),
                        end: new Date(date + "T23:59:59"),
                        allDay: true,
                        type: "holiday",
                        color: holiday.is_national
                            ? COLORS.holiday
                            : COLORS.holidayCustom,
                        resource: holiday,
                    },
                    EVENT_PRIORITY.holiday,
                );
            });
        }

        // 2. Attendance summary - Aggregated view for entire organization
        // Green for normal, Yellow if any late
        if (Array.isArray(data.attendances)) {
            const attendancesByDate = {};
            data.attendances.forEach((attendance) => {
                const date = attendance.date;
                if (!attendancesByDate[date]) {
                    attendancesByDate[date] = { total: 0, late: 0 };
                }
                attendancesByDate[date].total++;
                if (attendance.status === "late") {
                    attendancesByDate[date].late++;
                }
            });

            Object.keys(attendancesByDate).forEach((date) => {
                const stats = attendancesByDate[date];
                const isLate = stats.late > 0;

                addEvent(
                    date,
                    {
                        id: `attendance-${date}`,
                        title: `👥 ${stats.total} user${stats.late > 0 ? ` (⚠️${stats.late})` : ""}`,
                        start: new Date(date + "T00:00:00"),
                        end: new Date(date + "T23:59:59"),
                        allDay: true,
                        type: "attendance",
                        color: isLate ? COLORS.late : COLORS.present,
                        resource: stats,
                    },
                    isLate ? EVENT_PRIORITY.late : EVENT_PRIORITY.present,
                );
            });
        }

        // 3. Leave summary - Purple color
        if (Array.isArray(data.leaves)) {
            data.leaves.forEach((leave) => {
                const userName = leave.user?.name || "User";
                const shortName =
                    userName.length > 15
                        ? `${userName.substring(0, 15)}...`
                        : userName;

                const leaveStart = moment(leave.start_date);
                const leaveEnd = moment(leave.end_date);

                // Create event for each day in leave period
                for (
                    let date = leaveStart.clone();
                    date.isSameOrBefore(leaveEnd);
                    date.add(1, "day")
                ) {
                    const dateStr = date.format("YYYY-MM-DD");
                    addEvent(
                        dateStr,
                        {
                            id: `leave-${leave.id}-${dateStr}`,
                            title: `🏖️ ${shortName}`,
                            start: new Date(dateStr + "T00:00:00"),
                            end: new Date(dateStr + "T23:59:59"),
                            allDay: true,
                            type: "leave",
                            color: COLORS.leave,
                            resource: leave,
                        },
                        EVENT_PRIORITY.leave,
                    );
                }
            });
        }

        // Resolve conflicts: Keep only highest priority event per date
        const finalEvents = [];
        Object.keys(eventsByDate).forEach((dateKey) => {
            const dateEvents = eventsByDate[dateKey];
            // Sort by priority (lower number = higher priority)
            dateEvents.sort((a, b) => a.priority - b.priority);
            // Take only the highest priority event
            const topEvent = dateEvents[0];
            if (topEvent) {
                const { priority, ...eventData } = topEvent;
                finalEvents.push(eventData);
            }
        });

        console.log("🔍 Admin Event Generation Debug:");
        console.log(`   - Total events generated: ${finalEvents.length}`);
        console.log(`   - Event types:`, {
            holidays: finalEvents.filter((e) => e.type === "holiday").length,
            attendances: finalEvents.filter((e) => e.type === "attendance")
                .length,
            leaves: finalEvents.filter((e) => e.type === "leave").length,
        });

        setEvents(finalEvents);
    }, []);

    // Fetch date detail
    const fetchDateDetail = useCallback(
        async (date) => {
            try {
                setLoadingDetail(true);
                const dateStr = moment(date).format("YYYY-MM-DD");

                const params = {};
                if (selectedDivisionId) {
                    params.division_id = selectedDivisionId;
                }

                const response = await axiosInstance.get(
                    `/admin/calendar/date/${dateStr}`,
                    { params },
                );

                if (response.data.success) {
                    setDateDetail(response.data.data);
                    // Auto scroll to detail section
                    setTimeout(() => {
                        detailRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                    }, 100);
                }
            } catch (error) {
                console.error("Error fetching date detail:", error);
                toast.error("Gagal memuat detail tanggal");
            } finally {
                setLoadingDetail(false);
            }
        },
        [selectedDivisionId],
    );

    // Handle date/event click with future date validation
    const handleSelectSlot = useCallback(
        (slotInfo) => {
            const selectedDateStr = formatDateToString(slotInfo.start);

            // Prevent selecting future dates
            if (isFutureDate(selectedDateStr)) {
                toast.error("Tidak dapat melihat detail tanggal di masa depan");
                return;
            }

            setSelectedDate(slotInfo.start);
            fetchDateDetail(slotInfo.start);
        },
        [fetchDateDetail],
    );

    const handleSelectEvent = useCallback(
        (event) => {
            const selectedDateStr = formatDateToString(event.start);

            // Prevent selecting future dates
            if (isFutureDate(selectedDateStr)) {
                toast.error("Tidak dapat melihat detail tanggal di masa depan");
                return;
            }

            setSelectedDate(event.start);
            fetchDateDetail(event.start);
        },
        [fetchDateDetail],
    );

    const handleNavigate = useCallback(
        (date) => {
            setCurrentDate(date);
            fetchCalendarData(date);
            setSelectedDate(null);
            setDateDetail(null);
        },
        [fetchCalendarData],
    );

    // Handle division filter change
    const handleDivisionFilterChange = useCallback((e) => {
        setSelectedDivisionId(e.target.value);
    }, []);

    // Month/Year filter handlers
    const handleMonthChange = useCallback((e) => {
        setSelectedMonth(e.target.value);
    }, []);

    const handleYearChange = useCallback((e) => {
        setSelectedYear(e.target.value);
    }, []);

    const handleApplyFilter = useCallback(() => {
        // Create new date from selected month and year
        const newDate = new Date(
            parseInt(selectedYear),
            parseInt(selectedMonth) - 1,
            1,
        );
        setCurrentDate(newDate);
        fetchCalendarData(newDate);

        // Update URL params
        setSearchParams({ month: selectedMonth, year: selectedYear });

        // Close detail if open
        setSelectedDate(null);
        setDateDetail(null);
    }, [selectedMonth, selectedYear, setSearchParams, fetchCalendarData]);

    const handleResetFilter = useCallback(() => {
        const today = new Date();
        const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
        const currentYear = String(today.getFullYear());

        setSelectedMonth(currentMonth);
        setSelectedYear(currentYear);
        setCurrentDate(today);

        // Clear URL params
        setSearchParams({});

        setSelectedDate(null);
        setDateDetail(null);
    }, [setSearchParams]);

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

    // Day cell styling with future date handling and today highlight
    const dayPropGetter = useCallback(
        (date) => {
            const dayOfWeek = date.getDay();
            const dateStr = formatDateToString(date);
            const isTodayDate = checkIsToday(dateStr);
            const isFuture = isFutureDate(dateStr);
            const isWorkingDay = calendarData?.workingDays?.includes(dayOfWeek);

            let style = {};
            let className = "";

            if (isFuture) {
                // Future dates - disabled style
                style = {
                    backgroundColor: "#f8f9fa",
                    color: "#adb5bd",
                    opacity: 0.6,
                    cursor: "not-allowed",
                };
                className = "future-date-disabled";
            } else if (isTodayDate) {
                // Today - highlight with blue
                style = {
                    backgroundColor: "#e3f2fd",
                    fontWeight: "bold",
                    border: "2px solid #2196f3",
                };
                className = "today-highlight";
            } else if (!isWorkingDay) {
                // Weekend - light gray
                style = {
                    backgroundColor: COLORS.weekend,
                    color: "#adb5bd",
                };
                className = "weekend";
            }

            return { style, className };
        },
        [calendarData],
    );

    useEffect(() => {
        fetchCalendarData(currentDate);
    }, [fetchCalendarData, currentDate]);

    // Indonesian messages
    const messages = useMemo(
        () => ({
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
        }),
        [],
    );

    if (loading && !calendarData) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "400px" }}
            >
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="work-calendar-container p-3">
            {/* Header with Gradient */}
            <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                        <h3
                            className="mb-1 fw-bold"
                            style={{
                                background:
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            <i
                                className="bi bi-calendar-week me-2"
                                style={{ color: "#667eea" }}
                            ></i>
                            Kalender Kerja - Monitoring Sistem
                        </h3>
                        <p className="text-muted small mb-0">
                            <i className="bi bi-info-circle me-1"></i>
                            Monitor seluruh aktivitas organisasi (klik tanggal
                            untuk detail)
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <Badge bg="primary" className="px-3 py-2">
                            <i className="bi bi-calendar-day me-1"></i>
                            {moment().format("DD MMMM YYYY")}
                        </Badge>
                        <Link
                            to="/admin/system-settings"
                            className="btn btn-outline-primary btn-sm"
                        >
                            <i className="bi bi-gear me-2"></i>
                            Kelola Hari Libur
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filter - Division Selection */}
            <Card className="mb-3 border-0 shadow-sm">
                <Card.Body className="p-3">
                    <Row className="g-2 align-items-center">
                        <Col xs={12} md={6}>
                            <div className="d-flex align-items-center gap-2">
                                <i
                                    className="bi bi-funnel text-primary"
                                    style={{ fontSize: "1.2rem" }}
                                ></i>
                                <div className="flex-grow-1">
                                    <Form.Select
                                        value={selectedDivisionId}
                                        onChange={handleDivisionFilterChange}
                                        style={{ fontWeight: "500" }}
                                    >
                                        <option value="">
                                            📋 Semua Divisi
                                        </option>
                                        {divisions.map((division) => (
                                            <option
                                                key={division.id}
                                                value={division.id}
                                            >
                                                {division.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Summary Cards - Modern Design with Gradients */}
            {calendarData?.summary && (
                <Row className="g-3 mb-4">
                    <Col xs={6} md={3}>
                        <Card
                            className="border-0 shadow-sm h-100"
                            style={{
                                background:
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                            }}
                        >
                            <Card.Body className="p-3 text-center">
                                <div className="mb-2">
                                    <i
                                        className="bi bi-people"
                                        style={{ fontSize: "2rem" }}
                                    ></i>
                                </div>
                                <h3 className="mb-1 fw-bold">
                                    {calendarData.summary?.totalUsers || 0}
                                </h3>
                                <small className="text-white-50 fw-medium">
                                    Total User
                                </small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={6} md={3}>
                        <Card
                            className="border-0 shadow-sm h-100"
                            style={{
                                background:
                                    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                                color: "white",
                            }}
                        >
                            <Card.Body className="p-3 text-center">
                                <div className="mb-2">
                                    <i
                                        className="bi bi-check-circle"
                                        style={{ fontSize: "2rem" }}
                                    ></i>
                                </div>
                                <h3 className="mb-1 fw-bold">
                                    {calendarData.summary?.totalAttendances ||
                                        0}
                                </h3>
                                <small className="text-white-50 fw-medium">
                                    Kehadiran
                                </small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={6} md={3}>
                        <Card
                            className="border-0 shadow-sm h-100"
                            style={{
                                background:
                                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                color: "white",
                            }}
                        >
                            <Card.Body className="p-3 text-center">
                                <div className="mb-2">
                                    <i
                                        className="bi bi-calendar-x"
                                        style={{ fontSize: "2rem" }}
                                    ></i>
                                </div>
                                <h3 className="mb-1 fw-bold">
                                    {calendarData.summary?.totalHolidays || 0}
                                </h3>
                                <small className="text-white-50 fw-medium">
                                    Hari Libur
                                </small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={6} md={3}>
                        <Card
                            className="border-0 shadow-sm h-100"
                            style={{
                                background:
                                    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                color: "white",
                            }}
                        >
                            <Card.Body className="p-3 text-center">
                                <div className="mb-2">
                                    <i
                                        className="bi bi-briefcase"
                                        style={{ fontSize: "2rem" }}
                                    ></i>
                                </div>
                                <h3 className="mb-1 fw-bold">
                                    {calendarData.summary?.leaveStats
                                        ?.approved || 0}
                                </h3>
                                <small className="text-white-50 fw-medium">
                                    Cuti Disetujui
                                </small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Legend - Modern Glassmorphism Design */}
            <Card
                className="mb-4 border-0"
                style={{
                    background: "rgba(255, 255, 255, 0.7)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                }}
            >
                <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-3">
                        <div
                            className="d-flex align-items-center justify-content-center"
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background:
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                marginRight: "12px",
                            }}
                        >
                            <i className="bi bi-palette text-white"></i>
                        </div>
                        <div>
                            <h6 className="mb-0 fw-bold">
                                Keterangan Warna Kalender
                            </h6>
                            <small className="text-muted">
                                Sistem prioritas untuk menampilkan status
                            </small>
                        </div>
                    </div>

                    <Row className="g-3">
                        {[
                            {
                                color: COLORS.holiday,
                                label: "Libur Nasional",
                                icon: "🎉",
                                priority: 1,
                            },
                            {
                                color: COLORS.holidayCustom,
                                label: "Hari Libur",
                                icon: "📅",
                                priority: 2,
                            },
                            {
                                color: COLORS.leave,
                                label: "Izin/Cuti User",
                                icon: "🏖️",
                                priority: 3,
                            },
                            {
                                color: COLORS.late,
                                label: "Ada Terlambat",
                                icon: "⏰",
                                priority: 4,
                            },
                            {
                                color: COLORS.present,
                                label: "Presensi Normal",
                                icon: "✓",
                                priority: 5,
                            },
                        ].map((item) => (
                            <Col xs={6} md={4} lg={2} key={item.priority}>
                                <div
                                    className="d-flex align-items-center p-3 rounded-3 h-100"
                                    style={{
                                        background: "white",
                                        border: "1px solid rgba(0,0,0,0.08)",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                        transition: "all 0.3s ease",
                                        cursor: "default",
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(-2px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0,0,0,0.1)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "0 2px 8px rgba(0,0,0,0.05)";
                                    }}
                                >
                                    <span
                                        className="me-2 flex-shrink-0"
                                        style={{
                                            display: "inline-block",
                                            width: "24px",
                                            height: "24px",
                                            backgroundColor: item.color,
                                            borderRadius: "6px",
                                            boxShadow: `0 2px 8px ${item.color}40`,
                                        }}
                                    ></span>
                                    <div className="flex-grow-1">
                                        <div
                                            className="fw-medium"
                                            style={{
                                                fontSize: "0.85rem",
                                                lineHeight: "1.2",
                                            }}
                                        >
                                            <span className="me-1">
                                                {item.icon}
                                            </span>
                                            {item.label}
                                        </div>
                                        <small
                                            className="text-muted"
                                            style={{ fontSize: "0.7rem" }}
                                        >
                                            Prioritas {item.priority}
                                        </small>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    <Alert
                        variant="info"
                        className="mt-4 mb-0 border-0"
                        style={{
                            background:
                                "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                            borderLeft: "4px solid #667eea",
                        }}
                    >
                        <div className="d-flex align-items-start">
                            <i
                                className="bi bi-lightbulb me-2 text-primary"
                                style={{ fontSize: "1.2rem" }}
                            ></i>
                            <div>
                                <strong className="text-primary">Tips:</strong>
                                <span className="ms-2">
                                    Jika satu tanggal memiliki beberapa status,
                                    hanya status dengan prioritas tertinggi yang
                                    ditampilkan di kalender.
                                </span>
                            </div>
                        </div>
                    </Alert>
                </Card.Body>
            </Card>

            {/* Calendar - Modern Design with Integrated Filter */}
            <Card
                className="border-0 mb-4"
                style={{
                    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    borderRadius: "16px",
                    overflow: "hidden",
                }}
            >
                {/* Calendar Header with Integrated Filter */}
                <div
                    className="p-3"
                    style={{
                        background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                    }}
                >
                    <Row className="align-items-center g-2">
                        <Col md={6}>
                            <div className="d-flex align-items-center">
                                <div
                                    className="d-flex align-items-center justify-content-center me-3"
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "12px",
                                        background: "rgba(255,255,255,0.2)",
                                        backdropFilter: "blur(10px)",
                                    }}
                                >
                                    <i
                                        className="bi bi-calendar3"
                                        style={{ fontSize: "1.5rem" }}
                                    ></i>
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-bold">
                                        Tampilan Kalender
                                    </h5>
                                    <small className="text-white-50">
                                        Pilih periode untuk melihat aktivitas
                                        organisasi
                                    </small>
                                </div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <Row className="g-2 justify-content-md-end">
                                <Col xs={12} sm="auto">
                                    <InputGroup size="sm">
                                        <InputGroup.Text
                                            style={{
                                                background:
                                                    "rgba(255,255,255,0.2)",
                                                border: "none",
                                                color: "white",
                                            }}
                                        >
                                            <i className="bi bi-calendar-month"></i>
                                        </InputGroup.Text>
                                        <Form.Select
                                            value={selectedMonth}
                                            onChange={handleMonthChange}
                                            style={{
                                                minWidth: "130px",
                                                background:
                                                    "rgba(255,255,255,0.95)",
                                                border: "none",
                                                fontWeight: "500",
                                            }}
                                        >
                                            {Array.from(
                                                { length: 12 },
                                                (_, i) => {
                                                    const month = String(
                                                        i + 1,
                                                    ).padStart(2, "0");
                                                    return (
                                                        <option
                                                            key={month}
                                                            value={month}
                                                        >
                                                            {moment(
                                                                `2024-${month}-01`,
                                                            ).format("MMMM")}
                                                        </option>
                                                    );
                                                },
                                            )}
                                        </Form.Select>
                                    </InputGroup>
                                </Col>
                                <Col xs={12} sm="auto">
                                    <InputGroup size="sm">
                                        <InputGroup.Text
                                            style={{
                                                background:
                                                    "rgba(255,255,255,0.2)",
                                                border: "none",
                                                color: "white",
                                            }}
                                        >
                                            <i className="bi bi-calendar-range"></i>
                                        </InputGroup.Text>
                                        <Form.Select
                                            value={selectedYear}
                                            onChange={handleYearChange}
                                            style={{
                                                minWidth: "100px",
                                                background:
                                                    "rgba(255,255,255,0.95)",
                                                border: "none",
                                                fontWeight: "500",
                                            }}
                                        >
                                            {Array.from(
                                                { length: 5 },
                                                (_, i) => {
                                                    const year =
                                                        new Date().getFullYear() -
                                                        i;
                                                    return (
                                                        <option
                                                            key={year}
                                                            value={year}
                                                        >
                                                            {year}
                                                        </option>
                                                    );
                                                },
                                            )}
                                        </Form.Select>
                                    </InputGroup>
                                </Col>
                                <Col xs="auto">
                                    <Button
                                        variant="light"
                                        size="sm"
                                        onClick={handleApplyFilter}
                                        className="fw-medium"
                                        style={{
                                            boxShadow:
                                                "0 2px 8px rgba(0,0,0,0.15)",
                                        }}
                                    >
                                        <i className="bi bi-arrow-repeat me-1"></i>
                                        Terapkan
                                    </Button>
                                </Col>
                                <Col xs="auto">
                                    <Button
                                        variant="outline-light"
                                        size="sm"
                                        onClick={handleResetFilter}
                                        className="fw-medium"
                                    >
                                        <i className="bi bi-arrow-counterclockwise me-1"></i>
                                        Reset
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </div>

                {/* Calendar Body */}
                <Card.Body style={{ height: "550px", padding: "1.5rem" }}>
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
                                <strong>
                                    {moment(selectedDate).format(
                                        "dddd, DD MMMM YYYY",
                                    )}
                                </strong>
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
                                    <Spinner
                                        animation="border"
                                        variant="primary"
                                        size="sm"
                                    />
                                    <p className="mt-2 text-muted small">
                                        Memuat detail...
                                    </p>
                                </div>
                            ) : dateDetail ? (
                                <>
                                    {/* Statistics Card */}
                                    <Alert
                                        variant="light"
                                        className="border mb-3 py-2"
                                    >
                                        <Row className="text-center">
                                            <Col xs={3}>
                                                <h5 className="mb-0 text-primary">
                                                    {dateDetail.summary
                                                        ?.totalUsers || 0}
                                                </h5>
                                                <small className="text-muted">
                                                    Total User
                                                </small>
                                            </Col>
                                            <Col xs={3}>
                                                <h5 className="mb-0 text-success">
                                                    {dateDetail.summary
                                                        ?.presentCount || 0}
                                                </h5>
                                                <small className="text-muted">
                                                    Hadir
                                                </small>
                                            </Col>
                                            <Col xs={3}>
                                                <h5 className="mb-0 text-warning">
                                                    {dateDetail.summary
                                                        ?.leaveCount || 0}
                                                </h5>
                                                <small className="text-muted">
                                                    Izin
                                                </small>
                                            </Col>
                                            <Col xs={3}>
                                                <h5 className="mb-0 text-danger">
                                                    {dateDetail.summary
                                                        ?.absentCount || 0}
                                                </h5>
                                                <small className="text-muted">
                                                    Tidak Hadir
                                                </small>
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
                                                Presensi (
                                                {dateDetail.attendances
                                                    ?.length || 0}
                                                )
                                            </h6>
                                            <div
                                                style={{
                                                    maxHeight: "250px",
                                                    overflowY: "auto",
                                                }}
                                            >
                                                {dateDetail.attendances
                                                    ?.length > 0 ? (
                                                    dateDetail.attendances.map(
                                                        (att) => (
                                                            <Card
                                                                key={att.id}
                                                                className="mb-2 border"
                                                            >
                                                                <Card.Body className="p-2">
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <div>
                                                                            <strong className="small">
                                                                                {att
                                                                                    .user
                                                                                    ?.name ||
                                                                                    "User"}
                                                                            </strong>
                                                                            <br />
                                                                            <small className="text-muted">
                                                                                {att.check_in_time ||
                                                                                    "N/A"}{" "}
                                                                                -{" "}
                                                                                {att.check_out_time ||
                                                                                    "Belum"}
                                                                            </small>
                                                                        </div>
                                                                        <div>
                                                                            {att.status ===
                                                                                "late" && (
                                                                                <Badge
                                                                                    bg="warning"
                                                                                    text="dark"
                                                                                >
                                                                                    ⏰
                                                                                    Late
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        ),
                                                    )
                                                ) : (
                                                    <Alert
                                                        variant="secondary"
                                                        className="py-2 small mb-0"
                                                    >
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
                                                Izin/Cuti (
                                                {dateDetail.leaves?.length || 0}
                                                )
                                            </h6>
                                            <div
                                                style={{
                                                    maxHeight: "250px",
                                                    overflowY: "auto",
                                                }}
                                            >
                                                {dateDetail.leaves?.length >
                                                0 ? (
                                                    dateDetail.leaves.map(
                                                        (leave) => (
                                                            <Card
                                                                key={leave.id}
                                                                className="mb-2 border"
                                                            >
                                                                <Card.Body className="p-2">
                                                                    <div className="d-flex justify-content-between">
                                                                        <div>
                                                                            <strong className="small">
                                                                                {leave
                                                                                    .user
                                                                                    ?.name ||
                                                                                    "User"}
                                                                            </strong>
                                                                            <br />
                                                                            <small className="text-muted">
                                                                                {
                                                                                    leave.type
                                                                                }
                                                                            </small>
                                                                        </div>
                                                                        <Badge
                                                                            bg={
                                                                                leave.status ===
                                                                                "approved"
                                                                                    ? "success"
                                                                                    : leave.status ===
                                                                                        "rejected"
                                                                                      ? "danger"
                                                                                      : "warning"
                                                                            }
                                                                        >
                                                                            {
                                                                                leave.status
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        ),
                                                    )
                                                ) : (
                                                    <Alert
                                                        variant="secondary"
                                                        className="py-2 small mb-0"
                                                    >
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

            {/* ============================================================================ */}
            {/* COMPREHENSIVE ORGANIZATIONAL MONITORING SECTION - INDUSTRY BEST PRACTICES */}
            {/* ============================================================================ */}

            {calendarData && (
                <>
                    {/* Divider with Title */}
                    <div className="my-5">
                        <div className="d-flex align-items-center">
                            <div
                                className="flex-grow-1"
                                style={{
                                    height: "2px",
                                    background:
                                        "linear-gradient(90deg, #667eea 0%, transparent 100%)",
                                }}
                            ></div>
                            <div className="mx-3">
                                <h4
                                    className="mb-0 fw-bold"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                    }}
                                >
                                    <i className="bi bi-graph-up me-2"></i>
                                    Analitik Mendalam Organisasi
                                </h4>
                            </div>
                            <div
                                className="flex-grow-1"
                                style={{
                                    height: "2px",
                                    background:
                                        "linear-gradient(90deg, transparent 0%, #667eea 100%)",
                                }}
                            ></div>
                        </div>
                        <p className="text-center text-muted small mt-2">
                            Monitoring real-time performa divisi, user activity,
                            dan supervisor oversight
                        </p>
                    </div>

                    {/* ============================================================================ */}
                    {/* SECTION 1: DIVISION-LEVEL ANALYTICS (SUPERVISOR OVERSIGHT) */}
                    {/* ============================================================================ */}
                    <Card
                        className="mb-4 border-0"
                        style={{
                            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                            borderRadius: "16px",
                            overflow: "hidden",
                        }}
                    >
                        <Card.Header
                            className="text-white p-4"
                            style={{
                                background:
                                    "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                            }}
                        >
                            <div className="d-flex align-items-center">
                                <div
                                    className="d-flex align-items-center justify-content-center me-3"
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "12px",
                                        background: "rgba(255,255,255,0.2)",
                                        backdropFilter: "blur(10px)",
                                    }}
                                >
                                    <i
                                        className="bi bi-bar-chart-line"
                                        style={{ fontSize: "1.5rem" }}
                                    ></i>
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-bold">
                                        Statistik Divisi
                                    </h5>
                                    <small className="text-white-50">
                                        Overview performa setiap divisi dengan
                                        KPI
                                    </small>
                                </div>
                            </div>
                        </Card.Header>

                        <Card.Body className="p-4">
                            {calendarData.divisionStats &&
                            calendarData.divisionStats.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead
                                            style={{ background: "#f8f9fa" }}
                                        >
                                            <tr>
                                                <th
                                                    style={{
                                                        color: "#667eea",
                                                        fontWeight: "600",
                                                        borderBottom:
                                                            "2px solid #667eea",
                                                    }}
                                                >
                                                    <i className="bi bi-diagram-2 me-2"></i>
                                                    Divisi
                                                </th>
                                                <th
                                                    className="text-center"
                                                    style={{
                                                        color: "#667eea",
                                                        fontWeight: "600",
                                                        borderBottom:
                                                            "2px solid #667eea",
                                                    }}
                                                >
                                                    👥 Members
                                                </th>
                                                <th
                                                    className="text-center"
                                                    style={{
                                                        color: "#667eea",
                                                        fontWeight: "600",
                                                        borderBottom:
                                                            "2px solid #667eea",
                                                    }}
                                                >
                                                    ✓ Hadir
                                                </th>
                                                <th
                                                    className="text-center"
                                                    style={{
                                                        color: "#667eea",
                                                        fontWeight: "600",
                                                        borderBottom:
                                                            "2px solid #667eea",
                                                    }}
                                                >
                                                    ⏰ Terlambat
                                                </th>
                                                <th
                                                    className="text-center"
                                                    style={{
                                                        color: "#667eea",
                                                        fontWeight: "600",
                                                        borderBottom:
                                                            "2px solid #667eea",
                                                    }}
                                                >
                                                    ✕ Tidak Hadir
                                                </th>
                                                <th
                                                    className="text-center"
                                                    style={{
                                                        color: "#667eea",
                                                        fontWeight: "600",
                                                        borderBottom:
                                                            "2px solid #667eea",
                                                    }}
                                                >
                                                    📋 Logbook
                                                </th>
                                                <th
                                                    className="text-center"
                                                    style={{
                                                        color: "#667eea",
                                                        fontWeight: "600",
                                                        borderBottom:
                                                            "2px solid #667eea",
                                                    }}
                                                >
                                                    📊 Rate
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {calendarData.divisionStats.map(
                                                (div, idx) => {
                                                    const attendanceRate =
                                                        div.attendanceRate || 0;
                                                    const rateColor =
                                                        attendanceRate >= 90
                                                            ? "#28a745"
                                                            : attendanceRate >=
                                                                75
                                                              ? "#ffc107"
                                                              : "#dc3545";

                                                    return (
                                                        <tr
                                                            key={div.id}
                                                            style={{
                                                                borderBottom:
                                                                    "1px solid #e9ecef",
                                                                transition:
                                                                    "all 0.3s ease",
                                                            }}
                                                            onMouseOver={(
                                                                e,
                                                            ) => {
                                                                e.currentTarget.style.backgroundColor =
                                                                    "#f8f9fa";
                                                                e.currentTarget.style.transform =
                                                                    "translateX(4px)";
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.currentTarget.style.backgroundColor =
                                                                    "white";
                                                                e.currentTarget.style.transform =
                                                                    "translateX(0)";
                                                            }}
                                                        >
                                                            <td
                                                                className="fw-bold"
                                                                style={{
                                                                    color: "#667eea",
                                                                }}
                                                            >
                                                                <i className="bi bi-diagram-2 me-2"></i>
                                                                {div.name}
                                                            </td>
                                                            <td className="text-center">
                                                                <Badge
                                                                    bg="primary"
                                                                    className="px-3 py-2"
                                                                >
                                                                    {
                                                                        div.memberCount
                                                                    }
                                                                </Badge>
                                                            </td>
                                                            <td className="text-center">
                                                                <span
                                                                    className="fw-medium"
                                                                    style={{
                                                                        color: "#28a745",
                                                                        fontSize:
                                                                            "1rem",
                                                                    }}
                                                                >
                                                                    {
                                                                        div.attendanceDays
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                {div.lateDays >
                                                                0 ? (
                                                                    <span
                                                                        className="fw-medium"
                                                                        style={{
                                                                            color: "#ffc107",
                                                                        }}
                                                                    >
                                                                        ⚠️{" "}
                                                                        {
                                                                            div.lateDays
                                                                        }
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        className="text-muted"
                                                                        style={{
                                                                            fontSize:
                                                                                "1.2rem",
                                                                        }}
                                                                    >
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-center">
                                                                {div.absentDays >
                                                                0 ? (
                                                                    <span
                                                                        className="fw-medium"
                                                                        style={{
                                                                            color: "#dc3545",
                                                                        }}
                                                                    >
                                                                        ✕{" "}
                                                                        {
                                                                            div.absentDays
                                                                        }
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        className="text-muted"
                                                                        style={{
                                                                            fontSize:
                                                                                "1.2rem",
                                                                        }}
                                                                    >
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-center">
                                                                <span
                                                                    className="fw-medium text-info"
                                                                    style={{
                                                                        fontSize:
                                                                            "1rem",
                                                                    }}
                                                                >
                                                                    {
                                                                        div.logbookCount
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        justifyContent:
                                                                            "center",
                                                                        gap: "6px",
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            width: "60px",
                                                                            height: "24px",
                                                                            background:
                                                                                "#e9ecef",
                                                                            borderRadius:
                                                                                "12px",
                                                                            overflow:
                                                                                "hidden",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                width: `${attendanceRate}%`,
                                                                                height: "100%",
                                                                                background:
                                                                                    rateColor,
                                                                                transition:
                                                                                    "width 0.3s ease",
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                    <span
                                                                        className="fw-bold small"
                                                                        style={{
                                                                            color: rateColor,
                                                                            minWidth:
                                                                                "40px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            attendanceRate
                                                                        }
                                                                        %
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <Alert
                                    variant="secondary"
                                    className="mb-0 text-center"
                                >
                                    <i className="bi bi-info-circle me-2"></i>
                                    Belum ada data divisi untuk periode ini
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>

                    {/* ============================================================================ */}
                    {/* SECTION 2: MEMBER-LEVEL PERFORMANCE DASHBOARD (USER ACTIVITY) */}
                    {/* ============================================================================ */}
                    <Card
                        className="mb-4 border-0"
                        style={{
                            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                            borderRadius: "16px",
                            overflow: "hidden",
                        }}
                    >
                        <Card.Header
                            className="text-white p-4"
                            style={{
                                background:
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div className="d-flex align-items-center">
                                    <div
                                        className="d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "12px",
                                            background: "rgba(255,255,255,0.2)",
                                            backdropFilter: "blur(10px)",
                                        }}
                                    >
                                        <i
                                            className="bi bi-person-badge"
                                            style={{ fontSize: "1.5rem" }}
                                        ></i>
                                    </div>
                                    <div>
                                        <h5 className="mb-0 fw-bold">
                                            Skor Kinerja Individual
                                        </h5>
                                        <small className="text-white-50">
                                            Performance scorecard setiap
                                            karyawan berdasarkan presensi,
                                            logbook, dan ketepatan waktu
                                        </small>
                                    </div>
                                </div>
                                <Badge
                                    bg="light"
                                    text="dark"
                                    className="px-3 py-2"
                                >
                                    <i className="bi bi-people me-1"></i>
                                    {calendarData.memberStats?.length || 0} User
                                </Badge>
                            </div>
                        </Card.Header>

                        <Card.Body className="p-4">
                            {calendarData.memberStats &&
                            calendarData.memberStats.length > 0 ? (
                                <>
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="table table-hover mb-0">
                                            <thead
                                                style={{
                                                    background: "#f8f9fa",
                                                    position: "sticky",
                                                    top: 0,
                                                }}
                                            >
                                                <tr>
                                                    <th
                                                        style={{
                                                            color: "#667eea",
                                                            fontWeight: "600",
                                                            borderBottom:
                                                                "2px solid #667eea",
                                                        }}
                                                    >
                                                        <i className="bi bi-person-circle me-2"></i>
                                                        User / Role
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            color: "#667eea",
                                                            fontWeight: "600",
                                                            borderBottom:
                                                                "2px solid #667eea",
                                                        }}
                                                    >
                                                        📍 Divisi
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            color: "#667eea",
                                                            fontWeight: "600",
                                                            borderBottom:
                                                                "2px solid #667eea",
                                                        }}
                                                    >
                                                        ✓ Hadir
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            color: "#667eea",
                                                            fontWeight: "600",
                                                            borderBottom:
                                                                "2px solid #667eea",
                                                        }}
                                                    >
                                                        ⏰ Terlambat
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            color: "#667eea",
                                                            fontWeight: "600",
                                                            borderBottom:
                                                                "2px solid #667eea",
                                                        }}
                                                    >
                                                        ✕ Absen
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            color: "#667eea",
                                                            fontWeight: "600",
                                                            borderBottom:
                                                                "2px solid #667eea",
                                                        }}
                                                    >
                                                        🏖️ Cuti
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            color: "#667eea",
                                                            fontWeight: "600",
                                                            borderBottom:
                                                                "2px solid #667eea",
                                                        }}
                                                    >
                                                        📓 Logbook
                                                    </th>
                                                    <th
                                                        className="text-center"
                                                        style={{
                                                            color: "#667eea",
                                                            fontWeight: "600",
                                                            borderBottom:
                                                                "2px solid #667eea",
                                                        }}
                                                    >
                                                        📊 Kehadiran
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {calendarData.memberStats
                                                    .sort(
                                                        (a, b) =>
                                                            b.attendanceRate -
                                                            a.attendanceRate,
                                                    )
                                                    .map((member) => {
                                                        const attendanceRate =
                                                            member.attendanceRate ||
                                                            0;
                                                        const rateColor =
                                                            attendanceRate >= 90
                                                                ? "#28a745"
                                                                : attendanceRate >=
                                                                    75
                                                                  ? "#ffc107"
                                                                  : "#dc3545";
                                                        const roleEmoji =
                                                            member.role ===
                                                            "supervisor"
                                                                ? "👨‍💼"
                                                                : "👤";

                                                        return (
                                                            <tr
                                                                key={member.id}
                                                                style={{
                                                                    borderBottom:
                                                                        "1px solid #e9ecef",
                                                                    transition:
                                                                        "all 0.3s ease",
                                                                }}
                                                                onMouseOver={(
                                                                    e,
                                                                ) => {
                                                                    e.currentTarget.style.backgroundColor =
                                                                        "#f8f9fa";
                                                                    e.currentTarget.style.transform =
                                                                        "translateX(4px)";
                                                                }}
                                                                onMouseOut={(
                                                                    e,
                                                                ) => {
                                                                    e.currentTarget.style.backgroundColor =
                                                                        "white";
                                                                    e.currentTarget.style.transform =
                                                                        "translateX(0)";
                                                                }}
                                                            >
                                                                <td
                                                                    className="fw-bold"
                                                                    style={{
                                                                        color: "#667eea",
                                                                    }}
                                                                >
                                                                    {roleEmoji}{" "}
                                                                    {
                                                                        member.name
                                                                    }
                                                                    <br />
                                                                    <small className="text-muted text-uppercase">
                                                                        {
                                                                            member.role
                                                                        }
                                                                    </small>
                                                                </td>
                                                                <td className="text-center">
                                                                    <small
                                                                        className="fw-medium"
                                                                        style={{
                                                                            color: "#666",
                                                                        }}
                                                                    >
                                                                        {member.divisionName ||
                                                                            "-"}
                                                                    </small>
                                                                </td>
                                                                <td className="text-center">
                                                                    <Badge
                                                                        bg="success"
                                                                        className="px-2 py-1"
                                                                    >
                                                                        ✓{" "}
                                                                        {
                                                                            member.attendanceDays
                                                                        }
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-center">
                                                                    {member.lateDays >
                                                                    0 ? (
                                                                        <Badge
                                                                            bg="warning"
                                                                            text="dark"
                                                                            className="px-2 py-1"
                                                                        >
                                                                            ⏰{" "}
                                                                            {
                                                                                member.lateDays
                                                                            }
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-muted">
                                                                            -
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    {member.absentDays >
                                                                    0 ? (
                                                                        <Badge
                                                                            bg="danger"
                                                                            className="px-2 py-1"
                                                                        >
                                                                            ✕{" "}
                                                                            {
                                                                                member.absentDays
                                                                            }
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-muted">
                                                                            -
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    {member.leaveDays >
                                                                    0 ? (
                                                                        <Badge
                                                                            bg="secondary"
                                                                            className="px-2 py-1"
                                                                        >
                                                                            🏖️{" "}
                                                                            {
                                                                                member.leaveDays
                                                                            }
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-muted">
                                                                            -
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    <Badge
                                                                        bg="info"
                                                                        className="px-2 py-1"
                                                                    >
                                                                        📓{" "}
                                                                        {
                                                                            member.logbookDays
                                                                        }
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            justifyContent:
                                                                                "center",
                                                                            gap: "8px",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                width: "80px",
                                                                                height: "28px",
                                                                                background:
                                                                                    "#e9ecef",
                                                                                borderRadius:
                                                                                    "14px",
                                                                                overflow:
                                                                                    "hidden",
                                                                                boxShadow:
                                                                                    "inset 0 1px 3px rgba(0,0,0,0.1)",
                                                                            }}
                                                                        >
                                                                            <div
                                                                                style={{
                                                                                    width: `${attendanceRate}%`,
                                                                                    height: "100%",
                                                                                    background:
                                                                                        rateColor,
                                                                                    transition:
                                                                                        "width 0.3s ease",
                                                                                    boxShadow: `0 0 10px ${rateColor}40`,
                                                                                }}
                                                                            ></div>
                                                                        </div>
                                                                        <span
                                                                            className="fw-bold small"
                                                                            style={{
                                                                                color: rateColor,
                                                                                minWidth:
                                                                                    "45px",
                                                                                textAlign:
                                                                                    "right",
                                                                            }}
                                                                        >
                                                                            {
                                                                                attendanceRate
                                                                            }
                                                                            %
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Summary Footer */}
                                    <div
                                        className="mt-4 pt-3 border-top"
                                        style={{
                                            background: "#f8f9fa",
                                            borderRadius: "8px",
                                            padding: "12px 16px",
                                        }}
                                    >
                                        <Row className="text-center">
                                            <Col xs={6} md={3}>
                                                <div>
                                                    <h6 className="mb-1 text-success fw-bold">
                                                        {calendarData.memberStats.reduce(
                                                            (acc, m) =>
                                                                acc +
                                                                m.attendanceDays,
                                                            0,
                                                        )}
                                                    </h6>
                                                    <small className="text-muted">
                                                        Total Kehadiran
                                                    </small>
                                                </div>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <div>
                                                    <h6 className="mb-1 text-warning fw-bold">
                                                        {calendarData.memberStats.reduce(
                                                            (acc, m) =>
                                                                acc +
                                                                m.lateDays,
                                                            0,
                                                        )}
                                                    </h6>
                                                    <small className="text-muted">
                                                        Total Terlambat
                                                    </small>
                                                </div>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <div>
                                                    <h6 className="mb-1 text-danger fw-bold">
                                                        {calendarData.memberStats.reduce(
                                                            (acc, m) =>
                                                                acc +
                                                                m.absentDays,
                                                            0,
                                                        )}
                                                    </h6>
                                                    <small className="text-muted">
                                                        Total Absen
                                                    </small>
                                                </div>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <div>
                                                    <h6 className="mb-1 text-info fw-bold">
                                                        {calendarData.memberStats.reduce(
                                                            (acc, m) =>
                                                                acc +
                                                                m.logbookDays,
                                                            0,
                                                        )}
                                                    </h6>
                                                    <small className="text-muted">
                                                        Total Logbook
                                                    </small>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                </>
                            ) : (
                                <Alert
                                    variant="secondary"
                                    className="mb-0 text-center"
                                >
                                    <i className="bi bi-info-circle me-2"></i>
                                    Belum ada data kinerja karyawan untuk
                                    periode ini
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </>
            )}
        </div>
    );
};

export default AdminWorkCalendar;
