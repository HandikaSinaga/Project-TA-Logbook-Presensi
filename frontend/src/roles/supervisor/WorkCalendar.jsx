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
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import {
    isFutureDate,
    isToday as checkIsToday,
    formatDateToString,
} from "../../utils/dateHelper";
import DateDetailStats from "./components/DateDetailStats";
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

const SupervisorWorkCalendar = () => {
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
    const [selectedUserId, setSelectedUserId] = useState("");
    const [supervisorAssignedAt, setSupervisorAssignedAt] = useState(null);

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
    const fetchCalendarData = useCallback(
        async (date) => {
            try {
                setLoading(true);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;

                const params = { year, month };
                if (selectedUserId) {
                    params.user_id = selectedUserId;
                }

                const response = await axiosInstance.get(
                    "/supervisor/calendar",
                    { params },
                );

                if (response.data.success) {
                    setCalendarData(response.data.data);
                    setSupervisorAssignedAt(
                        response.data.data.supervisorAssignedAt,
                    );
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
        },
        [selectedUserId],
    );

    // Enhanced event generation with priority-based conflict resolution
    // For supervisor view: shows team aggregated data
    const generateEvents = useCallback(
        (data) => {
            const eventsByDate = {}; // Group events by date to handle conflicts

            // Helper function to add event with priority check
            const addEvent = (date, event, priority) => {
                const dateKey = moment(date).format("YYYY-MM-DD");
                if (!eventsByDate[dateKey]) {
                    eventsByDate[dateKey] = [];
                }
                eventsByDate[dateKey].push({ ...event, priority });
            };

            // BRANCH 1: USER-SPECIFIC VIEW (when selectedUserId is set)
            // Exactly matches user work calendar logic
            if (selectedUserId && data.user?.created_at) {
                console.log("👤 SUPERVISOR VIEWING USER-SPECIFIC CALENDAR", {
                    userName: data.user?.name,
                    userId: selectedUserId,
                    joinDate: data.user?.created_at,
                });

                const userJoinDate = moment(data.user.created_at).startOf(
                    "day",
                );

                // 1. Holidays
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

                // 2. Mark absent/alpha for working days without attendance
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
                    for (
                        let date = startDate.clone();
                        date.isSameOrBefore(endDate);
                        date.add(1, "day")
                    ) {
                        const dateStr = date.format("YYYY-MM-DD");
                        const dayOfWeek = date.day();

                        // Skip if before user join date
                        if (userJoinDate && date.isBefore(userJoinDate)) {
                            continue;
                        }

                        // Weekend check
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const isWorkingDay =
                            data.workingDays.includes(dayOfWeek);
                        const hasHoliday = eventsByDate[dateStr]?.some(
                            (e) => e.type === "holiday",
                        );
                        const hasAttendance = attendanceDates.has(dateStr);
                        const hasLeave = leaveDates.has(dateStr);
                        const isFuture = date.isAfter(today);

                        // Mark as absent if all conditions met
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

                // 3. Leaves
                data.leaves?.forEach((leave) => {
                    const leaveStart = moment(leave.start_date);
                    const leaveEnd = moment(leave.end_date);

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

                // 4. Attendances
                data.attendances?.forEach((att) => {
                    const time = att.check_in_time?.substring(0, 5) || "";
                    const isLate = att.status === "late";
                    const isAbsent = att.status === "absent";

                    // Skip if already marked as absent (this is actual attendance record)
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
                            isLate
                                ? EVENT_PRIORITY.late
                                : EVENT_PRIORITY.present,
                        );
                    }
                });
            } else {
                // BRANCH 2: TEAM VIEW (when no selectedUserId or it's empty)
                // Aggregated supervisor view
                console.log("👨‍💼 SUPERVISOR VIEWING TEAM CALENDAR", {
                    teamMemberCount: data.teamMembers?.length || 0,
                });

                // 1. Holidays - Red for national, Orange for custom (Highest Priority)
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

                // 2. Team attendances - Aggregated view
                if (data.attendances) {
                    const attendancesByDate = {};
                    data.attendances.forEach((attendance) => {
                        const date = attendance.date;
                        if (!attendancesByDate[date]) {
                            attendancesByDate[date] = { all: [], late: [] };
                        }
                        attendancesByDate[date].all.push(attendance);
                        if (attendance.status === "late") {
                            attendancesByDate[date].late.push(attendance);
                        }
                    });

                    Object.keys(attendancesByDate).forEach((date) => {
                        const count = attendancesByDate[date].all.length;
                        const lateCount = attendancesByDate[date].late.length;
                        const isLate = lateCount > 0;

                        addEvent(
                            date,
                            {
                                id: `attendance-${date}`,
                                title:
                                    lateCount > 0
                                        ? `⏰ ${lateCount} Terlambat`
                                        : `✓ ${count} Hadir`,
                                start: new Date(date + "T00:00:00"),
                                end: new Date(date + "T23:59:59"),
                                allDay: true,
                                type: "attendance",
                                color: isLate ? COLORS.late : COLORS.present,
                                resource: attendancesByDate[date],
                            },
                            isLate
                                ? EVENT_PRIORITY.late
                                : EVENT_PRIORITY.present,
                        );
                    });
                }

                // 3. Team leaves - Purple color
                data.leaves?.forEach((leave) => {
                    const userName = leave.user?.name || "User";
                    const shortName =
                        userName.length > 15
                            ? `${userName.substring(0, 15)}...`
                            : userName;

                    const leaveStart = moment(leave.start_date);
                    const leaveEnd = moment(leave.end_date);

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

                // 4. Team logbooks
                if (data.logbooks) {
                    const logbooksByDate = {};
                    data.logbooks.forEach((logbook) => {
                        const date = logbook.date;
                        if (!logbooksByDate[date]) {
                            logbooksByDate[date] = [];
                        }
                        logbooksByDate[date].push(logbook);
                    });

                    Object.keys(logbooksByDate).forEach((date) => {
                        const count = logbooksByDate[date].length;
                        if (
                            !eventsByDate[date] ||
                            eventsByDate[date].length === 0
                        ) {
                            addEvent(
                                date,
                                {
                                    id: `logbook-${date}`,
                                    title: `📝 ${count} Logbook`,
                                    start: new Date(date + "T00:00:00"),
                                    end: new Date(date + "T23:59:59"),
                                    allDay: true,
                                    type: "logbook",
                                    color: COLORS.logbook,
                                    resource: logbooksByDate[date],
                                },
                                6,
                            );
                        }
                    });
                }
            }

            // Resolve conflicts: Keep only highest priority event per date
            const finalEvents = [];
            Object.keys(eventsByDate).forEach((dateKey) => {
                const dateEvents = eventsByDate[dateKey];
                dateEvents.sort((a, b) => a.priority - b.priority);
                const topEvent = dateEvents[0];
                if (topEvent) {
                    const { priority, ...eventData } = topEvent;
                    finalEvents.push(eventData);
                }
            });

            console.log("🔍 Event Generation Complete:", {
                totalEvents: finalEvents.length,
                eventTypes: {
                    holidays: finalEvents.filter((e) => e.type === "holiday")
                        .length,
                    attendances: finalEvents.filter(
                        (e) => e.type === "attendance",
                    ).length,
                    leaves: finalEvents.filter((e) => e.type === "leave")
                        .length,
                    logbooks: finalEvents.filter((e) => e.type === "logbook")
                        .length,
                    absent: finalEvents.filter((e) => e.type === "absent")
                        .length,
                },
            });

            setEvents(finalEvents);
        },
        [selectedUserId],
    );

    // Fetch date detail
    const fetchDateDetail = useCallback(
        async (date) => {
            try {
                setLoadingDetail(true);
                const dateStr = moment(date).format("YYYY-MM-DD");

                const params = {};
                if (selectedUserId) {
                    params.user_id = selectedUserId;
                }

                const response = await axiosInstance.get(
                    `/supervisor/calendar/date/${dateStr}`,
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
        [selectedUserId],
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

            // Prevent selecting dates before supervisor assignment
            if (supervisorAssignedAt) {
                const assignedDate = new Date(supervisorAssignedAt);
                assignedDate.setHours(0, 0, 0, 0);
                const checkDate = new Date(slotInfo.start);
                checkDate.setHours(0, 0, 0, 0);
                if (checkDate < assignedDate) {
                    toast.error(
                        "Tidak dapat melihat detail sebelum Anda ditugaskan sebagai supervisor",
                    );
                    return;
                }
            }

            setSelectedDate(slotInfo.start);
            fetchDateDetail(slotInfo.start);
        },
        [fetchDateDetail, supervisorAssignedAt],
    );

    const handleSelectEvent = useCallback(
        (event) => {
            const selectedDateStr = formatDateToString(event.start);

            // Prevent selecting future dates
            if (isFutureDate(selectedDateStr)) {
                toast.error("Tidak dapat melihat detail tanggal di masa depan");
                return;
            }

            // Prevent selecting dates before supervisor assignment
            if (supervisorAssignedAt) {
                const assignedDate = new Date(supervisorAssignedAt);
                assignedDate.setHours(0, 0, 0, 0);
                const checkDate = new Date(event.start);
                checkDate.setHours(0, 0, 0, 0);
                if (checkDate < assignedDate) {
                    toast.error(
                        "Tidak dapat melihat detail sebelum Anda ditugaskan sebagai supervisor",
                    );
                    return;
                }
            }

            setSelectedDate(event.start);
            fetchDateDetail(event.start);
        },
        [fetchDateDetail, supervisorAssignedAt],
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

    // Handle user filter change
    const handleUserFilterChange = useCallback((e) => {
        setSelectedUserId(e.target.value);
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
    // When filter to single user, use user view styling logic
    const dayPropGetter = useCallback(
        (date) => {
            const dayOfWeek = date.getDay();
            const dateStr = formatDateToString(date);
            const isTodayDate = checkIsToday(dateStr);
            const isFuture = isFutureDate(dateStr);
            const isWorkingDay = calendarData?.workingDays?.includes(dayOfWeek);

            let style = {};
            let className = "";

            // When filter to single user, use user view logic
            if (selectedUserId && calendarData?.user?.created_at) {
                // Use user view styling when filtered to single user
                const userJoinDate = calendarData.user?.created_at
                    ? moment(calendarData.user.created_at).startOf("day")
                    : null;
                const isBeforeJoin =
                    userJoinDate && moment(date).isBefore(userJoinDate);

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
            } else {
                // Team view styling (default supervisor view)
                // Check if date is before supervisor was assigned to division
                let isBeforeAssigned = false;
                if (supervisorAssignedAt) {
                    const assignedDate = new Date(supervisorAssignedAt);
                    assignedDate.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    isBeforeAssigned = checkDate < assignedDate;
                }

                if (isFuture) {
                    // Future dates - disabled style
                    style = {
                        backgroundColor: "#f8f9fa",
                        color: "#adb5bd",
                        opacity: 0.6,
                        cursor: "not-allowed",
                    };
                    className = "future-date-disabled";
                } else if (isBeforeAssigned) {
                    // Dates before supervisor assignment - disabled style
                    style = {
                        backgroundColor: "#ffe5e5",
                        color: "#999",
                        opacity: 0.5,
                        cursor: "not-allowed",
                        textDecoration: "line-through",
                    };
                    className = "before-assigned-disabled";
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
            }

            return { style, className };
        },
        [calendarData, supervisorAssignedAt, selectedUserId],
    );

    useEffect(() => {
        fetchCalendarData(currentDate);
    }, [fetchCalendarData, currentDate, selectedUserId]);

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
            {/* Header with Gradient - Dynamic based on view type */}
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
                            {selectedUserId
                                ? `Kalender Kerja ${calendarData?.user?.name || "User"}`
                                : "Kalender Kerja Tim"}
                        </h3>
                        <p className="text-muted small mb-0">
                            <i className="bi bi-info-circle me-1"></i>
                            {selectedUserId
                                ? "Klik tanggal untuk melihat detail aktivitas (hanya tanggal hari ini dan sebelumnya)"
                                : "Monitor aktivitas tim dan riwayat presensi (klik tanggal untuk detail)"}
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

            {/* Filter - User Selection */}
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
                                        value={selectedUserId}
                                        onChange={handleUserFilterChange}
                                        style={{ fontWeight: "500" }}
                                    >
                                        <option value="">
                                            📋 Semua Anggota Tim
                                        </option>
                                        {calendarData?.teamMembers?.map(
                                            (member) => (
                                                <option
                                                    key={member.id}
                                                    value={member.id}
                                                >
                                                    {member.name}
                                                </option>
                                            ),
                                        )}
                                    </Form.Select>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* CONDITIONAL RENDERING BASED ON VIEW TYPE */}
            {!selectedUserId ? (
                // TEAM VIEW - Show monitoring cards and team statistics
                <>
                    {/* Summary Cards - Team Overview */}
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
                                            {calendarData.teamMembers?.length ||
                                                0}
                                        </h3>
                                        <small className="text-white-50 fw-medium">
                                            Anggota Tim
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
                                            {calendarData.summary
                                                .totalAttendances || 0}
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
                                            {calendarData.summary.lateCount ||
                                                0}
                                        </h3>
                                        <small className="text-white-50 fw-medium">
                                            Terlambat
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
                                                className="bi bi-journal-text"
                                                style={{ fontSize: "2rem" }}
                                            ></i>
                                        </div>
                                        <h3 className="mb-1 fw-bold">
                                            {calendarData.summary
                                                .logbookCount || 0}
                                        </h3>
                                        <small className="text-white-50 fw-medium">
                                            Logbook
                                        </small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {/* Legend - Team Monitoring Cards */}
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
                                    <i className="bi bi-people text-white"></i>
                                </div>
                                <div>
                                    <h6 className="mb-0 fw-bold">
                                        Status Monitoring Tim
                                    </h6>
                                    <small className="text-muted">
                                        Ringkasan kehadiran tim dalam periode
                                        ini
                                    </small>
                                </div>
                            </div>

                            <Row className="g-3">
                                {[
                                    {
                                        color: COLORS.holiday,
                                        label: "Libur Nasional",
                                        icon: "🎉",
                                        count:
                                            calendarData?.summary?.holidays
                                                ?.national || 0,
                                    },
                                    {
                                        color: COLORS.holidayCustom,
                                        label: "Hari Libur",
                                        icon: "📅",
                                        count:
                                            calendarData?.summary?.holidays
                                                ?.custom || 0,
                                    },
                                    {
                                        color: COLORS.present,
                                        label: "Hadir On-Time",
                                        icon: "✓",
                                        count:
                                            calendarData?.summary?.attendance
                                                ?.onTime || 0,
                                    },
                                    {
                                        color: COLORS.late,
                                        label: "Terlambat",
                                        icon: "⏰",
                                        count:
                                            calendarData?.summary?.attendance
                                                ?.late || 0,
                                    },
                                    {
                                        color: COLORS.leave,
                                        label: "Izin Disetujui",
                                        icon: "🏖️",
                                        count:
                                            calendarData?.summary?.leave
                                                ?.approved || 0,
                                    },
                                    {
                                        color: COLORS.logbook,
                                        label: "Logbook",
                                        icon: "📝",
                                        count:
                                            calendarData?.summary?.logbook
                                                ?.total || 0,
                                    },
                                ].map((item, index) => (
                                    <Col xs={6} md={4} lg={2} key={index}>
                                        <div
                                            className="monitoring-card d-flex flex-column align-items-center p-3 rounded-3 h-100"
                                            style={{
                                                background: "white",
                                                border: "1px solid rgba(0,0,0,0.08)",
                                                boxShadow:
                                                    "0 2px 8px rgba(0,0,0,0.05)",
                                                transition: "all 0.3s ease",
                                                cursor: "default",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "inline-flex",
                                                    width: "40px",
                                                    height: "40px",
                                                    backgroundColor: item.color,
                                                    borderRadius: "8px",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "1.2rem",
                                                    marginBottom: "8px",
                                                    boxShadow: `0 2px 8px ${item.color}40`,
                                                }}
                                            >
                                                {item.icon}
                                            </div>
                                            <div className="text-center">
                                                <div
                                                    style={{
                                                        fontSize: "0.8rem",
                                                        lineHeight: "1.2",
                                                        color: "#6c757d",
                                                        marginBottom: "6px",
                                                        minHeight: "32px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    {item.label}
                                                </div>
                                                <Badge
                                                    bg="primary"
                                                    style={{
                                                        fontSize: "0.85rem",
                                                        fontWeight: "600",
                                                        padding: "4px 8px",
                                                    }}
                                                >
                                                    {item.count}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>

                            {/* Team Statistics Summary */}
                            <Row className="g-3 mt-3">
                                <Col md={6}>
                                    <Card
                                        className="stats-card border h-100"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, rgba(40, 167, 69, 0.15) 0%, rgba(40, 167, 69, 0.08) 100%)",
                                        }}
                                    >
                                        <Card.Body>
                                            <h6 className="mb-3 text-success">
                                                <i className="bi bi-check-circle me-2"></i>
                                                Statistik Presensi
                                            </h6>
                                            <div className="small">
                                                <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                                    <span className="text-muted">
                                                        Total Tim:
                                                    </span>
                                                    <strong>
                                                        {calendarData?.summary
                                                            ?.totalTeamMembers ||
                                                            0}
                                                    </strong>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                                    <span className="text-muted">
                                                        On-Time:
                                                    </span>
                                                    <strong className="text-success">
                                                        {calendarData?.summary
                                                            ?.attendance
                                                            ?.onTime || 0}
                                                    </strong>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">
                                                        Terlambat:
                                                    </span>
                                                    <strong className="text-warning">
                                                        {calendarData?.summary
                                                            ?.attendance
                                                            ?.late || 0}
                                                    </strong>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card
                                        className="stats-card border h-100"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, rgba(23, 162, 184, 0.15) 0%, rgba(23, 162, 184, 0.08) 100%)",
                                        }}
                                    >
                                        <Card.Body>
                                            <h6 className="mb-3 text-info">
                                                <i className="bi bi-file-earmark-text me-2"></i>
                                                Statistik Logbook
                                            </h6>
                                            <div className="small">
                                                <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                                    <span className="text-muted">
                                                        Total:
                                                    </span>
                                                    <strong>
                                                        {calendarData?.summary
                                                            ?.logbook?.total ||
                                                            0}
                                                    </strong>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                                    <span className="text-muted">
                                                        Disetujui:
                                                    </span>
                                                    <strong className="text-success">
                                                        {calendarData?.summary
                                                            ?.logbook
                                                            ?.approved || 0}
                                                    </strong>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">
                                                        Pending:
                                                    </span>
                                                    <strong className="text-warning">
                                                        {calendarData?.summary
                                                            ?.logbook
                                                            ?.pending || 0}
                                                    </strong>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
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
                                        <strong className="text-primary">
                                            Tips:
                                        </strong>
                                        <span className="ms-2">
                                            Jika satu tanggal memiliki beberapa
                                            status, hanya status dengan
                                            prioritas tertinggi yang ditampilkan
                                            di kalender.
                                        </span>
                                    </div>
                                </div>
                            </Alert>
                        </Card.Body>
                    </Card>
                </>
            ) : (
                // USER-SPECIFIC VIEW - Show individual user summary cards like user calendar
                <>
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
                                            {calendarData.summary
                                                .totalAttendances || 0}
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
                                            {calendarData.summary.lateCount ||
                                                0}
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
                                            {calendarData.summary.absentCount ||
                                                0}
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
                                            {calendarData.summary.leaveCount ||
                                                0}
                                        </h3>
                                        <small className="text-white-50 fw-medium">
                                            Cuti (Hari)
                                        </small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {/* Legend - User View */}
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
                                        Sistem prioritas untuk menampilkan
                                        status
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
                                    <Col
                                        xs={6}
                                        md={4}
                                        lg={2}
                                        key={item.priority}
                                    >
                                        <div
                                            className="d-flex align-items-center p-3 rounded-3 h-100"
                                            style={{
                                                background: "white",
                                                border: "1px solid rgba(0,0,0,0.08)",
                                                boxShadow:
                                                    "0 2px 8px rgba(0,0,0,0.05)",
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
                                                    style={{
                                                        fontSize: "0.7rem",
                                                    }}
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
                                        <strong className="text-primary">
                                            Tips:
                                        </strong>
                                        <span className="ms-2">
                                            Klik tanggal untuk melihat detail
                                            aktivitas Anda (hanya tanggal hari
                                            ini dan sebelumnya)
                                        </span>
                                    </div>
                                </div>
                            </Alert>
                        </Card.Body>
                    </Card>
                </>
            )}

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
                                        tim
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
                                <DateDetailStats
                                    dateDetail={dateDetail}
                                    loading={loadingDetail}
                                />
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

export default SupervisorWorkCalendar;
