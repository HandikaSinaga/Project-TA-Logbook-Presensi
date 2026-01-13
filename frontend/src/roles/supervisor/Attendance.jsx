import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl, getImageUrl } from "../../utils/Constant";
import toast from "react-hot-toast";
import { Modal, Button, Badge, Form } from "react-bootstrap";

const Attendance = () => {
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);

    // Enhanced Filters
    const [filters, setFilters] = useState({
        work_type: "all",
        date_from: "",
        date_to: "",
        user_name: "",
        status: "all",
    });

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

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== filters.user_name) {
                setFilters((prev) => ({ ...prev, user_name: searchTerm }));
                setPage(1); // Reset to page 1 on new search
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchAttendances();
    }, [
        filters.work_type,
        filters.status,
        filters.date_from,
        filters.date_to,
        filters.user_name,
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
            if (filters.user_name && filters.user_name.trim() !== "") {
                params.search = filters.user_name.trim();
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
            user_name: "",
            status: "all",
        });
        setSearchTerm("");
        setPage(1);
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
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-search me-1"></i>
                                Cari Nama/Email
                            </label>
                            <Form.Control
                                type="text"
                                placeholder="Cari nama atau email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && searchTerm !== filters.user_name && (
                                <small className="text-muted">
                                    <i className="bi bi-hourglass-split me-1"></i>
                                    Mencari...
                                </small>
                            )}
                        </div>
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
                        <div className="col-md-5">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-calendar-range me-1"></i>
                                Periode
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
                        <div className="col-md-12">
                            <Button
                                variant="outline-secondary"
                                size="sm"
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
                                            <th>Tipe Kerja</th>
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
                                                    <td>
                                                        {attendance.work_type ===
                                                        "offsite" ? (
                                                            <div>
                                                                <Badge
                                                                    bg="info"
                                                                    className="mb-1"
                                                                >
                                                                    <i className="bi bi-house-door me-1"></i>
                                                                    Offsite
                                                                </Badge>
                                                                {attendance.offsite_reason && (
                                                                    <div
                                                                        className="small text-muted"
                                                                        style={{
                                                                            maxWidth:
                                                                                "150px",
                                                                            whiteSpace:
                                                                                "nowrap",
                                                                            overflow:
                                                                                "hidden",
                                                                            textOverflow:
                                                                                "ellipsis",
                                                                        }}
                                                                        title={
                                                                            attendance.offsite_reason
                                                                        }
                                                                    >
                                                                        {
                                                                            attendance.offsite_reason
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Badge bg="success">
                                                                <i className="bi bi-building me-1"></i>
                                                                Onsite
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg={statusBadge.bg}
                                                        >
                                                            <i
                                                                className={`bi bi-${statusBadge.icon} me-1`}
                                                            ></i>
                                                            {statusBadge.text}
                                                        </Badge>
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
                                                className={`page-item ${
                                                    !pagination.has_prev
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
                                                            className={`page-item ${
                                                                page === pageNum
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
                                                className={`page-item ${
                                                    !pagination.has_next
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
            <Modal
                show={showDetailModal}
                onHide={handleCloseDetail}
                size="lg"
                centered
            >
                <Modal.Header
                    closeButton
                    style={{
                        background:
                            "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)",
                        border: "none",
                    }}
                >
                    <Modal.Title className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                            <i className="bi bi-info-circle text-primary fs-4"></i>
                        </div>
                        <span>Detail Presensi</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedAttendance && (
                        <div>
                            {/* User Info */}
                            <div className="mb-4 pb-3 border-bottom">
                                <h6 className="text-muted mb-3">
                                    <i className="bi bi-person-circle me-2"></i>
                                    Informasi Karyawan
                                </h6>
                                <div className="d-flex align-items-center mb-3">
                                    <img
                                        src={getAvatarUrl(
                                            selectedAttendance.user
                                        )}
                                        alt={selectedAttendance.user?.name}
                                        className="rounded-circle me-3"
                                        style={{
                                            width: "60px",
                                            height: "60px",
                                            objectFit: "cover",
                                        }}
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                selectedAttendance.user?.name ||
                                                    "User"
                                            )}&background=random&color=fff&size=128`;
                                        }}
                                    />
                                    <div>
                                        <h5 className="mb-1">
                                            {selectedAttendance.user?.name}
                                        </h5>
                                        <p className="text-muted mb-0">
                                            {selectedAttendance.user?.email}
                                        </p>
                                        {selectedAttendance.user?.division && (
                                            <Badge
                                                bg="secondary"
                                                className="mt-1"
                                            >
                                                {
                                                    selectedAttendance.user
                                                        .division.name
                                                }
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Details */}
                            <div className="mb-4 pb-3 border-bottom">
                                <h6 className="text-muted mb-3">
                                    <i className="bi bi-calendar-check me-2"></i>
                                    Detail Presensi
                                </h6>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="small text-muted mb-1">
                                            Tanggal
                                        </label>
                                        <div className="fw-semibold">
                                            {new Date(
                                                selectedAttendance.date
                                            ).toLocaleDateString("id-ID", {
                                                weekday: "long",
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="small text-muted mb-1">
                                            Status Kehadiran
                                        </label>
                                        <div>
                                            <Badge
                                                bg={
                                                    getStatusBadge(
                                                        selectedAttendance.status
                                                    ).bg
                                                }
                                            >
                                                <i
                                                    className={`bi bi-${
                                                        getStatusBadge(
                                                            selectedAttendance.status
                                                        ).icon
                                                    } me-1`}
                                                ></i>
                                                {
                                                    getStatusBadge(
                                                        selectedAttendance.status
                                                    ).text
                                                }
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="small text-muted mb-1">
                                            Check-in
                                        </label>
                                        <div className="fw-semibold">
                                            <i className="bi bi-box-arrow-in-right text-success me-2"></i>
                                            {selectedAttendance.check_in_time ||
                                                "-"}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="small text-muted mb-1">
                                            Check-out
                                        </label>
                                        <div className="fw-semibold">
                                            <i className="bi bi-box-arrow-right text-danger me-2"></i>
                                            {selectedAttendance.check_out_time ||
                                                "Belum checkout"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Work Type & Location */}
                            <div className="mb-4 pb-3 border-bottom">
                                <h6 className="text-muted mb-3">
                                    <i className="bi bi-geo-alt me-2"></i>
                                    Lokasi & Tipe Kerja
                                </h6>

                                {/* Work Type Badge */}
                                <div className="mb-3">
                                    <label className="small text-muted mb-1">
                                        Tipe Kerja
                                    </label>
                                    <div>
                                        {selectedAttendance.work_type ===
                                        "offsite" ? (
                                            <Badge bg="info">
                                                <i className="bi bi-house-door me-1"></i>
                                                Offsite
                                            </Badge>
                                        ) : (
                                            <Badge bg="success">
                                                <i className="bi bi-building me-1"></i>
                                                Onsite
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Check-in Information */}
                                <div className="card bg-light border-0 mb-3">
                                    <div className="card-body">
                                        <h6 className="mb-3">
                                            <i className="bi bi-box-arrow-in-right text-success me-2"></i>
                                            Informasi Check-in
                                        </h6>

                                        {selectedAttendance.offsite_reason && (
                                            <div className="mb-3">
                                                <label className="small text-muted mb-1">
                                                    Alasan Offsite (Check-in)
                                                </label>
                                                <div className="alert alert-info mb-0">
                                                    <i className="bi bi-info-circle me-2"></i>
                                                    {
                                                        selectedAttendance.offsite_reason
                                                    }
                                                </div>
                                            </div>
                                        )}

                                        {selectedAttendance.check_in_address && (
                                            <div className="mb-3">
                                                <label className="small text-muted mb-1">
                                                    Alamat
                                                </label>
                                                <div>
                                                    <i className="bi bi-geo-alt-fill me-2 text-success"></i>
                                                    {
                                                        selectedAttendance.check_in_address
                                                    }
                                                </div>
                                            </div>
                                        )}

                                        {selectedAttendance.check_in_ip && (
                                            <div>
                                                <label className="small text-muted mb-1">
                                                    IP Address
                                                </label>
                                                <div>
                                                    <i className="bi bi-hdd-network me-2"></i>
                                                    {
                                                        selectedAttendance.check_in_ip
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Check-out Information */}
                                {(selectedAttendance.check_out_time ||
                                    selectedAttendance.check_out_address ||
                                    selectedAttendance.checkout_offsite_reason) && (
                                    <div className="card bg-light border-0">
                                        <div className="card-body">
                                            <h6 className="mb-3">
                                                <i className="bi bi-box-arrow-right text-danger me-2"></i>
                                                Informasi Check-out
                                            </h6>

                                            {selectedAttendance.checkout_offsite_reason && (
                                                <div className="mb-3">
                                                    <label className="small text-muted mb-1">
                                                        Alasan Offsite
                                                        (Check-out)
                                                    </label>
                                                    <div className="alert alert-info mb-0">
                                                        <i className="bi bi-info-circle me-2"></i>
                                                        {
                                                            selectedAttendance.checkout_offsite_reason
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            {selectedAttendance.check_out_address && (
                                                <div className="mb-3">
                                                    <label className="small text-muted mb-1">
                                                        Alamat
                                                    </label>
                                                    <div>
                                                        <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
                                                        {
                                                            selectedAttendance.check_out_address
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            {selectedAttendance.check_out_ip && (
                                                <div>
                                                    <label className="small text-muted mb-1">
                                                        IP Address
                                                    </label>
                                                    <div>
                                                        <i className="bi bi-hdd-network me-2"></i>
                                                        {
                                                            selectedAttendance.check_out_ip
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Photos */}
                            {(selectedAttendance.check_in_photo ||
                                selectedAttendance.check_out_photo) && (
                                <div className="mb-4 pb-3 border-bottom">
                                    <h6 className="text-muted mb-3">
                                        <i className="bi bi-camera me-2"></i>
                                        Foto Presensi
                                    </h6>
                                    <div className="row g-3">
                                        {selectedAttendance.check_in_photo && (
                                            <div className="col-md-6">
                                                <div className="card border-0 shadow-sm">
                                                    <div className="card-header bg-success bg-opacity-10 border-0">
                                                        <small className="fw-semibold text-success">
                                                            <i className="bi bi-box-arrow-in-right me-2"></i>
                                                            Foto Check-in
                                                        </small>
                                                    </div>
                                                    <div className="card-body p-2">
                                                        <img
                                                            src={getImageUrl(
                                                                selectedAttendance.check_in_photo
                                                            )}
                                                            alt="Check-in"
                                                            className="img-fluid rounded"
                                                            style={{
                                                                maxHeight:
                                                                    "300px",
                                                                width: "100%",
                                                                objectFit:
                                                                    "contain",
                                                                cursor: "pointer",
                                                                backgroundColor:
                                                                    "#f8f9fa",
                                                            }}
                                                            onClick={() =>
                                                                window.open(
                                                                    getImageUrl(
                                                                        selectedAttendance.check_in_photo
                                                                    ),
                                                                    "_blank"
                                                                )
                                                            }
                                                            onError={(e) => {
                                                                e.target.onerror =
                                                                    null;
                                                                e.target.src =
                                                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23f0f0f0' width='300' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='18' dy='150' dx='50'%3EFoto tidak tersedia%3C/text%3E%3C/svg%3E";
                                                            }}
                                                        />
                                                        <div className="text-center mt-2">
                                                            <small className="text-muted">
                                                                <i className="bi bi-zoom-in me-1"></i>
                                                                Klik untuk
                                                                memperbesar
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {selectedAttendance.check_out_photo && (
                                            <div className="col-md-6">
                                                <div className="card border-0 shadow-sm">
                                                    <div className="card-header bg-danger bg-opacity-10 border-0">
                                                        <small className="fw-semibold text-danger">
                                                            <i className="bi bi-box-arrow-right me-2"></i>
                                                            Foto Check-out
                                                        </small>
                                                    </div>
                                                    <div className="card-body p-2">
                                                        <img
                                                            src={getImageUrl(
                                                                selectedAttendance.check_out_photo
                                                            )}
                                                            alt="Check-out"
                                                            className="img-fluid rounded"
                                                            style={{
                                                                maxHeight:
                                                                    "300px",
                                                                width: "100%",
                                                                objectFit:
                                                                    "contain",
                                                                cursor: "pointer",
                                                                backgroundColor:
                                                                    "#f8f9fa",
                                                            }}
                                                            onClick={() =>
                                                                window.open(
                                                                    getImageUrl(
                                                                        selectedAttendance.check_out_photo
                                                                    ),
                                                                    "_blank"
                                                                )
                                                            }
                                                            onError={(e) => {
                                                                e.target.onerror =
                                                                    null;
                                                                e.target.src =
                                                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23f0f0f0' width='300' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='18' dy='150' dx='50'%3EFoto tidak tersedia%3C/text%3E%3C/svg%3E";
                                                            }}
                                                        />
                                                        <div className="text-center mt-2">
                                                            <small className="text-muted">
                                                                <i className="bi bi-zoom-in me-1"></i>
                                                                Klik untuk
                                                                memperbesar
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light">
                    <Button variant="secondary" onClick={handleCloseDetail}>
                        <i className="bi bi-x-circle me-2"></i>
                        Tutup
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Attendance;
