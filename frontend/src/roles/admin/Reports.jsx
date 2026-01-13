import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { OverlayTrigger, Tooltip, Spinner } from "react-bootstrap";

const AdminReports = () => {
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState("attendance");
    const [divisions, setDivisions] = useState([]);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        start_date: new Date(new Date().setDate(1)).toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        division_id: "",
        periode: "",
        sumber_magang: "",
        status: "",
        approval_status: "",
        work_type: "",
        leave_type: "",
    });
    const [reportData, setReportData] = useState(null);
    const [activeTab, setActiveTab] = useState("attendance"); // For summary report tab navigation

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

    useEffect(() => {
        fetchDivisions();
        fetchUsers();
    }, []);

    // Reset pagination when report data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [reportData]);

    // Pagination helper functions
    const getCurrentData = (data) => {
        if (!data || !Array.isArray(data)) return [];

        // Sort data if sortConfig is set
        let sortedData = [...data];
        if (sortConfig.key) {
            sortedData.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle nested values (e.g., user.name)
                if (sortConfig.key.includes(".")) {
                    const keys = sortConfig.key.split(".");
                    aValue = keys.reduce((obj, key) => obj?.[key], a);
                    bValue = keys.reduce((obj, key) => obj?.[key], b);
                }

                // Handle null/undefined
                if (aValue == null) return 1;
                if (bValue == null) return -1;

                // Compare values
                if (aValue < bValue)
                    return sortConfig.direction === "asc" ? -1 : 1;
                if (aValue > bValue)
                    return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        // Paginate
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return sortedData.slice(indexOfFirstItem, indexOfLastItem);
    };

    const getTotalPages = (data) => {
        if (!data || !Array.isArray(data)) return 0;
        return Math.ceil(data.length / itemsPerPage);
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return (
                <i
                    className="bi bi-arrow-down-up text-muted ms-1"
                    style={{ fontSize: "0.75rem" }}
                ></i>
            );
        }
        return sortConfig.direction === "asc" ? (
            <i className="bi bi-sort-up text-primary ms-1"></i>
        ) : (
            <i className="bi bi-sort-down text-primary ms-1"></i>
        );
    };

    const fetchDivisions = async () => {
        try {
            const response = await axiosInstance.get("/admin/divisions");
            setDivisions(response.data.data || response.data || []);
        } catch (error) {
            console.error("Fetch divisions error:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axiosInstance.get("/admin/users");
            setUsers(response.data.data || response.data || []);
        } catch (error) {
            console.error("Fetch users error:", error);
        }
    };

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
                    0
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
    };

    const handleResetFilters = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setFilters({
            start_date: firstDay.toISOString().split("T")[0],
            end_date: today.toISOString().split("T")[0],
            division_id: "",
            periode: "",
            sumber_magang: "",
            status: "",
            approval_status: "",
            work_type: "",
            leave_type: "",
        });
        setReportData(null);
    };

    const generateReport = async () => {
        setLoading(true);
        const toastId = toast.loading("Menghasilkan laporan...");

        try {
            const params = new URLSearchParams({
                start_date: filters.start_date,
                end_date: filters.end_date,
            });

            if (filters.division_id)
                params.append("division_id", filters.division_id);
            if (filters.periode) params.append("periode", filters.periode);
            if (filters.sumber_magang)
                params.append("sumber_magang", filters.sumber_magang);

            // For attendance: use both status and approval_status
            if (reportType === "attendance") {
                if (filters.status) params.append("status", filters.status);
                if (filters.approval_status)
                    params.append("approval_status", filters.approval_status);
                if (filters.work_type)
                    params.append("work_type", filters.work_type);
            }

            // For logbook/leave: use approval_status as status
            if (
                (reportType === "logbook" || reportType === "leave") &&
                filters.approval_status
            ) {
                params.append("status", filters.approval_status);
            }

            if (reportType === "leave" && filters.leave_type) {
                params.append("type", filters.leave_type);
            }

            // Map frontend reportType to backend route
            const routeMap = {
                attendance: "attendance",
                leave: "izin",
                logbook: "logbook",
                division: "division",
                summary: "summary",
            };
            const backendRoute = routeMap[reportType] || reportType;

            const response = await axiosInstance.get(
                `/admin/reports/${backendRoute}?${params}`
            );
            setReportData(response.data);

            // Reset active tab to attendance when generating summary report
            if (reportType === "summary") {
                setActiveTab("attendance");
            }

            toast.success("Laporan berhasil dihasilkan", { id: toastId });
        } catch (error) {
            console.error("Generate report error:", error);
            toast.error(
                error.response?.data?.message || "Gagal menghasilkan laporan",
                {
                    id: toastId,
                }
            );
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async () => {
        const toastId = toast.loading("Mengekspor laporan ke Excel...");

        try {
            const params = new URLSearchParams({
                start_date: filters.start_date,
                end_date: filters.end_date,
            });

            if (filters.division_id)
                params.append("division_id", filters.division_id);
            if (filters.periode) params.append("periode", filters.periode);
            if (filters.sumber_magang)
                params.append("sumber_magang", filters.sumber_magang);

            // For attendance: use both status and approval_status
            if (reportType === "attendance") {
                if (filters.status) params.append("status", filters.status);
                if (filters.approval_status)
                    params.append("approval_status", filters.approval_status);
                if (filters.work_type)
                    params.append("work_type", filters.work_type);
            }

            // For logbook/leave: use approval_status as status
            if (
                (reportType === "logbook" || reportType === "leave") &&
                filters.approval_status
            ) {
                params.append("status", filters.approval_status);
            }

            if (reportType === "leave" && filters.leave_type) {
                params.append("type", filters.leave_type);
            }

            // Map frontend reportType to backend route
            const routeMap = {
                attendance: "attendance",
                leave: "izin",
                logbook: "logbook",
                division: "division",
                summary: "summary",
            };
            const backendRoute = routeMap[reportType] || reportType;

            const response = await axiosInstance.get(
                `/admin/reports/${backendRoute}/export?${params}`,
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            // Build descriptive filename
            const reportTypeLabel =
                {
                    attendance: "Presensi",
                    leave: "Izin_Cuti",
                    logbook: "Logbook",
                    division: "Divisi",
                    summary: "Summary",
                }[reportType] || reportType;

            const filterParts = [];
            if (filters.division_id) {
                const division = divisions.find(
                    (d) => d.id === parseInt(filters.division_id)
                );
                if (division)
                    filterParts.push(division.name.replace(/\s+/g, "_"));
            }
            if (filters.periode) filterParts.push(`P${filters.periode}`);
            if (filters.sumber_magang)
                filterParts.push(filters.sumber_magang.replace(/\s+/g, "_"));
            if (reportType === "attendance" && filters.status)
                filterParts.push(filters.status);
            if (filters.approval_status)
                filterParts.push(filters.approval_status);

            const dateStr = `${filters.start_date}_${filters.end_date}`;
            const filterStr =
                filterParts.length > 0 ? `_${filterParts.join("_")}` : "";

            link.download = `Laporan_${reportTypeLabel}_${dateStr}${filterStr}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Laporan berhasil diekspor ke Excel", {
                id: toastId,
            });
        } catch (error) {
            console.error("Export report error:", error);
            toast.error(
                error.response?.data?.message || "Gagal mengekspor laporan",
                {
                    id: toastId,
                }
            );
        }
    };

    // Pagination Controls Component
    const renderPaginationControls = (data, dataType = "data") => {
        if (!data || !Array.isArray(data) || data.length === 0) return null;

        const totalPages = getTotalPages(data);
        const totalItems = data.length;
        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

        if (totalItems <= itemsPerPage) return null; // No pagination needed for small datasets

        return (
            <div className="d-flex flex-wrap justify-content-between align-items-center p-3 border-top bg-light">
                <div className="d-flex align-items-center gap-2 mb-2 mb-md-0">
                    <span className="text-muted small">
                        Menampilkan <strong>{startIndex}</strong> -{" "}
                        <strong>{endIndex}</strong> dari{" "}
                        <strong>{totalItems}</strong> data
                    </span>
                </div>

                <div className="d-flex align-items-center gap-3">
                    {/* Items per page selector */}
                    <div className="d-flex align-items-center gap-2">
                        <label className="text-muted small mb-0">
                            Per halaman:
                        </label>
                        <select
                            className="form-select form-select-sm"
                            style={{ width: "auto" }}
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={250}>250</option>
                        </select>
                    </div>

                    {/* Pagination buttons */}
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li
                                className={`page-item ${
                                    currentPage === 1 ? "disabled" : ""
                                }`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    <i className="bi bi-chevron-double-left"></i>
                                </button>
                            </li>
                            <li
                                className={`page-item ${
                                    currentPage === 1 ? "disabled" : ""
                                }`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() =>
                                        setCurrentPage(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                            </li>

                            {/* Page numbers */}
                            {(() => {
                                const pages = [];
                                const showPages = 5; // Number of page buttons to show
                                let startPage = Math.max(
                                    1,
                                    currentPage - Math.floor(showPages / 2)
                                );
                                let endPage = Math.min(
                                    totalPages,
                                    startPage + showPages - 1
                                );

                                if (endPage - startPage < showPages - 1) {
                                    startPage = Math.max(
                                        1,
                                        endPage - showPages + 1
                                    );
                                }

                                for (let i = startPage; i <= endPage; i++) {
                                    pages.push(
                                        <li
                                            key={i}
                                            className={`page-item ${
                                                currentPage === i
                                                    ? "active"
                                                    : ""
                                            }`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() =>
                                                    setCurrentPage(i)
                                                }
                                            >
                                                {i}
                                            </button>
                                        </li>
                                    );
                                }
                                return pages;
                            })()}

                            <li
                                className={`page-item ${
                                    currentPage === totalPages ? "disabled" : ""
                                }`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() =>
                                        setCurrentPage(currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </li>
                            <li
                                className={`page-item ${
                                    currentPage === totalPages ? "disabled" : ""
                                }`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    <i className="bi bi-chevron-double-right"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        );
    };

    return (
        <div className="admin-reports p-4">
            <h2 className="mb-4">Laporan & Statistik</h2>

            {/* Report Configuration */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white py-3 border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-file-earmark-bar-graph me-2 text-primary"></i>
                        Konfigurasi Laporan
                    </h5>
                </div>
                <div className="card-body">
                    {/* Quick Date Actions */}
                    <div className="mb-4 pb-3 border-bottom">
                        <label className="form-label fw-bold mb-2">
                            <i className="bi bi-calendar-check me-2"></i>
                            Quick Actions
                        </label>
                        <div className="d-flex gap-2 flex-wrap">
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>Filter data hari ini</Tooltip>
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
                                        Filter data minggu ini (Senin-Minggu)
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
                                    <Tooltip>Filter data bulan ini</Tooltip>
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
                                    <Tooltip>Filter data tahun ini</Tooltip>
                                }
                            >
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleQuickDate("thisYear")}
                                >
                                    <i className="bi bi-calendar3 me-1"></i>
                                    Tahun Ini
                                </button>
                            </OverlayTrigger>
                            <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={handleResetFilters}
                            >
                                <i className="bi bi-arrow-counterclockwise me-1"></i>
                                Reset Filter
                            </button>
                        </div>
                    </div>

                    {/* Report Type and Date Range */}
                    <div className="row g-3 mb-3">
                        <div className="col-md-4">
                            <label className="form-label fw-bold">
                                <i className="bi bi-file-text me-2"></i>
                                Jenis Laporan
                            </label>
                            <select
                                className="form-select"
                                value={reportType}
                                onChange={(e) => {
                                    setReportType(e.target.value);
                                    setReportData(null);
                                }}
                            >
                                <option value="attendance">
                                    Laporan Presensi
                                </option>
                                <option value="leave">Laporan Izin/Cuti</option>
                                <option value="logbook">Laporan Logbook</option>
                                <option value="summary">Laporan Summary</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">
                                <i className="bi bi-calendar-range me-2"></i>
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.start_date}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        start_date: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">
                                <i className="bi bi-calendar-range me-2"></i>
                                Tanggal Akhir
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.end_date}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        end_date: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    {/* Comprehensive Filters */}
                    <div className="row g-3 mb-3">
                        <div className="col-md-3">
                            <label className="form-label fw-bold">
                                <i className="bi bi-building me-2"></i>
                                Sumber Magang
                            </label>
                            <select
                                className="form-select"
                                value={filters.sumber_magang}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        sumber_magang: e.target.value,
                                    })
                                }
                            >
                                <option value="">Semua Sumber</option>
                                {[...new Set(users.map((u) => u.sumber_magang))]
                                    .filter(Boolean)
                                    .map((source) => (
                                        <option key={source} value={source}>
                                            {source}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">
                                <i className="bi bi-calendar3 me-2"></i>
                                Periode/Batch
                            </label>
                            <select
                                className="form-select"
                                value={filters.periode}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        periode: e.target.value,
                                    })
                                }
                            >
                                <option value="">Semua Periode</option>
                                {[...new Set(users.map((u) => u.periode))]
                                    .filter(Boolean)
                                    .sort((a, b) => b - a)
                                    .map((period) => (
                                        <option key={period} value={period}>
                                            Periode {period}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">
                                <i className="bi bi-diagram-3 me-2"></i>
                                Divisi
                            </label>
                            <select
                                className="form-select"
                                value={filters.division_id}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        division_id: e.target.value,
                                    })
                                }
                            >
                                <option value="">Semua Divisi</option>
                                {divisions.map((div) => (
                                    <option key={div.id} value={div.id}>
                                        {div.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-bold">
                                <i className="bi bi-check-circle me-2"></i>
                                {reportType === "attendance"
                                    ? "Status Kehadiran"
                                    : "Status Approval"}
                            </label>
                            <select
                                className="form-select"
                                value={
                                    reportType === "attendance"
                                        ? filters.status
                                        : filters.approval_status
                                }
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        [reportType === "attendance"
                                            ? "status"
                                            : "approval_status"]:
                                            e.target.value,
                                    })
                                }
                            >
                                <option value="">Semua Status</option>
                                {reportType === "attendance" ? (
                                    <>
                                        <option value="present">Hadir</option>
                                        <option value="late">Terlambat</option>
                                        <option value="early">
                                            Pulang Awal
                                        </option>
                                        <option value="absent">
                                            Tidak Hadir
                                        </option>
                                    </>
                                ) : (
                                    <>
                                        <option value="approved">
                                            Approved
                                        </option>
                                        <option value="pending">Pending</option>
                                        <option value="rejected">
                                            Rejected
                                        </option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Conditional Filters */}
                    {reportType === "attendance" && (
                        <div className="row g-3 mb-3">
                            <div className="col-md-4">
                                <label className="form-label fw-bold">
                                    <i className="bi bi-briefcase me-2"></i>
                                    Tipe Kerja
                                </label>
                                <select
                                    className="form-select"
                                    value={filters.work_type}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            work_type: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Semua Tipe</option>
                                    <option value="onsite">Onsite</option>
                                    <option value="offsite">Offsite</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-bold">
                                    <i className="bi bi-shield-check me-2"></i>
                                    Status Approval
                                </label>
                                <select
                                    className="form-select"
                                    value={filters.approval_status}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            approval_status: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">
                                        Semua Status Approval
                                    </option>
                                    <option value="approved">Approved</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {reportType === "leave" && (
                        <div className="row g-3 mb-3">
                            <div className="col-md-4">
                                <label className="form-label fw-bold">
                                    <i className="bi bi-clipboard-check me-2"></i>
                                    Tipe Izin/Cuti
                                </label>
                                <select
                                    className="form-select"
                                    value={filters.leave_type}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            leave_type: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Semua Tipe</option>
                                    <option value="izin_sakit">
                                        Izin Sakit
                                    </option>
                                    <option value="izin_keperluan">
                                        Izin Keperluan
                                    </option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 justify-content-end pt-3 border-top">
                        <button
                            className="btn btn-primary px-4"
                            onClick={generateReport}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Spinner
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                    />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-search me-2"></i>
                                    Generate Laporan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Display */}
            {reportData && (
                <>
                    {/* Export Actions */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <h6 className="mb-1 fw-bold">
                                        <i className="bi bi-file-earmark-arrow-down me-2 text-primary"></i>
                                        Export Laporan
                                    </h6>
                                    <div className="d-flex flex-wrap gap-2 align-items-center">
                                        <span className="badge bg-light text-dark border">
                                            <i className="bi bi-calendar-range me-1"></i>
                                            {new Date(
                                                filters.start_date
                                            ).toLocaleDateString("id-ID")}{" "}
                                            -{" "}
                                            {new Date(
                                                filters.end_date
                                            ).toLocaleDateString("id-ID")}
                                        </span>
                                        {filters.division_id && (
                                            <span className="badge bg-light text-dark border">
                                                <i className="bi bi-diagram-3 me-1"></i>
                                                {
                                                    divisions.find(
                                                        (d) =>
                                                            d.id ===
                                                            parseInt(
                                                                filters.division_id
                                                            )
                                                    )?.name
                                                }
                                            </span>
                                        )}
                                        {filters.periode && (
                                            <span className="badge bg-light text-dark border">
                                                <i className="bi bi-calendar3 me-1"></i>
                                                Periode {filters.periode}
                                            </span>
                                        )}
                                        {filters.sumber_magang && (
                                            <span className="badge bg-light text-dark border">
                                                <i className="bi bi-building me-1"></i>
                                                {filters.sumber_magang}
                                            </span>
                                        )}
                                        {reportType === "attendance" &&
                                            filters.status && (
                                                <span
                                                    className={`badge ${
                                                        filters.status ===
                                                        "present"
                                                            ? "bg-success"
                                                            : filters.status ===
                                                              "late"
                                                            ? "bg-warning"
                                                            : filters.status ===
                                                              "early"
                                                            ? "bg-info"
                                                            : "bg-danger"
                                                    }`}
                                                >
                                                    <i className="bi bi-circle-fill me-1"></i>
                                                    {filters.status ===
                                                    "present"
                                                        ? "Hadir"
                                                        : filters.status ===
                                                          "late"
                                                        ? "Terlambat"
                                                        : filters.status ===
                                                          "early"
                                                        ? "Pulang Awal"
                                                        : "Tidak Hadir"}
                                                </span>
                                            )}
                                        {(reportType === "logbook" ||
                                            reportType === "leave") &&
                                            filters.approval_status && (
                                                <span
                                                    className={`badge ${
                                                        filters.approval_status ===
                                                        "approved"
                                                            ? "bg-success"
                                                            : filters.approval_status ===
                                                              "pending"
                                                            ? "bg-warning"
                                                            : "bg-danger"
                                                    }`}
                                                >
                                                    <i className="bi bi-check-circle me-1"></i>
                                                    {filters.approval_status
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        filters.approval_status.slice(
                                                            1
                                                        )}
                                                </span>
                                            )}
                                        {reportType === "attendance" &&
                                            filters.work_type && (
                                                <span className="badge bg-info text-dark">
                                                    <i className="bi bi-briefcase me-1"></i>
                                                    {filters.work_type.toUpperCase()}
                                                </span>
                                            )}
                                        {reportType === "leave" &&
                                            filters.leave_type && (
                                                <span className="badge bg-info text-dark">
                                                    <i className="bi bi-clipboard-check me-1"></i>
                                                    {filters.leave_type
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        filters.leave_type.slice(
                                                            1
                                                        )}
                                                </span>
                                            )}
                                    </div>
                                </div>
                                <div className="btn-group">
                                    <button
                                        className="btn btn-success"
                                        onClick={() => exportReport()}
                                    >
                                        <i className="bi bi-file-earmark-excel me-2"></i>
                                        Export Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Data - Show different view for summary vs other reports */}
                    {reportType === "summary" ? (
                        // Summary report with tabbed interface for better UX
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
                                <h5 className="mb-3">
                                    <i className="bi bi-table me-2 text-primary"></i>
                                    Data Detail Laporan
                                </h5>

                                {/* Tab Navigation */}
                                <ul className="nav nav-tabs card-header-tabs">
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${
                                                activeTab === "attendance"
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() => {
                                                setActiveTab("attendance");
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <i className="bi bi-calendar-check me-2"></i>
                                            Presensi
                                            {reportData.data?.attendances
                                                ?.length > 0 && (
                                                <span className="badge bg-primary ms-2">
                                                    {
                                                        reportData.data
                                                            .attendances.length
                                                    }
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${
                                                activeTab === "logbook"
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() => {
                                                setActiveTab("logbook");
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <i className="bi bi-journal-check me-2"></i>
                                            Logbook
                                            {reportData.data?.logbooks?.length >
                                                0 && (
                                                <span className="badge bg-success ms-2">
                                                    {
                                                        reportData.data.logbooks
                                                            .length
                                                    }
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${
                                                activeTab === "leave"
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() => {
                                                setActiveTab("leave");
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <i className="bi bi-calendar-x me-2"></i>
                                            Izin/Cuti
                                            {reportData.data?.leaves?.length >
                                                0 && (
                                                <span className="badge bg-warning ms-2">
                                                    {
                                                        reportData.data.leaves
                                                            .length
                                                    }
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            <div className="card-body p-0">
                                {/* Tab Content */}
                                <div className="tab-content">
                                    {/* Attendance Tab */}
                                    {activeTab === "attendance" && (
                                        <div className="tab-pane fade show active">
                                            {reportData.data?.attendances
                                                ?.length > 0 ? (
                                                <>
                                                    <div className="table-responsive">
                                                        <table className="table table-hover mb-0">
                                                            <thead className="table-light sticky-top">
                                                                <tr>
                                                                    <th
                                                                        className="text-center"
                                                                        style={{
                                                                            width: "60px",
                                                                        }}
                                                                    >
                                                                        No
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "120px",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        onClick={() =>
                                                                            handleSort(
                                                                                "date"
                                                                            )
                                                                        }
                                                                    >
                                                                        Tanggal{" "}
                                                                        {getSortIcon(
                                                                            "date"
                                                                        )}
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "180px",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        onClick={() =>
                                                                            handleSort(
                                                                                "user.name"
                                                                            )
                                                                        }
                                                                    >
                                                                        User{" "}
                                                                        {getSortIcon(
                                                                            "user.name"
                                                                        )}
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "150px",
                                                                        }}
                                                                    >
                                                                        Divisi
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "120px",
                                                                        }}
                                                                    >
                                                                        Status
                                                                        Kehadiran
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "120px",
                                                                        }}
                                                                    >
                                                                        Status
                                                                        Approval
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "100px",
                                                                        }}
                                                                    >
                                                                        Check In
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "100px",
                                                                        }}
                                                                    >
                                                                        Check
                                                                        Out
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "100px",
                                                                        }}
                                                                    >
                                                                        Tipe
                                                                        Kerja
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {getCurrentData(
                                                                    reportData
                                                                        .data
                                                                        .attendances
                                                                ).map(
                                                                    (
                                                                        item,
                                                                        index
                                                                    ) => {
                                                                        const globalIndex =
                                                                            (currentPage -
                                                                                1) *
                                                                                itemsPerPage +
                                                                            index +
                                                                            1;
                                                                        return (
                                                                            <tr
                                                                                key={`att-${
                                                                                    item.id ||
                                                                                    index
                                                                                }`}
                                                                            >
                                                                                <td className="text-center">
                                                                                    {
                                                                                        globalIndex
                                                                                    }
                                                                                </td>
                                                                                <td>
                                                                                    <small className="text-nowrap">
                                                                                        {new Date(
                                                                                            item.date
                                                                                        ).toLocaleDateString(
                                                                                            "id-ID",
                                                                                            {
                                                                                                weekday:
                                                                                                    "short",
                                                                                                year: "numeric",
                                                                                                month: "short",
                                                                                                day: "numeric",
                                                                                            }
                                                                                        )}
                                                                                    </small>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="fw-semibold">
                                                                                        {item
                                                                                            .user
                                                                                            ?.name ||
                                                                                            "-"}
                                                                                    </div>
                                                                                    <small className="text-muted">
                                                                                        NIP:{" "}
                                                                                        {item
                                                                                            .user
                                                                                            ?.nip ||
                                                                                            "-"}
                                                                                    </small>
                                                                                    {item
                                                                                        .user
                                                                                        ?.periode && (
                                                                                        <>
                                                                                            <br />
                                                                                            <small className="badge bg-info bg-opacity-10 text-info">
                                                                                                {
                                                                                                    item
                                                                                                        .user
                                                                                                        .periode
                                                                                                }
                                                                                            </small>
                                                                                        </>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    <small>
                                                                                        {item
                                                                                            .user
                                                                                            ?.division
                                                                                            ?.name ||
                                                                                            "-"}
                                                                                    </small>
                                                                                </td>
                                                                                <td>
                                                                                    <span
                                                                                        className={`badge bg-${
                                                                                            item.status ===
                                                                                            "present"
                                                                                                ? "success"
                                                                                                : item.status ===
                                                                                                  "late"
                                                                                                ? "warning"
                                                                                                : item.status ===
                                                                                                  "early"
                                                                                                ? "info"
                                                                                                : item.status ===
                                                                                                  "leave"
                                                                                                ? "secondary"
                                                                                                : "danger"
                                                                                        }`}
                                                                                    >
                                                                                        {item.status ===
                                                                                        "present"
                                                                                            ? "Hadir"
                                                                                            : item.status ===
                                                                                              "late"
                                                                                            ? "Terlambat"
                                                                                            : item.status ===
                                                                                              "early"
                                                                                            ? "Pulang Awal"
                                                                                            : item.status ===
                                                                                              "leave"
                                                                                            ? "Izin"
                                                                                            : item.status ===
                                                                                              "absent"
                                                                                            ? "Tidak Hadir"
                                                                                            : item.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <span
                                                                                        className={`badge bg-${
                                                                                            item.approval_status ===
                                                                                            "approved"
                                                                                                ? "success"
                                                                                                : item.approval_status ===
                                                                                                  "pending"
                                                                                                ? "warning"
                                                                                                : "danger"
                                                                                        }`}
                                                                                    >
                                                                                        {item.approval_status ===
                                                                                        "approved"
                                                                                            ? "Disetujui"
                                                                                            : item.approval_status ===
                                                                                              "pending"
                                                                                            ? "Menunggu"
                                                                                            : item.approval_status ===
                                                                                              "rejected"
                                                                                            ? "Ditolak"
                                                                                            : item.approval_status}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <small className="text-nowrap">
                                                                                        {item.check_in_time ? (
                                                                                            <>
                                                                                                <i className="bi bi-clock-fill text-success me-1"></i>
                                                                                                {
                                                                                                    item.check_in_time
                                                                                                }
                                                                                            </>
                                                                                        ) : (
                                                                                            "-"
                                                                                        )}
                                                                                    </small>
                                                                                </td>
                                                                                <td>
                                                                                    <small className="text-nowrap">
                                                                                        {item.check_out_time ? (
                                                                                            <>
                                                                                                <i className="bi bi-clock-fill text-danger me-1"></i>
                                                                                                {
                                                                                                    item.check_out_time
                                                                                                }
                                                                                            </>
                                                                                        ) : (
                                                                                            "-"
                                                                                        )}
                                                                                    </small>
                                                                                </td>
                                                                                <td>
                                                                                    <small
                                                                                        className={`badge ${
                                                                                            item.work_type ===
                                                                                            "wfo"
                                                                                                ? "bg-primary"
                                                                                                : "bg-info"
                                                                                        } bg-opacity-10 text-${
                                                                                            item.work_type ===
                                                                                            "wfo"
                                                                                                ? "primary"
                                                                                                : "info"
                                                                                        }`}
                                                                                    >
                                                                                        {item.work_type ===
                                                                                        "wfo"
                                                                                            ? "WFO"
                                                                                            : "WFH"}
                                                                                    </small>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    }
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    {renderPaginationControls(
                                                        reportData.data
                                                            .attendances,
                                                        "attendance"
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center py-5">
                                                    <i
                                                        className="bi bi-inbox text-muted"
                                                        style={{
                                                            fontSize: "3rem",
                                                        }}
                                                    ></i>
                                                    <p className="text-muted mt-3 mb-0">
                                                        Tidak ada data presensi
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Logbook Tab */}
                                    {activeTab === "logbook" && (
                                        <div className="tab-pane fade show active">
                                            {reportData.data?.logbooks?.length >
                                            0 ? (
                                                <>
                                                    <div className="table-responsive">
                                                        <table className="table table-hover mb-0">
                                                            <thead className="table-light sticky-top">
                                                                <tr>
                                                                    <th
                                                                        className="text-center"
                                                                        style={{
                                                                            width: "60px",
                                                                        }}
                                                                    >
                                                                        No
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "120px",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        onClick={() =>
                                                                            handleSort(
                                                                                "date"
                                                                            )
                                                                        }
                                                                    >
                                                                        Tanggal{" "}
                                                                        {getSortIcon(
                                                                            "date"
                                                                        )}
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "180px",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        onClick={() =>
                                                                            handleSort(
                                                                                "user.name"
                                                                            )
                                                                        }
                                                                    >
                                                                        User{" "}
                                                                        {getSortIcon(
                                                                            "user.name"
                                                                        )}
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "150px",
                                                                        }}
                                                                    >
                                                                        Divisi
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "250px",
                                                                        }}
                                                                    >
                                                                        Aktivitas
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "300px",
                                                                        }}
                                                                    >
                                                                        Deskripsi
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "120px",
                                                                        }}
                                                                    >
                                                                        Status
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "150px",
                                                                        }}
                                                                    >
                                                                        Reviewer
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {getCurrentData(
                                                                    reportData
                                                                        .data
                                                                        .logbooks
                                                                ).map(
                                                                    (
                                                                        item,
                                                                        index
                                                                    ) => {
                                                                        const globalIndex =
                                                                            (currentPage -
                                                                                1) *
                                                                                itemsPerPage +
                                                                            index +
                                                                            1;
                                                                        return (
                                                                            <tr
                                                                                key={`log-${
                                                                                    item.id ||
                                                                                    index
                                                                                }`}
                                                                            >
                                                                                <td className="text-center">
                                                                                    {
                                                                                        globalIndex
                                                                                    }
                                                                                </td>
                                                                                <td>
                                                                                    <small className="text-nowrap">
                                                                                        {new Date(
                                                                                            item.date
                                                                                        ).toLocaleDateString(
                                                                                            "id-ID",
                                                                                            {
                                                                                                weekday:
                                                                                                    "short",
                                                                                                year: "numeric",
                                                                                                month: "short",
                                                                                                day: "numeric",
                                                                                            }
                                                                                        )}
                                                                                    </small>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="fw-semibold">
                                                                                        {item
                                                                                            .user
                                                                                            ?.name ||
                                                                                            "-"}
                                                                                    </div>
                                                                                    <small className="text-muted">
                                                                                        NIP:{" "}
                                                                                        {item
                                                                                            .user
                                                                                            ?.nip ||
                                                                                            "-"}
                                                                                    </small>
                                                                                    {item
                                                                                        .user
                                                                                        ?.periode && (
                                                                                        <>
                                                                                            <br />
                                                                                            <small className="badge bg-info bg-opacity-10 text-info">
                                                                                                {
                                                                                                    item
                                                                                                        .user
                                                                                                        .periode
                                                                                                }
                                                                                            </small>
                                                                                        </>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    <small>
                                                                                        {item
                                                                                            .user
                                                                                            ?.division
                                                                                            ?.name ||
                                                                                            "-"}
                                                                                    </small>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="fw-semibold text-primary">
                                                                                        {item.activity ||
                                                                                            "-"}
                                                                                    </div>
                                                                                </td>
                                                                                <td>
                                                                                    <small className="text-muted">
                                                                                        {item.description
                                                                                            ? item
                                                                                                  .description
                                                                                                  .length >
                                                                                              100
                                                                                                ? item.description.substring(
                                                                                                      0,
                                                                                                      100
                                                                                                  ) +
                                                                                                  "..."
                                                                                                : item.description
                                                                                            : "-"}
                                                                                    </small>
                                                                                </td>
                                                                                <td>
                                                                                    <span
                                                                                        className={`badge bg-${
                                                                                            item.status ===
                                                                                            "approved"
                                                                                                ? "success"
                                                                                                : item.status ===
                                                                                                  "pending"
                                                                                                ? "warning"
                                                                                                : "danger"
                                                                                        }`}
                                                                                    >
                                                                                        {item.status ===
                                                                                        "approved"
                                                                                            ? "Disetujui"
                                                                                            : item.status ===
                                                                                              "pending"
                                                                                            ? "Menunggu"
                                                                                            : item.status ===
                                                                                              "rejected"
                                                                                            ? "Ditolak"
                                                                                            : item.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <small>
                                                                                        <i className="bi bi-person-check me-1"></i>
                                                                                        {item
                                                                                            .reviewer
                                                                                            ?.name ||
                                                                                            "-"}
                                                                                    </small>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    }
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    {renderPaginationControls(
                                                        reportData.data
                                                            .logbooks,
                                                        "logbook"
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center py-5">
                                                    <i
                                                        className="bi bi-inbox text-muted"
                                                        style={{
                                                            fontSize: "3rem",
                                                        }}
                                                    ></i>
                                                    <p className="text-muted mt-3 mb-0">
                                                        Tidak ada data logbook
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Leave Tab */}
                                    {activeTab === "leave" && (
                                        <div className="tab-pane fade show active">
                                            {reportData.data?.leaves?.length >
                                            0 ? (
                                                <>
                                                    <div className="table-responsive">
                                                        <table className="table table-hover mb-0">
                                                            <thead className="table-light sticky-top">
                                                                <tr>
                                                                    <th
                                                                        className="text-center"
                                                                        style={{
                                                                            width: "60px",
                                                                        }}
                                                                    >
                                                                        No
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "120px",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        onClick={() =>
                                                                            handleSort(
                                                                                "start_date"
                                                                            )
                                                                        }
                                                                    >
                                                                        Tanggal
                                                                        Mulai{" "}
                                                                        {getSortIcon(
                                                                            "start_date"
                                                                        )}
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "120px",
                                                                        }}
                                                                    >
                                                                        Tanggal
                                                                        Akhir
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "180px",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        onClick={() =>
                                                                            handleSort(
                                                                                "user.name"
                                                                            )
                                                                        }
                                                                    >
                                                                        User{" "}
                                                                        {getSortIcon(
                                                                            "user.name"
                                                                        )}
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "150px",
                                                                        }}
                                                                    >
                                                                        Divisi
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "120px",
                                                                        }}
                                                                    >
                                                                        Tipe
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "300px",
                                                                        }}
                                                                    >
                                                                        Alasan
                                                                    </th>
                                                                    <th
                                                                        className="text-center"
                                                                        style={{
                                                                            minWidth:
                                                                                "80px",
                                                                        }}
                                                                    >
                                                                        Durasi
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "120px",
                                                                        }}
                                                                    >
                                                                        Status
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            minWidth:
                                                                                "150px",
                                                                        }}
                                                                    >
                                                                        Reviewer
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {getCurrentData(
                                                                    reportData
                                                                        .data
                                                                        .leaves
                                                                ).map(
                                                                    (
                                                                        item,
                                                                        index
                                                                    ) => {
                                                                        const globalIndex =
                                                                            (currentPage -
                                                                                1) *
                                                                                itemsPerPage +
                                                                            index +
                                                                            1;
                                                                        return (
                                                                            <tr
                                                                                key={`leave-${
                                                                                    item.id ||
                                                                                    index
                                                                                }`}
                                                                            >
                                                                                <td className="text-center">
                                                                                    {
                                                                                        globalIndex
                                                                                    }
                                                                                </td>
                                                                                <td>
                                                                                    <small className="text-nowrap">
                                                                                        {new Date(
                                                                                            item.start_date
                                                                                        ).toLocaleDateString(
                                                                                            "id-ID",
                                                                                            {
                                                                                                weekday:
                                                                                                    "short",
                                                                                                year: "numeric",
                                                                                                month: "short",
                                                                                                day: "numeric",
                                                                                            }
                                                                                        )}
                                                                                    </small>
                                                                                </td>
                                                                                <td>
                                                                                    <small className="text-nowrap">
                                                                                        {new Date(
                                                                                            item.end_date
                                                                                        ).toLocaleDateString(
                                                                                            "id-ID",
                                                                                            {
                                                                                                weekday:
                                                                                                    "short",
                                                                                                year: "numeric",
                                                                                                month: "short",
                                                                                                day: "numeric",
                                                                                            }
                                                                                        )}
                                                                                    </small>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="fw-semibold">
                                                                                        {item
                                                                                            .user
                                                                                            ?.name ||
                                                                                            "-"}
                                                                                    </div>
                                                                                    <small className="text-muted">
                                                                                        NIP:{" "}
                                                                                        {item
                                                                                            .user
                                                                                            ?.nip ||
                                                                                            "-"}
                                                                                    </small>
                                                                                    {item
                                                                                        .user
                                                                                        ?.periode && (
                                                                                        <>
                                                                                            <br />
                                                                                            <small className="badge bg-info bg-opacity-10 text-info">
                                                                                                {
                                                                                                    item
                                                                                                        .user
                                                                                                        .periode
                                                                                                }
                                                                                            </small>
                                                                                        </>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    <small>
                                                                                        {item
                                                                                            .user
                                                                                            ?.division
                                                                                            ?.name ||
                                                                                            "-"}
                                                                                    </small>
                                                                                </td>
                                                                                <td>
                                                                                    <span
                                                                                        className={`badge ${
                                                                                            item.type ===
                                                                                            "izin_sakit"
                                                                                                ? "bg-danger"
                                                                                                : "bg-warning"
                                                                                        } bg-opacity-10 text-${
                                                                                            item.type ===
                                                                                            "izin_sakit"
                                                                                                ? "danger"
                                                                                                : "warning"
                                                                                        }`}
                                                                                    >
                                                                                        <i
                                                                                            className={`bi ${
                                                                                                item.type ===
                                                                                                "izin_sakit"
                                                                                                    ? "bi-heart-pulse"
                                                                                                    : "bi-calendar-event"
                                                                                            } me-1`}
                                                                                        ></i>
                                                                                        {item.type ===
                                                                                        "izin_sakit"
                                                                                            ? "Izin Sakit"
                                                                                            : "Izin Keperluan"}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <small className="text-muted">
                                                                                        {item.reason
                                                                                            ? item
                                                                                                  .reason
                                                                                                  .length >
                                                                                              80
                                                                                                ? item.reason.substring(
                                                                                                      0,
                                                                                                      80
                                                                                                  ) +
                                                                                                  "..."
                                                                                                : item.reason
                                                                                            : "-"}
                                                                                    </small>
                                                                                </td>
                                                                                <td className="text-center">
                                                                                    <span className="badge bg-primary">
                                                                                        <strong>
                                                                                            {
                                                                                                item.duration
                                                                                            }
                                                                                        </strong>{" "}
                                                                                        hari
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <span
                                                                                        className={`badge bg-${
                                                                                            item.status ===
                                                                                            "approved"
                                                                                                ? "success"
                                                                                                : item.status ===
                                                                                                  "pending"
                                                                                                ? "warning"
                                                                                                : "danger"
                                                                                        }`}
                                                                                    >
                                                                                        {item.status ===
                                                                                        "approved"
                                                                                            ? "Disetujui"
                                                                                            : item.status ===
                                                                                              "pending"
                                                                                            ? "Menunggu"
                                                                                            : item.status ===
                                                                                              "rejected"
                                                                                            ? "Ditolak"
                                                                                            : item.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <small>
                                                                                        <i className="bi bi-person-check me-1"></i>
                                                                                        {item
                                                                                            .reviewer
                                                                                            ?.name ||
                                                                                            "-"}
                                                                                    </small>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    }
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    {renderPaginationControls(
                                                        reportData.data.leaves,
                                                        "leave"
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center py-5">
                                                    <i
                                                        className="bi bi-inbox text-muted"
                                                        style={{
                                                            fontSize: "3rem",
                                                        }}
                                                    ></i>
                                                    <p className="text-muted mt-3 mb-0">
                                                        Tidak ada data izin/cuti
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white py-3 border-bottom">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                        <i className="bi bi-table me-2 text-primary"></i>
                                        Detail Laporan
                                    </h5>
                                    <span className="badge bg-primary">
                                        {reportData.data?.length || 0} Data
                                    </span>
                                </div>
                            </div>
                            <div className="card-body p-0">
                                {reportData.data?.length > 0 ? (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>No</th>
                                                        <th
                                                            style={{
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() =>
                                                                handleSort(
                                                                    "date"
                                                                )
                                                            }
                                                        >
                                                            Tanggal{" "}
                                                            {getSortIcon(
                                                                "date"
                                                            )}
                                                        </th>
                                                        <th
                                                            style={{
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() =>
                                                                handleSort(
                                                                    "user.name"
                                                                )
                                                            }
                                                        >
                                                            User{" "}
                                                            {getSortIcon(
                                                                "user.name"
                                                            )}
                                                        </th>
                                                        <th>Divisi</th>
                                                        <th>Status</th>
                                                        <th>Keterangan</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getCurrentData(
                                                        reportData.data
                                                    ).map((item, index) => {
                                                        const globalIndex =
                                                            (currentPage - 1) *
                                                                itemsPerPage +
                                                            index +
                                                            1;
                                                        return (
                                                            <tr
                                                                key={`item-${
                                                                    item.id ||
                                                                    index
                                                                }`}
                                                            >
                                                                <td>
                                                                    {
                                                                        globalIndex
                                                                    }
                                                                </td>
                                                                <td>
                                                                    <small>
                                                                        {item.date ||
                                                                        item.start_date
                                                                            ? new Date(
                                                                                  item.date ||
                                                                                      item.start_date
                                                                              ).toLocaleDateString(
                                                                                  "id-ID"
                                                                              )
                                                                            : "-"}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    <div>
                                                                        <div>
                                                                            {item
                                                                                .user
                                                                                ?.name ||
                                                                                "-"}
                                                                        </div>
                                                                        {item
                                                                            .user
                                                                            ?.nip && (
                                                                            <small className="text-muted">
                                                                                NIP:{" "}
                                                                                {
                                                                                    item
                                                                                        .user
                                                                                        .nip
                                                                                }
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {item.user
                                                                        ?.division
                                                                        ?.name ||
                                                                        "-"}
                                                                </td>
                                                                <td>
                                                                    {reportType ===
                                                                    "attendance" ? (
                                                                        <div className="d-flex flex-column gap-1">
                                                                            <span
                                                                                className={`badge bg-${
                                                                                    item.status ===
                                                                                    "present"
                                                                                        ? "success"
                                                                                        : item.status ===
                                                                                          "late"
                                                                                        ? "warning"
                                                                                        : item.status ===
                                                                                          "early"
                                                                                        ? "info"
                                                                                        : "danger"
                                                                                }`}
                                                                            >
                                                                                {item.status ===
                                                                                "present"
                                                                                    ? "Hadir"
                                                                                    : item.status ===
                                                                                      "late"
                                                                                    ? "Terlambat"
                                                                                    : item.status ===
                                                                                      "early"
                                                                                    ? "Pulang Awal"
                                                                                    : item.status ===
                                                                                      "absent"
                                                                                    ? "Tidak Hadir"
                                                                                    : item.status}
                                                                            </span>
                                                                            {item.approval_status && (
                                                                                <span
                                                                                    className={`badge bg-${
                                                                                        item.approval_status ===
                                                                                        "approved"
                                                                                            ? "success"
                                                                                            : item.approval_status ===
                                                                                              "pending"
                                                                                            ? "warning"
                                                                                            : "danger"
                                                                                    }`}
                                                                                >
                                                                                    {item.approval_status ===
                                                                                    "approved"
                                                                                        ? "Disetujui"
                                                                                        : item.approval_status ===
                                                                                          "pending"
                                                                                        ? "Menunggu"
                                                                                        : item.approval_status ===
                                                                                          "rejected"
                                                                                        ? "Ditolak"
                                                                                        : item.approval_status}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span
                                                                            className={`badge bg-${
                                                                                item.status ===
                                                                                "approved"
                                                                                    ? "success"
                                                                                    : item.status ===
                                                                                      "pending"
                                                                                    ? "warning"
                                                                                    : "danger"
                                                                            }`}
                                                                        >
                                                                            {item.status ===
                                                                            "approved"
                                                                                ? "Disetujui"
                                                                                : item.status ===
                                                                                  "pending"
                                                                                ? "Menunggu"
                                                                                : item.status ===
                                                                                  "rejected"
                                                                                ? "Ditolak"
                                                                                : item.status ||
                                                                                  "-"}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {reportType ===
                                                                            "attendance" && (
                                                                            <>
                                                                                {item.check_in_time &&
                                                                                    `Masuk: ${item.check_in_time}`}
                                                                                {item.check_out_time &&
                                                                                    ` | Keluar: ${item.check_out_time}`}
                                                                                {item.work_type && (
                                                                                    <div className="mt-1">
                                                                                        <span className="badge bg-info text-dark">
                                                                                            {item.work_type ===
                                                                                            "onsite"
                                                                                                ? "Onsite"
                                                                                                : "Offsite"}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                        {reportType ===
                                                                            "logbook" && (
                                                                            <>
                                                                                {item.activity && (
                                                                                    <div className="fw-bold">
                                                                                        {
                                                                                            item.activity
                                                                                        }
                                                                                    </div>
                                                                                )}
                                                                                {item.description && (
                                                                                    <div>
                                                                                        {item.description.substring(
                                                                                            0,
                                                                                            50
                                                                                        )}
                                                                                        ...
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                        {reportType ===
                                                                            "leave" && (
                                                                            <>
                                                                                {item.reason && (
                                                                                    <div>
                                                                                        {item.reason.substring(
                                                                                            0,
                                                                                            50
                                                                                        )}
                                                                                        ...
                                                                                    </div>
                                                                                )}
                                                                                {item.duration && (
                                                                                    <div className="mt-1">
                                                                                        Durasi:{" "}
                                                                                        {
                                                                                            item.duration
                                                                                        }{" "}
                                                                                        hari
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </small>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {renderPaginationControls(
                                            reportData.data,
                                            "individual"
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-5">
                                        <i
                                            className="bi bi-inbox text-muted"
                                            style={{ fontSize: "3rem" }}
                                        ></i>
                                        <p className="text-muted mt-3 mb-0">
                                            Tidak ada data
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {!reportData && !loading && (
                <div className="text-center text-muted py-5">
                    <i className="bi bi-bar-chart fs-1 d-block mb-3"></i>
                    <p>
                        Pilih jenis laporan dan klik "Generate" untuk melihat
                        data
                    </p>
                </div>
            )}

            <style>{`
                /* Tab Navigation Styling */
                .nav-tabs {
                    border-bottom: 2px solid #dee2e6;
                }
                
                .nav-tabs .nav-link {
                    color: #6c757d;
                    border: none;
                    border-bottom: 3px solid transparent;
                    background: transparent;
                    padding: 0.75rem 1.5rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .nav-tabs .nav-link:hover {
                    color: #0d6efd;
                    border-bottom-color: rgba(13, 110, 253, 0.3);
                    background: rgba(13, 110, 253, 0.05);
                }
                
                .nav-tabs .nav-link.active {
                    color: #0d6efd;
                    border-bottom-color: #0d6efd;
                    background: transparent;
                    font-weight: 600;
                }
                
                .nav-tabs .nav-link .badge {
                    font-size: 0.7rem;
                    padding: 0.25em 0.5em;
                }
                
                /* Table Styling Improvements */
                .table thead.sticky-top {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }
                
                .table-responsive {
                    max-height: 600px;
                    overflow-y: auto;
                }
                
                .table-hover tbody tr {
                    transition: all 0.2s ease;
                }
                
                .table-hover tbody tr:hover {
                    background-color: rgba(13, 110, 253, 0.05);
                    transform: scale(1.001);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }
                
                /* Badge Styling */
                .badge {
                    font-weight: 500;
                    padding: 0.35em 0.65em;
                    font-size: 0.8em;
                }
                
                .badge.bg-opacity-10 {
                    font-weight: 600;
                }
                
                /* Card Footer Summary */
                .card-footer {
                    border-top: 2px solid #dee2e6;
                    padding: 1.25rem;
                }
                
                .card-footer .col-md-4 {
                    padding: 0.75rem;
                }
                
                .card-footer .fs-5 {
                    margin-top: 0.25rem;
                }
                
                /* Empty State Styling */
                .text-center.py-5 {
                    padding: 3rem 1rem !important;
                }
                
                .text-center.py-5 i {
                    opacity: 0.5;
                }
                
                /* Scrollbar Styling */
                .table-responsive::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                
                .table-responsive::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                
                .table-responsive::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                }
                
                .table-responsive::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
                
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .nav-tabs .nav-link {
                        padding: 0.5rem 1rem;
                        font-size: 0.9rem;
                    }
                    
                    .table {
                        font-size: 0.875rem;
                    }
                    
                    .table-responsive {
                        max-height: 500px;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminReports;
