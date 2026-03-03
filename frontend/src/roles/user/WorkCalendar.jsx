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
    Button,
    Form,
    InputGroup,
} from "react-bootstrap";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import {
    isFutureDate,
    isToday as checkIsToday,
    formatDateToString,
} from "../../utils/dateHelper";
import { useSearchParams } from "react-router-dom";
import "./WorkCalendar.css";

moment.locale("id");
const localizer = momentLocalizer(moment);

// Enhanced Color palette with industry best practices
const COLORS = {
    holiday: "#dc3545", // Red - National holiday (Priority 1 - Highest)
    holidayCustom: "#fd7e14", // Orange - Custom holiday (Priority 2)
    absent: "#6c757d", // Gray - Absent/Alpha (Priority 3)
    leave: "#6f42c1", // Purple - Approved leave (Priority 4)
    late: "#ffc107", // Yellow - Late (Priority 5)
    present: "#28a745", // Green - On time (Priority 6 - Lowest)
    weekend: "#f8f9fa", // Light gray - Weekend
};

// Event priority for conflict resolution (lower number = higher priority)
const EVENT_PRIORITY = {
    holiday: 1,
    absent: 2,
    leave: 3,
    late: 4,
    present: 5,
};

const UserWorkCalendar = () => {
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

    // Fetch calendar data
    const fetchCalendarData = useCallback(async (date) => {
        try {
            setLoading(true);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            const response = await axiosInstance.get("/user/calendar", {
                params: { year, month },
            });

            if (response.data.success) {
                // Debug: Log calendar data and summary
                console.log("📅 Calendar Data Received:", {
                    workingDays: response.data.data.workingDays,
                    period: response.data.data.period,
                    holidaysCount: response.data.data.holidays?.length,
                    attendancesCount: response.data.data.attendances?.length,
                    leavesCount: response.data.data.leaves?.length,
                    summary: response.data.data.summary,
                });

                console.log("📊 Summary Breakdown:", {
                    expectedWorkingDays:
                        response.data.data.summary.expectedWorkingDays,
                    totalAttendances:
                        response.data.data.summary.totalAttendances,
                    leaveCount: response.data.data.summary.leaveCount,
                    absentCount: response.data.data.summary.absentCount,
                    calculation: `${response.data.data.summary.expectedWorkingDays} - ${response.data.data.summary.totalAttendances} - ${response.data.data.summary.leaveCount} = ${response.data.data.summary.absentCount}`,
                });

                setCalendarData(response.data.data);
                generateEvents(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching calendar:", error);
            toast.error(
                error.response?.data?.message || "Gagal memuat kalender",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    // Enhanced event generation with priority-based conflict resolution
    // Now includes user join date validation
    const generateEvents = useCallback((data) => {
        const eventsByDate = {}; // Group events by date to handle conflicts

        // Debug counters
        let absentEventCount = 0;
        const absentDates = [];

        // Get user join date
        const userJoinDate = data.user?.created_at
            ? moment(data.user.created_at).startOf("day")
            : null;

        console.log("👤 User Info:", {
            name: data.user?.name,
            email: data.user?.email,
            joinDate: userJoinDate
                ? userJoinDate.format("YYYY-MM-DD")
                : "Unknown",
        });

        // Helper function to add event with priority check
        const addEvent = (date, event, priority) => {
            const dateKey = moment(date).format("YYYY-MM-DD");
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push({ ...event, priority });

            // Count absent events
            if (event.type === "absent") {
                absentEventCount++;
                absentDates.push(dateKey);
            }
        };

        // 1. Holidays (Highest Priority - Always visible)
        data.holidays?.forEach((holiday) => {
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

        // 2. Check for working days without attendance (Absent/Alpha) - ONLY for past dates
        if (data.period && data.workingDays) {
            const startDate = moment(data.period.firstDay);
            const endDate = moment(data.period.lastDay);
            const today = moment().startOf("day");
            const attendanceDates = new Set(
                data.attendances?.map((att) => att.date) || [],
            );
            const leaveDates = new Set();

            // Collect all leave dates
            data.leaves?.forEach((leave) => {
                const leaveStart = moment(leave.start_date);
                const leaveEnd = moment(leave.end_date);
                for (
                    let d = leaveStart.clone();
                    d.isSameOrBefore(leaveEnd);
                    d.add(1, "day")
                ) {
                    leaveDates.add(d.format("YYYY-MM-DD"));
                }
            });

            // Check each working day
            // For PAST months: all days
            // For CURRENT month: up to today (include today if it's a workday with no attendance)
            // For FUTURE dates: don't mark as absent
            for (
                let date = startDate.clone();
                date.isSameOrBefore(endDate);
                date.add(1, "day")
            ) {
                const dateStr = date.format("YYYY-MM-DD");
                const dayOfWeek = date.day();

                // CRITICAL: Skip if before user join date
                if (userJoinDate && date.isBefore(userJoinDate)) {
                    continue;
                }

                // CRITICAL: Weekend (0=Sunday, 6=Saturday) should NEVER be marked as absent
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isWorkingDay = data.workingDays.includes(dayOfWeek);
                const hasHoliday = eventsByDate[dateStr]?.some(
                    (e) => e.type === "holiday",
                );
                const hasAttendance = attendanceDates.has(dateStr);
                const hasLeave = leaveDates.has(dateStr);
                const isFuture = date.isAfter(today);

                // Mark as absent if:
                // - NOT weekend
                // - IS working day
                // - NO holiday
                // - NO attendance
                // - NO leave
                // - NOT future (date <= today)
                // - NOT before join date (already checked above)
                if (
                    !isWeekend &&
                    isWorkingDay &&
                    !hasHoliday &&
                    !hasAttendance &&
                    !hasLeave &&
                    !isFuture
                ) {
                    addEvent(
                        dateStr,
                        {
                            id: `absent-${dateStr}`,
                            title: "❌ Alpha",
                            start: new Date(dateStr + "T00:00:00"),
                            end: new Date(dateStr + "T23:59:59"),
                            allDay: true,
                            type: "absent",
                            color: COLORS.absent,
                            resource: { date: dateStr, type: "absent" },
                        },
                        EVENT_PRIORITY.absent,
                    );
                }
            }
        }

        // 3. Leaves (Higher priority than attendance)
        data.leaves?.forEach((leave) => {
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
                        title: `🏖️ ${leave.type.replace("izin_", "")}`,
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

        // 4. Attendances (Late has higher priority than present)
        data.attendances?.forEach((att) => {
            const time = att.check_in_time?.substring(0, 5) || "";
            const isLate = att.status === "late";
            const isAbsent = att.status === "absent";

            // Skip if already marked as absent above (this is actual attendance record)
            if (!isAbsent) {
                addEvent(
                    att.date,
                    {
                        id: `attendance-${att.id}`,
                        title: isLate ? `⏰ ${time}` : `✓ ${time}`,
                        start: new Date(att.date + "T00:00:00"),
                        end: new Date(att.date + "T23:59:59"),
                        allDay: true,
                        type: "attendance",
                        color: isLate ? COLORS.late : COLORS.present,
                        resource: att,
                    },
                    isLate ? EVENT_PRIORITY.late : EVENT_PRIORITY.present,
                );
            }
        });

        // Resolve conflicts: Keep only highest priority event per date
        const finalEvents = [];
        let finalAbsentCount = 0;
        const finalAbsentDates = [];

        Object.keys(eventsByDate).forEach((dateKey) => {
            const dateEvents = eventsByDate[dateKey];
            // Sort by priority (lower number = higher priority)
            dateEvents.sort((a, b) => a.priority - b.priority);
            // Take only the highest priority event
            const topEvent = dateEvents[0];
            if (topEvent) {
                const { priority, ...eventData } = topEvent; // Remove priority from final event
                finalEvents.push(eventData);

                // Count final absent events (after conflict resolution)
                if (eventData.type === "absent") {
                    finalAbsentCount++;
                    finalAbsentDates.push(dateKey);
                }
            }
        });

        console.log("🔍 Frontend Event Generation Debug:");
        console.log(`   - Total absent events generated: ${absentEventCount}`);
        console.log(
            `   - Absent dates (before conflict): [${absentDates.sort().join(", ")}]`,
        );
        console.log(
            `   - Final absent events (after conflict): ${finalAbsentCount}`,
        );
        console.log(
            `   - Final absent dates: [${finalAbsentDates.sort().join(", ")}]`,
        );
        console.log(`   - Backend absentCount: ${data.summary?.absentCount}`);
        console.log(
            `   - Difference: ${Math.abs(finalAbsentCount - (data.summary?.absentCount || 0))}`,
        );

        if (finalAbsentCount !== data.summary?.absentCount) {
            console.warn("⚠️  MISMATCH DETECTED!");
            console.warn(
                `   Frontend shows ${finalAbsentCount} alpha in calendar`,
            );
            console.warn(
                `   Backend calculated ${data.summary?.absentCount} alpha in summary`,
            );
        }

        setEvents(finalEvents);
    }, []);

    // Fetch date detail
    const fetchDateDetail = useCallback(async (date) => {
        try {
            setLoadingDetail(true);
            const dateStr = moment(date).format("YYYY-MM-DD");

            const response = await axiosInstance.get(
                `/user/calendar/date/${dateStr}`,
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
    }, []);

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

            // Check if date is before user join date
            const userJoinDate = calendarData?.user?.created_at
                ? moment(calendarData.user.created_at).startOf("day")
                : null;
            const isBeforeJoin =
                userJoinDate && moment(date).isBefore(userJoinDate);

            let style = {};
            let className = "";

            if (isBeforeJoin) {
                // Before join date - disabled with gray style
                style = {
                    backgroundColor: "#e9ecef",
                    color: "#adb5bd",
                    opacity: 0.4,
                    cursor: "not-allowed",
                    pointerEvents: "none",
                    textDecoration: "line-through",
                };
                className = "pre-join-date-disabled";
            } else if (isFuture) {
                // Future dates - disabled style
                style = {
                    backgroundColor: "#f8f9fa",
                    color: "#adb5bd",
                    opacity: 0.5,
                    cursor: "not-allowed",
                    pointerEvents: "none",
                };
                className = "future-date-disabled";
            } else if (isTodayDate) {
                // Today - highlighted
                style = {
                    backgroundColor: "#e3f2fd",
                    fontWeight: "bold",
                    border: "2px solid #2196f3",
                    borderRadius: "4px",
                };
                className = "today-date";
            } else if (!isWorkingDay) {
                // Weekend
                style = {
                    backgroundColor: COLORS.weekend,
                    color: "#6c757d",
                };
            }

            return { style, className };
        },
        [calendarData],
    );

    // Handle month/year filter change
    const handleMonthChange = useCallback((e) => {
        const newMonth = e.target.value;
        setSelectedMonth(newMonth);
    }, []);

    const handleYearChange = useCallback((e) => {
        const newYear = e.target.value;
        setSelectedYear(newYear);
    }, []);

    const handleApplyFilter = useCallback(() => {
        const newDate = new Date(
            parseInt(selectedYear),
            parseInt(selectedMonth) - 1,
            1,
        );
        setCurrentDate(newDate);

        // Update URL params
        setSearchParams({ month: selectedMonth, year: selectedYear });

        // Close detail if open
        setSelectedDate(null);
        setDateDetail(null);
    }, [selectedMonth, selectedYear, setSearchParams]);

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
                            Kalender Kerja Saya
                        </h3>
                        <p className="text-muted small mb-0">
                            <i className="bi bi-info-circle me-1"></i>
                            Klik tanggal untuk melihat detail aktivitas (hanya
                            tanggal hari ini dan sebelumnya)
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <Badge bg="primary" className="px-3 py-2">
                            <i className="bi bi-calendar-day me-1"></i>
                            {moment().format("DD MMMM YYYY")}
                        </Badge>
                    </div>
                </div>
            </div>

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
                                        className="bi bi-check-circle"
                                        style={{ fontSize: "2rem" }}
                                    ></i>
                                </div>
                                <h3 className="mb-1 fw-bold">
                                    {calendarData.summary.totalAttendances}
                                </h3>
                                <small className="text-white-50 fw-medium">
                                    Hadir
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
                                        className="bi bi-clock-history"
                                        style={{ fontSize: "2rem" }}
                                    ></i>
                                </div>
                                <h3 className="mb-1 fw-bold">
                                    {calendarData.summary.lateCount}
                                </h3>
                                <small className="text-white-50 fw-medium">
                                    Telat
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
                                        className="bi bi-x-circle"
                                        style={{ fontSize: "2rem" }}
                                    ></i>
                                </div>
                                <h3 className="mb-1 fw-bold">
                                    {calendarData.summary.absentCount || 0}
                                </h3>
                                <small className="text-white-50 fw-medium">
                                    Alpha (Hari)
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
                                        className="bi bi-calendar-x"
                                        style={{ fontSize: "2rem" }}
                                    ></i>
                                </div>
                                <h3 className="mb-1 fw-bold">
                                    {calendarData.summary.leaveCount || 0}
                                </h3>
                                <small className="text-white-50 fw-medium">
                                    Cuti (Hari)
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
                                color: COLORS.absent,
                                label: "Tidak Masuk (Alpha)",
                                icon: "❌",
                                priority: 3,
                            },
                            {
                                color: COLORS.leave,
                                label: "Izin/Cuti Disetujui",
                                icon: "🏖️",
                                priority: 4,
                            },
                            {
                                color: COLORS.late,
                                label: "Terlambat",
                                icon: "⏰",
                                priority: 5,
                            },
                            {
                                color: COLORS.present,
                                label: "Hadir Tepat Waktu",
                                icon: "✓",
                                priority: 6,
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
                                <span className="ms-1">
                                    Jika dalam satu hari terdapat beberapa
                                    status, kalender akan menampilkan status
                                    dengan prioritas tertinggi. Tanggal di masa
                                    depan tidak dapat diklik.
                                </span>
                            </div>
                        </div>
                    </Alert>
                </Card.Body>
            </Card>

            {/* Calendar - Modern Design with Integrated Date Filter */}
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
                                    {/* Day Status - Show holiday details */}
                                    <Alert
                                        variant="light"
                                        className="border mb-3 py-2"
                                    >
                                        <strong>Status Hari:</strong>{" "}
                                        {dateDetail.holiday ? (
                                            <div className="mt-2">
                                                <Badge
                                                    bg="danger"
                                                    className="ms-2 mb-2"
                                                >
                                                    🎉 Hari Libur
                                                </Badge>
                                                <div className="mt-2 ps-2 border-start border-danger border-3">
                                                    <div>
                                                        <strong className="text-danger">
                                                            {
                                                                dateDetail
                                                                    .holiday
                                                                    .name
                                                            }
                                                        </strong>
                                                    </div>
                                                    {dateDetail.holiday
                                                        .description && (
                                                        <div className="text-muted small mt-1">
                                                            {
                                                                dateDetail
                                                                    .holiday
                                                                    .description
                                                            }
                                                        </div>
                                                    )}
                                                    <div className="text-muted small mt-1">
                                                        Tipe:{" "}
                                                        <span className="badge bg-danger-subtle text-danger">
                                                            {dateDetail.holiday
                                                                .is_national
                                                                ? "Libur Nasional"
                                                                : "Hari Libur"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : dateDetail.isWorkingDay ? (
                                            <Badge
                                                bg="success"
                                                className="ms-2"
                                            >
                                                ✓ Hari Kerja
                                            </Badge>
                                        ) : (
                                            <Badge
                                                bg="secondary"
                                                className="ms-2"
                                            >
                                                📅 Akhir Pekan
                                            </Badge>
                                        )}
                                    </Alert>

                                    <Row className="g-3">
                                        {/* Presensi */}
                                        <Col md={6}>
                                            <h6 className="mb-2">
                                                <i className="bi bi-clock me-2 text-success"></i>
                                                Presensi
                                            </h6>
                                            {dateDetail.attendance ? (
                                                <Card className="border">
                                                    <Card.Body className="p-3">
                                                        <Row className="mb-2">
                                                            <Col xs={6}>
                                                                <small className="text-muted d-block">
                                                                    Check In
                                                                </small>
                                                                <strong>
                                                                    {dateDetail
                                                                        .attendance
                                                                        .check_in_time ||
                                                                        "-"}
                                                                </strong>
                                                            </Col>
                                                            <Col xs={6}>
                                                                <small className="text-muted d-block">
                                                                    Check Out
                                                                </small>
                                                                <strong>
                                                                    {dateDetail
                                                                        .attendance
                                                                        .check_out_time ||
                                                                        "-"}
                                                                </strong>
                                                            </Col>
                                                        </Row>
                                                        <div>
                                                            {dateDetail
                                                                .attendance
                                                                .status ===
                                                                "late" && (
                                                                <Badge
                                                                    bg="warning"
                                                                    text="dark"
                                                                    className="me-1"
                                                                >
                                                                    ⏰ Terlambat
                                                                </Badge>
                                                            )}
                                                            {dateDetail
                                                                .attendance
                                                                .work_type ===
                                                                "offsite" && (
                                                                <Badge bg="info">
                                                                    📍 Offsite
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {dateDetail.attendance
                                                            .notes && (
                                                            <div className="mt-2 pt-2 border-top">
                                                                <small className="text-muted d-block">
                                                                    Catatan:
                                                                </small>
                                                                <small>
                                                                    {
                                                                        dateDetail
                                                                            .attendance
                                                                            .notes
                                                                    }
                                                                </small>
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            ) : (
                                                <Alert
                                                    variant="secondary"
                                                    className="py-2 small mb-0"
                                                >
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Tidak ada presensi
                                                </Alert>
                                            )}
                                        </Col>

                                        {/* Logbook */}
                                        <Col md={6}>
                                            <h6 className="mb-2">
                                                <i className="bi bi-journal-text me-2 text-info"></i>
                                                Logbook
                                            </h6>
                                            {dateDetail.logbook ? (
                                                <Card className="border">
                                                    <Card.Body className="p-3">
                                                        <h6 className="mb-1">
                                                            {
                                                                dateDetail
                                                                    .logbook
                                                                    .activity
                                                            }
                                                        </h6>
                                                        <p className="text-muted small mb-0">
                                                            {
                                                                dateDetail
                                                                    .logbook
                                                                    .description
                                                            }
                                                        </p>
                                                    </Card.Body>
                                                </Card>
                                            ) : (
                                                <Alert
                                                    variant="secondary"
                                                    className="py-2 small mb-0"
                                                >
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Tidak ada logbook
                                                </Alert>
                                            )}
                                        </Col>

                                        {/* Perizinan */}
                                        {dateDetail.leave && (
                                            <Col xs={12}>
                                                <h6 className="mb-2">
                                                    <i className="bi bi-calendar-x me-2 text-purple"></i>
                                                    Perizinan
                                                </h6>
                                                <Card className="border">
                                                    <Card.Body className="p-3">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h6 className="mb-1">
                                                                    {dateDetail.leave.type
                                                                        .replace(
                                                                            "izin_",
                                                                            "",
                                                                        )
                                                                        .toUpperCase()}
                                                                </h6>
                                                                <p className="small text-muted mb-2">
                                                                    {moment(
                                                                        dateDetail
                                                                            .leave
                                                                            .start_date,
                                                                    ).format(
                                                                        "DD MMM",
                                                                    )}{" "}
                                                                    -{" "}
                                                                    {moment(
                                                                        dateDetail
                                                                            .leave
                                                                            .end_date,
                                                                    ).format(
                                                                        "DD MMM YYYY",
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <Badge bg="success">
                                                                ✓ Disetujui
                                                            </Badge>
                                                        </div>
                                                        <p className="mb-0 small">
                                                            <strong>
                                                                Alasan:
                                                            </strong>{" "}
                                                            {
                                                                dateDetail.leave
                                                                    .reason
                                                            }
                                                        </p>
                                                        {dateDetail.leave
                                                            .supervisor && (
                                                            <p className="mb-0 small text-muted mt-2">
                                                                Disetujui oleh:{" "}
                                                                {
                                                                    dateDetail
                                                                        .leave
                                                                        .supervisor
                                                                        .name
                                                                }
                                                            </p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        )}
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

export default UserWorkCalendar;
