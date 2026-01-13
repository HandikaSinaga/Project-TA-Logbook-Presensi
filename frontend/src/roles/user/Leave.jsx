import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

const Leave = () => {
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [filteredLeaves, setFilteredLeaves] = useState([]);
    const [leaveQuota, setLeaveQuota] = useState(null);
    const [stats, setStats] = useState({
        approved: 0,
        pending: 0,
        rejected: 0,
        total: 0,
        used: 0,
        remaining: 0,
    });
    const [systemSettings, setSystemSettings] = useState({
        leave_submission_deadline_hours: 24, // Default H-1
        leave_min_reason_chars: 10, // Default minimum characters
    });
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [leaveToDelete, setLeaveToDelete] = useState(null);
    const [formData, setFormData] = useState({
        start_date: "",
        end_date: "",
        type: "izin",
        reason: "",
        attachment: null,
    });
    const [previewFile, setPreviewFile] = useState(null);

    // Filter states
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination state
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchLeaveQuota();
        fetchSystemSettings();
        fetchLeaveHistory().finally(() => setLoading(false));
    }, []);

    // Fetch history when page or filters change
    useEffect(() => {
        if (
            page > 1 ||
            filterStatus ||
            filterDateFrom ||
            filterDateTo ||
            searchQuery
        ) {
            fetchLeaveHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filterStatus, filterDateFrom, filterDateTo, searchQuery]);

    // Recalculate remaining when leaveQuota changes
    useEffect(() => {
        if (leaveQuota && leaves.length > 0) {
            const usedDays = leaves
                .filter((l) => l.status === "approved")
                .reduce(
                    (sum, leave) =>
                        sum + calculateDays(leave.start_date, leave.end_date),
                    0
                );

            setStats((prevStats) => {
                if (prevStats.remaining !== leaveQuota.quota - usedDays) {
                    return {
                        ...prevStats,
                        remaining: leaveQuota.quota - usedDays,
                    };
                }
                return prevStats;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leaveQuota, leaves.length]);

    // Auto-scroll modal to top when opened
    useEffect(() => {
        if (showModal || showDetailModal) {
            setTimeout(() => {
                const modalBody = document.querySelector(".modal-body");
                if (modalBody) {
                    modalBody.scrollTop = 0;
                }
            }, 100);
        }
    }, [showModal, showDetailModal]);

    const fetchLeaveQuota = async () => {
        try {
            const response = await axiosInstance.get("/user/izin/quota");
            if (response.data.success) {
                setLeaveQuota(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching leave quota:", error);
            // Gracefully handle - app will work without quota (unlimited mode)
            setLeaveQuota(null);
        }
    };

    // Fetch system settings
    const fetchSystemSettings = async () => {
        try {
            const response = await axiosInstance.get("/user/settings");
            if (response.data.success) {
                const settings = response.data.data;
                setSystemSettings({
                    leave_submission_deadline_hours:
                        parseInt(settings.leave_submission_deadline_hours) ||
                        24,
                    leave_min_reason_chars:
                        parseInt(settings.leave_min_reason_chars) || 10,
                });
            }
        } catch (error) {
            console.error("Error fetching system settings:", error);
            // Use default if fetch fails
        }
    };

    const fetchLeaveHistory = async () => {
        try {
            setHistoryLoading(true);
            const params = { page, limit: 20 };

            // Apply filters
            if (filterStatus && filterStatus !== "all") {
                params.status = filterStatus;
            }
            if (filterDateFrom) {
                params.date_from = filterDateFrom;
            }
            if (filterDateTo) {
                params.date_to = filterDateTo;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }

            const response = await axiosInstance.get("/user/izin", { params });
            const data = response.data.data || response.data || [];
            setLeaves(Array.isArray(data) ? data : []);
            setFilteredLeaves(Array.isArray(data) ? data : []);
            setPagination(response.data.pagination || null);

            // Calculate stats
            const totalRecords =
                response.data.pagination?.total_records || data.length;

            // Calculate used days (approved only) from current page data
            const usedDays = data
                .filter((l) => l.status === "approved")
                .reduce(
                    (sum, leave) =>
                        sum + calculateDays(leave.start_date, leave.end_date),
                    0
                );

            setStats((prevStats) => ({
                ...prevStats,
                total: totalRecords,
                used: usedDays,
                remaining: leaveQuota ? leaveQuota.quota - usedDays : 0,
            }));
        } catch (error) {
            console.error("Error fetching leaves:", error);
            toast.error("Gagal memuat data izin");
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 5MB");
                e.target.value = "";
                return;
            }

            const validTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "application/pdf",
            ];
            if (!validTypes.includes(file.type)) {
                toast.error("Format file harus JPG, PNG, GIF, atau PDF");
                e.target.value = "";
                return;
            }

            setFormData({ ...formData, attachment: file });

            // Preview
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => setPreviewFile(reader.result);
                reader.readAsDataURL(file);
            } else {
                setPreviewFile("pdf");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.start_date || !formData.end_date || !formData.reason) {
            toast.error("Semua field wajib diisi");
            return;
        }

        const minReasonChars = systemSettings.leave_min_reason_chars || 10;
        if (formData.reason.length < minReasonChars) {
            toast.error(
                `Alasan minimal ${minReasonChars} karakter untuk penjelasan yang jelas`,
                {
                    icon: "✍️",
                    duration: 3000,
                }
            );
            return;
        }

        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            toast.error(
                "Tanggal selesai tidak boleh lebih awal dari tanggal mulai"
            );
            return;
        }

        // Validate deadline for izin type - H-1 means different day, not 24 hours
        if (formData.type === "izin") {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today

            const startDate = new Date(formData.start_date);
            startDate.setHours(0, 0, 0, 0); // Start of leave date

            // Check if leave date is today or in the past
            if (startDate <= today) {
                toast.error("Izin harus diajukan minimal H-1 (minimal besok)", {
                    icon: "⚠️",
                    duration: 4000,
                });
                return;
            }
        }

        // Validate file for sakit type
        if (formData.type === "sakit" && !formData.attachment) {
            toast.error("Surat keterangan sakit wajib dilampirkan", {
                icon: "📎",
                duration: 3000,
            });
            return;
        }

        // Check quota
        const requestedDays = calculateDays(
            formData.start_date,
            formData.end_date
        );
        if (leaveQuota && stats.remaining < requestedDays) {
            toast.error(
                `Kuota izin tidak mencukupi. Sisa kuota: ${stats.remaining} hari`
            );
            return;
        }

        try {
            const submitData = new FormData();
            submitData.append("start_date", formData.start_date);
            submitData.append("end_date", formData.end_date);
            submitData.append("type", formData.type);
            submitData.append("reason", formData.reason);
            if (formData.attachment) {
                submitData.append("attachment", formData.attachment);
            }

            await axiosInstance.post("/user/izin", submitData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Pengajuan izin berhasil dikirim", {
                icon: "📝",
                duration: 3000,
            });
            setShowModal(false);
            setFormData({
                start_date: "",
                end_date: "",
                type: "izin",
                reason: "",
                attachment: null,
            });
            setPreviewFile(null);
            fetchLeaveHistory();
            fetchLeaveQuota();
        } catch (error) {
            console.error("Error submitting leave:", error);
            toast.error(
                error.response?.data?.message || "Gagal mengajukan izin"
            );
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/user/izin/${id}`);
            toast.success("Pengajuan berhasil dihapus", {
                icon: "🗑️",
                duration: 3000,
            });
            fetchLeaveHistory();
            fetchLeaveQuota();
            setShowDeleteModal(false);
            setLeaveToDelete(null);
        } catch (error) {
            console.error("Error deleting leave:", error);
            toast.error("Gagal menghapus pengajuan");
        }
    };

    const confirmDelete = (leave) => {
        setLeaveToDelete(leave);
        setShowDeleteModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            approved: "success",
            pending: "warning",
            rejected: "danger",
        };
        return badges[status] || "secondary";
    };

    const getTypeBadge = (type) => {
        const badges = {
            izin: "primary",
            sakit: "info",
            izin_keperluan: "primary",
            izin_sakit: "info",
        };
        return badges[type] || "secondary";
    };

    const getTypeLabel = (type) => {
        const labels = {
            izin: "Izin",
            sakit: "Sakit",
            izin_keperluan: "Izin",
            izin_sakit: "Sakit",
        };
        return labels[type] || type;
    };

    const getTypeIcon = (type) => {
        const icons = {
            izin: "bi-person-x",
            sakit: "bi-hospital",
            izin_keperluan: "bi-person-x",
            izin_sakit: "bi-hospital",
        };
        return icons[type] || "bi-question-circle";
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatDateShort = (date) => {
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const calculateDays = (start, end) => {
        const diffTime = Math.abs(new Date(end) - new Date(start));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "400px" }}
            >
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="user-leave p-4">
            {/* Header */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h2 className="mb-1">
                            <i className="bi bi-calendar-x me-2"></i>
                            Pengajuan Izin
                        </h2>
                        <p className="text-muted mb-0">
                            Kelola pengajuan izin magang Anda
                        </p>
                    </div>
                    <button
                        className="btn btn-primary btn-lg shadow-sm"
                        onClick={() => setShowModal(true)}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        Ajukan Izin
                    </button>
                </div>
            </div>

            {/* Stats Cards - Subtle Gradient */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div
                            className="card-body"
                            style={{
                                background:
                                    "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)",
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <p className="mb-1 text-muted small">
                                        Total Pengajuan
                                    </p>
                                    <h2 className="mb-0 fw-bold text-primary">
                                        {stats.total}
                                    </h2>
                                </div>
                                <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                    <i className="bi bi-file-text text-primary fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-2 small text-muted">
                                <i className="bi bi-calendar-check me-1"></i>
                                Semua pengajuan
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div
                            className="card-body"
                            style={{
                                background:
                                    "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)",
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <p className="mb-1 text-muted small">
                                        Disetujui
                                    </p>
                                    <h2 className="mb-0 fw-bold text-success">
                                        {stats.approved}
                                    </h2>
                                </div>
                                <div className="bg-success bg-opacity-10 rounded-circle p-2">
                                    <i className="bi bi-check-circle-fill text-success fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-2 small text-muted">
                                <i className="bi bi-hand-thumbs-up me-1"></i>
                                {stats.used} hari terpakai
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div
                            className="card-body"
                            style={{
                                background:
                                    "linear-gradient(135deg, #fef3c7 0%, #fefce8 100%)",
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <p className="mb-1 text-muted small">
                                        Pending
                                    </p>
                                    <h2 className="mb-0 fw-bold text-warning">
                                        {stats.pending}
                                    </h2>
                                </div>
                                <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                    <i className="bi bi-clock-fill text-warning fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-2 small text-muted">
                                <i className="bi bi-hourglass-split me-1"></i>
                                Menunggu persetujuan
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div
                            className="card-body"
                            style={{
                                background:
                                    "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)",
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <p className="mb-1 text-muted small">
                                        Kuota Tersisa
                                    </p>
                                    <h2 className="mb-0 fw-bold text-info">
                                        {leaveQuota ? stats.remaining : "-"}
                                    </h2>
                                </div>
                                <div className="bg-info bg-opacity-10 rounded-circle p-2">
                                    <i className="bi bi-calendar3 text-info fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-2 small text-muted">
                                <i className="bi bi-info-circle me-1"></i>
                                {leaveQuota
                                    ? `dari ${leaveQuota.quota} hari`
                                    : "Tidak dibatasi"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quota Warning Banner */}
            {leaveQuota && stats.remaining <= 3 && stats.remaining > 0 && (
                <div
                    className="alert alert-warning border-0 shadow-sm mb-4"
                    role="alert"
                >
                    <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                        <div>
                            <h6 className="alert-heading mb-1">
                                Kuota Izin Hampir Habis!
                            </h6>
                            <p className="mb-0 small">
                                Kuota izin Anda tersisa{" "}
                                <strong>{stats.remaining} hari</strong> lagi.
                                Gunakan dengan bijak!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!leaveQuota && (
                <div
                    className="alert alert-info border-0 shadow-sm mb-4"
                    role="alert"
                >
                    <div className="d-flex align-items-center">
                        <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                        <div>
                            <h6 className="alert-heading mb-1">
                                Informasi Kuota
                            </h6>
                            <p className="mb-0 small">
                                Kuota izin belum diatur oleh admin. Anda dapat
                                mengajukan izin tanpa batasan.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Section */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <h6 className="mb-3">
                        <i className="bi bi-funnel me-2"></i>
                        Filter & Pencarian
                    </h6>
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label small text-muted">
                                Status
                            </label>
                            <select
                                className="form-select"
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">📋 Semua Status</option>
                                <option value="pending">⏳ Pending</option>
                                <option value="approved">✅ Disetujui</option>
                                <option value="rejected">❌ Ditolak</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small text-muted">
                                Dari Tanggal
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={filterDateFrom}
                                onChange={(e) => {
                                    setFilterDateFrom(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small text-muted">
                                Sampai Tanggal
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={filterDateTo}
                                onChange={(e) => {
                                    setFilterDateTo(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small text-muted">
                                Cari Alasan
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ketik untuk mencari..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    {(filterStatus ||
                        filterDateFrom ||
                        filterDateTo ||
                        searchQuery) && (
                        <div className="mt-3 d-flex justify-content-between align-items-center">
                            <span className="badge bg-primary">
                                <i className="bi bi-funnel-fill me-1"></i>
                                Filter aktif
                            </span>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                    setFilterStatus("");
                                    setFilterDateFrom("");
                                    setFilterDateTo("");
                                    setSearchQuery("");
                                    setPage(1);
                                }}
                            >
                                <i className="bi bi-x-circle me-1"></i>
                                Reset Filter
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Leave List */}
            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <h6 className="mb-3">
                        <i className="bi bi-list-ul me-2"></i>
                        Riwayat Pengajuan Izin
                        {pagination && (
                            <span className="badge bg-primary ms-2">
                                {pagination.total_records}
                            </span>
                        )}
                    </h6>
                    {historyLoading ? (
                        <div className="text-center py-5">
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>
                            <div className="mt-2 text-muted">
                                Memuat riwayat izin...
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: "5%" }}>#</th>
                                            <th style={{ width: "20%" }}>
                                                <i className="bi bi-calendar-range me-1"></i>
                                                Periode
                                            </th>
                                            <th style={{ width: "10%" }}>
                                                <i className="bi bi-hourglass me-1"></i>
                                                Durasi
                                            </th>
                                            <th style={{ width: "10%" }}>
                                                <i className="bi bi-tag me-1"></i>
                                                Jenis
                                            </th>
                                            <th style={{ width: "25%" }}>
                                                <i className="bi bi-chat-left-text me-1"></i>
                                                Alasan
                                            </th>
                                            <th style={{ width: "10%" }}>
                                                <i className="bi bi-check-circle me-1"></i>
                                                Status
                                            </th>
                                            <th
                                                style={{ width: "20%" }}
                                                className="text-center"
                                            >
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeaves.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    className="text-center py-5"
                                                >
                                                    <div className="text-muted">
                                                        <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                                                        <p className="mb-0">
                                                            {searchQuery ||
                                                            filterStatus ||
                                                            filterDateFrom ||
                                                            filterDateTo
                                                                ? "Tidak ada data yang sesuai dengan filter"
                                                                : "Belum ada pengajuan izin"}
                                                        </p>
                                                        {!searchQuery &&
                                                            !filterStatus &&
                                                            !filterDateFrom &&
                                                            !filterDateTo && (
                                                                <button
                                                                    className="btn btn-primary btn-sm mt-3"
                                                                    onClick={() =>
                                                                        setShowModal(
                                                                            true
                                                                        )
                                                                    }
                                                                >
                                                                    <i className="bi bi-plus-circle me-2"></i>
                                                                    Ajukan Izin
                                                                    Sekarang
                                                                </button>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLeaves.map(
                                                (leave, index) => (
                                                    <tr key={leave.id}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <div className="small text-nowrap">
                                                                <i className="bi bi-calendar-range text-primary me-1"></i>
                                                                {formatDateShort(
                                                                    leave.start_date
                                                                )}{" "}
                                                                -{" "}
                                                                {formatDateShort(
                                                                    leave.end_date
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-secondary bg-opacity-10 text-dark">
                                                                <i className="bi bi-calendar3 me-1"></i>
                                                                {calculateDays(
                                                                    leave.start_date,
                                                                    leave.end_date
                                                                )}{" "}
                                                                hari
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`badge bg-${getTypeBadge(
                                                                    leave.type
                                                                )}`}
                                                            >
                                                                <i
                                                                    className={`bi ${getTypeIcon(
                                                                        leave.type
                                                                    )} me-1`}
                                                                ></i>
                                                                {getTypeLabel(
                                                                    leave.type
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div
                                                                className="text-truncate small"
                                                                style={{
                                                                    maxWidth:
                                                                        "200px",
                                                                }}
                                                                title={
                                                                    leave.reason
                                                                }
                                                            >
                                                                {leave.reason}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`badge bg-${getStatusBadge(
                                                                    leave.status
                                                                )}`}
                                                            >
                                                                {leave.status ===
                                                                    "pending" && (
                                                                    <>
                                                                        <i className="bi bi-clock-fill me-1"></i>
                                                                        Pending
                                                                    </>
                                                                )}
                                                                {leave.status ===
                                                                    "approved" && (
                                                                    <>
                                                                        <i className="bi bi-check-circle-fill me-1"></i>
                                                                        Disetujui
                                                                    </>
                                                                )}
                                                                {leave.status ===
                                                                    "rejected" && (
                                                                    <>
                                                                        <i className="bi bi-x-circle-fill me-1"></i>
                                                                        Ditolak
                                                                    </>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                onClick={() => {
                                                                    setSelectedLeave(
                                                                        leave
                                                                    );
                                                                    setShowDetailModal(
                                                                        true
                                                                    );
                                                                }}
                                                                title="Lihat Detail"
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                            {leave.status ===
                                                                "pending" && (
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() =>
                                                                        confirmDelete(
                                                                            leave
                                                                        )
                                                                    }
                                                                    title="Hapus Pengajuan"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {!historyLoading &&
                                pagination &&
                                pagination.total_pages > 1 && (
                                    <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                                        <div className="text-muted small">
                                            Menampilkan{" "}
                                            {(page - 1) * pagination.limit + 1}{" "}
                                            -{" "}
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
                                                            pagination.total_pages,
                                                            5
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
                                                            pageNum =
                                                                page - 2 + i;
                                                        }
                                                        return (
                                                            <li
                                                                key={pageNum}
                                                                className={`page-item ${
                                                                    page ===
                                                                    pageNum
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

            {/* Form Modal - Scrollable */}
            {showModal && (
                <div
                    className="modal show d-block"
                    style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                        overflow: "auto",
                    }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowModal(false);
                            setFormData({
                                start_date: "",
                                end_date: "",
                                type: "izin",
                                reason: "",
                                attachment: null,
                            });
                            setPreviewFile(null);
                        }
                    }}
                >
                    <div
                        className="modal-dialog modal-lg"
                        style={{ margin: "1.75rem auto" }}
                    >
                        <div
                            className="modal-content"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                maxHeight: "calc(100vh - 3.5rem)",
                            }}
                        >
                            <div
                                className="modal-header border-0"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)",
                                    flexShrink: 0,
                                }}
                            >
                                <h5 className="modal-title d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                        <i className="bi bi-calendar-plus text-primary fs-4"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-primary">
                                            Ajukan Izin Magang
                                        </div>
                                        <small
                                            className="text-muted"
                                            style={{ fontSize: "0.85rem" }}
                                        >
                                            Isi formulir dengan lengkap dan
                                            jelas
                                        </small>
                                    </div>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowModal(false);
                                        setFormData({
                                            start_date: "",
                                            end_date: "",
                                            type: "izin",
                                            reason: "",
                                            attachment: null,
                                        });
                                        setPreviewFile(null);
                                    }}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div
                                    className="modal-body"
                                    style={{
                                        overflowY: "auto",
                                        flex: "1 1 auto",
                                        maxHeight: "calc(100vh - 250px)",
                                    }}
                                >
                                    {/* Info Alert */}
                                    <div
                                        className="alert alert-info border-0 mb-3"
                                        style={{ padding: "0.75rem 1rem" }}
                                    >
                                        <div className="d-flex align-items-start">
                                            <i
                                                className="bi bi-info-circle-fill me-2"
                                                style={{ fontSize: "1.25rem" }}
                                            ></i>
                                            <div className="flex-grow-1">
                                                <h6
                                                    className="mb-2 fw-bold"
                                                    style={{
                                                        fontSize: "0.95rem",
                                                    }}
                                                >
                                                    📋 Informasi Pengajuan Izin
                                                </h6>
                                                <div
                                                    style={{
                                                        fontSize: "0.85rem",
                                                        lineHeight: "1.6",
                                                    }}
                                                >
                                                    <div className="mb-2">
                                                        <strong>
                                                            <i className="bi bi-person-x me-1"></i>
                                                            Izin:
                                                        </strong>
                                                        Foto{" "}
                                                        <span className="badge bg-secondary">
                                                            Opsional
                                                        </span>
                                                        , minimal{" "}
                                                        <strong className="text-primary">
                                                            {systemSettings.leave_submission_deadline_hours ===
                                                            24
                                                                ? "H-1"
                                                                : `${systemSettings.leave_submission_deadline_hours} jam`}
                                                        </strong>
                                                        , alasan ≥{" "}
                                                        <strong className="text-primary">
                                                            {
                                                                systemSettings.leave_min_reason_chars
                                                            }{" "}
                                                            karakter
                                                        </strong>
                                                    </div>
                                                    <div className="mb-2">
                                                        <strong>
                                                            <i className="bi bi-hospital me-1"></i>
                                                            Sakit:
                                                        </strong>
                                                        Surat{" "}
                                                        <span className="badge bg-danger">
                                                            WAJIB
                                                        </span>
                                                        , alasan ≥{" "}
                                                        <strong className="text-primary">
                                                            {
                                                                systemSettings.leave_min_reason_chars
                                                            }{" "}
                                                            karakter
                                                        </strong>
                                                    </div>
                                                    {leaveQuota && (
                                                        <div
                                                            className="alert alert-warning py-1 px-2 mb-0"
                                                            style={{
                                                                fontSize:
                                                                    "0.85rem",
                                                            }}
                                                        >
                                                            <i className="bi bi-calendar3 me-1"></i>
                                                            <strong>
                                                                Kuota:
                                                            </strong>{" "}
                                                            <span className="badge bg-warning text-dark">
                                                                {
                                                                    stats.remaining
                                                                }{" "}
                                                                /{" "}
                                                                {
                                                                    leaveQuota.quota
                                                                }{" "}
                                                                hari
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date Fields */}
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-calendar-event text-primary me-1"></i>
                                                Tanggal Mulai
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.start_date}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        start_date:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-calendar-check text-success me-1"></i>
                                                Tanggal Selesai
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.end_date}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        end_date:
                                                            e.target.value,
                                                    })
                                                }
                                                min={formData.start_date}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Duration Display */}
                                    {formData.start_date &&
                                        formData.end_date && (
                                            <div className="alert alert-secondary bg-opacity-10 border-0 mb-3">
                                                <i className="bi bi-hourglass-split me-2"></i>
                                                <strong>Durasi:</strong>{" "}
                                                {calculateDays(
                                                    formData.start_date,
                                                    formData.end_date
                                                )}{" "}
                                                hari
                                                {leaveQuota &&
                                                    calculateDays(
                                                        formData.start_date,
                                                        formData.end_date
                                                    ) > stats.remaining && (
                                                        <span className="text-danger ms-2">
                                                            <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                                            Melebihi kuota
                                                            tersisa!
                                                        </span>
                                                    )}
                                            </div>
                                        )}

                                    {/* Type Select */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            <i className="bi bi-tag text-info me-1"></i>
                                            Jenis Izin
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={formData.type}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    type: e.target.value,
                                                })
                                            }
                                            required
                                        >
                                            <option value="izin">
                                                🚶 Izin
                                            </option>
                                            <option value="sakit">
                                                🏥 Sakit
                                            </option>
                                        </select>
                                        <div className="form-text">
                                            {formData.type === "sakit" && (
                                                <>
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Wajib melampirkan surat
                                                    keterangan sakit
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reason Textarea */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            <i className="bi bi-chat-left-text text-warning me-1"></i>
                                            Alasan Izin
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            className={`form-control ${
                                                formData.reason.length > 0 &&
                                                formData.reason.length <
                                                    systemSettings.leave_min_reason_chars
                                                    ? "is-invalid"
                                                    : formData.reason.length >=
                                                      systemSettings.leave_min_reason_chars
                                                    ? "is-valid"
                                                    : ""
                                            }`}
                                            rows="4"
                                            value={formData.reason}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    reason: e.target.value,
                                                })
                                            }
                                            placeholder={`Jelaskan alasan pengajuan izin dengan lengkap dan jelas (minimal ${systemSettings.leave_min_reason_chars} karakter)...`}
                                            maxLength="500"
                                            style={{ resize: "none" }}
                                            required
                                        ></textarea>
                                        <div className="form-text d-flex justify-content-between align-items-center">
                                            <span>
                                                {formData.reason.length <
                                                systemSettings.leave_min_reason_chars ? (
                                                    <>
                                                        <i className="bi bi-exclamation-circle text-danger me-1"></i>
                                                        <span className="text-danger">
                                                            Minimal{" "}
                                                            {
                                                                systemSettings.leave_min_reason_chars
                                                            }{" "}
                                                            karakter
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check-circle text-success me-1"></i>
                                                        <span className="text-success">
                                                            Alasan sudah
                                                            memenuhi syarat
                                                        </span>
                                                    </>
                                                )}
                                            </span>
                                            <span
                                                className={
                                                    formData.reason.length > 450
                                                        ? "text-danger fw-bold"
                                                        : formData.reason
                                                              .length >=
                                                          systemSettings.leave_min_reason_chars
                                                        ? "text-success"
                                                        : "text-muted"
                                                }
                                            >
                                                {formData.reason.length} / 500
                                                karakter
                                            </span>
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            <i className="bi bi-paperclip text-secondary me-1"></i>
                                            Lampiran{" "}
                                            {formData.type === "izin" && (
                                                <span className="badge bg-secondary">
                                                    Opsional
                                                </span>
                                            )}
                                            {formData.type === "sakit" && (
                                                <span className="badge bg-danger">
                                                    WAJIB
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept=".jpg,.jpeg,.png,.gif,.pdf"
                                            onChange={handleFileChange}
                                            required={formData.type === "sakit"}
                                        />
                                        <div className="form-text">
                                            {formData.type === "sakit" ? (
                                                <div
                                                    className="alert alert-warning py-1 px-2 mb-0 mt-2"
                                                    style={{
                                                        fontSize: "0.85rem",
                                                    }}
                                                >
                                                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                                    <strong>
                                                        Surat keterangan sakit
                                                        WAJIB!
                                                    </strong>{" "}
                                                    JPG, PNG, GIF, PDF | Max 5MB
                                                </div>
                                            ) : (
                                                <>
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Format: JPG, PNG, GIF, PDF |
                                                    Maksimal 5MB
                                                </>
                                            )}
                                        </div>

                                        {/* File Preview */}
                                        {previewFile && (
                                            <div className="card border-success bg-success bg-opacity-10 mt-2">
                                                <div className="card-body p-2">
                                                    <div className="d-flex align-items-center">
                                                        <i className="bi bi-check-circle-fill text-success fs-5 me-2"></i>
                                                        <div className="flex-grow-1">
                                                            <h6
                                                                className="mb-0"
                                                                style={{
                                                                    fontSize:
                                                                        "0.9rem",
                                                                }}
                                                            >
                                                                File berhasil
                                                                dipilih
                                                            </h6>
                                                            <p className="mb-0 small text-muted">
                                                                {previewFile ===
                                                                "pdf"
                                                                    ? "File PDF siap diupload"
                                                                    : "Gambar siap diupload"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {previewFile !== "pdf" && (
                                                        <div className="mt-2">
                                                            <img
                                                                src={
                                                                    previewFile
                                                                }
                                                                alt="Preview"
                                                                className="img-fluid rounded"
                                                                style={{
                                                                    maxHeight:
                                                                        "150px",
                                                                    objectFit:
                                                                        "contain",
                                                                    display:
                                                                        "block",
                                                                    margin: "0 auto",
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="modal-footer"
                                    style={{ flexShrink: 0 }}
                                >
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowModal(false);
                                            setFormData({
                                                start_date: "",
                                                end_date: "",
                                                type: "izin",
                                                reason: "",
                                                attachment: null,
                                            });
                                            setPreviewFile(null);
                                        }}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={
                                            leaveQuota &&
                                            formData.start_date &&
                                            formData.end_date &&
                                            calculateDays(
                                                formData.start_date,
                                                formData.end_date
                                            ) > stats.remaining
                                        }
                                    >
                                        <i className="bi bi-send me-2"></i>
                                        Ajukan Izin
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal - Scrollable */}
            {showDetailModal && selectedLeave && (
                <div
                    className="modal show d-block"
                    style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                        overflow: "auto",
                    }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowDetailModal(false);
                            setSelectedLeave(null);
                        }
                    }}
                >
                    <div
                        className="modal-dialog modal-lg"
                        style={{ margin: "1.75rem auto" }}
                    >
                        <div
                            className="modal-content"
                            style={{ maxHeight: "calc(100vh - 3.5rem)" }}
                        >
                            <div
                                className="modal-header border-0"
                                style={{
                                    background:
                                        selectedLeave.status === "approved"
                                            ? "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)"
                                            : selectedLeave.status ===
                                              "rejected"
                                            ? "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)"
                                            : "linear-gradient(135deg, #fef3c7 0%, #fefce8 100%)",
                                    flexShrink: 0,
                                }}
                            >
                                <h5 className="modal-title d-flex align-items-center">
                                    <div
                                        className={`${
                                            selectedLeave.status === "approved"
                                                ? "bg-success"
                                                : selectedLeave.status ===
                                                  "rejected"
                                                ? "bg-danger"
                                                : "bg-warning"
                                        } bg-opacity-10 rounded-circle p-2 me-3`}
                                    >
                                        <i
                                            className={`bi bi-calendar-check ${
                                                selectedLeave.status ===
                                                "approved"
                                                    ? "text-success"
                                                    : selectedLeave.status ===
                                                      "rejected"
                                                    ? "text-danger"
                                                    : "text-warning"
                                            } fs-4`}
                                        ></i>
                                    </div>
                                    <div>
                                        <div
                                            className={`fw-bold ${
                                                selectedLeave.status ===
                                                "approved"
                                                    ? "text-success"
                                                    : selectedLeave.status ===
                                                      "rejected"
                                                    ? "text-danger"
                                                    : "text-warning"
                                            }`}
                                        >
                                            Detail Pengajuan Izin
                                        </div>
                                        <small
                                            className="text-muted"
                                            style={{ fontSize: "0.8rem" }}
                                        >
                                            ID: #{selectedLeave.id}
                                        </small>
                                    </div>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setSelectedLeave(null);
                                    }}
                                ></button>
                            </div>
                            <div
                                className="modal-body"
                                style={{ overflowY: "auto" }}
                            >
                                {/* Status Badge */}
                                <div className="mb-4 text-center">
                                    <span
                                        className={`badge bg-${getStatusBadge(
                                            selectedLeave.status
                                        )} fs-5 px-4 py-2`}
                                    >
                                        {selectedLeave.status === "pending" && (
                                            <>
                                                <i className="bi bi-clock-fill me-2"></i>
                                                Menunggu Persetujuan
                                            </>
                                        )}
                                        {selectedLeave.status ===
                                            "approved" && (
                                            <>
                                                <i className="bi bi-check-circle-fill me-2"></i>
                                                Disetujui
                                            </>
                                        )}
                                        {selectedLeave.status ===
                                            "rejected" && (
                                            <>
                                                <i className="bi bi-x-circle-fill me-2"></i>
                                                Ditolak
                                            </>
                                        )}
                                    </span>
                                </div>

                                {/* Info Cards Grid */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div
                                            className="card border-0 h-100"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)",
                                            }}
                                        >
                                            <div className="card-body">
                                                <h6 className="text-muted mb-2">
                                                    <i className="bi bi-calendar-event text-primary me-2"></i>
                                                    Tanggal Mulai
                                                </h6>
                                                <h5 className="mb-0 fw-bold">
                                                    {formatDate(
                                                        selectedLeave.start_date
                                                    )}
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div
                                            className="card border-0 h-100"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)",
                                            }}
                                        >
                                            <div className="card-body">
                                                <h6 className="text-muted mb-2">
                                                    <i className="bi bi-calendar-check text-success me-2"></i>
                                                    Tanggal Selesai
                                                </h6>
                                                <h5 className="mb-0 fw-bold">
                                                    {formatDate(
                                                        selectedLeave.end_date
                                                    )}
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div
                                            className="card border-0 h-100"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #fef3c7 0%, #fefce8 100%)",
                                            }}
                                        >
                                            <div className="card-body">
                                                <h6 className="text-muted mb-2">
                                                    <i className="bi bi-hourglass-split text-warning me-2"></i>
                                                    Durasi
                                                </h6>
                                                <h5 className="mb-0 fw-bold">
                                                    {calculateDays(
                                                        selectedLeave.start_date,
                                                        selectedLeave.end_date
                                                    )}{" "}
                                                    Hari
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div
                                            className="card border-0 h-100"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)",
                                            }}
                                        >
                                            <div className="card-body">
                                                <h6 className="text-muted mb-2">
                                                    <i className="bi bi-tag text-info me-2"></i>
                                                    Jenis Izin
                                                </h6>
                                                <h5 className="mb-0">
                                                    <span
                                                        className={`badge bg-${getTypeBadge(
                                                            selectedLeave.type
                                                        )}`}
                                                    >
                                                        <i
                                                            className={`bi ${getTypeIcon(
                                                                selectedLeave.type
                                                            )} me-1`}
                                                        ></i>
                                                        {getTypeLabel(
                                                            selectedLeave.type
                                                        )}
                                                    </span>
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reason Section */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-body">
                                        <h6 className="mb-3">
                                            <i className="bi bi-chat-left-text me-2"></i>
                                            Alasan Izin
                                        </h6>
                                        <p
                                            className="mb-0"
                                            style={{ whiteSpace: "pre-wrap" }}
                                        >
                                            {selectedLeave.reason}
                                        </p>
                                    </div>
                                </div>

                                {/* Attachment Section */}
                                {selectedLeave.attachment_url && (
                                    <div className="card border-0 shadow-sm mb-4">
                                        <div className="card-body">
                                            <h6 className="mb-3">
                                                <i className="bi bi-paperclip me-2"></i>
                                                Lampiran
                                            </h6>
                                            {selectedLeave.attachment_url.endsWith(
                                                ".pdf"
                                            ) ? (
                                                <div className="text-center py-3">
                                                    <i className="bi bi-file-pdf text-danger fs-1 d-block mb-3"></i>
                                                    <a
                                                        href={`${
                                                            import.meta.env
                                                                .VITE_API_URL ||
                                                            "http://localhost:5000"
                                                        }${
                                                            selectedLeave.attachment_url
                                                        }`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline-danger"
                                                    >
                                                        <i className="bi bi-download me-2"></i>
                                                        Unduh PDF
                                                    </a>
                                                </div>
                                            ) : (
                                                <img
                                                    src={`${
                                                        import.meta.env
                                                            .VITE_API_URL ||
                                                        "http://localhost:5000"
                                                    }${
                                                        selectedLeave.attachment_url
                                                    }`}
                                                    alt="Lampiran"
                                                    className="img-fluid rounded"
                                                    style={{
                                                        maxHeight: "400px",
                                                        objectFit: "contain",
                                                        display: "block",
                                                        margin: "0 auto",
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Review Section (if reviewed) */}
                                {selectedLeave.status !== "pending" &&
                                    (selectedLeave.review_notes ||
                                        selectedLeave.rejection_reason ||
                                        selectedLeave.notes) && (
                                        <div
                                            className={`card border-0 shadow-sm mb-4 ${
                                                selectedLeave.status ===
                                                "approved"
                                                    ? "border-success"
                                                    : "border-danger"
                                            }`}
                                        >
                                            <div
                                                className="card-header"
                                                style={{
                                                    background:
                                                        selectedLeave.status ===
                                                        "approved"
                                                            ? "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)"
                                                            : "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
                                                }}
                                            >
                                                <h6 className="mb-0">
                                                    <i
                                                        className={`bi ${
                                                            selectedLeave.status ===
                                                            "approved"
                                                                ? "bi-check-circle-fill text-success"
                                                                : "bi-x-circle-fill text-danger"
                                                        } me-2`}
                                                    ></i>
                                                    Catatan{" "}
                                                    {selectedLeave.status ===
                                                    "approved"
                                                        ? "Persetujuan"
                                                        : "Penolakan"}
                                                </h6>
                                            </div>
                                            <div className="card-body">
                                                <p
                                                    className="mb-0"
                                                    style={{
                                                        whiteSpace: "pre-wrap",
                                                    }}
                                                >
                                                    {selectedLeave.review_notes ||
                                                        selectedLeave.rejection_reason ||
                                                        selectedLeave.notes ||
                                                        "Tidak ada catatan"}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                {/* Timeline */}
                                <div className="card border-0 bg-light">
                                    <div className="card-body">
                                        <h6 className="mb-3">
                                            <i className="bi bi-clock-history me-2"></i>
                                            Timeline
                                        </h6>
                                        <div className="d-flex mb-2">
                                            <i
                                                className="bi bi-circle-fill text-primary me-3"
                                                style={{
                                                    fontSize: "8px",
                                                    marginTop: "6px",
                                                }}
                                            ></i>
                                            <div className="flex-grow-1">
                                                <div className="fw-semibold">
                                                    Pengajuan Dibuat
                                                </div>
                                                <small className="text-muted">
                                                    {new Date(
                                                        selectedLeave.created_at
                                                    ).toLocaleString("id-ID", {
                                                        weekday: "long",
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </small>
                                            </div>
                                        </div>
                                        {selectedLeave.status !== "pending" && (
                                            <div className="d-flex">
                                                <i
                                                    className={`bi bi-circle-fill ${
                                                        selectedLeave.status ===
                                                        "approved"
                                                            ? "text-success"
                                                            : "text-danger"
                                                    } me-3`}
                                                    style={{
                                                        fontSize: "8px",
                                                        marginTop: "6px",
                                                    }}
                                                ></i>
                                                <div className="flex-grow-1">
                                                    <div className="fw-semibold">
                                                        {selectedLeave.status ===
                                                        "approved"
                                                            ? "Disetujui"
                                                            : "Ditolak"}
                                                    </div>
                                                    <small className="text-muted">
                                                        {selectedLeave.updated_at &&
                                                            new Date(
                                                                selectedLeave.updated_at
                                                            ).toLocaleString(
                                                                "id-ID",
                                                                {
                                                                    weekday:
                                                                        "long",
                                                                    day: "numeric",
                                                                    month: "long",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                    </small>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div
                                className="modal-footer"
                                style={{ flexShrink: 0 }}
                            >
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setSelectedLeave(null);
                                    }}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && leaveToDelete && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowDeleteModal(false);
                            setLeaveToDelete(null);
                        }
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div
                                className="modal-header border-0"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%)",
                                }}
                            >
                                <h5 className="modal-title d-flex align-items-center">
                                    <div
                                        className="rounded-circle p-2 me-3"
                                        style={{
                                            backgroundColor:
                                                "rgba(220, 38, 38, 0.1)",
                                        }}
                                    >
                                        <i
                                            className="bi bi-exclamation-triangle-fill fs-4"
                                            style={{ color: "#dc2626" }}
                                        ></i>
                                    </div>
                                    <span
                                        className="fw-bold"
                                        style={{ color: "#dc2626" }}
                                    >
                                        Konfirmasi Hapus
                                    </span>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setLeaveToDelete(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
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
                                        <strong>Perhatian!</strong> Data yang
                                        sudah dihapus tidak dapat dikembalikan.
                                    </div>
                                </div>

                                <p className="mb-3">
                                    Anda yakin ingin menghapus pengajuan izin
                                    berikut?
                                </p>

                                <div className="card border-0 bg-light">
                                    <div className="card-body">
                                        <div className="row g-2 small">
                                            <div className="col-12">
                                                <i className="bi bi-calendar-range text-danger me-2"></i>
                                                <strong>Periode:</strong>
                                                <div className="ms-4">
                                                    {formatDateShort(
                                                        leaveToDelete.start_date
                                                    )}{" "}
                                                    -{" "}
                                                    {formatDateShort(
                                                        leaveToDelete.end_date
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <i className="bi bi-hourglass-split text-warning me-2"></i>
                                                <strong>Durasi:</strong>{" "}
                                                {calculateDays(
                                                    leaveToDelete.start_date,
                                                    leaveToDelete.end_date
                                                )}{" "}
                                                hari
                                            </div>
                                            <div className="col-12">
                                                <i className="bi bi-tag text-info me-2"></i>
                                                <strong>Jenis:</strong>
                                                <span
                                                    className={`badge bg-${getTypeBadge(
                                                        leaveToDelete.type
                                                    )} ms-2`}
                                                >
                                                    {getTypeLabel(
                                                        leaveToDelete.type
                                                    )}
                                                </span>
                                            </div>
                                            <div className="col-12">
                                                <i className="bi bi-chat-left-text text-muted me-2"></i>
                                                <strong>Alasan:</strong>
                                                <div
                                                    className="ms-4 text-truncate"
                                                    style={{
                                                        maxWidth: "350px",
                                                    }}
                                                >
                                                    {leaveToDelete.reason}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setLeaveToDelete(null);
                                    }}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() =>
                                        handleDelete(leaveToDelete.id)
                                    }
                                >
                                    <i className="bi bi-trash me-2"></i>
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leave;
