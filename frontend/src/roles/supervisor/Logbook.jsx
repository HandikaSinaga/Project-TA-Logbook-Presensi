import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl } from "../../utils/Constant";
import toast from "react-hot-toast";
import { Modal, Button, Badge, Form } from "react-bootstrap";

const SupervisorLogbook = () => {
    const [loading, setLoading] = useState(true);
    const [logbooks, setLogbooks] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedLogbook, setSelectedLogbook] = useState(null);
    const [feedback, setFeedback] = useState("");

    // Enhanced Filters
    const [filters, setFilters] = useState({
        status: "all",
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
        fetchLogbooks();
    }, [
        filters.status,
        filters.date_from,
        filters.date_to,
        filters.user_name,
        page,
    ]);

    const fetchLogbooks = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 20,
            };

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

            const response = await axiosInstance.get("/supervisor/logbook", {
                params,
            });
            const data = response.data.data || response.data || [];
            const logbooksArray = Array.isArray(data) ? data : [];
            setLogbooks(logbooksArray);
            setPagination(response.data.pagination);

            // Calculate stats
            setStats({
                total:
                    response.data.pagination?.total_records ||
                    logbooksArray.length,
                pending: logbooksArray.filter((l) => l.status === "pending")
                    .length,
                approved: logbooksArray.filter((l) => l.status === "approved")
                    .length,
                rejected: logbooksArray.filter((l) => l.status === "rejected")
                    .length,
            });
        } catch (error) {
            console.error("Error fetching logbooks:", error);
            toast.error("Gagal memuat logbook");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axiosInstance.put(`/supervisor/logbook/${id}/approve`);
            toast.success("Logbook berhasil disetujui");
            fetchLogbooks();
            setShowDetailModal(false);
        } catch (error) {
            console.error("Error approving logbook:", error);
            toast.error(
                error.response?.data?.message || "Gagal menyetujui logbook"
            );
        }
    };

    const openRejectModal = (logbook) => {
        setSelectedLogbook(logbook);
        setShowRejectModal(true);
        setFeedback("");
    };

    const handleReject = async () => {
        if (!feedback.trim()) {
            toast.error("Alasan penolakan harus diisi");
            return;
        }

        try {
            await axiosInstance.put(
                `/supervisor/logbook/${selectedLogbook.id}/reject`,
                { feedback: feedback.trim() }
            );
            toast.success("Logbook ditolak");
            fetchLogbooks();
            setShowRejectModal(false);
            setShowDetailModal(false);
            setFeedback("");
            setSelectedLogbook(null);
        } catch (error) {
            console.error("Error rejecting logbook:", error);
            toast.error(
                error.response?.data?.message || "Gagal menolak logbook"
            );
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
            date_from: "",
            date_to: "",
            user_name: "",
        });
        setSearchTerm("");
        setPage(1);
    };

    const getStatusBadge = (status) => {
        const badges = {
            approved: {
                bg: "success",
                icon: "check-circle",
                text: "Disetujui",
            },
            pending: { bg: "warning", icon: "clock-history", text: "Pending" },
            rejected: { bg: "danger", icon: "x-circle", text: "Ditolak" },
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
                        <i className="bi bi-journal-text text-primary me-2"></i>
                        Riwayat Logbook Tim
                    </h2>
                    <p className="text-muted mb-0">
                        Monitor dan review logbook anggota divisi Anda
                    </p>
                </div>
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={fetchLogbooks}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-journal-text fs-4 text-primary"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">
                                        Total Logbook
                                    </small>
                                    <h4 className="mb-0 fw-bold">
                                        {stats.total}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
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
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-check-circle fs-4 text-success"></i>
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
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-x-circle fs-4 text-danger"></i>
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
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
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
                                Status
                            </label>
                            <Form.Select
                                value={filters.status}
                                onChange={(e) =>
                                    handleFilterChange("status", e.target.value)
                                }
                            >
                                <option value="all">Semua</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-6">
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

            {/* Logbooks List */}
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
                                Memuat data logbook...
                            </p>
                        </div>
                    ) : logbooks.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox display-1 text-muted"></i>
                            <p className="text-muted mt-3">
                                Tidak ada data logbook
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
                                            <th className="py-3">Tanggal</th>
                                            <th className="py-3">
                                                Aktivitas/Lokasi
                                            </th>
                                            <th className="py-3">Deskripsi</th>
                                            <th className="py-3">Status</th>
                                            <th className="py-3 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logbooks.map((logbook) => {
                                            const statusBadge = getStatusBadge(
                                                logbook.status
                                            );
                                            return (
                                                <tr key={logbook.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={getAvatarUrl(
                                                                    logbook.user
                                                                )}
                                                                alt={
                                                                    logbook.user
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
                                                                        logbook
                                                                            .user
                                                                            ?.name ||
                                                                            "User"
                                                                    )}&background=random&color=fff&size=128`;
                                                                }}
                                                            />
                                                            <div>
                                                                <div className="fw-semibold">
                                                                    {
                                                                        logbook
                                                                            .user
                                                                            ?.name
                                                                    }
                                                                </div>
                                                                <small className="text-muted">
                                                                    {
                                                                        logbook
                                                                            .user
                                                                            ?.email
                                                                    }
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <small className="text-muted">
                                                            <i className="bi bi-calendar3 me-1"></i>
                                                            {new Date(
                                                                logbook.date
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
                                                        <div
                                                            className="fw-semibold text-primary"
                                                            style={{
                                                                maxWidth:
                                                                    "200px",
                                                            }}
                                                        >
                                                            <i className="bi bi-briefcase me-1"></i>
                                                            {logbook.activity ||
                                                                "-"}
                                                        </div>
                                                        {logbook.location && (
                                                            <small className="text-muted d-block mt-1">
                                                                <i className="bi bi-geo-alt me-1"></i>
                                                                {
                                                                    logbook.location
                                                                }
                                                            </small>
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        <div
                                                            className="text-muted small"
                                                            style={{
                                                                maxWidth:
                                                                    "300px",
                                                                display:
                                                                    "-webkit-box",
                                                                WebkitLineClamp:
                                                                    "2",
                                                                WebkitBoxOrient:
                                                                    "vertical",
                                                                overflow:
                                                                    "hidden",
                                                            }}
                                                        >
                                                            {
                                                                logbook.description
                                                            }
                                                        </div>
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
                                                                    setSelectedLogbook(
                                                                        logbook
                                                                    );
                                                                    setShowDetailModal(
                                                                        true
                                                                    );
                                                                }}
                                                            >
                                                                <i className="bi bi-eye me-1"></i>
                                                                Detail
                                                            </Button>
                                                            {logbook.status ===
                                                                "pending" && (
                                                                <>
                                                                    <Button
                                                                        variant="outline-success"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleApprove(
                                                                                logbook.id
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
                                                                                logbook
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
                            <i className="bi bi-journal-text text-primary fs-4"></i>
                        </div>
                        <span>Detail Logbook</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedLogbook && (
                        <div>
                            {/* User Info */}
                            <div className="mb-4 pb-3 border-bottom">
                                <h6 className="text-muted mb-3">
                                    <i className="bi bi-person-circle me-2"></i>
                                    Informasi Karyawan
                                </h6>
                                <div className="d-flex align-items-center">
                                    <img
                                        src={getAvatarUrl(selectedLogbook.user)}
                                        alt={selectedLogbook.user?.name}
                                        className="rounded-circle me-3"
                                        width="60"
                                        height="60"
                                        style={{ objectFit: "cover" }}
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                selectedLogbook.user?.name ||
                                                    "User"
                                            )}&background=random&color=fff&size=128`;
                                        }}
                                    />
                                    <div>
                                        <h5 className="mb-1">
                                            {selectedLogbook.user?.name}
                                        </h5>
                                        <p className="text-muted mb-0">
                                            {selectedLogbook.user?.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Logbook Details */}
                            <div className="mb-4 pb-3 border-bottom">
                                <h6 className="text-muted mb-3">
                                    <i className="bi bi-journal-bookmark me-2"></i>
                                    Detail Logbook
                                </h6>
                                <div className="mb-3">
                                    <label className="small text-muted mb-1">
                                        Tanggal
                                    </label>
                                    <div className="fw-semibold">
                                        <i className="bi bi-calendar3 me-2 text-primary"></i>
                                        {new Date(
                                            selectedLogbook.date
                                        ).toLocaleDateString("id-ID", {
                                            weekday: "long",
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="small text-muted mb-1">
                                        Waktu
                                    </label>
                                    <div className="fw-semibold">
                                        <i className="bi bi-clock me-2 text-info"></i>
                                        {selectedLogbook.time || "-"}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="small text-muted mb-1">
                                        Aktivitas
                                    </label>
                                    <div className="fw-semibold">
                                        <i className="bi bi-briefcase me-2 text-success"></i>
                                        {selectedLogbook.activity || "-"}
                                    </div>
                                </div>
                                {selectedLogbook.location && (
                                    <div className="mb-3">
                                        <label className="small text-muted mb-1">
                                            Lokasi
                                        </label>
                                        <div className="fw-semibold">
                                            <i className="bi bi-geo-alt me-2 text-danger"></i>
                                            {selectedLogbook.location}
                                        </div>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="small text-muted mb-1">
                                        Deskripsi
                                    </label>
                                    <div className="card bg-light border-0">
                                        <div className="card-body">
                                            {selectedLogbook.description}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="small text-muted mb-1">
                                        Status
                                    </label>
                                    <div>
                                        <Badge
                                            bg={
                                                getStatusBadge(
                                                    selectedLogbook.status
                                                ).bg
                                            }
                                            className="px-3 py-2"
                                        >
                                            <i
                                                className={`bi bi-${
                                                    getStatusBadge(
                                                        selectedLogbook.status
                                                    ).icon
                                                } me-2`}
                                            ></i>
                                            {
                                                getStatusBadge(
                                                    selectedLogbook.status
                                                ).text
                                            }
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Attachments */}
                            {selectedLogbook.attachments &&
                                selectedLogbook.attachments.length > 0 && (
                                    <div className="mb-4 pb-3 border-bottom">
                                        <h6 className="text-muted mb-3">
                                            <i className="bi bi-paperclip me-2"></i>
                                            Lampiran (
                                            {selectedLogbook.attachments.length}
                                            )
                                        </h6>
                                        <div className="row g-2">
                                            {selectedLogbook.attachments.map(
                                                (attachment, index) => {
                                                    const isImage =
                                                        /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                                            attachment
                                                        );
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="col-md-6"
                                                        >
                                                            {isImage ? (
                                                                <div className="card border-0 shadow-sm">
                                                                    <img
                                                                        src={`http://localhost:3000${attachment}`}
                                                                        alt={`Attachment ${
                                                                            index +
                                                                            1
                                                                        }`}
                                                                        className="card-img-top"
                                                                        style={{
                                                                            height: "200px",
                                                                            objectFit:
                                                                                "cover",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        onClick={() =>
                                                                            window.open(
                                                                                `http://localhost:3000${attachment}`,
                                                                                "_blank"
                                                                            )
                                                                        }
                                                                        onError={(
                                                                            e
                                                                        ) => {
                                                                            e.target.src =
                                                                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="100" dx="50"%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E';
                                                                        }}
                                                                    />
                                                                    <div className="card-body p-2 text-center">
                                                                        <small className="text-muted">
                                                                            <i className="bi bi-zoom-in me-1"></i>
                                                                            Klik
                                                                            untuk
                                                                            memperbesar
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <a
                                                                    href={`http://localhost:3000${attachment}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="btn btn-outline-primary w-100"
                                                                >
                                                                    <i className="bi bi-file-earmark me-2"></i>
                                                                    Lampiran{" "}
                                                                    {index + 1}
                                                                </a>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Feedback */}
                            {selectedLogbook.feedback && (
                                <div>
                                    <h6 className="text-muted mb-3">
                                        <i className="bi bi-chat-left-quote me-2"></i>
                                        Feedback
                                    </h6>
                                    <div className="alert alert-warning">
                                        <strong>Alasan Penolakan:</strong>
                                        <p className="mb-0 mt-2">
                                            {selectedLogbook.feedback}
                                        </p>
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
                    {selectedLogbook?.status === "pending" && (
                        <>
                            <Button
                                variant="outline-danger"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    openRejectModal(selectedLogbook);
                                }}
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                Tolak
                            </Button>
                            <Button
                                variant="success"
                                onClick={() =>
                                    handleApprove(selectedLogbook.id)
                                }
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
                        <span>Tolak Logbook</span>
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
                            Anda akan menolak logbook dari{" "}
                            <strong>{selectedLogbook?.user?.name}</strong>
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
                            placeholder="Jelaskan alasan penolakan logbook..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                        <Form.Text className="text-muted">
                            Feedback ini akan dikirim ke karyawan
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 bg-light">
                    <Button
                        variant="secondary"
                        onClick={() => setShowRejectModal(false)}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        Batal
                    </Button>
                    <Button
                        onClick={handleReject}
                        disabled={!feedback.trim()}
                        style={{
                            backgroundColor: "#dc2626",
                            border: "none",
                            color: "white",
                        }}
                    >
                        <i className="bi bi-check2 me-2"></i>
                        Ya, Tolak Logbook
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default SupervisorLogbook;
