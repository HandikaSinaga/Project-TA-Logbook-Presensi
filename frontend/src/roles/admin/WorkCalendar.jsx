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
    const [selectedUserId, setSelectedUserId] = useState("");
    // allDivisions comes from backend response (no separate fetch needed)

    // Filter states
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const urlMonth = searchParams.get("month");
        return urlMonth || String(new Date().getMonth() + 1).padStart(2, "0");
    });
    const [selectedYear, setSelectedYear] = useState(() => {
        const urlYear = searchParams.get("year");
        return urlYear || String(new Date().getFullYear());
    });
    const [statusFilter, setStatusFilter] = useState("all");

    const detailRef = useRef(null);

    // Fetch calendar data
    const fetchCalendarData = useCallback(
        async (date) => {
            try {
                setLoading(true);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;

                const params = { year, month };
                if (selectedDivisionId) params.division_id = parseInt(selectedDivisionId);
                if (selectedUserId) params.user_id = parseInt(selectedUserId);

                const response = await axiosInstance.get("/admin/calendar", { params });

                if (response.data.success && response.data.data) {
                    setCalendarData(response.data.data);
                    generateEvents(response.data.data);
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (error) {
                console.error("Error fetching calendar:", error);
                toast.error(error.response?.data?.message || "Gagal memuat kalender");
                setCalendarData(null);
            } finally {
                setLoading(false);
            }
        },
        [selectedDivisionId, selectedUserId], // eslint-disable-line
    );

    // generateEvents: multi-event per day (no priority suppression) like supervisor team view
    // For user-specific view: single priority-based event per day
    const generateEvents = useCallback((data) => {
        if (!data || !data.holidays) { setEvents([]); return; }

        const eventsByDate = {};
        const addEvent = (date, event, priority) => {
            const dateKey = moment(date).format("YYYY-MM-DD");
            if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
            eventsByDate[dateKey].push({ ...event, priority });
        };

        const isUserView = !!selectedUserId;

        // 1. Holidays (always shown, highest priority)
        if (Array.isArray(data.holidays)) {
            data.holidays.forEach((holiday) => {
                addEvent(holiday.date, {
                    id: `holiday-${holiday.id}`,
                    title: `🎉 ${holiday.name}`,
                    start: new Date(holiday.date + "T00:00:00"),
                    end: new Date(holiday.date + "T23:59:59"),
                    allDay: true, type: "holiday",
                    color: holiday.is_national ? COLORS.holiday : COLORS.holidayCustom,
                    resource: holiday,
                }, EVENT_PRIORITY.holiday);
            });
        }

        const holidayDates = new Set(data.holidays?.map(h => h.date) || []);

        if (isUserView && data.user?.created_at) {
            // ── USER-SPECIFIC VIEW: single event per day, priority-based ──
            const userJoinDate = moment(data.user.created_at).startOf("day");

            // Alpha markers
            if (data.period && data.workingDays) {
                const today = moment().startOf("day");
                const attendanceDates = new Set(data.attendances?.map(a => a.date) || []);
                const leaveDates = new Set();
                data.leaves?.forEach(leave => {
                    for (let d = moment(leave.start_date).clone(); d.isSameOrBefore(moment(leave.end_date)); d.add(1, "day"))
                        leaveDates.add(d.format("YYYY-MM-DD"));
                });
                for (let d = moment(data.period.firstDay).clone(); d.isSameOrBefore(moment(data.period.lastDay)); d.add(1, "day")) {
                    const ds = d.format("YYYY-MM-DD");
                    if (d.isBefore(userJoinDate) || d.isAfter(today)) continue;
                    if (!data.workingDays.includes(d.day()) || holidayDates.has(ds) || attendanceDates.has(ds) || leaveDates.has(ds)) continue;
                    addEvent(ds, { id: `absent-${ds}`, title: "❌ Alpha", start: new Date(ds + "T00:00:00"), end: new Date(ds + "T23:59:59"), allDay: true, type: "absent", color: COLORS.absent, resource: { date: ds } }, EVENT_PRIORITY.absent);
                }
            }
            // Leaves
            data.leaves?.forEach(leave => {
                for (let d = moment(leave.start_date).clone(); d.isSameOrBefore(moment(leave.end_date)); d.add(1, "day")) {
                    const ds = d.format("YYYY-MM-DD");
                    addEvent(ds, { id: `leave-${leave.id}-${ds}`, title: `🏖️ ${leave.type?.replace("izin_", "") || "Izin"}`, start: new Date(ds + "T00:00:00"), end: new Date(ds + "T23:59:59"), allDay: true, type: "leave", color: COLORS.leave, resource: leave }, EVENT_PRIORITY.leave);
                }
            });
            // Attendances
            data.attendances?.forEach(att => {
                const time = att.check_in_time?.substring(0, 5) || "";
                const isLate = att.status === "late";
                addEvent(att.date, { id: `att-${att.id}`, title: isLate ? `⏰ ${time}` : `✓ ${time}`, start: new Date(att.date + "T00:00:00"), end: new Date(att.date + "T23:59:59"), allDay: true, type: "attendance", color: isLate ? COLORS.late : COLORS.present, resource: att }, isLate ? EVENT_PRIORITY.late : EVENT_PRIORITY.present);
            });
        } else {
            // ── TEAM/ORG VIEW: multi-event per day, no suppression ──
            const totalUsers = data.users?.length || data.summary?.totalUsers || 0;
            const attByDate = {};
            data.attendances?.forEach(a => {
                if (!attByDate[a.date]) attByDate[a.date] = { onTime: 0, late: 0 };
                attByDate[a.date][a.status === "late" ? "late" : "onTime"]++;
            });
            const leaveDateMap = {};
            data.leaves?.filter(l => l.status === "approved").forEach(l => {
                for (let d = moment(l.start_date).clone(); d.isSameOrBefore(moment(l.end_date)); d.add(1, "day")) {
                    const ds = d.format("YYYY-MM-DD"); if (!leaveDateMap[ds]) leaveDateMap[ds] = 0; leaveDateMap[ds]++;
                }
            });

            const allDates = new Set([
                ...Object.keys(attByDate),
                ...Object.keys(leaveDateMap),
            ]);
            // Add all working days in period
            if (data.period && data.workingDays) {
                const today = moment().startOf("day");
                for (let d = moment(data.period.firstDay).clone(); d.isSameOrBefore(moment(data.period.lastDay)); d.add(1, "day")) {
                    if (data.workingDays.includes(d.day()) && !d.isAfter(today)) allDates.add(d.format("YYYY-MM-DD"));
                }
            }

            const today = moment().startOf("day");
            allDates.forEach(dateStr => {
                if (holidayDates.has(dateStr)) return;
                const dm = moment(dateStr);
                if (dm.isAfter(today)) return;
                if (data.workingDays && !data.workingDays.includes(dm.day())) return;

                const onTime = attByDate[dateStr]?.onTime || 0;
                const late = attByDate[dateStr]?.late || 0;
                const leave = leaveDateMap[dateStr] || 0;
                const absent = Math.max(0, totalUsers - onTime - late - leave);

                if (onTime > 0) addEvent(dateStr, { id: `present-${dateStr}`, title: `✓ ${onTime} Tepat`, start: new Date(dateStr + "T00:00:00"), end: new Date(dateStr + "T23:59:59"), allDay: true, type: "present", color: COLORS.present, resource: { date: dateStr, count: onTime } }, 50);
                if (late > 0) addEvent(dateStr, { id: `late-${dateStr}`, title: `⏰ ${late} Terlambat`, start: new Date(dateStr + "T00:00:00"), end: new Date(dateStr + "T23:59:59"), allDay: true, type: "late", color: COLORS.late, resource: { date: dateStr, count: late } }, 51);
                if (leave > 0) addEvent(dateStr, { id: `leave-${dateStr}`, title: `🏖️ ${leave} Izin`, start: new Date(dateStr + "T00:00:00"), end: new Date(dateStr + "T23:59:59"), allDay: true, type: "leave", color: COLORS.leave, resource: { date: dateStr, count: leave } }, 52);
                if (absent > 0) addEvent(dateStr, { id: `absent-${dateStr}`, title: `❌ ${absent} Alpha`, start: new Date(dateStr + "T00:00:00"), end: new Date(dateStr + "T23:59:59"), allDay: true, type: "absent", color: COLORS.absent, resource: { date: dateStr, count: absent } }, 53);
            });
        }

        // Resolve: user view = 1 event/date; team view = all (except holiday suppresses all)
        const finalEvents = [];
        Object.keys(eventsByDate).forEach(dateKey => {
            const evs = eventsByDate[dateKey].sort((a, b) => a.priority - b.priority);
            if (isUserView) {
                const { priority: _p, ...ev } = evs[0]; finalEvents.push(ev);
            } else {
                const hasHoliday = evs.some(e => e.type === "holiday");
                (hasHoliday ? evs.filter(e => e.type === "holiday") : evs)
                    .forEach(e => { const { priority: _p, ...ev } = e; finalEvents.push(ev); });
            }
        });

        setEvents(finalEvents);
    }, [selectedUserId]);

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
        setSelectedUserId(""); // Reset user when division changes
    }, []);

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
        setSelectedDivisionId("");
        setSelectedUserId("");
        setSearchParams({});
        setSelectedDate(null);
        setDateDetail(null);
        fetchCalendarData(today);
    }, [setSearchParams, fetchCalendarData]);

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

    // Build per-date attendance stats for heatmap (org/team view only)
    const orgDateStats = useMemo(() => {
        if (selectedUserId || !calendarData?.attendances) return {};
        const stats = {};
        const totalUsers = calendarData.users?.length || calendarData.summary?.totalUsers || 0;
        calendarData.attendances.forEach(a => {
            if (!stats[a.date]) stats[a.date] = { present: 0 };
            stats[a.date].present++;
        });
        Object.keys(stats).forEach(d => { stats[d].totalUsers = totalUsers; });
        return stats;
    }, [calendarData, selectedUserId]);

    // Day cell styling: heatmap for org/team view, standard for user view
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
                style = { backgroundColor: "#f8f9fa", color: "#adb5bd", opacity: 0.6, cursor: "not-allowed" };
                className = "future-date-disabled";
            } else if (selectedUserId && calendarData?.user?.created_at) {
                // User-specific: check pre-join date
                const userJoinDate = moment(calendarData.user.created_at).startOf("day");
                if (moment(date).isBefore(userJoinDate)) {
                    style = { backgroundColor: "#e9ecef", color: "#adb5bd", opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" };
                    className = "pre-join-date-disabled";
                } else if (isTodayDate) {
                    style = { backgroundColor: "#e3f2fd", fontWeight: "bold", border: "2px solid #2196f3" };
                    className = "today-highlight";
                } else if (!isWorkingDay) {
                    style = { backgroundColor: COLORS.weekend, color: "#adb5bd" };
                    className = "weekend";
                }
            } else {
                // Org/team view heatmap
                if (isTodayDate) {
                    style = { backgroundColor: "#e3f2fd", fontWeight: "bold", border: "2px solid #2196f3" };
                    className = "today-highlight";
                } else if (!isWorkingDay) {
                    style = { backgroundColor: "#f0f0f0", color: "#adb5bd" };
                    className = "weekend";
                } else {
                    const dayStats = orgDateStats[dateStr];
                    const totalUsers = calendarData?.users?.length || calendarData?.summary?.totalUsers || 0;
                    if (dayStats && totalUsers > 0) {
                        const rate = Math.round((dayStats.present / totalUsers) * 100);
                        if (rate >= 90) style = { backgroundColor: "#e8f5e9" };
                        else if (rate >= 70) style = { backgroundColor: "#fff9c4" };
                        else if (rate >= 50) style = { backgroundColor: "#fff3e0" };
                        else style = { backgroundColor: "#ffebee" };
                    }
                }
            }

            return { style, className };
        },
        [calendarData, selectedUserId, orgDateStats],
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

            {/* Filter Panel - Full Featured */}
            <Card className="mb-3 border-0 shadow-sm">
                <Card.Body className="p-3">
                    <div className="d-flex align-items-center mb-2 gap-2">
                        <i className="bi bi-funnel-fill text-primary"></i>
                        <strong className="small">Filter Monitoring</strong>
                        {(selectedDivisionId || selectedUserId) && (
                            <Badge bg="primary" pill className="small">
                                {selectedUserId ? "User" : "Divisi"} aktif
                            </Badge>
                        )}
                    </div>
                    <Row className="g-2 align-items-end">
                        <Col xs={12} md={3}>
                            <Form.Label className="small fw-medium mb-1">Divisi</Form.Label>
                            <Form.Select size="sm" value={selectedDivisionId} onChange={handleDivisionFilterChange}>
                                <option value="">📋 Semua Divisi</option>
                                {(calendarData?.allDivisions || []).map(div => (
                                    <option key={div.id} value={div.id}>{div.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={12} md={3}>
                            <Form.Label className="small fw-medium mb-1">User</Form.Label>
                            <Form.Select size="sm" value={selectedUserId} onChange={handleUserFilterChange}>
                                <option value="">👥 Semua User</option>
                                {(calendarData?.users || [])
                                    .filter(u => !selectedDivisionId || String(u.division_id) === String(selectedDivisionId))
                                    .map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} {u.role === "supervisor" ? "⭐" : ""}
                                        </option>
                                    ))}
                            </Form.Select>
                        </Col>
                        <Col xs={6} md={2}>
                            <Form.Label className="small fw-medium mb-1">Bulan</Form.Label>
                            <Form.Select size="sm" value={selectedMonth} onChange={handleMonthChange}>
                                {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m,i) => (
                                    <option key={m} value={m}>{moment().month(i).format("MMMM")}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={6} md={2}>
                            <Form.Label className="small fw-medium mb-1">Tahun</Form.Label>
                            <Form.Select size="sm" value={selectedYear} onChange={handleYearChange}>
                                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col xs={12} md={2} className="d-flex gap-2">
                            <Button size="sm" variant="primary" className="flex-grow-1" onClick={handleApplyFilter}>
                                <i className="bi bi-search me-1"></i>Terapkan
                            </Button>
                            <Button size="sm" variant="outline-secondary" onClick={handleResetFilter} title="Reset filter">
                                <i className="bi bi-arrow-counterclockwise"></i>
                            </Button>
                        </Col>
                    </Row>
                    {selectedUserId && (
                        <div className="mt-2 p-2 rounded" style={{background:"#e3f2fd",fontSize:"0.8rem"}}>
                            <i className="bi bi-person-circle me-1 text-primary"></i>
                            <strong>Mode User:</strong> Menampilkan kalender personal{" "}
                            <strong>{calendarData?.users?.find(u => String(u.id) === String(selectedUserId))?.name || ""}</strong>
                            {" "}&mdash; data sama seperti tampilan user bersangkutan.
                        </div>
                    )}
                </Card.Body>
            </Card>


            {/* KPI Summary Cards - 6 metrics */}
            {calendarData?.summary && (
                <Row className="g-3 mb-4">
                    {[
                        { gradient: "linear-gradient(135deg,#667eea,#764ba2)", icon: "bi-people", label: selectedUserId ? "User Dipilih" : "Total User", value: calendarData.summary.totalUsers || 0 },
                        { gradient: "linear-gradient(135deg,#43e97b,#38f9d7)", icon: "bi-check-circle", label: "Kehadiran", value: calendarData.summary.totalAttendances || 0 },
                        { gradient: "linear-gradient(135deg,#f6d365,#fda085)", icon: "bi-clock-history", label: "Terlambat", value: calendarData.summary.lateCount || 0 },
                        { gradient: "linear-gradient(135deg,#f093fb,#f5576c)", icon: "bi-x-circle", label: "Alpha/Absen", value: (() => { const exp = (calendarData.summary.totalUsers || 0) * (calendarData.summary.workingDaysElapsed || 0); return Math.max(0, exp - (calendarData.summary.totalAttendances || 0) - (calendarData.summary.leaveStats?.approved || 0)); })() },
                        { gradient: "linear-gradient(135deg,#6f42c1,#a855f7)", icon: "bi-briefcase", label: "Izin Disetujui", value: calendarData.summary.leaveStats?.approved || 0 },
                        { gradient: "linear-gradient(135deg,#17a2b8,#4facfe)", icon: "bi-journal-text", label: "Logbook", value: calendarData.summary.totalLogbooks || 0 },
                    ].map((card, i) => (
                        <Col xs={6} md={2} key={i}>
                            <Card className="border-0 shadow-sm h-100" style={{ background: card.gradient, color: "white" }}>
                                <Card.Body className="p-3 text-center">
                                    <div className="mb-1"><i className={`bi ${card.icon}`} style={{ fontSize: "1.8rem" }}></i></div>
                                    <h4 className="mb-0 fw-bold">{card.value}</h4>
                                    <small className="text-white-50 fw-medium" style={{ fontSize: "0.75rem" }}>{card.label}</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Legend */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="p-3">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <i className="bi bi-palette text-primary"></i>
                        <strong className="small">Keterangan Warna Kalender</strong>
                        <span className="text-muted small ms-auto">
                            {selectedUserId ? "Mode individual — 1 event/hari" : "Mode tim — multi event/hari + heatmap"}
                        </span>
                    </div>
                    <Row className="g-2">
                        {[
                            { color: COLORS.holiday, label: "Libur Nasional", icon: "🎉" },
                            { color: COLORS.holidayCustom, label: "Hari Libur", icon: "📅" },
                            { color: COLORS.present, label: "Hadir Tepat", icon: "✓" },
                            { color: COLORS.late, label: "Terlambat", icon: "⏰" },
                            { color: COLORS.leave, label: "Izin/Cuti", icon: "🏖️" },
                            { color: COLORS.absent, label: "Alpha", icon: "❌" },
                        ].map((item, i) => (
                            <Col xs={6} md={4} lg={2} key={i}>
                                <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: "#f8f9fa" }}>
                                    <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 4, backgroundColor: item.color, flexShrink: 0 }}></span>
                                    <span style={{ fontSize: "0.8rem" }}>{item.icon} {item.label}</span>
                                </div>
                            </Col>
                        ))}
                    </Row>
                    {!selectedUserId && (
                        <div className="mt-2 d-flex gap-3 flex-wrap">
                            <small className="text-muted"><span style={{ display:"inline-block",width:12,height:12,borderRadius:3,backgroundColor:"#e8f5e9",border:"1px solid #ccc",marginRight:4 }}></span>≥90% hadir</small>
                            <small className="text-muted"><span style={{ display:"inline-block",width:12,height:12,borderRadius:3,backgroundColor:"#fff9c4",border:"1px solid #ccc",marginRight:4 }}></span>70–89%</small>
                            <small className="text-muted"><span style={{ display:"inline-block",width:12,height:12,borderRadius:3,backgroundColor:"#fff3e0",border:"1px solid #ccc",marginRight:4 }}></span>50–69%</small>
                            <small className="text-muted"><span style={{ display:"inline-block",width:12,height:12,borderRadius:3,backgroundColor:"#ffebee",border:"1px solid #ccc",marginRight:4 }}></span>&lt;50%</small>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Division Scorecard — only in org/division view */}
            {!selectedUserId && calendarData?.divisionStats?.length > 0 && (
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Header className="bg-white border-0 py-3">
                        <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-diagram-3 text-primary"></i>
                            <strong>Scorecard per Divisi</strong>
                            <Badge bg="secondary" pill>{calendarData.divisionStats.length} divisi</Badge>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <table className="table table-hover table-sm mb-0">
                                <thead style={{ background: "#f8f9fa" }}>
                                    <tr>
                                        <th className="ps-3 py-2 small">Divisi</th>
                                        <th className="text-center py-2 small">Anggota</th>
                                        <th className="text-center py-2 small">Hadir</th>
                                        <th className="text-center py-2 small">Terlambat</th>
                                        <th className="text-center py-2 small">Alpha</th>
                                        <th className="text-center py-2 small">Logbook</th>
                                        <th className="text-center py-2 small" style={{ minWidth: 120 }}>Attendance Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calendarData.divisionStats.map(div => (
                                        <tr key={div.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedDivisionId(String(div.id)); handleApplyFilter(); }}>
                                            <td className="ps-3 py-2 fw-medium small">{div.name}</td>
                                            <td className="text-center py-2 small">{div.memberCount}</td>
                                            <td className="text-center py-2 small"><span className="text-success fw-bold">{div.attendanceDays}</span></td>
                                            <td className="text-center py-2 small"><span className="text-warning fw-bold">{div.lateDays}</span></td>
                                            <td className="text-center py-2 small"><span className="text-danger fw-bold">{div.absentDays}</span></td>
                                            <td className="text-center py-2 small"><span className="text-info fw-bold">{div.logbookCount}</span></td>
                                            <td className="text-center py-2">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="flex-grow-1" style={{ height: 6, background: "#e9ecef", borderRadius: 3 }}>
                                                        <div style={{ width: `${div.attendanceRate}%`, height: "100%", borderRadius: 3, background: div.attendanceRate >= 90 ? "#28a745" : div.attendanceRate >= 70 ? "#ffc107" : "#dc3545" }}></div>
                                                    </div>
                                                    <small className="fw-bold" style={{ fontSize: "0.75rem", minWidth: 32 }}>{div.attendanceRate}%</small>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Member Scorecard — shown when memberStats exist */}
            {calendarData?.memberStats?.length > 0 && (
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Header className="bg-white border-0 py-3">
                        <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-person-lines-fill text-primary"></i>
                            <strong>Scorecard per Anggota</strong>
                            <Badge bg="secondary" pill>{calendarData.memberStats.length} user</Badge>
                            {selectedDivisionId && <Badge bg="info" pill>{calendarData?.allDivisions?.find(d => String(d.id) === String(selectedDivisionId))?.name || "Divisi"}</Badge>}
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <table className="table table-hover table-sm mb-0">
                                <thead style={{ background: "#f8f9fa" }}>
                                    <tr>
                                        <th className="ps-3 py-2 small">Nama</th>
                                        <th className="py-2 small">Divisi</th>
                                        <th className="text-center py-2 small">Role</th>
                                        <th className="text-center py-2 small">Hadir</th>
                                        <th className="text-center py-2 small">Terlambat</th>
                                        <th className="text-center py-2 small">Alpha</th>
                                        <th className="text-center py-2 small">Izin</th>
                                        <th className="text-center py-2 small">Logbook</th>
                                        <th className="text-center py-2 small" style={{ minWidth: 110 }}>Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calendarData.memberStats
                                        .sort((a, b) => b.attendanceRate - a.attendanceRate)
                                        .map(m => (
                                        <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => setSelectedUserId(String(m.id))}>
                                            <td className="ps-3 py-2 small fw-medium">{m.name}</td>
                                            <td className="py-2 small text-muted">{m.divisionName}</td>
                                            <td className="text-center py-2">
                                                <Badge bg={m.role === "supervisor" ? "warning" : "secondary"} className="small">{m.role === "supervisor" ? "⭐ SPV" : "User"}</Badge>
                                            </td>
                                            <td className="text-center py-2 small text-success fw-bold">{m.attendanceDays}</td>
                                            <td className="text-center py-2 small text-warning fw-bold">{m.lateDays}</td>
                                            <td className="text-center py-2 small text-danger fw-bold">{m.absentDays}</td>
                                            <td className="text-center py-2 small text-purple fw-bold">{m.leaveDays}</td>
                                            <td className="text-center py-2 small text-info fw-bold">{m.logbookDays}</td>
                                            <td className="text-center py-2">
                                                <div className="d-flex align-items-center gap-1">
                                                    <div className="flex-grow-1" style={{ height: 5, background: "#e9ecef", borderRadius: 3 }}>
                                                        <div style={{ width: `${m.attendanceRate}%`, height: "100%", borderRadius: 3, background: m.attendanceRate >= 80 ? "#28a745" : m.attendanceRate >= 60 ? "#ffc107" : "#dc3545" }}></div>
                                                    </div>
                                                    <small className="fw-bold" style={{ fontSize: "0.7rem", minWidth: 28 }}>{m.attendanceRate}%</small>
                                                </div>
                                                {m.attendanceRate < 70 && <small className="text-danger d-block" style={{ fontSize: "0.65rem" }}>⚠ Rendah</small>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card.Body>
                </Card>
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
