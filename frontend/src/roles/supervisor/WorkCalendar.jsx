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
    // Team view: status filter (all | hasAbsent | hasLate | hasLeave)
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

                        // Weekend check
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const isWorkingDay =
                            data.workingDays.includes(dayOfWeek);

                        // Add "Belum Bergabung" event if before join date
                        if (userJoinDate && date.isBefore(userJoinDate)) {
                            if (!isWeekend && isWorkingDay) {
                                addEvent(
                                    dateStr,
                                    {
                                        id: `prejoin-${dateStr}`,
                                        title: "Belum Bergabung",
                                        start: new Date(dateStr + "T00:00:00"),
                                        end: new Date(dateStr + "T23:59:59"),
                                        allDay: true,
                                        type: "prejoin",
                                        color: "#e2e8f0",
                                        textColor: "#64748b",
                                        resource: { date: dateStr, type: "prejoin" },
                                    },
                                    EVENT_PRIORITY.absent,
                                );
                            }
                            continue;
                        }
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
                // ============================================================
                // BRANCH 2: TEAM VIEW — Supervisor monitoring all team members
                // Strategy: Show ALL relevant event types per day (no suppression)
                // Each day can show: holiday, onTime count, late count, leave count, logbook count
                // ============================================================

                const teamSize = data.teamMembers?.length || 0;

                // Build lookup maps for O(1) access
                const attendancesByDate = {};
                data.attendances?.forEach((att) => {
                    if (!attendancesByDate[att.date]) attendancesByDate[att.date] = { onTime: [], late: [], all: [] };
                    attendancesByDate[att.date].all.push(att);
                    if (att.status === "late") attendancesByDate[att.date].late.push(att);
                    else attendancesByDate[att.date].onTime.push(att);
                });

                const leaveDateMap = {};
                data.leaves?.filter(l => l.status === "approved").forEach((leave) => {
                    const s = moment(leave.start_date), e = moment(leave.end_date);
                    for (let d = s.clone(); d.isSameOrBefore(e); d.add(1, "day")) {
                        const ds = d.format("YYYY-MM-DD");
                        if (!leaveDateMap[ds]) leaveDateMap[ds] = [];
                        leaveDateMap[ds].push(leave);
                    }
                });

                const logbooksByDate = {};
                data.logbooks?.forEach((lb) => {
                    if (!logbooksByDate[lb.date]) logbooksByDate[lb.date] = [];
                    logbooksByDate[lb.date].push(lb);
                });

                // Collect all unique working dates in the period
                const startDate = moment(data.period?.firstDay);
                const endDate = moment(data.period?.lastDay);
                const today = moment().startOf("day");

                const allDates = new Set([
                    ...Object.keys(attendancesByDate),
                    ...Object.keys(leaveDateMap),
                    ...Object.keys(logbooksByDate),
                ]);

                // Also add working days to detect full-absence days
                for (let d = startDate.clone(); d.isSameOrBefore(endDate); d.add(1, "day")) {
                    if (data.workingDays?.includes(d.day()) && !d.isAfter(today)) {
                        allDates.add(d.format("YYYY-MM-DD"));
                    }
                }

                // 1. Holidays (override everything, shown as single event)
                data.holidays?.forEach((holiday) => {
                    addEvent(holiday.date, {
                        id: `holiday-${holiday.id}`,
                        title: `🎉 ${holiday.name}`,
                        start: new Date(holiday.date + "T00:00:00"),
                        end: new Date(holiday.date + "T23:59:59"),
                        allDay: true,
                        type: "holiday",
                        color: holiday.is_national ? COLORS.holiday : COLORS.holidayCustom,
                        resource: holiday,
                    }, EVENT_PRIORITY.holiday);
                });

                // Build holiday date set for exclusion
                const holidayDates = new Set(data.holidays?.map(h => h.date) || []);

                // 2. Per-date: show multiple event chips
                allDates.forEach((dateStr) => {
                    if (holidayDates.has(dateStr)) return; // Skip holidays
                    const dateMoment = moment(dateStr);
                    if (dateMoment.isAfter(today)) return; // Skip future
                    if (!data.workingDays?.includes(dateMoment.day())) return; // Skip weekends

                    const attDay = attendancesByDate[dateStr];
                    const onTimeCount = attDay?.onTime?.length || 0;
                    const lateCount = attDay?.late?.length || 0;
                    const totalPresent = (attDay?.all?.length || 0);
                    const leaveCount = leaveDateMap[dateStr]?.length || 0;
                    const logbookCount = logbooksByDate[dateStr]?.length || 0;
                    const activeTeamSize = data.teamMembers?.filter(user => {
                        if (!user.created_at) return true;
                        const joinDate = moment(user.created_at).startOf("day");
                        return !moment(dateStr).isBefore(joinDate);
                    }).length || 0;

                    const absentCount = Math.max(0, activeTeamSize - totalPresent - leaveCount);

                    // Event: On-time attendances
                    if (onTimeCount > 0) {
                        addEvent(dateStr, {
                            id: `present-${dateStr}`,
                            title: `✓ ${onTimeCount} Tepat`,
                            start: new Date(dateStr + "T00:00:00"),
                            end: new Date(dateStr + "T23:59:59"),
                            allDay: true,
                            type: "present",
                            color: COLORS.present,
                            resource: { date: dateStr, count: onTimeCount, type: "present", members: attDay?.onTime },
                        }, 50); // no priority suppression in team view, use high value
                    }

                    // Event: Late attendances
                    if (lateCount > 0) {
                        addEvent(dateStr, {
                            id: `late-${dateStr}`,
                            title: `⏰ ${lateCount} Terlambat`,
                            start: new Date(dateStr + "T00:00:00"),
                            end: new Date(dateStr + "T23:59:59"),
                            allDay: true,
                            type: "late",
                            color: COLORS.late,
                            resource: { date: dateStr, count: lateCount, type: "late", members: attDay?.late },
                        }, 51);
                    }

                    // Event: Approved leaves
                    if (leaveCount > 0) {
                        addEvent(dateStr, {
                            id: `leave-${dateStr}`,
                            title: `🏖️ ${leaveCount} Izin`,
                            start: new Date(dateStr + "T00:00:00"),
                            end: new Date(dateStr + "T23:59:59"),
                            allDay: true,
                            type: "leave",
                            color: COLORS.leave,
                            resource: { date: dateStr, count: leaveCount, type: "leave", members: leaveDateMap[dateStr] },
                        }, 52);
                    }

                    // Event: Absences (alpha)
                    if (absentCount > 0) {
                        addEvent(dateStr, {
                            id: `absent-${dateStr}`,
                            title: `❌ ${absentCount} Alpha`,
                            start: new Date(dateStr + "T00:00:00"),
                            end: new Date(dateStr + "T23:59:59"),
                            allDay: true,
                            type: "absent",
                            color: COLORS.absent,
                            resource: { date: dateStr, count: absentCount, type: "absent" },
                        }, 53);
                    }

                    // Event: Logbooks (only if no other events on that day)
                    if (logbookCount > 0 && onTimeCount === 0 && lateCount === 0 && leaveCount === 0 && absentCount === 0) {
                        addEvent(dateStr, {
                            id: `logbook-${dateStr}`,
                            title: `📝 ${logbookCount} Logbook`,
                            start: new Date(dateStr + "T00:00:00"),
                            end: new Date(dateStr + "T23:59:59"),
                            allDay: true,
                            type: "logbook",
                            color: COLORS.logbook,
                            resource: { date: dateStr, count: logbookCount, type: "logbook" },
                        }, 54);
                    }
                });
            }

            // For team view: show ALL events (no priority suppression).
            // For user view: keep priority-based resolution (single event per date).
            const finalEvents = [];
            const isTeamView = !selectedUserId;

            Object.keys(eventsByDate).forEach((dateKey) => {
                const dateEvents = eventsByDate[dateKey];
                dateEvents.sort((a, b) => a.priority - b.priority);

                if (isTeamView) {
                    // Show all events for team view (holidays still suppress others)
                    const hasHoliday = dateEvents.some(e => e.type === "holiday");
                    const toShow = hasHoliday ? dateEvents.filter(e => e.type === "holiday") : dateEvents;
                    toShow.forEach(ev => {
                        const { priority, ...evData } = ev;
                        finalEvents.push(evData);
                    });
                } else {
                    // User view: keep single highest-priority event
                    const topEvent = dateEvents[0];
                    if (topEvent) {
                        const { priority, ...eventData } = topEvent;
                        finalEvents.push(eventData);
                    }
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

        // Directly fetch data for today's month
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

    // Build per-date attendance stats for heatmap (team view only)
    const teamDateStats = useMemo(() => {
        if (selectedUserId || !calendarData?.attendances) return {};
        const stats = {};
        const teamSize = calendarData.teamMembers?.length || 0;
        calendarData.attendances.forEach((att) => {
            if (!stats[att.date]) stats[att.date] = { present: 0, late: 0 };
            stats[att.date].present++;
            if (att.status === "late") stats[att.date].late++;
        });
        // Attach team size for rate calculation
        Object.keys(stats).forEach(d => { stats[d].teamSize = teamSize; });
        return stats;
    }, [calendarData, selectedUserId]);

    // Day cell styling: heatmap for team view, priority style for user view
    const dayPropGetter = useCallback(
        (date) => {
            const dayOfWeek = date.getDay();
            const dateStr = formatDateToString(date);
            const isTodayDate = checkIsToday(dateStr);
            const isFuture = isFutureDate(dateStr);
            const isWorkingDay = calendarData?.workingDays?.includes(dayOfWeek);

            let style = {};
            let className = "";

            // USER-SPECIFIC VIEW styling
            if (selectedUserId && calendarData?.user?.created_at) {
                const userJoinDate = moment(calendarData.user.created_at).startOf("day");
                const isBeforeJoin = moment(date).isBefore(userJoinDate);

                if (isBeforeJoin) {
                    style = { backgroundColor: "#e9ecef", color: "#adb5bd", opacity: 0.4, cursor: "not-allowed", pointerEvents: "none", textDecoration: "line-through" };
                    className = "pre-join-date-disabled";
                } else if (isFuture) {
                    style = { backgroundColor: "#f8f9fa", color: "#adb5bd", opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" };
                    className = "future-date-disabled";
                } else if (isTodayDate) {
                    style = { backgroundColor: "#e3f2fd", fontWeight: "bold", border: "2px solid #2196f3", borderRadius: "4px" };
                    className = "today-date";
                } else if (!isWorkingDay) {
                    style = { backgroundColor: COLORS.weekend, color: "#6c757d" };
                }
            } else {
                // TEAM VIEW — heatmap coloring based on attendance rate
                let isBeforeAssigned = false;
                if (supervisorAssignedAt) {
                    const assignedDate = new Date(supervisorAssignedAt);
                    assignedDate.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    isBeforeAssigned = checkDate < assignedDate;
                }

                if (isFuture) {
                    style = { backgroundColor: "#f8f9fa", color: "#adb5bd", opacity: 0.6, cursor: "not-allowed" };
                    className = "future-date-disabled";
                } else if (isBeforeAssigned) {
                    style = { backgroundColor: "#fff3cd", color: "#856404", opacity: 0.5, cursor: "not-allowed" };
                    className = "before-assigned-disabled";
                } else if (!isWorkingDay) {
                    style = { backgroundColor: "#f0f0f0", color: "#adb5bd" };
                    className = "weekend";
                } else if (isTodayDate) {
                    style = { backgroundColor: "#e3f2fd", fontWeight: "bold", border: "2px solid #2196f3" };
                    className = "today-highlight";
                } else {
                    // Heatmap: color based on attendance rate
                    const dayStats = teamDateStats[dateStr];
                    const teamSize = calendarData?.teamMembers?.length || 0;
                    if (dayStats && teamSize > 0) {
                        const rate = dayStats.present / teamSize;
                        const hasLate = dayStats.late > 0;
                        if (rate >= 0.9) {
                            // 90%+ present — light green
                            style = { backgroundColor: hasLate ? "#fff9c4" : "#e8f5e9" };
                        } else if (rate >= 0.7) {
                            // 70-89% present — light yellow-green
                            style = { backgroundColor: "#fff9c4" };
                        } else if (rate >= 0.5) {
                            // 50-69% present — light orange
                            style = { backgroundColor: "#fff3e0" };
                        } else {
                            // <50% present — light red (attendance concern)
                            style = { backgroundColor: "#ffebee" };
                        }
                        className = `heatmap-day attendance-rate-${Math.round(rate * 100)}`;
                    } else {
                        // Working day but no data
                        style = { backgroundColor: "#fff3e0", opacity: 0.8 };
                        className = "heatmap-day no-data";
                    }
                }
            }

            return { style, className };
        },
        [calendarData, supervisorAssignedAt, selectedUserId, teamDateStats],
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

            {/* ===== ENHANCED FILTER PANEL ===== */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body className="p-3">
                    <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-funnel-fill text-primary me-2" style={{ fontSize: "1rem" }}></i>
                        <span className="fw-semibold text-dark">Filter Kalender</span>
                    </div>
                    <Row className="g-2 align-items-end">
                        {/* Member filter */}
                        <Col xs={12} md={4}>
                            <Form.Label className="small text-muted mb-1 fw-semibold">👤 Anggota Tim</Form.Label>
                            <Form.Select
                                value={selectedUserId}
                                onChange={handleUserFilterChange}
                                size="sm"
                            >
                                <option value="">📋 Semua Anggota</option>
                                {calendarData?.teamMembers?.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>

                        {/* Month filter */}
                        <Col xs={6} md={2}>
                            <Form.Label className="small text-muted mb-1 fw-semibold">📅 Bulan</Form.Label>
                            <Form.Select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                size="sm"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                                        {moment().month(i).format("MMMM")}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>

                        {/* Year filter */}
                        <Col xs={6} md={2}>
                            <Form.Label className="small text-muted mb-1 fw-semibold">🗓️ Tahun</Form.Label>
                            <Form.Select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                size="sm"
                            >
                                {Array.from({ length: 5 }, (_, i) => {
                                    const y = new Date().getFullYear() - 2 + i;
                                    return <option key={y} value={String(y)}>{y}</option>;
                                })}
                            </Form.Select>
                        </Col>

                        {/* Status filter (team view only) */}
                        {!selectedUserId && (
                            <Col xs={12} md={2}>
                                <Form.Label className="small text-muted mb-1 fw-semibold">🔍 Tampilkan</Form.Label>
                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    size="sm"
                                >
                                    <option value="all">Semua Hari</option>
                                    <option value="hasAbsent">Ada Alpha</option>
                                    <option value="hasLate">Ada Terlambat</option>
                                    <option value="hasLeave">Ada Izin</option>
                                </Form.Select>
                            </Col>
                        )}

                        {/* Action buttons */}
                        <Col xs={12} md={selectedUserId ? 4 : 2} className="d-flex gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                className="flex-grow-1"
                                onClick={handleApplyFilter}
                            >
                                <i className="bi bi-search me-1"></i>Terapkan
                            </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={handleResetFilter}
                                title="Reset ke bulan ini"
                            >
                                <i className="bi bi-arrow-counterclockwise"></i>
                            </Button>
                        </Col>
                    </Row>

                    {/* Active filter badges */}
                    <div className="mt-2 d-flex flex-wrap gap-1">
                        {selectedUserId && (
                            <Badge bg="primary" className="fw-normal">
                                👤 {calendarData?.teamMembers?.find(m => String(m.id) === String(selectedUserId))?.name || "User"}
                                <span
                                    className="ms-1"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setSelectedUserId("")}
                                >✕</span>
                            </Badge>
                        )}
                        {statusFilter !== "all" && (
                            <Badge bg="warning" text="dark" className="fw-normal">
                                🔍 {statusFilter === "hasAbsent" ? "Ada Alpha" : statusFilter === "hasLate" ? "Ada Terlambat" : "Ada Izin"}
                                <span
                                    className="ms-1"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setStatusFilter("all")}
                                >✕</span>
                            </Badge>
                        )}
                        <Badge bg="light" text="dark" className="fw-normal border">
                            📅 {moment().month(parseInt(selectedMonth) - 1).format("MMMM")} {selectedYear}
                        </Badge>
                    </div>
                </Card.Body>
            </Card>

            {/* CONDITIONAL RENDERING BASED ON VIEW TYPE */}
            {!selectedUserId ? (
                // TEAM VIEW
                <>
                    {/* Summary Cards - enriched with attendance rate */}
                    {calendarData?.summary && (() => {
                        const teamSize = calendarData.teamMembers?.length || 0;
                        const totalAttendances = calendarData.summary.totalAttendances || 0;
                        const lateCount = calendarData.summary.lateCount || calendarData.summary.attendance?.late || 0;
                        const workingDaysElapsed = calendarData.summary.workingDays || 1;
                        const attendanceRate = teamSize > 0 && workingDaysElapsed > 0
                            ? Math.round((totalAttendances / (teamSize * workingDaysElapsed)) * 100)
                            : 0;
                        const absentTotal = Math.max(0, (teamSize * workingDaysElapsed) - totalAttendances - (calendarData.summary.leave?.approved || 0));

                        return (
                            <Row className="g-3 mb-4">
                                {/* Anggota Tim */}
                                <Col xs={6} md={2}>
                                    <Card className="border-0 shadow-sm h-100 text-center"
                                        style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
                                        <Card.Body className="p-3">
                                            <i className="bi bi-people" style={{ fontSize: "1.8rem" }}></i>
                                            <h3 className="mb-0 mt-1 fw-bold">{teamSize}</h3>
                                            <small className="text-white-50">Anggota Tim</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                {/* Attendance Rate */}
                                <Col xs={6} md={2}>
                                    <Card className="border-0 shadow-sm h-100 text-center"
                                        style={{ background: attendanceRate >= 80 ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)" : attendanceRate >= 60 ? "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)" : "linear-gradient(135deg, #dc3545 0%, #c82333 100%)", color: "white" }}>
                                        <Card.Body className="p-3">
                                            <i className="bi bi-graph-up" style={{ fontSize: "1.8rem" }}></i>
                                            <h3 className="mb-0 mt-1 fw-bold">{attendanceRate}%</h3>
                                            <small className="text-white-50">Rate Hadir</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                {/* Hadir */}
                                <Col xs={6} md={2}>
                                    <Card className="border-0 shadow-sm h-100 text-center"
                                        style={{ background: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)", color: "white" }}>
                                        <Card.Body className="p-3">
                                            <i className="bi bi-check-circle" style={{ fontSize: "1.8rem" }}></i>
                                            <h3 className="mb-0 mt-1 fw-bold">{totalAttendances}</h3>
                                            <small className="text-white-50">Presensi</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                {/* Terlambat */}
                                <Col xs={6} md={2}>
                                    <Card className="border-0 shadow-sm h-100 text-center"
                                        style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
                                        <Card.Body className="p-3">
                                            <i className="bi bi-clock-history" style={{ fontSize: "1.8rem" }}></i>
                                            <h3 className="mb-0 mt-1 fw-bold">{lateCount}</h3>
                                            <small className="text-white-50">Terlambat</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                {/* Alpha */}
                                <Col xs={6} md={2}>
                                    <Card className="border-0 shadow-sm h-100 text-center"
                                        style={{ background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)", color: "white" }}>
                                        <Card.Body className="p-3">
                                            <i className="bi bi-x-circle" style={{ fontSize: "1.8rem" }}></i>
                                            <h3 className="mb-0 mt-1 fw-bold">{absentTotal}</h3>
                                            <small className="text-white-50">Alpha</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                {/* Izin */}
                                <Col xs={6} md={2}>
                                    <Card className="border-0 shadow-sm h-100 text-center"
                                        style={{ background: "linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)", color: "white" }}>
                                        <Card.Body className="p-3">
                                            <i className="bi bi-calendar-x" style={{ fontSize: "1.8rem" }}></i>
                                            <h3 className="mb-0 mt-1 fw-bold">{calendarData.summary.leave?.approved || 0}</h3>
                                            <small className="text-white-50">Izin Disetujui</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        );
                    })()}

                    {/* ===== MEMBER SCORECARD ===== */}
                    {calendarData?.memberStats && calendarData.memberStats.length > 0 && (
                        <Card className="mb-4 border-0 shadow-sm">
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center mb-3">
                                    <i className="bi bi-bar-chart-line text-primary me-2" style={{ fontSize: "1rem" }}></i>
                                    <span className="fw-semibold">Performa Anggota Tim</span>
                                    <small className="text-muted ms-2">— {moment().month(parseInt(selectedMonth) - 1).format("MMMM")} {selectedYear}</small>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ fontSize: "0.8rem" }}>Anggota</th>
                                                <th className="text-center" style={{ fontSize: "0.8rem" }}>Hadir</th>
                                                <th className="text-center" style={{ fontSize: "0.8rem" }}>Terlambat</th>
                                                <th className="text-center" style={{ fontSize: "0.8rem" }}>Alpha</th>
                                                <th className="text-center" style={{ fontSize: "0.8rem" }}>Izin</th>
                                                <th className="text-center" style={{ fontSize: "0.8rem" }}>Rate Hadir</th>
                                                <th className="text-center" style={{ fontSize: "0.8rem" }}>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {calendarData.memberStats.map((member) => {
                                                const rate = member.attendanceRate ?? 0;
                                                const rateColor = rate >= 80 ? "success" : rate >= 60 ? "warning" : "danger";
                                                const isLowAttendance = rate < 70;
                                                return (
                                                    <tr key={member.id} className={isLowAttendance ? "table-danger" : ""}>
                                                        <td style={{ fontSize: "0.85rem" }}>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div
                                                                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                                                    style={{
                                                                        width: "28px", height: "28px",
                                                                        background: isLowAttendance ? "#dc3545" : "#667eea",
                                                                        fontSize: "0.7rem",
                                                                    }}
                                                                >
                                                                    {member.name?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="fw-medium">{member.name}</span>
                                                                {isLowAttendance && (
                                                                    <Badge bg="danger" pill style={{ fontSize: "0.65rem" }}>
                                                                        ⚠️ Rendah
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg="success" className="fw-normal">{member.attendanceDays ?? 0}</Badge>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg={member.lateDays > 0 ? "warning" : "light"} text={member.lateDays > 0 ? "dark" : "muted"} className="fw-normal">
                                                                {member.lateDays ?? 0}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg={member.absentDays > 0 ? "secondary" : "light"} text={member.absentDays > 0 ? "white" : "muted"} className="fw-normal">
                                                                {member.absentDays ?? 0}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg={member.leaveDays > 0 ? "primary" : "light"} text={member.leaveDays > 0 ? "white" : "muted"} className="fw-normal">
                                                                {member.leaveDays ?? 0}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-center" style={{ minWidth: "100px" }}>
                                                            <div className="d-flex align-items-center gap-1">
                                                                <div className="flex-grow-1 bg-light rounded" style={{ height: "6px" }}>
                                                                    <div
                                                                        className={`bg-${rateColor} rounded`}
                                                                        style={{ height: "6px", width: `${Math.min(rate, 100)}%`, transition: "width 0.5s ease" }}
                                                                    ></div>
                                                                </div>
                                                                <small className={`text-${rateColor} fw-bold`} style={{ fontSize: "0.75rem", minWidth: "34px" }}>
                                                                    {rate}%
                                                                </small>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                                                                onClick={() => setSelectedUserId(String(member.id))}
                                                            >
                                                                Detail
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {calendarData.memberStats.some(m => (m.attendanceRate ?? 0) < 70) && (
                                    <Alert variant="warning" className="mt-3 mb-0 py-2">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        <strong>Perhatian:</strong> Beberapa anggota memiliki tingkat kehadiran di bawah 70%.
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Legend & Heatmap Guide */}
                    <Card className="mb-4 border-0 shadow-sm">
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center mb-3">
                                <i className="bi bi-palette text-primary me-2"></i>
                                <span className="fw-semibold">Panduan Warna Kalender</span>
                            </div>
                            <Row className="g-2">
                                {[
                                    { color: COLORS.holiday, label: "Libur Nasional", icon: "🎉" },
                                    { color: COLORS.holidayCustom, label: "Hari Libur", icon: "📅" },
                                    { color: COLORS.present, label: "Hadir Tepat Waktu", icon: "✓" },
                                    { color: COLORS.late, label: "Terlambat", icon: "⏰" },
                                    { color: COLORS.leave, label: "Izin Disetujui", icon: "🏖️" },
                                    { color: COLORS.absent, label: "Alpha (Tidak Hadir)", icon: "❌" },
                                ].map((item, i) => (
                                    <Col xs={6} md={4} lg={2} key={i}>
                                        <div className="d-flex align-items-center gap-2 p-2 rounded border">
                                            <span style={{ display: "inline-block", width: "16px", height: "16px", backgroundColor: item.color, borderRadius: "4px", flexShrink: 0 }}></span>
                                            <small style={{ fontSize: "0.78rem" }}>{item.icon} {item.label}</small>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                            <div className="mt-3">
                                <small className="text-muted fw-semibold d-block mb-2">Warna Background Hari (Heatmap Kehadiran Tim):</small>
                                <div className="d-flex flex-wrap gap-2">
                                    {[
                                        { bg: "#e8f5e9", label: "≥90% Hadir (Sangat Baik)" },
                                        { bg: "#fff9c4", label: "70–89% Hadir (Baik)" },
                                        { bg: "#fff3e0", label: "50–69% Hadir (Perlu Perhatian)" },
                                        { bg: "#ffebee", label: "<50% Hadir (Kritis)" },
                                    ].map((h, i) => (
                                        <div key={i} className="d-flex align-items-center gap-1 border rounded px-2 py-1">
                                            <span style={{ display: "inline-block", width: "14px", height: "14px", backgroundColor: h.bg, border: "1px solid #dee2e6", borderRadius: "3px" }}></span>
                                            <small style={{ fontSize: "0.75rem" }}>{h.label}</small>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                        date={currentDate}
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
