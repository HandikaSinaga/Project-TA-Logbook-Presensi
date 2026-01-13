import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl, getImageUrl } from "../../utils/Constant";
import toast from "react-hot-toast";
import { Modal, Button, Badge, Form } from "react-bootstrap";

const SupervisorLeave = () => {
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    // Enhanced Filters
    const [filters, setFilters] = useState({
        status: "all",
        type: "all",
        date_from: "",
        date_to: "",
        user_name: "",
    });

    // Pagination state
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        sick: 0,
        permission: 0,
    });

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== filters.user_name) {
                setFilters((prev) => ({ ...prev, user_name: searchTerm }));
                setPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchLeaves();
    }, [
        filters.status,
        filters.type,
        filters.date_from,
        filters.date_to,
        filters.user_name,
        page,
    ]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 20,
            };

            if (filters.status !== "all") {
                params.status = filters.status;
            }
            if (filters.type !== "all") {
                params.type = filters.type;
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

            const response = await axiosInstance.get("/supervisor/izin", {
                params,
            });
            const data = response.data.data || response.data || [];
            const leavesArray = Array.isArray(data) ? data : [];
            setLeaves(leavesArray);
            setPagination(response.data.pagination);

            // Calculate stats
            setStats({
                total:
                    response.data.pagination?.total_records ||
                    leavesArray.length,
                pending: leavesArray.filter((l) => l.status === "pending")
                    .length,
                approved: leavesArray.filter((l) => l.status === "approved")
                    .length,
                rejected: leavesArray.filter((l) => l.status === "rejected")
                    .length,
                sick: leavesArray.filter(
                    (l) => l.type === "sick" || l.type === "izin_sakit"
                ).length,
                permission: leavesArray.filter(
                    (l) =>
                        l.type === "permission" ||
                        l.type === "izin_keperluan" ||
                        l.type === "izin"
                ).length,
            });
        } catch (error) {
            console.error("Error fetching leaves:", error);
            toast.error("Gagal memuat data izin");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axiosInstance.put(`/supervisor/izin/${id}/approve`);
            toast.success("Izin berhasil disetujui");
            fetchLeaves();
            setShowDetailModal(false);
        } catch (error) {
            console.error("Error approving leave:", error);
            toast.error(
                error.response?.data?.message || "Gagal menyetujui izin"
            );
        }
    };

    const openRejectModal = (leave) => {
        setSelectedLeave(leave);
        setShowRejectModal(true);
        setRejectionReason("");
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Alasan penolakan harus diisi");
            return;
        }

        try {
            await axiosInstance.put(
                `/supervisor/izin/${selectedLeave.id}/reject`,
                { rejection_reason: rejectionReason.trim() }
            );
            toast.success("Izin ditolak");
            fetchLeaves();
            setShowRejectModal(false);
            setShowDetailModal(false);
            setRejectionReason("");
            setSelectedLeave(null);
        } catch (error) {
            console.error("Error rejecting leave:", error);
            toast.error(error.response?.data?.message || "Gagal menolak izin");
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        if (key !== "user_name") {
            setPage(1);
        }
    };

    const handleResetFilters = () => {
        setFilters({
            status: "all",
            type: "all",
            date_from: "",
            date_to: "",
            user_name: "",
        });
        setSearchTerm("");
        setPage(1);
    };

    const getTypeBadge = (type) => {
        const badges = {
            sick: { bg: "warning", icon: "thermometer-half", text: "Sakit" },
            izin_sakit: {
                bg: "warning",
                icon: "thermometer-half",
                text: "Sakit",
            },
            permission: { bg: "info", icon: "clipboard-check", text: "Izin" },
            izin: { bg: "info", icon: "clipboard-check", text: "Izin" },
            izin_keperluan: {
                bg: "info",
                icon: "clipboard-check",
                text: "Izin",
            },
            leave: { bg: "primary", icon: "calendar-x", text: "Cuti" },
        };
        return (
            badges[type] || { bg: "secondary", icon: "question", text: type }
        );
    };

    const getStatusBadge = (status) => {
        const badges = {
            approved: {
                bg: "success",
                icon: "check-circle-fill",
                text: "Disetujui",
            },
            pending: { bg: "warning", icon: "clock-history", text: "Pending" },
            rejected: { bg: "danger", icon: "x-circle-fill", text: "Ditolak" },
        };
        return (
            badges[status] || {
                bg: "secondary",
                icon: "question",
                text: status,
            }
        );
    };

    const calculateDuration = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const getAttachmentIcon = (attachment) => {
        if (!attachment) return "file-earmark";
        const ext = attachment.split(".").pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
            return "file-earmark-image";
        if (ext === "pdf") return "file-earmark-pdf";
        if (["doc", "docx"].includes(ext)) return "file-earmark-word";
        return "file-earmark-text";
    };

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <i className="bi bi-calendar-check text-primary me-2"></i>
                        Riwayat Izin & Cuti Tim
                    </h2>
                    <p className="text-muted mb-0">
                        Review dan kelola pengajuan izin/cuti anggota divisi
                        Anda
                    </p>
                </div>
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={fetchLeaves}
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
                                    <i className="bi bi-calendar-check fs-4 text-primary"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Total Izin
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
                                <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-clock-history fs-4 text-warning"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Pending
                                    </small>
                                    <h4 className="mb-0 fw-bold text-warning">
                                        {stats.pending}
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
                                    <i className="bi bi-check-circle-fill fs-4 text-success"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Disetujui
                                    </small>
                                    <h4 className="mb-0 fw-bold text-success">
                                        {stats.approved}
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
                                    <i className="bi bi-x-circle-fill fs-4 text-danger"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Ditolak
                                    </small>
                                    <h4 className="mb-0 fw-bold text-danger">
                                        {stats.rejected}
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
                                    <i className="bi bi-thermometer-half fs-4 text-warning"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Sakit
                                    </small>
                                    <h4 className="mb-0 fw-bold">
                                        {stats.sick}
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
                                    <i className="bi bi-clipboard-check fs-4 text-info"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Izin
                                    </small>
                                    <h4 className="mb-0 fw-bold">
                                        {stats.permission}
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
                                placeholder="Cari nama atau email karyawan..."
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
                                <i className="bi bi-funnel me-1"></i>
                                Tipe Izin
                            </label>
                            <Form.Select
                                value={filters.type}
                                onChange={(e) =>
                                    handleFilterChange("type", e.target.value)
                                }
                            >
                                <option value="all">Semua Tipe</option>
                                <option value="sick">Sakit</option>
                                <option value="permission">
                                    Izin Keperluan
                                </option>
                            </Form.Select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-funnel me-1"></i>
                                Status
                            </label>
                            <Form.Select
                                value={filters.status}
                                onChange={(e) =>
                                    handleFilterChange("status", e.target.value)
                                }
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-5">
                            <label className="form-label small fw-semibold">
                                <i className="bi bi-calendar-range me-1"></i>
                                Periode Izin
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

            {/* Leaves List */}
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
                                Memuat data izin...
                            </p>
                        </div>
                    ) : leaves.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox display-1 text-muted"></i>
                            <p className="text-muted mt-3">
                                Tidak ada data pengajuan izin
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
                                <table className="table table-hover mb-0">
                                    <thead
                                        style={{
                                            backgroundColor: "#f8f9fa",
                                            borderBottom: "2px solid #dee2e6",
                                        }}
                                    >
                                        <tr>
                                            <th className="px-4 py-3">
                                                Karyawan
                                            </th>
                                            <th className="py-3">Tipe</th>
                                            <th className="py-3">Periode</th>
                                            <th className="py-3">Durasi</th>
                                            <th className="py-3">
                                                Tanggal Ajuan
                                            </th>
                                            <th className="py-3">Status</th>
                                            <th className="py-3 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaves.map((leave) => {
                                            const typeBadge = getTypeBadge(
                                                leave.type
                                            );
                                            const statusBadge = getStatusBadge(
                                                leave.status
                                            );
                                            const duration = calculateDuration(
                                                leave.start_date,
                                                leave.end_date
                                            );

                                            return (
                                                <tr key={leave.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={getAvatarUrl(
                                                                    leave.user
                                                                )}
                                                                alt={
                                                                    leave.user
                                                                        ?.name
                                                                }
                                                                className="rounded-circle me-3"
                                                                width="40"
                                                                height="40"
                                                                style={{
                                                                    objectFit:
                                                                        "cover",
                                                                }}
                                                                onError={(
                                                                    e
                                                                ) => {
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                        leave
                                                                            .user
                                                                            ?.name ||
                                                                            "User"
                                                                    )}&background=random&color=fff&size=128`;
                                                                }}
                                                            />
                                                            <div>
                                                                <div className="fw-semibold">
                                                                    {
                                                                        leave
                                                                            .user
                                                                            ?.name
                                                                    }
                                                                </div>
                                                                <small className="text-muted">
                                                                    {
                                                                        leave
                                                                            .user
                                                                            ?.email
                                                                    }
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <Badge
                                                            bg={typeBadge.bg}
                                                        >
                                                            <i
                                                                className={`bi bi-${typeBadge.icon} me-1`}
                                                            ></i>
                                                            {typeBadge.text}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3">
                                                        <div>
                                                            <small className="text-muted d-block">
                                                                <i className="bi bi-calendar-event me-1"></i>
                                                                {new Date(
                                                                    leave.start_date
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    }
                                                                )}
                                                            </small>
                                                            <small className="text-muted">
                                                                <i className="bi bi-arrow-down me-1"></i>
                                                                {new Date(
                                                                    leave.end_date
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    }
                                                                )}
                                                            </small>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="badge bg-secondary">
                                                            <i className="bi bi-calendar3 me-1"></i>
                                                            {duration} hari
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <small className="text-muted">
                                                            {new Date(
                                                                leave.created_at
                                                            ).toLocaleDateString(
                                                                "id-ID",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                }
                                                            )}
                                                        </small>
                                                    </td>
                                                    <td className="py-3">
                                                        <Badge
                                                            bg={statusBadge.bg}
                                                        >
                                                            <i
                                                                className={`bi bi-${statusBadge.icon} me-1`}
                                                            ></i>
                                                            {statusBadge.text}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <div className="btn-group btn-group-sm">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedLeave(
                                                                        leave
                                                                    );
                                                                    setShowDetailModal(
                                                                        true
                                                                    );
                                                                }}
                                                            >
                                                                <i className="bi bi-eye me-1"></i>
                                                                Detail
                                                            </Button>
                                                            {leave.status ===
                                                                "pending" && (
                                                                <>
                                                                    <Button
                                                                        variant="outline-success"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleApprove(
                                                                                leave.id
                                                                            )
                                                                        }
                                                                    >
                                                                        <i className="bi bi-check-circle me-1"></i>
                                                                        Setujui
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            openRejectModal(
                                                                                leave
                                                                            )
                                                                        }
                                                                    >
                                                                        <i className="bi bi-x-circle me-1"></i>
                                                                        Tolak
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
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
                onHide={() => setShowDetailModal(false)}
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
                            <i className="bi bi-calendar-check text-primary fs-4"></i>
                        </div>
                        <span>Detail Pengajuan Izin</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedLeave && (
                        <div>
                            {/* User Info */}
                            <div className="mb-4 pb-3 border-bottom">
                                <h6 className="text-muted mb-3">
                                    <i className="bi bi-person-circle me-2"></i>
                                    Informasi Karyawan
                                </h6>
                                <div className="d-flex align-items-center">
                                    <img
                                        src={getAvatarUrl(selectedLeave.user)}
                                        alt={selectedLeave.user?.name}
                                        className="rounded-circle me-3"
                                        width="60"
                                        height="60"
                                        style={{ objectFit: "cover" }}
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                selectedLeave.user?.name ||
                                                    "User"
                                            )}&background=random&color=fff&size=128`;
                                        }}
                                    />
                                    <div>
                                        <h5 className="mb-1">
                                            {selectedLeave.user?.name}
                                        </h5>
                                        <p className="text-muted mb-0">
                                            <i className="bi bi-envelope me-2"></i>
                                            {selectedLeave.user?.email}
                                        </p>
                                        {selectedLeave.user?.position && (
                                            <p className="text-muted mb-0">
                                                <i className="bi bi-briefcase me-2"></i>
                                                {selectedLeave.user.position}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Leave Details */}
                            <div className="mb-4 pb-3 border-bottom">
                                <h6 className="text-muted mb-3">
                                    <i className="bi bi-calendar-check me-2"></i>
                                    Detail Izin
                                </h6>

                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="small text-muted mb-1">
                                            Tipe Izin
                                        </label>
                                        <div>
                                            <Badge
                                                bg={
                                                    getTypeBadge(
                                                        selectedLeave.type
                                                    ).bg
                                                }
                                                className="px-3 py-2"
                                            >
                                                <i
                                                    className={`bi bi-${
                                                        getTypeBadge(
                                                            selectedLeave.type
                                                        ).icon
                                                    } me-2`}
                                                ></i>
                                                {
                                                    getTypeBadge(
                                                        selectedLeave.type
                                                    ).text
                                                }
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="small text-muted mb-1">
                                            Status
                                        </label>
                                        <div>
                                            <Badge
                                                bg={
                                                    getStatusBadge(
                                                        selectedLeave.status
                                                    ).bg
                                                }
                                                className="px-3 py-2"
                                            >
                                                <i
                                                    className={`bi bi-${
                                                        getStatusBadge(
                                                            selectedLeave.status
                                                        ).icon
                                                    } me-2`}
                                                ></i>
                                                {
                                                    getStatusBadge(
                                                        selectedLeave.status
                                                    ).text
                                                }
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-light border-0 mb-3">
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6 mb-3 mb-md-0">
                                                <label className="small text-muted mb-2">
                                                    Tanggal Mulai
                                                </label>
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                                                        <i className="bi bi-calendar-event text-primary fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold">
                                                            {formatDate(
                                                                selectedLeave.start_date
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="small text-muted mb-2">
                                                    Tanggal Selesai
                                                </label>
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-danger bg-opacity-10 rounded p-2 me-3">
                                                        <i className="bi bi-calendar-x text-danger fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold">
                                                            {formatDate(
                                                                selectedLeave.end_date
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="small text-muted mb-1">
                                        Durasi
                                    </label>
                                    <div className="fw-semibold">
                                        <i className="bi bi-calendar3 me-2 text-primary"></i>
                                        {calculateDuration(
                                            selectedLeave.start_date,
                                            selectedLeave.end_date
                                        )}{" "}
                                        hari
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="small text-muted mb-1">
                                        Alasan
                                    </label>
                                    <div
                                        className="card border-0"
                                        style={{ backgroundColor: "#f8f9fa" }}
                                    >
                                        <div className="card-body">
                                            {selectedLeave.reason}
                                        </div>
                                    </div>
                                </div>

                                {selectedLeave.attachment && (
                                    <div className="mb-3">
                                        <label className="small text-muted mb-2">
                                            Lampiran
                                        </label>
                                        <div
                                            className="card border-0"
                                            style={{
                                                backgroundColor: "#e7f3ff",
                                            }}
                                        >
                                            <div className="card-body d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                                                        <i
                                                            className={`bi bi-${getAttachmentIcon(
                                                                selectedLeave.attachment
                                                            )} text-primary fs-4`}
                                                        ></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold">
                                                            Dokumen Pendukung
                                                        </div>
                                                        <small className="text-muted">
                                                            {selectedLeave.attachment
                                                                .split("/")
                                                                .pop()}
                                                        </small>
                                                    </div>
                                                </div>
                                                <a
                                                    href={getImageUrl(
                                                        selectedLeave.attachment
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    <i className="bi bi-download me-2"></i>
                                                    Unduh
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="small text-muted mb-1">
                                        Tanggal Pengajuan
                                    </label>
                                    <div className="fw-semibold">
                                        <i className="bi bi-clock-history me-2 text-primary"></i>
                                        {new Date(
                                            selectedLeave.created_at
                                        ).toLocaleDateString("id-ID", {
                                            weekday: "long",
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Rejection Reason */}
                            {selectedLeave.status === "rejected" &&
                                selectedLeave.rejection_reason && (
                                    <div>
                                        <h6 className="text-muted mb-3">
                                            <i className="bi bi-chat-left-quote me-2"></i>
                                            Alasan Penolakan
                                        </h6>
                                        <div className="alert alert-danger">
                                            <div className="d-flex">
                                                <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
                                                <div>
                                                    <strong>
                                                        Ditolak oleh:
                                                    </strong>{" "}
                                                    {selectedLeave.reviewer
                                                        ?.name || "Supervisor"}
                                                    <p className="mb-0 mt-2">
                                                        {
                                                            selectedLeave.rejection_reason
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {/* Approval Info */}
                            {selectedLeave.status === "approved" &&
                                selectedLeave.reviewer && (
                                    <div>
                                        <h6 className="text-muted mb-3">
                                            <i className="bi bi-person-check me-2"></i>
                                            Informasi Persetujuan
                                        </h6>
                                        <div className="alert alert-success">
                                            <div className="d-flex align-items-center">
                                                <img
                                                    src={getAvatarUrl(
                                                        selectedLeave.reviewer
                                                    )}
                                                    alt={
                                                        selectedLeave.reviewer
                                                            .name
                                                    }
                                                    className="rounded-circle me-3"
                                                    width="40"
                                                    height="40"
                                                    style={{
                                                        objectFit: "cover",
                                                    }}
                                                    onError={(e) => {
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                            selectedLeave
                                                                .reviewer
                                                                .name ||
                                                                "Reviewer"
                                                        )}&background=28a745&color=fff&size=128`;
                                                    }}
                                                />
                                                <div>
                                                    <strong>
                                                        Disetujui oleh:
                                                    </strong>{" "}
                                                    {
                                                        selectedLeave.reviewer
                                                            .name
                                                    }
                                                    {selectedLeave.approved_at && (
                                                        <div className="small text-muted mt-1">
                                                            <i className="bi bi-clock-history me-1"></i>
                                                            {new Date(
                                                                selectedLeave.approved_at
                                                            ).toLocaleDateString(
                                                                "id-ID",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "long",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDetailModal(false)}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        Tutup
                    </Button>
                    {selectedLeave?.status === "pending" && (
                        <>
                            <Button
                                variant="outline-danger"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    openRejectModal(selectedLeave);
                                }}
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                Tolak
                            </Button>
                            <Button
                                variant="success"
                                onClick={() => handleApprove(selectedLeave.id)}
                            >
                                <i className="bi bi-check-circle me-2"></i>
                                Setujui
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Reject Modal */}
            <Modal
                show={showRejectModal}
                onHide={() => setShowRejectModal(false)}
                centered
            >
                <Modal.Header
                    closeButton
                    style={{
                        background:
                            "linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%)",
                        border: "none",
                    }}
                >
                    <Modal.Title className="d-flex align-items-center">
                        <div
                            className="rounded-circle p-2 me-3"
                            style={{
                                backgroundColor: "rgba(220, 38, 38, 0.1)",
                            }}
                        >
                            <i
                                className="bi bi-x-circle fs-4"
                                style={{ color: "#dc2626" }}
                            ></i>
                        </div>
                        <span>Tolak Pengajuan Izin</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div
                        className="alert d-flex align-items-start mb-3"
                        style={{
                            backgroundColor: "#fef3c7",
                            border: "1px solid #fde68a",
                        }}
                    >
                        <i
                            className="bi bi-exclamation-triangle-fill me-3"
                            style={{ color: "#d97706" }}
                        ></i>
                        <div style={{ color: "#78350f" }}>
                            Anda akan menolak pengajuan izin dari{" "}
                            <strong>{selectedLeave?.user?.name}</strong>
                            <div className="mt-2 small">
                                <strong>Periode:</strong>{" "}
                                {selectedLeave &&
                                    formatDate(selectedLeave.start_date)}{" "}
                                -{" "}
                                {selectedLeave &&
                                    formatDate(selectedLeave.end_date)}
                            </div>
                        </div>
                    </div>
                    <Form.Group>
                        <Form.Label className="fw-semibold">
                            Alasan Penolakan{" "}
                            <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Jelaskan alasan penolakan pengajuan izin ini..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <Form.Text className="text-muted">
                            Alasan ini akan dikirim ke karyawan yang
                            bersangkutan
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowRejectModal(false);
                            setRejectionReason("");
                        }}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        Batal
                    </Button>
                    <Button
                        onClick={handleReject}
                        disabled={!rejectionReason.trim()}
                        style={{
                            backgroundColor: "#dc2626",
                            border: "none",
                            color: "white",
                        }}
                    >
                        <i className="bi bi-check2 me-2"></i>
                        Ya, Tolak Pengajuan
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default SupervisorLeave;
