import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl, getImageUrl } from "../../utils/Constant";
import toast from "react-hot-toast";
import { Button, Badge, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import AttendanceDetailModal from "../../components/AttendanceDetailModal";
import AdvancedFilters from "../../components/common/AdvancedFilters";

const Attendance = () => {
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);

    // Enhanced Filters
    const [filters, setFilters] = useState({
        work_type: "all",
        date_from: "",
        date_to: "",
        status: "all",
        periode: "",
        sumber_magang: "",
    });

    const [selectedUserIds, setSelectedUserIds] = useState([]);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        onsite: 0,
        offsite: 0,
    });

    useEffect(() => {
        fetchAttendances();
    }, [
        filters.work_type,
        filters.status,
        filters.date_from,
        filters.date_to,
        filters.periode,
        filters.sumber_magang,
        selectedUserIds,
        page,
    ]);

    const fetchAttendances = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 20,
            };

            if (filters.work_type !== "all") {
                params.work_type = filters.work_type;
            }
            if (filters.status !== "all") {
                params.status = filters.status;
            }
            if (filters.date_from) {
                params.date_from = filters.date_from;
            }
            if (filters.date_to) {
                params.date_to = filters.date_to;
            }
            if (filters.periode) {
                params.periode = filters.periode;
            }
            if (filters.sumber_magang) {
                params.sumber_magang = filters.sumber_magang;
            }
            if (selectedUserIds.length > 0) {
                params.user_ids = selectedUserIds.join(",");
            }

            const response = await axiosInstance.get("/supervisor/attendance", {
                params,
            });

            const data = response.data.data || [];
            setAttendances(data);
            setPagination(response.data.pagination);

            // Calculate stats from pagination metadata or current data
            setStats({
                total: response.data.pagination?.total_records || data.length,
                present: data.filter((a) => a.status === "present").length,
                late: data.filter((a) => a.status === "late").length,
                absent: data.filter((a) => a.status === "absent").length,
                onsite: data.filter((a) => a.work_type === "onsite").length,
                offsite: data.filter((a) => a.work_type === "offsite").length,
            });
        } catch (error) {
            console.error("Error fetching attendances:", error);
            toast.error("Gagal memuat data presensi");
        } finally {
            setLoading(false);
        }
    };

    const handleShowDetail = (attendance) => {
        setSelectedAttendance(attendance);
        setShowDetailModal(true);
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setSelectedAttendance(null);
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        if (key !== "user_name") {
            setPage(1); // Reset to page 1 when changing filters
        }
    };

    const handleResetFilters = () => {
        setFilters({
            work_type: "all",
            date_from: "",
            date_to: "",
            status: "all",
            periode: "",
            sumber_magang: "",
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
            date_from: startDate.toISOString().split("T")[0],
            date_to: endDate.toISOString().split("T")[0],
        });
        setPage(1);
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

    const getStatusBadge = (status) => {
        const badges = {
            present: { bg: "success", icon: "check-circle", text: "Hadir" },
            late: { bg: "warning", icon: "clock", text: "Terlambat" },
            absent: { bg: "danger", icon: "x-circle", text: "Tidak Hadir" },
            excused: { bg: "info", icon: "info-circle", text: "Izin" },
        };
        return (
            badges[status] || {
                bg: "secondary",
                icon: "question",
                text: status,
            }
        );
    };

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <i className="bi bi-calendar-check text-primary me-2"></i>
                        Riwayat Presensi
                    </h2>
                    <p className="text-muted mb-0">
                        Monitor riwayat presensi anggota divisi Anda
                    </p>
                </div>
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={fetchAttendances}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-2">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-list-check fs-4 text-primary"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Total
                                    </small>
                                    <h4 className="mb-0 fw-bold">
                                        {stats.total}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-check-circle fs-4 text-success"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Hadir
                                    </small>
                                    <h4 className="mb-0 fw-bold text-success">
                                        {stats.present}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-clock-history fs-4 text-warning"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Terlambat
                                    </small>
                                    <h4 className="mb-0 fw-bold text-warning">
                                        {stats.late}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-x-circle fs-4 text-danger"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Tidak Hadir
                                    </small>
                                    <h4 className="mb-0 fw-bold text-danger">
                                        {stats.absent}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-building fs-4 text-success"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Onsite
                                    </small>
                                    <h4 className="mb-0 fw-bold">
                                        {stats.onsite}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-house-door fs-4 text-info"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Offsite
                                    </small>
                                    <h4 className="mb-0 fw-bold">
                                        {stats.offsite}
                                    </h4>
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
                        <div className="d-flex gap-2 flex-wrap">
                            <OverlayTrigger placement="top" overlay={<Tooltip>Tampilkan data hari ini</Tooltip>}>
                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleQuickDate("today")}>
                                    <i className="bi bi-calendar-day me-1"></i> Hari Ini
                                </button>
                            </OverlayTrigger>
                            <OverlayTrigger placement="top" overlay={<Tooltip>Tampilkan data minggu ini</Tooltip>}>
                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleQuickDate("thisWeek")}>
                                    <i className="bi bi-calendar-week me-1"></i> Minggu Ini
                                </button>
                            </OverlayTrigger>
                            <OverlayTrigger placement="top" overlay={<Tooltip>Tampilkan data bulan ini</Tooltip>}>
                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleQuickDate("thisMonth")}>
                                    <i className="bi bi-calendar-month me-1"></i> Bulan Ini
                                </button>
                            </OverlayTrigger>
                            <OverlayTrigger placement="top" overlay={<Tooltip>Tampilkan data tahun ini</Tooltip>}>
                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleQuickDate("thisYear")}>
                                    <i className="bi bi-calendar-range me-1"></i> Tahun Ini
                                </button>
                            </OverlayTrigger>
                        </div>
                    </div>
                    
                    <AdvancedFilters
                        filters={filters}
                        setFilters={setFilters}
                        selectedUserIds={selectedUserIds}
                        setSelectedUserIds={setSelectedUserIds}
                        showDivision={false}
                        showPeriode={true}
                        showUser={true}
                        showSumberMagang={true}
                        role="supervisor"
                    />

                    <div className="row g-3 mt-2">
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-geo-alt me-1"></i>
                                Tipe Kerja
                            </label>
                            <Form.Select
                                value={filters.work_type}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "work_type",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="all">Semua</option>
                                <option value="onsite">Onsite</option>
                                <option value="offsite">Offsite</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-flag me-1"></i>
                                Status Kehadiran
                            </label>
                            <Form.Select
                                value={filters.status}
                                onChange={(e) =>
                                    handleFilterChange("status", e.target.value)
                                }
                            >
                                <option value="all">Semua</option>
                                <option value="present">Hadir</option>
                                <option value="late">Terlambat</option>
                                <option value="absent">Tidak Hadir</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-calendar-range me-1"></i>
                                Rentang Waktu
                            </label>
                            <div className="d-flex gap-2">
                                <Form.Control
                                    type="date"
                                    value={filters.date_from}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "date_from",
                                            e.target.value
                                        )
                                    }
                                />
                                <span className="align-self-center">s/d</span>
                                <Form.Control
                                    type="date"
                                    value={filters.date_to}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "date_to",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <Button
                                variant="outline-danger"
                                className="w-100"
                                onClick={handleResetFilters}
                            >
                                <i className="bi bi-arrow-counterclockwise me-2"></i>
                                Reset Filter
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>
                            <p className="text-muted mt-3">
                                Memuat data presensi...
                            </p>
                        </div>
                    ) : attendances.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox display-1 text-muted"></i>
                            <p className="text-muted mt-3">
                                Tidak ada data presensi
                            </p>
                            {(filters.user_name ||
                                filters.date_from ||
                                filters.date_to) && (
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={handleResetFilters}
                                    >
                                        Reset Filter
                                    </Button>
                                )}
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Karyawan</th>
                                            <th>Tanggal</th>
                                            <th>Waktu</th>
                                            <th>Keterangan Check-in</th>
                                            <th>Keterangan Check-out</th>
                                            <th>Status</th>
                                            <th className="text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendances.map((attendance) => {
                                            const statusBadge = getStatusBadge(
                                                attendance.status
                                            );
                                            return (
                                                <tr key={attendance.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={getAvatarUrl(
                                                                    attendance.user
                                                                )}
                                                                alt={
                                                                    attendance
                                                                        .user
                                                                        ?.name
                                                                }
                                                                className="rounded-circle me-3"
                                                                style={{
                                                                    width: "40px",
                                                                    height: "40px",
                                                                    objectFit:
                                                                        "cover",
                                                                }}
                                                                onError={(
                                                                    e
                                                                ) => {
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                        attendance
                                                                            .user
                                                                            ?.name ||
                                                                        "User"
                                                                    )}&background=random&color=fff&size=128`;
                                                                }}
                                                            />
                                                            <div>
                                                                <div className="fw-semibold">
                                                                    {attendance
                                                                        .user
                                                                        ?.name ||
                                                                        "-"}
                                                                </div>
                                                                <small className="text-muted">
                                                                    {attendance
                                                                        .user
                                                                        ?.email ||
                                                                        "-"}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="fw-semibold">
                                                                {new Date(
                                                                    attendance.date
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                    {
                                                                        weekday:
                                                                            "short",
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    }
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="d-flex align-items-center mb-1">
                                                                <i className="bi bi-box-arrow-in-right text-success me-2"></i>
                                                                <span className="fw-semibold">
                                                                    {attendance.check_in_time ||
                                                                        "-"}
                                                                </span>
                                                            </div>
                                                            <div className="d-flex align-items-center">
                                                                <i className="bi bi-box-arrow-right text-danger me-2"></i>
                                                                <span className="fw-semibold">
                                                                    {attendance.check_out_time ||
                                                                        "Belum"}
                                                                </span>
                                                            </div>
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
                                                        <div className="d-flex flex-column gap-1 align-items-start">
                                                            <Badge bg={statusBadge.bg}>
                                                                <i className={`bi bi-${statusBadge.icon} me-1`}></i>
                                                                {statusBadge.text}
                                                            </Badge>
                                                            {attendance.status !== 'absent' && attendance.status !== 'leave' && attendance.status !== 'sick' && attendance.work_type && (() => {
                                                                const workTypeBadge = getWorkTypeBadge(attendance.work_type);
                                                                return (
                                                                    <Badge bg={workTypeBadge.bg} text={workTypeBadge.bg === 'warning' ? 'dark' : 'white'}>
                                                                        <i className={`bi bi-${workTypeBadge.icon} me-1`}></i>
                                                                        {workTypeBadge.text}
                                                                    </Badge>
                                                                );
                                                            })()}
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleShowDetail(
                                                                    attendance
                                                                )
                                                            }
                                                        >
                                                            <i className="bi bi-eye me-1"></i>
                                                            Detail
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.total_pages > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                                    <div className="text-muted small">
                                        Menampilkan{" "}
                                        {(page - 1) * pagination.limit + 1} -{" "}
                                        {Math.min(
                                            page * pagination.limit,
                                            pagination.total_records
                                        )}{" "}
                                        dari {pagination.total_records} data
                                    </div>
                                    <nav>
                                        <ul className="pagination mb-0">
                                            <li
                                                className={`page-item ${!pagination.has_prev
                                                        ? "disabled"
                                                        : ""
                                                    }`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() =>
                                                        setPage(page - 1)
                                                    }
                                                    disabled={
                                                        !pagination.has_prev
                                                    }
                                                >
                                                    <i className="bi bi-chevron-left"></i>
                                                </button>
                                            </li>

                                            {/* Page Numbers */}
                                            {Array.from(
                                                {
                                                    length: Math.min(
                                                        5,
                                                        pagination.total_pages
                                                    ),
                                                },
                                                (_, i) => {
                                                    let pageNum;
                                                    if (
                                                        pagination.total_pages <=
                                                        5
                                                    ) {
                                                        pageNum = i + 1;
                                                    } else if (page <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (
                                                        page >=
                                                        pagination.total_pages -
                                                        2
                                                    ) {
                                                        pageNum =
                                                            pagination.total_pages -
                                                            4 +
                                                            i;
                                                    } else {
                                                        pageNum = page - 2 + i;
                                                    }

                                                    return (
                                                        <li
                                                            key={pageNum}
                                                            className={`page-item ${page === pageNum
                                                                    ? "active"
                                                                    : ""
                                                                }`}
                                                        >
                                                            <button
                                                                className="page-link"
                                                                onClick={() =>
                                                                    setPage(
                                                                        pageNum
                                                                    )
                                                                }
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        </li>
                                                    );
                                                }
                                            )}

                                            <li
                                                className={`page-item ${!pagination.has_next
                                                        ? "disabled"
                                                        : ""
                                                    }`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() =>
                                                        setPage(page + 1)
                                                    }
                                                    disabled={
                                                        !pagination.has_next
                                                    }
                                                >
                                                    <i className="bi bi-chevron-right"></i>
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <AttendanceDetailModal
                show={showDetailModal}
                onClose={handleCloseDetail}
                attendance={selectedAttendance}
                showUserInfo={true}
            />
        </div>
    );
};

export default Attendance;

