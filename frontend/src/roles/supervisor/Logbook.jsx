import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl } from "../../utils/Constant";
import toast from "react-hot-toast";
import { Modal, Button, Badge, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import LogbookDetailModal from "../../components/LogbookDetailModal";
import AdvancedFilters from "../../components/common/AdvancedFilters";

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
        periode: "",
        sumber_magang: "",
    });
    
    const [selectedUserIds, setSelectedUserIds] = useState([]);

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
        not_filled: 0,
    });



    useEffect(() => {
        fetchLogbooks();
    }, [
        filters.status,
        filters.date_from,
        filters.date_to,
        filters.periode,
        filters.sumber_magang,
        selectedUserIds,
        page,
    ]);

    const fetchLogbooks = async () => {
        try {
            setLoading(true);
            const params = { page, limit: 20 };

            if (filters.status !== "all") params.status = filters.status;
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            if (filters.periode) params.periode = filters.periode;
            if (filters.sumber_magang) params.sumber_magang = filters.sumber_magang;
            if (selectedUserIds.length > 0) {
                params.user_ids = selectedUserIds.join(",");
            }

            // Stats params (no status filter â€” always get full picture)
            const statsParams = {};
            if (filters.date_from) statsParams.date_from = filters.date_from;
            if (filters.date_to) statsParams.date_to = filters.date_to;
            if (filters.periode) statsParams.periode = filters.periode;
            if (filters.sumber_magang) statsParams.sumber_magang = filters.sumber_magang;
            if (selectedUserIds.length > 0) {
                statsParams.user_ids = selectedUserIds.join(",");
            }

            const [dataRes, statsRes] = await Promise.all([
                axiosInstance.get("/supervisor/logbook", { params }),
                axiosInstance.get("/supervisor/logbook/stats", { params: statsParams }),
            ]);

            const data = dataRes.data.data || [];
            setLogbooks(Array.isArray(data) ? data : []);
            setPagination(dataRes.data.pagination);

            // Use accurate stats from dedicated endpoint
            const s = statsRes.data.data || {};
            setStats({
                total: s.total ?? 0,
                pending: s.pending ?? 0,
                approved: s.approved ?? 0,
                rejected: s.rejected ?? 0,
                not_filled: s.not_filled ?? 0,
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

    const getStatusBadge = (status) => {
        const badges = {
            approved: {
                bg: "success",
                icon: "check-circle",
                text: "Disetujui",
            },
            pending: { bg: "warning", icon: "clock-history", text: "Pending" },
            rejected: { bg: "danger", icon: "x-circle", text: "Ditolak" },
            not_filled: { bg: "secondary", icon: "dash-circle", text: "Tidak Mengisi" },
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
                {[
                    { id: "all", label: "Total", value: stats.total, color: "primary", icon: "bi-journal-text" },
                    { id: "pending", label: "Pending", value: stats.pending, color: "warning", icon: "bi-clock-history" },
                    { id: "approved", label: "Disetujui", value: stats.approved, color: "success", icon: "bi-check-circle" },
                    { id: "rejected", label: "Ditolak", value: stats.rejected, color: "danger", icon: "bi-x-circle" },
                    { id: "not_filled", label: "Tidak Mengisi", value: stats.not_filled, color: "secondary", icon: "bi-dash-circle" },
                ].map((card) => (
                    <div key={card.label} className="col-6 col-md">
                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                cursor: "pointer",
                                transform: filters.status === card.id ? "scale(1.02)" : "scale(1)",
                                border: filters.status === card.id ? `2px solid var(--bs-${card.color})` : "2px solid transparent",
                                transition: "all 0.2s ease-in-out"
                            }}
                            onClick={() => handleFilterChange("status", card.id)}
                        >
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className={`rounded-circle bg-${card.color} bg-opacity-10 p-3 me-3`}>
                                        <i className={`bi ${card.icon} fs-4 text-${card.color}`}></i>
                                    </div>
                                    <div>
                                        <small className="text-muted d-block">{card.label}</small>
                                        <h4 className={`mb-0 fw-bold text-${card.color}`}>{card.value}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
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
                                <option value="not_filled">Tidak Mengisi</option>
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

            <LogbookDetailModal
                show={showDetailModal && !!selectedLogbook}
                onClose={() => setShowDetailModal(false)}
                logbook={selectedLogbook}
                showUserInfo={true}
                onApprove={handleApprove}
                onReject={openRejectModal}
            />


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
