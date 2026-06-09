import { useState, useEffect, useRef } from "react";
import {
    Modal,
    Badge,
    Spinner,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl, getImageUrl } from "../../utils/Constant";
import toast from "react-hot-toast";
import AttendanceDetailModal from "../../components/AttendanceDetailModal";
import AdvancedFilters from "../../components/common/AdvancedFilters";

const AdminAttendance = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [attendances, setAttendances] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        onLeave: 0,
        onsite: 0,
        offsite: 0,
        presentPercentage: 0,
        latePercentage: 0,
        onLeavePercentage: 0,
    });

    // Filters - Optimized for user monitoring only
    const [filters, setFilters] = useState({
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        division_id: "",
        periode: "",
        sumber_magang: "",
        status: "",
        work_type: "",
    });

    const [selectedUserIds, setSelectedUserIds] = useState([]);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    // View mode
    const [viewMode, setViewMode] = useState("table"); // table or grid

    // Detail modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);

    // Auto refresh
    const [autoRefresh, setAutoRefresh] = useState(false);
    const refreshInterval = useRef(null);



    useEffect(() => {
        fetchDivisions();
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchAttendances();
    }, [
        filters.start_date,
        filters.end_date,
        filters.division_id,
        filters.periode,
        filters.sumber_magang,
        filters.status,
        filters.work_type,
        selectedUserIds,
        page,
    ]);

    useEffect(() => {
        if (autoRefresh) {
            refreshInterval.current = setInterval(() => {
                fetchAttendances(true);
            }, 30000); // Refresh every 30 seconds
        } else {
            if (refreshInterval.current) {
                clearInterval(refreshInterval.current);
            }
        }

        return () => {
            if (refreshInterval.current) {
                clearInterval(refreshInterval.current);
            }
        };
    }, [autoRefresh, filters]);

    const fetchDivisions = async () => {
        try {
            const response = await axiosInstance.get("/admin/divisions");
            const data = response.data.data || response.data || [];
            setDivisions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching divisions:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axiosInstance.get("/admin/users");
            const data = response.data.data || response.data || [];
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchAttendances = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);

            const params = {
                page,
                limit: 20,
            };

            if (filters.start_date) params.date_from = filters.start_date;
            if (filters.end_date) params.date_to = filters.end_date;
            if (filters.division_id) params.division_id = filters.division_id;
            if (filters.status) params.status = filters.status;
            if (filters.work_type) params.work_type = filters.work_type;
            if (selectedUserIds.length > 0) {
                params.user_ids = selectedUserIds.join(",");
            }

            const response = await axiosInstance.get("/admin/attendances", {
                params,
            });

            let data = response.data.data || [];
            data = Array.isArray(data) ? data : [];

            // Client-side filtering for periode and sumber_magang (not in backend yet)
            if (filters.periode) {
                data = data.filter((a) => a.user?.periode === filters.periode);
            }
            if (filters.sumber_magang) {
                data = data.filter(
                    (a) => a.user?.sumber_magang === filters.sumber_magang,
                );
            }

            setAttendances(data);
            setPagination(response.data.pagination);
            calculateStats(
                response.data.pagination?.total_records || data.length,
            );

            if (silent) {
                toast.success("Data diperbarui", {
                    duration: 2000,
                    icon: "🔄",
                });
            }
        } catch (error) {
            console.error("Error fetching attendances:", error);
            if (!silent) {
                toast.error("Gagal memuat data presensi");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (totalRecords) => {
        // Note: Stats are calculated from current page data for display
        // For accurate stats across all pages, backend should return aggregated stats
        const data = attendances;
        const pageTotal = data.length;
        const present = data.filter((a) => a.status === "present").length;
        const late = data.filter((a) => a.status === "late").length;
        const onLeave = data.filter(
            (a) => a.status === "leave" || a.status === "sick",
        ).length;
        const onsite = data.filter((a) => a.work_type === "onsite").length;
        const offsite = data.filter((a) => a.work_type === "offsite").length;

        setStats({
            total: totalRecords || pageTotal,
            present,
            late,
            absent: 0,
            onLeave,
            onsite,
            offsite,
            presentPercentage:
                pageTotal > 0 ? ((present / pageTotal) * 100).toFixed(1) : 0,
            latePercentage:
                pageTotal > 0 ? ((late / pageTotal) * 100).toFixed(1) : 0,
            onLeavePercentage:
                pageTotal > 0 ? ((onLeave / pageTotal) * 100).toFixed(1) : 0,
        });
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
        if (key !== "search") {
            setPage(1);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        fetchAttendances(true);
    };

    const handleResetFilters = () => {
        const today = new Date().toISOString().split("T")[0];
        setFilters({
            start_date: today,
            end_date: today,
            division_id: "",
            periode: "",
            sumber_magang: "",
            status: "",
            work_type: "",
        });
        setSelectedUserIds([]);
        setPage(1);
    };

    // Quick date filters
    const handleQuickDate = (type) => {
        const today = new Date();
        let startDate, endDate;

        switch (type) {
            case "today":
                startDate = endDate = new Date();
                break;
            case "thisWeek":
                const dayOfWeek = today.getDay();
                const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                startDate = new Date(today);
                startDate.setDate(today.getDate() + diffToMonday);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case "thisMonth":
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    0,
                );
                break;
            case "thisYear":
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31);
                break;
            default:
                return;
        }

        setFilters({
            ...filters,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
        });
        setPage(1);
    };

    const handleViewDetail = (attendance) => {
        setSelectedAttendance(attendance);
        setShowDetailModal(true);
    };



    const getStatusBadge = (status) => {
        const badges = {
            present: { bg: "success", text: "Hadir", icon: "check-circle" },
            late: {
                bg: "warning",
                text: "Terlambat",
                icon: "exclamation-circle",
            },
            absent: { bg: "danger", text: "Tidak Hadir", icon: "x-circle" },
            leave: { bg: "info", text: "Izin", icon: "file-earmark-text" },
            sick: { bg: "secondary", text: "Sakit", icon: "hospital" },
        };
        return (
            badges[status] || {
                bg: "secondary",
                text: status,
                icon: "question-circle",
            }
        );
    };

    const getWorkTypeBadge = (workType) => {
        const badges = {
            onsite: { bg: "primary", text: "Onsite", icon: "building" },
            offsite: { bg: "warning", text: "Offsite", icon: "geo-alt" },
        };
        return (
            badges[workType] || {
                bg: "secondary",
                text: workType,
                icon: "question-circle",
            }
        );
    };

    const getRoleBadge = (role) => {
        const badges = {
            admin: { bg: "danger", text: "Admin" },
            supervisor: { bg: "warning", text: "Supervisor" },
            user: { bg: "primary", text: "User" },
        };
        return badges[role] || { bg: "secondary", text: role };
    };

    const formatTime = (timeString) => {
        if (!timeString) return "-";
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            },
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Pagination component
    const renderPagination = () => {
        if (!pagination || pagination.total_pages <= 1) return null;

        return (
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <div className="text-muted small">
                    Menampilkan {(page - 1) * pagination.limit + 1} -{" "}
                    {Math.min(
                        page * pagination.limit,
                        pagination.total_records,
                    )}{" "}
                    dari {pagination.total_records} data
                </div>
                <nav>
                    <ul className="pagination mb-0">
                        <li
                            className={`page-item ${!pagination.has_prev ? "disabled" : ""
                                }`}
                        >
                            <button
                                className="page-link"
                                onClick={() => setPage(page - 1)}
                                disabled={!pagination.has_prev}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>
                        </li>

                        {Array.from(
                            { length: Math.min(5, pagination.total_pages) },
                            (_, i) => {
                                let pageNum;
                                if (pagination.total_pages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= pagination.total_pages - 2) {
                                    pageNum = pagination.total_pages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }

                                return (
                                    <li
                                        key={pageNum}
                                        className={`page-item ${page === pageNum ? "active" : ""
                                            }`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    </li>
                                );
                            },
                        )}

                        <li
                            className={`page-item ${!pagination.has_next ? "disabled" : ""
                                }`}
                        >
                            <button
                                className="page-link"
                                onClick={() => setPage(page + 1)}
                                disabled={!pagination.has_next}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        );
    };

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "400px" }}
            >
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Memuat data presensi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-attendance">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <i className="bi bi-calendar-check me-2 text-primary"></i>
                        Monitoring Presensi
                    </h2>
                    <p className="text-muted mb-0">
                        Kelola dan monitor data presensi karyawan
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <OverlayTrigger
                        placement="bottom"
                        overlay={
                            <Tooltip>Auto-refresh setiap 30 detik</Tooltip>
                        }
                    >
                        <button
                            className={`btn ${autoRefresh
                                    ? "btn-success"
                                    : "btn-outline-secondary"
                                }`}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                        >
                            <i
                                className={`bi ${autoRefresh
                                        ? "bi-toggle-on"
                                        : "bi-toggle-off"
                                    } me-2`}
                            ></i>
                            Auto-Refresh{" "}
                            {autoRefresh && refreshing && (
                                <Spinner
                                    animation="border"
                                    size="sm"
                                    className="ms-2"
                                />
                            )}
                        </button>
                    </OverlayTrigger>
                    <button
                        className="btn btn-outline-primary"
                        onClick={handleRefresh}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div
                        className="card border-0 shadow-sm h-100"
                        style={{ borderLeft: "4px solid #0d6efd" }}
                    >
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 small">
                                        Total Presensi
                                    </p>
                                    <h3 className="mb-0 fw-bold">
                                        {stats.total}
                                    </h3>
                                </div>
                                <div className="bg-primary bg-opacity-10 p-3 rounded">
                                    <i className="bi bi-people-fill text-primary fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div
                        className="card border-0 shadow-sm h-100"
                        style={{ borderLeft: "4px solid #198754" }}
                    >
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 small">
                                        Hadir
                                    </p>
                                    <h3 className="mb-0 fw-bold">
                                        {stats.present}
                                    </h3>
                                    <p className="mb-0 small text-success fw-semibold">
                                        {stats.presentPercentage}%
                                    </p>
                                </div>
                                <div className="bg-success bg-opacity-10 p-3 rounded">
                                    <i className="bi bi-check-circle-fill text-success fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div
                        className="card border-0 shadow-sm h-100"
                        style={{ borderLeft: "4px solid #ffc107" }}
                    >
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 small">
                                        Terlambat
                                    </p>
                                    <h3 className="mb-0 fw-bold">
                                        {stats.late}
                                    </h3>
                                    <p className="mb-0 small text-warning fw-semibold">
                                        {stats.latePercentage}%
                                    </p>
                                </div>
                                <div className="bg-warning bg-opacity-10 p-3 rounded">
                                    <i className="bi bi-exclamation-circle-fill text-warning fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div
                        className="card border-0 shadow-sm h-100"
                        style={{ borderLeft: "4px solid #0dcaf0" }}
                    >
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="text-muted mb-1 small">
                                        Izin/Sakit
                                    </p>
                                    <h3 className="mb-0 fw-bold">
                                        {stats.onLeave}
                                    </h3>
                                    <p className="mb-0 small text-info fw-semibold">
                                        {stats.onLeavePercentage}%
                                    </p>
                                </div>
                                <div className="bg-info bg-opacity-10 p-3 rounded">
                                    <i className="bi bi-file-earmark-text-fill text-info fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="card-title mb-0">
                            <i className="bi bi-funnel me-2"></i>
                            Filter Data
                        </h5>
                        <div className="d-flex gap-2">
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>Tampilkan data hari ini</Tooltip>
                                }
                            >
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleQuickDate("today")}
                                >
                                    <i className="bi bi-calendar-day me-1"></i>
                                    Hari Ini
                                </button>
                            </OverlayTrigger>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>
                                        Tampilkan data minggu ini (Senin -
                                        Minggu)
                                    </Tooltip>
                                }
                            >
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleQuickDate("thisWeek")}
                                >
                                    <i className="bi bi-calendar-week me-1"></i>
                                    Minggu Ini
                                </button>
                            </OverlayTrigger>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>Tampilkan data bulan ini</Tooltip>
                                }
                            >
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleQuickDate("thisMonth")}
                                >
                                    <i className="bi bi-calendar-month me-1"></i>
                                    Bulan Ini
                                </button>
                            </OverlayTrigger>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>Tampilkan data tahun ini</Tooltip>
                                }
                            >
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleQuickDate("thisYear")}
                                >
                                    <i className="bi bi-calendar-range me-1"></i>
                                    Tahun Ini
                                </button>
                            </OverlayTrigger>
                        </div>
                    </div>

                    <AdvancedFilters
                        filters={filters}
                        setFilters={setFilters}
                        selectedUserIds={selectedUserIds}
                        setSelectedUserIds={setSelectedUserIds}
                        showDivision={true}
                        showPeriode={true}
                        showUser={true}
                        showSumberMagang={true}
                        role="admin"
                        externalUsers={users}
                        externalDivisions={divisions}
                    />

                    <div className="row g-3 align-items-end mt-2">
                        <div className="col-md-3">
                            <label className="form-label small fw-semibold">
                                Tanggal Mulai
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.start_date}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "start_date",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small fw-semibold">
                                Tanggal Akhir
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.end_date}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "end_date",
                                        e.target.value,
                                    )
                                }
                                min={filters.start_date}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                Status Kehadiran
                            </label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) =>
                                    handleFilterChange("status", e.target.value)
                                }
                            >
                                <option value="">Semua Status</option>
                                <option value="present">Hadir</option>
                                <option value="late">Terlambat</option>
                                <option value="absent">Tidak Hadir</option>
                                <option value="leave">Izin</option>
                                <option value="sick">Sakit</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                Tipe Kerja
                            </label>
                            <select
                                className="form-select"
                                value={filters.work_type}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "work_type",
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">Semua Tipe</option>
                                <option value="onsite">Onsite</option>
                                <option value="offsite">Offsite</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                &nbsp;
                            </label>
                            <button
                                className="btn btn-outline-danger w-100"
                                onClick={handleResetFilters}
                            >
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Table View */}
            {viewMode === "table" && (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: "50px" }}>
                                            Avatar
                                        </th>
                                        <th>Nama</th>
                                        <th>Divisi</th>
                                        <th>Tanggal</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Status</th>
                                        <th>Keterangan Check-in</th>
                                        <th>Keterangan Check-out</th>
                                        <th style={{ width: "100px" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendances.length > 0 ? (
                                        attendances.map((attendance) => {
                                            const statusBadge = getStatusBadge(
                                                attendance.status,
                                            );
                                            const workTypeBadge =
                                                getWorkTypeBadge(
                                                    attendance.work_type,
                                                );

                                            return (
                                                <tr key={attendance.id}>
                                                    <td>
                                                        <img
                                                            src={getAvatarUrl(
                                                                attendance.user,
                                                            )}
                                                            alt={
                                                                attendance.user
                                                                    ?.name
                                                            }
                                                            className="rounded-circle"
                                                            style={{
                                                                width: "40px",
                                                                height: "40px",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="fw-semibold">
                                                                {
                                                                    attendance
                                                                        .user
                                                                        ?.name
                                                                }
                                                            </div>
                                                            {attendance.user
                                                                ?.nip && (
                                                                    <small className="text-muted">
                                                                        NIP:{" "}
                                                                        {
                                                                            attendance
                                                                                .user
                                                                                .nip
                                                                        }
                                                                    </small>
                                                                )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-secondary bg-opacity-10 text-secondary">
                                                            {attendance.user
                                                                ?.division
                                                                ?.name || "-"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="text-nowrap">
                                                            {formatDate(
                                                                attendance.date,
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div>
                                                                {formatTime(
                                                                    attendance.check_in_time,
                                                                )}
                                                            </div>
                                                            {attendance.check_in_photo && (
                                                                <small className="text-muted">
                                                                    <i className="bi bi-camera me-1"></i>
                                                                    Ada foto
                                                                </small>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            {formatTime(
                                                                attendance.check_out_time,
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-column gap-1 align-items-start">
                                                            <Badge
                                                                bg={statusBadge.bg}
                                                            >
                                                                <i
                                                                    className={`bi bi-${statusBadge.icon} me-1`}
                                                                ></i>
                                                                {statusBadge.text}
                                                            </Badge>
                                                            {attendance.status !== 'absent' && attendance.status !== 'leave' && attendance.status !== 'sick' && attendance.work_type && (
                                                                <Badge bg={workTypeBadge.bg} text={workTypeBadge.bg === 'warning' ? 'dark' : 'white'}>
                                                                    <i className={`bi bi-${workTypeBadge.icon} me-1`}></i>
                                                                    {workTypeBadge.text}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Keterangan Check-in */}
                                                    <td>
                                                        {attendance.check_in_time ? (
                                                            <div style={{ minWidth: "160px" }}>
                                                                {/* Badge ONSITE / OFFSITE */}
                                                                <span className={`badge bg-${attendance.work_type === 'onsite' ? 'primary' : 'warning text-dark'} me-1`}>
                                                                    <i className={`bi bi-${attendance.work_type === 'onsite' ? 'building' : 'house-door'} me-1`}></i>
                                                                    {attendance.work_type === 'onsite' ? 'ONSITE' : 'OFFSITE'}
                                                                </span>
                                                                {attendance.work_type !== 'onsite' && (
                                                                    <div className="mt-1">
                                                                        <span className="small" title={attendance.offsite_reason || ""}>
                                                                            {attendance.offsite_reason
                                                                                ? (attendance.offsite_reason.length > 30
                                                                                    ? attendance.offsite_reason.substring(0, 30) + "..."
                                                                                    : attendance.offsite_reason)
                                                                                : "Tidak ada keterangan"}
                                                                            {attendance.check_in_photo && (
                                                                                <i className="bi bi-image ms-1 text-primary" title="Bukti Foto"></i>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>

                                                    {/* Keterangan Check-out */}
                                                    <td>
                                                        {attendance.check_out_time ? (
                                                            <div style={{ minWidth: "160px" }}>
                                                                {/* Badge ONSITE / OFFSITE untuk checkout */}
                                                                <span className={`badge bg-${!attendance.checkout_offsite_reason && !attendance.check_out_photo ? 'primary' : 'warning text-dark'} me-1`}>
                                                                    <i className={`bi bi-${!attendance.checkout_offsite_reason && !attendance.check_out_photo ? 'building' : 'house-door'} me-1`}></i>
                                                                    {!attendance.checkout_offsite_reason && !attendance.check_out_photo ? 'ONSITE' : 'OFFSITE'}
                                                                </span>
                                                                {(attendance.checkout_offsite_reason || attendance.check_out_photo) && (
                                                                    <div className="mt-1">
                                                                        <span className="small" title={attendance.checkout_offsite_reason || ""}>
                                                                            {attendance.checkout_offsite_reason
                                                                                ? (attendance.checkout_offsite_reason.length > 30
                                                                                    ? attendance.checkout_offsite_reason.substring(0, 30) + "..."
                                                                                    : attendance.checkout_offsite_reason)
                                                                                : "Tidak ada keterangan"}
                                                                            {attendance.check_out_photo && (
                                                                                <i className="bi bi-image ms-1 text-primary" title="Bukti Foto"></i>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() =>
                                                                handleViewDetail(
                                                                    attendance,
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-eye me-1"></i>
                                                            Detail
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="10"
                                                className="text-center py-5"
                                            >
                                                <div className="text-muted">
                                                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                                    <p className="mb-0">
                                                        Tidak ada data presensi
                                                    </p>
                                                    <small>
                                                        Silakan ubah filter atau
                                                        pilih rentang tanggal
                                                        lain
                                                    </small>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Content - Grid View */}
            {viewMode === "grid" && (
                <div className="row g-3 mb-4">
                    {attendances.length > 0 ? (
                        attendances.map((attendance) => {
                            const statusBadge = getStatusBadge(
                                attendance.status,
                            );
                            const workTypeBadge = getWorkTypeBadge(
                                attendance.work_type,
                            );

                            return (
                                <div
                                    key={attendance.id}
                                    className="col-md-6 col-lg-4 col-xl-3"
                                >
                                    <div
                                        className="card border-0 shadow-sm h-100 hover-lift"
                                        style={{
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                        onClick={() =>
                                            handleViewDetail(attendance)
                                        }
                                    >
                                        <div className="card-body">
                                            <div className="d-flex align-items-start mb-3">
                                                <img
                                                    src={getAvatarUrl(
                                                        attendance.user,
                                                    )}
                                                    alt={attendance.user?.name}
                                                    className="rounded-circle me-2"
                                                    style={{
                                                        width: "50px",
                                                        height: "50px",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1 fw-semibold">
                                                        {attendance.user?.name}
                                                    </h6>
                                                    {attendance.user?.nip && (
                                                        <small className="text-muted d-block">
                                                            NIP:{" "}
                                                            {
                                                                attendance.user
                                                                    .nip
                                                            }
                                                        </small>
                                                    )}
                                                    <small className="text-primary">
                                                        <i className="bi bi-calendar-event me-1"></i>
                                                        {formatDate(
                                                            attendance.date,
                                                        )}
                                                    </small>
                                                </div>
                                            </div>
                                            <div className="mb-2">
                                                <small className="text-muted d-block mb-1">
                                                    Divisi:
                                                </small>
                                                <span className="badge bg-secondary bg-opacity-10 text-secondary">
                                                    {attendance.user?.division
                                                        ?.name || "-"}
                                                </span>
                                            </div>
                                            <div className="row g-2 mb-2">
                                                <div className="col-6">
                                                    <small className="text-muted d-block">
                                                        Check In
                                                    </small>
                                                    <strong>
                                                        {formatTime(
                                                            attendance.check_in_time,
                                                        )}
                                                    </strong>
                                                </div>
                                                <div className="col-6">
                                                    <small className="text-muted d-block">
                                                        Check Out
                                                    </small>
                                                    <strong>
                                                        {formatTime(
                                                            attendance.check_out_time,
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <Badge bg={statusBadge.bg}>
                                                    <i
                                                        className={`bi bi-${statusBadge.icon} me-1`}
                                                    ></i>
                                                    {statusBadge.text}
                                                </Badge>
                                                <Badge bg={workTypeBadge.bg}>
                                                    <i
                                                        className={`bi bi-${workTypeBadge.icon} me-1`}
                                                    ></i>
                                                    {workTypeBadge.text}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5">
                                <i className="bi bi-inbox fs-1 d-block mb-2 text-muted"></i>
                                <p className="mb-0 text-muted">
                                    Tidak ada data presensi
                                </p>
                                <small className="text-muted">
                                    Silakan ubah filter atau pilih rentang
                                    tanggal lain
                                </small>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
                <div className="card border-0 shadow-sm">
                    <div className="card-body">{renderPagination()}</div>
                </div>
            )}

            {/* Detail Modal */}
            <AttendanceDetailModal
                show={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                attendance={selectedAttendance}
                showUserInfo={true}
            />

            <style>{`
                .hover-lift:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
            `}</style>
        </div>
    );
};

export default AdminAttendance;
