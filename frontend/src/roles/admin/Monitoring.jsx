import { useState, useEffect, useRef } from "react";
import { Modal, Badge, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl } from "../../utils/Constant";
import toast from "react-hot-toast";

const Monitoring = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [attendances, setAttendances] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        onLeave: 0,
        onsite: 0,
        offsite: 0,
    });

    // Filters
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split("T")[0],
        division_id: "",
        status: "",
        work_type: "",
        search: "",
    });

    // View mode
    const [viewMode, setViewMode] = useState("grid"); // grid or table

    // Detail modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);

    // Auto refresh
    const [autoRefresh, setAutoRefresh] = useState(false);
    const refreshInterval = useRef(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = viewMode === "grid" ? 12 : 20;

    useEffect(() => {
        fetchDivisions();
        fetchAttendances();
    }, [filters]);

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

    const fetchAttendances = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);

            const params = new URLSearchParams();
            if (filters.date) params.append("date", filters.date);
            if (filters.division_id) params.append("division_id", filters.division_id);
            if (filters.status) params.append("status", filters.status);
            if (filters.work_type) params.append("work_type", filters.work_type);

            const response = await axiosInstance.get(`/admin/attendances?${params.toString()}`);
            let data = response.data.data || response.data || [];
            data = Array.isArray(data) ? data : [];

            // Client-side search filtering
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                data = data.filter(
                    (a) =>
                        a.user?.name?.toLowerCase().includes(searchLower) ||
                        a.user?.nip?.toLowerCase().includes(searchLower) ||
                        a.user?.division?.name?.toLowerCase().includes(searchLower)
                );
            }

            setAttendances(data);
            calculateStats(data);

            if (silent) {
                toast.success("Data diperbarui", { duration: 2000, icon: "🔄" });
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

    const calculateStats = (data) => {
        const stats = {
            total: data.length,
            present: data.filter((a) => a.status === "present").length,
            late: data.filter((a) => a.status === "late").length,
            absent: 0, // Calculated differently
            onLeave: data.filter((a) => a.status === "leave" || a.status === "sick").length,
            onsite: data.filter((a) => a.work_type === "onsite").length,
            offsite: data.filter((a) => a.work_type === "offsite").length,
        };
        setStats(stats);
    };

    const handleRefresh = () => {
        setCurrentPage(1);
        fetchAttendances(true);
    };

    const handleResetFilters = () => {
        setFilters({
            date: new Date().toISOString().split("T")[0],
            division_id: "",
            status: "",
            work_type: "",
            search: "",
        });
        setCurrentPage(1);
    };

    const handleViewDetail = (attendance) => {
        setSelectedAttendance(attendance);
        setShowDetailModal(true);
    };

    const handleExport = async () => {
        try {
            toast.loading("Mengekspor data...", { id: "export" });
            
            const params = new URLSearchParams();
            if (filters.date) params.append("date", filters.date);
            if (filters.division_id) params.append("division_id", filters.division_id);
            if (filters.status) params.append("status", filters.status);

            const response = await axiosInstance.get(
                `/admin/attendances/export?${params.toString()}`,
                { responseType: "blob" }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `attendance_${filters.date}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Data berhasil diekspor", { id: "export" });
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Gagal mengekspor data", { id: "export" });
        }
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAttendances = attendances.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(attendances.length / itemsPerPage);

    const getStatusBadge = (status) => {
        const badges = {
            present: { bg: "success", text: "Hadir", icon: "check-circle" },
            late: { bg: "warning", text: "Terlambat", icon: "exclamation-circle" },
            absent: { bg: "danger", text: "Tidak Hadir", icon: "x-circle" },
            leave: { bg: "info", text: "Izin", icon: "file-earmark-text" },
            sick: { bg: "secondary", text: "Sakit", icon: "hospital" },
        };
        return badges[status] || { bg: "secondary", text: status, icon: "question-circle" };
    };

    const getWorkTypeBadge = (workType) => {
        const badges = {
            onsite: { bg: "primary", text: "Onsite", icon: "building" },
            offsite: { bg: "warning", text: "Offsite", icon: "house" },
        };
        return badges[workType] || { bg: "secondary", text: workType, icon: "geo-alt" };
    };

    if (loading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
                <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
                <p className="mt-3 text-muted">Memuat data monitoring...</p>
            </div>
        );
    }

    return (
        <div className="monitoring-container">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <i className="bi bi-monitor me-2 text-primary"></i>
                        Monitoring Presensi Real-Time
                    </h2>
                    <p className="text-muted mb-0">
                        Monitor kehadiran karyawan secara real-time
                        {autoRefresh && (
                            <Badge bg="success" className="ms-2">
                                <i className="bi bi-arrow-repeat me-1"></i>
                                Auto-Refresh Aktif
                            </Badge>
                        )}
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-primary"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <i className={`bi bi-arrow-clockwise me-2 ${refreshing ? "spin" : ""}`}></i>
                        Refresh
                    </button>
                    <button
                        className={`btn btn-outline-${autoRefresh ? "danger" : "success"}`}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        <i className={`bi bi-${autoRefresh ? "pause" : "play"}-fill me-2`}></i>
                        {autoRefresh ? "Stop Auto" : "Auto Refresh"}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 card-hover">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted small mb-1">Total Presensi</p>
                                    <h3 className="mb-0 fw-bold">{stats.total}</h3>
                                </div>
                                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-people fs-4 text-primary"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 card-hover">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted small mb-1">Hadir</p>
                                    <h3 className="mb-0 fw-bold text-success">{stats.present}</h3>
                                    <small className="text-muted">
                                        {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%
                                    </small>
                                </div>
                                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-check-circle fs-4 text-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 card-hover">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted small mb-1">Terlambat</p>
                                    <h3 className="mb-0 fw-bold text-warning">{stats.late}</h3>
                                    <small className="text-muted">
                                        {stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}%
                                    </small>
                                </div>
                                <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-exclamation-circle fs-4 text-warning"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 card-hover">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted small mb-1">Izin/Cuti</p>
                                    <h3 className="mb-0 fw-bold text-info">{stats.onLeave}</h3>
                                    <small className="text-muted">
                                        {stats.total > 0 ? ((stats.onLeave / stats.total) * 100).toFixed(1) : 0}%
                                    </small>
                                </div>
                                <div className="bg-info bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-file-earmark-text fs-4 text-info"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-calendar3 me-1"></i>
                                Tanggal
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-building me-1"></i>
                                Divisi
                            </label>
                            <select
                                className="form-select"
                                value={filters.division_id}
                                onChange={(e) => setFilters({ ...filters, division_id: e.target.value })}
                            >
                                <option value="">Semua Divisi</option>
                                {divisions.map((div) => (
                                    <option key={div.id} value={div.id}>
                                        {div.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-check-circle me-1"></i>
                                Status
                            </label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">Semua Status</option>
                                <option value="present">Hadir</option>
                                <option value="late">Terlambat</option>
                                <option value="leave">Izin</option>
                                <option value="sick">Sakit</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-geo-alt me-1"></i>
                                Tipe Kerja
                            </label>
                            <select
                                className="form-select"
                                value={filters.work_type}
                                onChange={(e) => setFilters({ ...filters, work_type: e.target.value })}
                            >
                                <option value="">Semua Tipe</option>
                                <option value="onsite">Onsite</option>
                                <option value="offsite">Offsite</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-search me-1"></i>
                                Cari
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nama, NIP, Divisi..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                        <div className="btn-group" role="group">
                            <button
                                type="button"
                                className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setViewMode("grid")}
                            >
                                <i className="bi bi-grid-3x3-gap me-1"></i>
                                Grid
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${viewMode === "table" ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setViewMode("table")}
                            >
                                <i className="bi bi-table me-1"></i>
                                Table
                            </button>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary" onClick={handleResetFilters}>
                                <i className="bi bi-x-circle me-1"></i>
                                Reset Filter
                            </button>
                            <button className="btn btn-sm btn-success" onClick={handleExport}>
                                <i className="bi bi-file-earmark-excel me-1"></i>
                                Export Excel
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {currentAttendances.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                        <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
                        <h5 className="text-muted">Tidak Ada Data Presensi</h5>
                        <p className="text-muted mb-3">
                            Tidak ada data presensi untuk filter yang dipilih
                        </p>
                        <button className="btn btn-primary" onClick={handleResetFilters}>
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Reset Filter
                        </button>
                    </div>
                </div>
            ) : viewMode === "grid" ? (
                <>
                    {/* Grid View */}
                    <div className="row g-3 mb-4">
                        {currentAttendances.map((attendance) => {
                            const statusBadge = getStatusBadge(attendance.status);
                            const workTypeBadge = getWorkTypeBadge(attendance.work_type);
                            return (
                                <div key={attendance.id} className="col-md-6 col-lg-4 col-xl-3">
                                    <div
                                        className="card border-0 shadow-sm h-100 card-hover"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleViewDetail(attendance)}
                                    >
                                        <div className="card-body">
                                            <div className="d-flex align-items-start mb-3">
                                                <img
                                                    src={getAvatarUrl(attendance.user)}
                                                    alt={attendance.user?.name}
                                                    className="rounded-circle me-3"
                                                    width="48"
                                                    height="48"
                                                    style={{ objectFit: "cover" }}
                                                    onError={(e) => {
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                            attendance.user?.name || "User"
                                                        )}&background=0D8ABC&color=fff&size=128`;
                                                    }}
                                                />
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-0">{attendance.user?.name}</h6>
                                                    <small className="text-muted">{attendance.user?.nip}</small>
                                                    <br />
                                                    <Badge bg="light" text="dark" className="mt-1">
                                                        {attendance.user?.division?.name || "No Division"}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="small text-muted">
                                                    <i className="bi bi-clock-history me-1"></i>
                                                    Check In
                                                </span>
                                                <strong>
                                                    {attendance.check_in_time
                                                        ? new Date(attendance.check_in_time).toLocaleTimeString("id-ID", {
                                                              hour: "2-digit",
                                                              minute: "2-digit",
                                                          })
                                                        : "-"}
                                                </strong>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <span className="small text-muted">
                                                    <i className="bi bi-clock-history me-1"></i>
                                                    Check Out
                                                </span>
                                                <strong>
                                                    {attendance.check_out_time
                                                        ? new Date(attendance.check_out_time).toLocaleTimeString("id-ID", {
                                                              hour: "2-digit",
                                                              minute: "2-digit",
                                                          })
                                                        : <Badge bg="warning">Belum</Badge>}
                                                </strong>
                                            </div>

                                            <div className="d-flex gap-2">
                                                <Badge bg={statusBadge.bg} className="flex-fill text-center">
                                                    <i className={`bi bi-${statusBadge.icon} me-1`}></i>
                                                    {statusBadge.text}
                                                </Badge>
                                                <Badge bg={workTypeBadge.bg} className="flex-fill text-center">
                                                    <i className={`bi bi-${workTypeBadge.icon} me-1`}></i>
                                                    {workTypeBadge.text}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <>
                    {/* Table View */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: "5%" }}>No</th>
                                            <th style={{ width: "25%" }}>User</th>
                                            <th style={{ width: "15%" }}>Divisi</th>
                                            <th style={{ width: "12%" }}>Check In</th>
                                            <th style={{ width: "12%" }}>Check Out</th>
                                            <th style={{ width: "12%" }}>Status</th>
                                            <th style={{ width: "12%" }}>Tipe Kerja</th>
                                            <th style={{ width: "7%" }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentAttendances.map((attendance, index) => {
                                            const statusBadge = getStatusBadge(attendance.status);
                                            const workTypeBadge = getWorkTypeBadge(attendance.work_type);
                                            return (
                                                <tr key={attendance.id}>
                                                    <td>{indexOfFirstItem + index + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={getAvatarUrl(attendance.user)}
                                                                alt={attendance.user?.name}
                                                                className="rounded-circle me-2"
                                                                width="32"
                                                                height="32"
                                                                style={{ objectFit: "cover" }}
                                                                onError={(e) => {
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                        attendance.user?.name || "User"
                                                                    )}&background=0D8ABC&color=fff&size=128`;
                                                                }}
                                                            />
                                                            <div>
                                                                <strong className="d-block">{attendance.user?.name}</strong>
                                                                <small className="text-muted">{attendance.user?.nip}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge bg="light" text="dark">
                                                            {attendance.user?.division?.name || "-"}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {attendance.check_in_time ? (
                                                            <>
                                                                <i className="bi bi-clock me-1 text-muted"></i>
                                                                {new Date(attendance.check_in_time).toLocaleTimeString("id-ID", {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {attendance.check_out_time ? (
                                                            <>
                                                                <i className="bi bi-clock me-1 text-muted"></i>
                                                                {new Date(attendance.check_out_time).toLocaleTimeString("id-ID", {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </>
                                                        ) : (
                                                            <Badge bg="warning" text="dark">
                                                                Belum
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Badge bg={statusBadge.bg}>
                                                            <i className={`bi bi-${statusBadge.icon} me-1`}></i>
                                                            {statusBadge.text}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Badge bg={workTypeBadge.bg}>
                                                            <i className={`bi bi-${workTypeBadge.icon} me-1`}></i>
                                                            {workTypeBadge.text}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Lihat Detail</Tooltip>}
                                                        >
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => handleViewDetail(attendance)}
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                        </OverlayTrigger>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center">
                    <p className="text-muted mb-0">
                        Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, attendances.length)} dari {attendances.length} data
                    </p>
                    <nav>
                        <ul className="pagination mb-0">
                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                            </li>
                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                // Show first, last, current, and adjacent pages
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(page)}>
                                                {page}
                                            </button>
                                        </li>
                                    );
                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                    return (
                                        <li key={page} className="page-item disabled">
                                            <span className="page-link">...</span>
                                        </li>
                                    );
                                }
                                return null;
                            })}
                            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}

            {/* Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                    <Modal.Title>
                        <i className="bi bi-info-circle me-2 text-primary"></i>
                        Detail Presensi
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedAttendance && (
                        <div>
                            {/* User Info */}
                            <div className="card bg-light border-0 mb-3">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={getAvatarUrl(selectedAttendance.user)}
                                            alt={selectedAttendance.user?.name}
                                            className="rounded-circle me-3"
                                            width="64"
                                            height="64"
                                            style={{ objectFit: "cover" }}
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                    selectedAttendance.user?.name || "User"
                                                )}&background=0D8ABC&color=fff&size=128`;
                                            }}
                                        />
                                        <div>
                                            <h5 className="mb-1">{selectedAttendance.user?.name}</h5>
                                            <p className="text-muted mb-1">
                                                <i className="bi bi-credit-card me-1"></i>
                                                {selectedAttendance.user?.nip}
                                            </p>
                                            <Badge bg="primary">{selectedAttendance.user?.division?.name || "No Division"}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Details */}
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="card border h-100">
                                        <div className="card-body">
                                            <h6 className="text-muted mb-3">
                                                <i className="bi bi-clock-history me-2"></i>
                                                Waktu Presensi
                                            </h6>
                                            <div className="mb-2">
                                                <small className="text-muted d-block">Check In</small>
                                                <strong className="fs-5">
                                                    {selectedAttendance.check_in_time
                                                        ? new Date(selectedAttendance.check_in_time).toLocaleString("id-ID")
                                                        : "-"}
                                                </strong>
                                            </div>
                                            <div>
                                                <small className="text-muted d-block">Check Out</small>
                                                <strong className="fs-5">
                                                    {selectedAttendance.check_out_time
                                                        ? new Date(selectedAttendance.check_out_time).toLocaleString("id-ID")
                                                        : <Badge bg="warning">Belum Check Out</Badge>}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="card border h-100">
                                        <div className="card-body">
                                            <h6 className="text-muted mb-3">
                                                <i className="bi bi-info-circle me-2"></i>
                                                Status & Tipe
                                            </h6>
                                            <div className="mb-2">
                                                <small className="text-muted d-block">Status Kehadiran</small>
                                                {(() => {
                                                    const badge = getStatusBadge(selectedAttendance.status);
                                                    return (
                                                        <Badge bg={badge.bg} className="fs-6 px-3 py-2">
                                                            <i className={`bi bi-${badge.icon} me-1`}></i>
                                                            {badge.text}
                                                        </Badge>
                                                    );
                                                })()}
                                            </div>
                                            <div>
                                                <small className="text-muted d-block">Tipe Kerja</small>
                                                {(() => {
                                                    const badge = getWorkTypeBadge(selectedAttendance.work_type);
                                                    return (
                                                        <Badge bg={badge.bg} className="fs-6 px-3 py-2">
                                                            <i className={`bi bi-${badge.icon} me-1`}></i>
                                                            {badge.text}
                                                        </Badge>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedAttendance.work_type === "offsite" && (
                                    <div className="col-12">
                                        <div className="card border">
                                            <div className="card-body">
                                                <h6 className="text-muted mb-3">
                                                    <i className="bi bi-file-text me-2"></i>
                                                    Keterangan Offsite
                                                </h6>
                                                <p className="mb-0">{selectedAttendance.offsite_reason || "-"}</p>
                                                {selectedAttendance.offsite_photo_url && (
                                                    <div className="mt-3">
                                                        <small className="text-muted d-block mb-2">Foto Bukti</small>
                                                        <img
                                                            src={selectedAttendance.offsite_photo_url}
                                                            alt="Offsite proof"
                                                            className="img-fluid rounded"
                                                            style={{ maxHeight: "300px" }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedAttendance.location && (
                                    <div className="col-12">
                                        <div className="card border">
                                            <div className="card-body">
                                                <h6 className="text-muted mb-2">
                                                    <i className="bi bi-geo-alt me-2"></i>
                                                    Lokasi
                                                </h6>
                                                <p className="mb-0">{selectedAttendance.location.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-top-0">
                    <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                        <i className="bi bi-x-lg me-2"></i>
                        Tutup
                    </button>
                </Modal.Footer>
            </Modal>

            {/* Custom CSS */}
            <style jsx>{`
                .card-hover {
                    transition: all 0.3s ease;
                }
                .card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default Monitoring;
