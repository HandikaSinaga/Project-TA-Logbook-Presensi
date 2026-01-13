import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

const Logbook = () => {
    const [loading, setLoading] = useState(true);
    const [logbooks, setLogbooks] = useState([]);
    const [filteredLogbooks, setFilteredLogbooks] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [todayLogbook, setTodayLogbook] = useState(null); // Track today's logbook

    // Pagination state
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [stats, setStats] = useState({
        approved: 0,
        pending: 0,
        rejected: 0,
        total: 0,
    });
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedLogbook, setSelectedLogbook] = useState(null);
    const [logbookToDelete, setLogbookToDelete] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        activity: "",
        description: "",
    });

    // Filter states
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterDate, setFilterDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        checkTodayAttendance();
        fetchLogbookHistory().finally(() => setLoading(false));
    }, []);

    // Fetch history when page or filters change
    useEffect(() => {
        if (page > 1 || filterStatus !== "all" || filterDate || searchQuery) {
            fetchLogbookHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filterStatus, filterDate, searchQuery]);

    const checkTodayAttendance = async () => {
        try {
            const response = await axiosInstance.get("/user/attendance/today");
            // Backend returns { success: true, data: attendance }
            setTodayAttendance(response.data.data);
        } catch (error) {
            console.error("Error checking attendance:", error);
            setTodayAttendance(null);
        }
    };

    // Helper function to check if logbook exists for today
    const checkTodayLogbook = () => {
        const today = new Date().toISOString().split("T")[0];
        const logbookToday = logbooks.find(
            (log) => new Date(log.date).toISOString().split("T")[0] === today
        );
        setTodayLogbook(logbookToday || null);
        return logbookToday;
    };

    // Check for today's logbook whenever logbooks change
    useEffect(() => {
        if (logbooks.length > 0) {
            checkTodayLogbook();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logbooks]);

    // Auto-scroll modal to top when opened
    useEffect(() => {
        if (showModal) {
            setTimeout(() => {
                const modalBody = document.querySelector(".modal-body");
                if (modalBody) {
                    modalBody.scrollTop = 0;
                }
            }, 100);
        }
    }, [showModal]);

    const fetchLogbookHistory = async () => {
        try {
            setHistoryLoading(true);
            const params = { page, limit: 20 };

            // Apply filters
            if (filterStatus && filterStatus !== "all") {
                params.status = filterStatus;
            }
            if (filterDate) {
                params.date_from = filterDate;
                params.date_to = filterDate;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }

            const response = await axiosInstance.get("/user/logbook", {
                params,
            });
            const data = response.data.data || response.data || [];
            setLogbooks(Array.isArray(data) ? data : []);
            setFilteredLogbooks(Array.isArray(data) ? data : []);
            setPagination(response.data.pagination || null);

            // Calculate stats from pagination total or data length
            const totalRecords =
                response.data.pagination?.total_records || data.length;
            setStats((prev) => ({
                ...prev,
                total: totalRecords,
            }));

            return data;
        } catch (error) {
            console.error("Error fetching logbooks:", error);
            toast.error("Gagal memuat data logbook");
            return [];
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.activity || !formData.description) {
            toast.error("Semua field harus diisi");
            return;
        }

        if (formData.description.length < 20) {
            toast.error(
                "Deskripsi minimal 20 karakter untuk penjelasan yang jelas"
            );
            return;
        }

        if (formData.activity.length < 5) {
            toast.error("Aktivitas minimal 5 karakter");
            return;
        }

        try {
            if (editingId) {
                await axiosInstance.put(`/user/logbook/${editingId}`, formData);
                toast.success("Logbook berhasil diupdate");
            } else {
                await axiosInstance.post("/user/logbook", formData);
                toast.success("Logbook berhasil ditambahkan");
            }

            setShowModal(false);
            setEditingId(null);
            setFormData({
                date: new Date().toISOString().split("T")[0],
                activity: "",
                description: "",
            });
            fetchLogbookHistory();
        } catch (error) {
            console.error("Error saving logbook:", error);
            toast.error(
                error.response?.data?.message || "Gagal menyimpan logbook"
            );
        }
    };

    const handleEdit = (logbook) => {
        setEditingId(logbook.id);
        setFormData({
            date: new Date(logbook.date).toISOString().split("T")[0],
            activity: logbook.activity,
            description: logbook.description,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/user/logbook/${id}`);
            toast.success("Logbook berhasil dihapus", {
                icon: "🗑️",
                duration: 3000,
            });
            fetchLogbookHistory();
            setShowDeleteModal(false);
            setLogbookToDelete(null);
        } catch (error) {
            console.error("Error deleting logbook:", error);
            toast.error("Gagal menghapus logbook");
        }
    };

    const confirmDelete = (logbook) => {
        setLogbookToDelete(logbook);
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

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
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
        <div className="user-logbook p-4">
            {/* Header dengan gradient */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h2 className="mb-1">
                            <i className="bi bi-journal-text me-2"></i>
                            Logbook Harian
                        </h2>
                        <p className="text-muted mb-0">
                            Catat aktivitas harian Anda dengan lengkap dan jelas
                        </p>
                    </div>
                    <button
                        className="btn btn-primary btn-lg shadow-sm"
                        onClick={async () => {
                            // Check if user has checked in today
                            if (
                                !todayAttendance ||
                                !todayAttendance.check_in_time
                            ) {
                                toast.error(
                                    "Anda harus check-in terlebih dahulu sebelum mengisi logbook!",
                                    {
                                        duration: 4000,
                                        icon: "⚠️",
                                    }
                                );
                                return;
                            }

                            // Re-fetch logbook data untuk memastikan data terbaru (mencegah cache lama)
                            const freshLogbooks = await fetchLogbookHistory();

                            // Check if logbook already exists for today
                            const today = new Date()
                                .toISOString()
                                .split("T")[0];
                            const existingLogbook = freshLogbooks.find(
                                (log) =>
                                    new Date(log.date)
                                        .toISOString()
                                        .split("T")[0] === today
                            );

                            if (existingLogbook) {
                                // If logbook is pending, allow edit
                                if (existingLogbook.status === "pending") {
                                    toast.error(
                                        "Anda sudah memiliki logbook untuk hari ini. Silakan edit logbook yang sudah ada.",
                                        {
                                            duration: 4000,
                                            icon: "ℹ️",
                                        }
                                    );
                                    // Auto open edit modal
                                    handleEdit(existingLogbook);
                                } else {
                                    // If already reviewed, cannot add new
                                    toast.error(
                                        `Logbook hari ini sudah ${
                                            existingLogbook.status ===
                                            "approved"
                                                ? "disetujui"
                                                : "direview"
                                        }. Hanya 1 logbook per hari yang diperbolehkan.`,
                                        {
                                            duration: 5000,
                                            icon: "🔒",
                                        }
                                    );
                                }
                                return;
                            }

                            setEditingId(null);
                            setFormData({
                                date: new Date().toISOString().split("T")[0],
                                activity: "",
                                description: "",
                            });
                            setShowModal(true);
                        }}
                        disabled={
                            !todayAttendance || !todayAttendance.check_in_time
                        }
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        {todayLogbook && todayLogbook.status === "pending"
                            ? "Edit Logbook Hari Ini"
                            : "Tambah Logbook"}
                    </button>
                </div>
            </div>

            {/* Check-in warning banner */}
            {(!todayAttendance || !todayAttendance.check_in_time) && (
                <div
                    className="alert alert-warning border-0 shadow-sm mb-4"
                    role="alert"
                >
                    <div className="d-flex align-items-start">
                        <div className="flex-shrink-0">
                            <i className="bi bi-exclamation-triangle-fill fs-2 me-3"></i>
                        </div>
                        <div className="flex-grow-1">
                            <h5 className="alert-heading mb-2">
                                <strong>Check-in Diperlukan!</strong>
                            </h5>
                            <p className="mb-2">
                                Anda belum melakukan check-in hari ini. Logbook
                                hanya dapat diisi setelah Anda melakukan
                                check-in.
                            </p>
                            <hr />
                            <p className="mb-0 small">
                                <i className="bi bi-lightbulb me-1"></i>
                                Silakan kunjungi menu{" "}
                                <strong>Attendance</strong> untuk melakukan
                                check-in terlebih dahulu.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Today's logbook info banner */}
            {todayLogbook && (
                <div
                    className={`alert border-0 shadow-sm mb-4 ${
                        todayLogbook.status === "pending"
                            ? "alert-info"
                            : todayLogbook.status === "approved"
                            ? "alert-success"
                            : "alert-danger"
                    }`}
                    role="alert"
                >
                    <div className="d-flex align-items-start">
                        <div className="flex-shrink-0">
                            <i
                                className={`bi ${
                                    todayLogbook.status === "pending"
                                        ? "bi-info-circle-fill"
                                        : todayLogbook.status === "approved"
                                        ? "bi-check-circle-fill"
                                        : "bi-x-circle-fill"
                                } fs-2 me-3`}
                            ></i>
                        </div>
                        <div className="flex-grow-1">
                            <h5 className="alert-heading mb-2">
                                <strong>
                                    {todayLogbook.status === "pending"
                                        ? "Logbook Hari Ini (Pending)"
                                        : todayLogbook.status === "approved"
                                        ? "Logbook Hari Ini (Disetujui)"
                                        : "Logbook Hari Ini (Ditolak)"}
                                </strong>
                            </h5>
                            <p className="mb-2">
                                <strong>Aktivitas:</strong>{" "}
                                {todayLogbook.activity}
                            </p>
                            {todayLogbook.status === "pending" && (
                                <>
                                    <hr />
                                    <p className="mb-0 small">
                                        <i className="bi bi-pencil me-1"></i>
                                        Anda dapat mengedit logbook ini sampai
                                        direview oleh supervisor. Hanya{" "}
                                        <strong>1 logbook per hari</strong> yang
                                        diperbolehkan.
                                    </p>
                                </>
                            )}
                            {todayLogbook.status !== "pending" && (
                                <>
                                    <hr />
                                    <p className="mb-0 small">
                                        <i className="bi bi-lock-fill me-1"></i>
                                        Logbook ini sudah direview dan tidak
                                        dapat diubah. Anda tidak dapat menambah
                                        logbook baru untuk hari ini.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats dengan gradient cards - Subtle & Elegant */}
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
                                        Total Logbook
                                    </p>
                                    <h2 className="mb-0 fw-bold text-primary">
                                        {stats.total}
                                    </h2>
                                </div>
                                <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                    <i className="bi bi-journal-text text-primary fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-2 small text-muted">
                                <i className="bi bi-calendar-check me-1"></i>
                                Semua aktivitas
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
                                        Approved
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
                                Disetujui supervisor
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
                                Menunggu review
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
                                    "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <p className="mb-1 text-muted small">
                                        Rejected
                                    </p>
                                    <h2 className="mb-0 fw-bold text-danger">
                                        {stats.rejected}
                                    </h2>
                                </div>
                                <div className="bg-danger bg-opacity-10 rounded-circle p-2">
                                    <i className="bi bi-x-circle-fill text-danger fs-4"></i>
                                </div>
                            </div>
                            <div className="mt-2 small text-muted">
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Perlu diperbaiki
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Section with better UX */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-bottom py-3">
                    <h6 className="mb-0">
                        <i className="bi bi-funnel me-2"></i>
                        Filter & Pencarian
                    </h6>
                </div>
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label fw-semibold mb-2">
                                <i className="bi bi-flag me-2"></i>Status
                            </label>
                            <select
                                className="form-select form-select-lg"
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="all">📋 Semua Status</option>
                                <option value="pending">⏳ Pending</option>
                                <option value="approved">✅ Approved</option>
                                <option value="rejected">❌ Rejected</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold mb-2">
                                <i className="bi bi-calendar-event me-2"></i>
                                Tanggal
                            </label>
                            <input
                                type="date"
                                className="form-control form-control-lg"
                                value={filterDate}
                                onChange={(e) => {
                                    setFilterDate(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold mb-2">
                                <i className="bi bi-search me-2"></i>Cari
                                Aktivitas
                            </label>
                            <input
                                type="text"
                                className="form-control form-control-lg"
                                placeholder="Cari aktivitas atau deskripsi..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="col-md-2">
                            <button
                                className="btn btn-outline-secondary btn-lg w-100"
                                onClick={() => {
                                    setFilterStatus("all");
                                    setFilterDate("");
                                    setSearchQuery("");
                                    setPage(1);
                                    toast.success("Filter berhasil direset", {
                                        icon: "🔄",
                                        duration: 2000,
                                    });
                                }}
                            >
                                <i className="bi bi-arrow-counterclockwise me-2"></i>
                                Reset
                            </button>
                        </div>
                    </div>
                    {(filterStatus !== "all" || filterDate || searchQuery) && (
                        <div className="mt-3 d-flex align-items-center justify-content-between">
                            <span className="badge bg-primary fs-6 px-3 py-2">
                                <i className="bi bi-funnel-fill me-1"></i>
                                Menampilkan {filteredLogbooks.length} dari{" "}
                                {logbooks.length} logbook
                            </span>
                            <small className="text-muted">
                                <i className="bi bi-info-circle me-1"></i>
                                Filter aktif
                            </small>
                        </div>
                    )}
                </div>
            </div>

            {/* Logbook List */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom py-3">
                    <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        Daftar Logbook
                    </h5>
                </div>
                <div className="card-body p-0">
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
                                Memuat riwayat logbook...
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th
                                                className="px-4"
                                                style={{ minWidth: "180px" }}
                                            >
                                                <i className="bi bi-calendar-event me-2"></i>
                                                Tanggal
                                            </th>
                                            <th style={{ minWidth: "200px" }}>
                                                <i className="bi bi-briefcase me-2"></i>
                                                Aktivitas
                                            </th>
                                            <th style={{ minWidth: "250px" }}>
                                                <i className="bi bi-text-paragraph me-2"></i>
                                                Deskripsi
                                            </th>
                                            <th
                                                className="text-center"
                                                style={{ minWidth: "120px" }}
                                            >
                                                <i className="bi bi-flag me-2"></i>
                                                Status
                                            </th>
                                            <th style={{ minWidth: "200px" }}>
                                                <i className="bi bi-chat-square-text me-2"></i>
                                                Review
                                            </th>
                                            <th
                                                className="text-center"
                                                style={{ minWidth: "150px" }}
                                            >
                                                <i className="bi bi-gear me-2"></i>
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogbooks.length > 0 ? (
                                            filteredLogbooks.map((logbook) => (
                                                <tr key={logbook.id}>
                                                    <td className="px-4">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-primary bg-opacity-10 rounded p-2 me-2">
                                                                <i className="bi bi-calendar3 text-primary"></i>
                                                            </div>
                                                            <div>
                                                                <div className="fw-semibold">
                                                                    {new Date(
                                                                        logbook.date
                                                                    ).toLocaleDateString(
                                                                        "id-ID",
                                                                        {
                                                                            day: "numeric",
                                                                            month: "short",
                                                                            year: "numeric",
                                                                        }
                                                                    )}
                                                                </div>
                                                                <small className="text-muted">
                                                                    {new Date(
                                                                        logbook.date
                                                                    ).toLocaleDateString(
                                                                        "id-ID",
                                                                        {
                                                                            weekday:
                                                                                "long",
                                                                        }
                                                                    )}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold text-dark">
                                                            {logbook.activity}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div
                                                            className="text-muted small"
                                                            style={{
                                                                maxWidth:
                                                                    "250px",
                                                                overflow:
                                                                    "hidden",
                                                                textOverflow:
                                                                    "ellipsis",
                                                                display:
                                                                    "-webkit-box",
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient:
                                                                    "vertical",
                                                            }}
                                                        >
                                                            {
                                                                logbook.description
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <span
                                                            className={`badge bg-${getStatusBadge(
                                                                logbook.status
                                                            )} px-3 py-2`}
                                                        >
                                                            <i
                                                                className={`bi ${
                                                                    logbook.status ===
                                                                    "approved"
                                                                        ? "bi-check-circle-fill"
                                                                        : logbook.status ===
                                                                          "rejected"
                                                                        ? "bi-x-circle-fill"
                                                                        : "bi-clock-fill"
                                                                } me-1`}
                                                            ></i>
                                                            {logbook.status ===
                                                            "approved"
                                                                ? "Disetujui"
                                                                : logbook.status ===
                                                                  "rejected"
                                                                ? "Ditolak"
                                                                : "Pending"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {logbook.review_notes ? (
                                                            <div>
                                                                <div
                                                                    className="text-muted small"
                                                                    style={{
                                                                        maxWidth:
                                                                            "200px",
                                                                        overflow:
                                                                            "hidden",
                                                                        textOverflow:
                                                                            "ellipsis",
                                                                        whiteSpace:
                                                                            "nowrap",
                                                                    }}
                                                                >
                                                                    {
                                                                        logbook.review_notes
                                                                    }
                                                                </div>
                                                                {logbook.reviewed_at && (
                                                                    <small className="text-muted">
                                                                        <i className="bi bi-clock-history me-1"></i>
                                                                        {new Date(
                                                                            logbook.reviewed_at
                                                                        ).toLocaleDateString(
                                                                            "id-ID",
                                                                            {
                                                                                day: "numeric",
                                                                                month: "short",
                                                                                hour: "2-digit",
                                                                                minute: "2-digit",
                                                                            }
                                                                        )}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted small">
                                                                <i className="bi bi-dash-circle me-1"></i>
                                                                Belum direview
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                className="btn btn-outline-info"
                                                                onClick={() => {
                                                                    setSelectedLogbook(
                                                                        logbook
                                                                    );
                                                                    setShowDetailModal(
                                                                        true
                                                                    );
                                                                }}
                                                                title="Lihat Detail"
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                            {logbook.status ===
                                                                "pending" && (
                                                                <>
                                                                    <button
                                                                        className="btn btn-outline-primary"
                                                                        onClick={() =>
                                                                            handleEdit(
                                                                                logbook
                                                                            )
                                                                        }
                                                                        title="Edit"
                                                                    >
                                                                        <i className="bi bi-pencil"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-outline-danger"
                                                                        onClick={() =>
                                                                            confirmDelete(
                                                                                logbook
                                                                            )
                                                                        }
                                                                        title="Hapus"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="6"
                                                    className="text-center py-5"
                                                >
                                                    <div className="text-muted">
                                                        <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                                                        <p className="mb-0">
                                                            {filterStatus !==
                                                                "all" ||
                                                            filterDate ||
                                                            searchQuery
                                                                ? "Tidak ada logbook yang sesuai dengan filter"
                                                                : "Belum ada logbook. Mulai catat aktivitas Anda hari ini!"}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {!historyLoading &&
                                pagination &&
                                pagination.total_pages > 1 && (
                                    <div className="d-flex justify-content-between align-items-center mt-4 px-4 pb-4 pt-3 border-top">
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

            {/* Add/Edit Modal - Fixed Scrollable */}
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
                            setEditingId(null);
                        }
                    }}
                >
                    <div
                        className="modal-dialog modal-lg modal-dialog-scrollable"
                        style={{ margin: "1.75rem auto" }}
                    >
                        <div
                            className="modal-content border-0 shadow-lg"
                            style={{ maxHeight: "calc(100vh - 3.5rem)" }}
                        >
                            <div
                                className="modal-header border-0 flex-shrink-0"
                                style={{
                                    background: editingId
                                        ? "linear-gradient(135deg, #fef3c7 0%, #fefce8 100%)"
                                        : "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)",
                                }}
                            >
                                <h5 className="modal-title d-flex align-items-center">
                                    <div
                                        className={`${
                                            editingId
                                                ? "bg-warning"
                                                : "bg-primary"
                                        } bg-opacity-10 rounded-circle p-2 me-3`}
                                    >
                                        <i
                                            className={`bi ${
                                                editingId
                                                    ? "bi-pencil-square"
                                                    : "bi-plus-circle"
                                            } ${
                                                editingId
                                                    ? "text-warning"
                                                    : "text-primary"
                                            } fs-4`}
                                        ></i>
                                    </div>
                                    <div>
                                        <div
                                            className={`fw-bold ${
                                                editingId
                                                    ? "text-warning"
                                                    : "text-primary"
                                            }`}
                                        >
                                            {editingId
                                                ? "Edit Logbook"
                                                : "Tambah Logbook Baru"}
                                        </div>
                                        <small
                                            className="text-muted"
                                            style={{ fontSize: "0.85rem" }}
                                        >
                                            {editingId
                                                ? "Perbarui informasi aktivitas Anda"
                                                : "Catat aktivitas harian Anda dengan lengkap"}
                                        </small>
                                    </div>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingId(null);
                                    }}
                                ></button>
                            </div>
                            <form
                                onSubmit={handleSubmit}
                                className="d-flex flex-column"
                                style={{ minHeight: 0 }}
                            >
                                <div
                                    className="modal-body p-4"
                                    style={{ overflowY: "auto" }}
                                >
                                    <div className="alert alert-info border-0 shadow-sm d-flex align-items-start mb-4">
                                        <div className="bg-info bg-opacity-25 rounded-circle p-2 me-3">
                                            <i className="bi bi-lightbulb-fill text-info fs-5"></i>
                                        </div>
                                        <div>
                                            <h6 className="alert-heading mb-2">
                                                <strong>
                                                    Tips Pengisian Logbook
                                                </strong>
                                            </h6>
                                            <ul className="mb-0 small ps-3">
                                                <li>
                                                    Pastikan aktivitas dan
                                                    deskripsi diisi dengan{" "}
                                                    <strong>
                                                        lengkap dan jelas
                                                    </strong>
                                                </li>
                                                <li>
                                                    Jelaskan{" "}
                                                    <strong>
                                                        apa yang dikerjakan
                                                    </strong>
                                                    ,{" "}
                                                    <strong>
                                                        hasil yang dicapai
                                                    </strong>
                                                    , dan{" "}
                                                    <strong>kendala</strong>{" "}
                                                    yang dihadapi
                                                </li>
                                                <li>
                                                    Gunakan bahasa yang{" "}
                                                    <strong>profesional</strong>{" "}
                                                    dan mudah dipahami
                                                </li>
                                                <li>
                                                    Logbook akan direview oleh
                                                    supervisor Anda
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold">
                                            <i className="bi bi-calendar-event me-2"></i>
                                            Tanggal{" "}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="date"
                                            className="form-control form-control-lg"
                                            value={formData.date}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    date: e.target.value,
                                                })
                                            }
                                            disabled={editingId ? true : false}
                                            required
                                        />
                                        {editingId && (
                                            <div className="form-text text-warning">
                                                <i className="bi bi-lock-fill me-1"></i>
                                                Tanggal tidak dapat diubah saat
                                                edit. Hanya 1 logbook per
                                                tanggal.
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold">
                                            <i className="bi bi-briefcase me-2"></i>
                                            Aktivitas{" "}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            placeholder="Contoh: Meeting dengan klien, Development fitur baru..."
                                            value={formData.activity}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    activity: e.target.value,
                                                })
                                            }
                                            required
                                            maxLength={255}
                                        />
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            <div className="form-text">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Tuliskan judul aktivitas yang
                                                singkat dan jelas (minimal 5
                                                karakter)
                                            </div>
                                            <div
                                                className={`small fw-semibold ${
                                                    formData.activity.length < 5
                                                        ? "text-danger"
                                                        : formData.activity
                                                              .length > 230
                                                        ? "text-warning"
                                                        : "text-success"
                                                }`}
                                            >
                                                {formData.activity.length} / 255
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold">
                                            <i className="bi bi-text-paragraph me-2"></i>
                                            Deskripsi Detail{" "}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            className="form-control form-control-lg"
                                            rows="6"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="Jelaskan aktivitas secara detail:&#10;&#10;• Apa yang dikerjakan?&#10;• Hasil yang dicapai?&#10;• Kendala yang dihadapi?&#10;• Solusi yang diterapkan?&#10;&#10;Contoh: Melakukan meeting dengan klien untuk membahas requirements proyek baru. Hasil meeting adalah persetujuan fitur utama dan timeline pengerjaan 3 bulan. Kendala: klien meminta perubahan UI yang cukup signifikan..."
                                            required
                                            maxLength={2000}
                                            style={{
                                                resize: "vertical",
                                                minHeight: "150px",
                                            }}
                                        ></textarea>
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            <div className="form-text">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Minimal 20 karakter untuk
                                                deskripsi yang baik
                                            </div>
                                            <div
                                                className={`small fw-semibold ${
                                                    formData.description
                                                        .length < 20
                                                        ? "text-danger"
                                                        : formData.description
                                                              .length > 1800
                                                        ? "text-warning"
                                                        : "text-success"
                                                }`}
                                            >
                                                {formData.description.length} /
                                                2000
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-0 flex-shrink-0">
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-lg"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingId(null);
                                        }}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className={`btn btn-lg ${
                                            editingId
                                                ? "btn-warning"
                                                : "btn-primary"
                                        }`}
                                        disabled={
                                            !formData.activity ||
                                            !formData.description ||
                                            formData.activity.length < 5 ||
                                            formData.description.length < 20
                                        }
                                    >
                                        <i
                                            className={`bi ${
                                                editingId
                                                    ? "bi-arrow-repeat"
                                                    : "bi-save"
                                            } me-2`}
                                        ></i>
                                        {editingId
                                            ? "Update Logbook"
                                            : "Simpan Logbook"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal - Enhanced & Scrollable */}
            {showDetailModal && selectedLogbook && (
                <div
                    className="modal show d-block"
                    style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                        overflow: "auto",
                    }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowDetailModal(false);
                            setSelectedLogbook(null);
                        }
                    }}
                >
                    <div
                        className="modal-dialog modal-lg modal-dialog-scrollable"
                        style={{ margin: "1.75rem auto" }}
                    >
                        <div
                            className="modal-content border-0 shadow-lg"
                            style={{ maxHeight: "calc(100vh - 3.5rem)" }}
                        >
                            {/* Header dengan gradient subtle berdasarkan status */}
                            <div
                                className="modal-header border-0 flex-shrink-0"
                                style={{
                                    background:
                                        selectedLogbook.status === "approved"
                                            ? "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)"
                                            : selectedLogbook.status ===
                                              "rejected"
                                            ? "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)"
                                            : "linear-gradient(135deg, #fef3c7 0%, #fefce8 100%)",
                                }}
                            >
                                <h5 className="modal-title d-flex align-items-center">
                                    <i
                                        className={`bi bi-journal-bookmark-fill me-2 fs-4 ${
                                            selectedLogbook.status ===
                                            "approved"
                                                ? "text-success"
                                                : selectedLogbook.status ===
                                                  "rejected"
                                                ? "text-danger"
                                                : "text-warning"
                                        }`}
                                    ></i>
                                    <div>
                                        <div
                                            className={`fw-bold ${
                                                selectedLogbook.status ===
                                                "approved"
                                                    ? "text-success"
                                                    : selectedLogbook.status ===
                                                      "rejected"
                                                    ? "text-danger"
                                                    : "text-warning"
                                            }`}
                                        >
                                            Detail Logbook
                                        </div>
                                        <small
                                            className="text-muted"
                                            style={{ fontSize: "0.8rem" }}
                                        >
                                            ID: #{selectedLogbook.id}
                                        </small>
                                    </div>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setSelectedLogbook(null);
                                    }}
                                ></button>
                            </div>

                            <div
                                className="modal-body p-4"
                                style={{ overflowY: "auto" }}
                            >
                                {/* Status Badge Large */}
                                <div className="text-center mb-4">
                                    <span
                                        className={`badge bg-${getStatusBadge(
                                            selectedLogbook.status
                                        )} px-4 py-3 fs-6`}
                                        style={{ borderRadius: "50px" }}
                                    >
                                        <i
                                            className={`bi ${
                                                selectedLogbook.status ===
                                                "approved"
                                                    ? "bi-check-circle-fill"
                                                    : selectedLogbook.status ===
                                                      "rejected"
                                                    ? "bi-x-circle-fill"
                                                    : "bi-clock-fill"
                                            } me-2`}
                                        ></i>
                                        {selectedLogbook.status === "approved"
                                            ? "DISETUJUI"
                                            : selectedLogbook.status ===
                                              "rejected"
                                            ? "DITOLAK"
                                            : "MENUNGGU REVIEW"}
                                    </span>
                                </div>

                                {/* Info Cards - Subtle Gradient */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div
                                            className="card border-0 shadow-sm h-100"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)",
                                            }}
                                        >
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                                                        <i className="bi bi-calendar-event text-primary fs-4"></i>
                                                    </div>
                                                    <div>
                                                        <small className="text-muted d-block mb-1">
                                                            Tanggal Aktivitas
                                                        </small>
                                                        <strong className="fs-6 text-dark">
                                                            {formatDate(
                                                                selectedLogbook.date
                                                            )}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div
                                            className="card border-0 shadow-sm h-100"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)",
                                            }}
                                        >
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                                                        <i className="bi bi-clock-history text-info fs-4"></i>
                                                    </div>
                                                    <div>
                                                        <small className="text-muted d-block mb-1">
                                                            Dibuat Pada
                                                        </small>
                                                        <strong className="fs-6 text-dark">
                                                            {new Date(
                                                                selectedLogbook.created_at
                                                            ).toLocaleString(
                                                                "id-ID",
                                                                {
                                                                    day: "numeric",
                                                                    month: "long",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Section */}
                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-primary rounded-circle p-2 me-2">
                                            <i className="bi bi-briefcase-fill text-white"></i>
                                        </div>
                                        <h6 className="mb-0 text-uppercase text-muted fw-semibold">
                                            Aktivitas
                                        </h6>
                                    </div>
                                    <div className="card border-0 shadow-sm">
                                        <div className="card-body bg-light">
                                            <p className="mb-0 fs-5 fw-semibold text-dark">
                                                {selectedLogbook.activity}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description Section */}
                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-info rounded-circle p-2 me-2">
                                            <i className="bi bi-text-paragraph text-white"></i>
                                        </div>
                                        <h6 className="mb-0 text-uppercase text-muted fw-semibold">
                                            Deskripsi Detail
                                        </h6>
                                    </div>
                                    <div className="card border-0 shadow-sm">
                                        <div
                                            className="card-body bg-light"
                                            style={{ minHeight: "120px" }}
                                        >
                                            <p
                                                className="mb-0"
                                                style={{
                                                    whiteSpace: "pre-wrap",
                                                    lineHeight: "1.8",
                                                }}
                                            >
                                                {selectedLogbook.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Section - Enhanced */}
                                {(selectedLogbook.review_notes ||
                                    selectedLogbook.status !== "pending") && (
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center mb-3">
                                            <div
                                                className={`rounded-circle p-2 me-2 ${
                                                    selectedLogbook.status ===
                                                    "approved"
                                                        ? "bg-success"
                                                        : "bg-danger"
                                                }`}
                                            >
                                                <i
                                                    className={`bi ${
                                                        selectedLogbook.status ===
                                                        "approved"
                                                            ? "bi-hand-thumbs-up-fill"
                                                            : "bi-hand-thumbs-down-fill"
                                                    } text-white`}
                                                ></i>
                                            </div>
                                            <h6 className="mb-0 text-uppercase text-muted fw-semibold">
                                                Review Supervisor
                                            </h6>
                                        </div>
                                        <div
                                            className={`card border-2 shadow-sm ${
                                                selectedLogbook.status ===
                                                "approved"
                                                    ? "border-success"
                                                    : selectedLogbook.status ===
                                                      "rejected"
                                                    ? "border-danger"
                                                    : "border-warning"
                                            }`}
                                        >
                                            <div
                                                className={`card-body ${
                                                    selectedLogbook.status ===
                                                    "approved"
                                                        ? "bg-success bg-opacity-10"
                                                        : selectedLogbook.status ===
                                                          "rejected"
                                                        ? "bg-danger bg-opacity-10"
                                                        : "bg-warning bg-opacity-10"
                                                }`}
                                            >
                                                {selectedLogbook.review_notes ? (
                                                    <>
                                                        {/* Review Status Icon */}
                                                        <div className="d-flex align-items-start mb-3">
                                                            <div
                                                                className={`flex-shrink-0 rounded-circle p-3 me-3 ${
                                                                    selectedLogbook.status ===
                                                                    "approved"
                                                                        ? "bg-success text-white"
                                                                        : "bg-danger text-white"
                                                                }`}
                                                            >
                                                                <i
                                                                    className={`bi ${
                                                                        selectedLogbook.status ===
                                                                        "approved"
                                                                            ? "bi-check-circle-fill fs-3"
                                                                            : "bi-x-circle-fill fs-3"
                                                                    }`}
                                                                ></i>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h5
                                                                    className={`mb-2 ${
                                                                        selectedLogbook.status ===
                                                                        "approved"
                                                                            ? "text-success"
                                                                            : "text-danger"
                                                                    }`}
                                                                >
                                                                    {selectedLogbook.status ===
                                                                    "approved"
                                                                        ? "✓ Logbook Disetujui"
                                                                        : "✗ Logbook Ditolak"}
                                                                </h5>
                                                                <p
                                                                    className="mb-0 text-dark"
                                                                    style={{
                                                                        whiteSpace:
                                                                            "pre-wrap",
                                                                        lineHeight:
                                                                            "1.8",
                                                                        fontSize:
                                                                            "1rem",
                                                                    }}
                                                                >
                                                                    {
                                                                        selectedLogbook.review_notes
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Review Metadata */}
                                                        <div className="border-top pt-3 mt-3">
                                                            <div className="row g-3">
                                                                {selectedLogbook.reviewed_at && (
                                                                    <div className="col-md-6">
                                                                        <div className="d-flex align-items-center">
                                                                            <i className="bi bi-calendar-check me-2 text-muted"></i>
                                                                            <div>
                                                                                <small className="text-muted d-block">
                                                                                    Direview
                                                                                    pada
                                                                                </small>
                                                                                <strong className="small">
                                                                                    {new Date(
                                                                                        selectedLogbook.reviewed_at
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
                                                                                </strong>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {selectedLogbook.reviewed_by && (
                                                                    <div className="col-md-6">
                                                                        <div className="d-flex align-items-center">
                                                                            <i className="bi bi-person-check me-2 text-muted"></i>
                                                                            <div>
                                                                                <small className="text-muted d-block">
                                                                                    Direview
                                                                                    oleh
                                                                                </small>
                                                                                <strong className="small">
                                                                                    Supervisor
                                                                                    (ID:{" "}
                                                                                    {
                                                                                        selectedLogbook.reviewed_by
                                                                                    }

                                                                                    )
                                                                                </strong>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action Suggestion for Rejected */}
                                                        {selectedLogbook.status ===
                                                            "rejected" && (
                                                            <div className="alert alert-warning mt-3 mb-0">
                                                                <div className="d-flex align-items-start">
                                                                    <i className="bi bi-lightbulb-fill fs-5 me-2"></i>
                                                                    <div>
                                                                        <strong>
                                                                            Saran:
                                                                        </strong>{" "}
                                                                        Perbaiki
                                                                        logbook
                                                                        Anda
                                                                        berdasarkan
                                                                        feedback
                                                                        di atas,
                                                                        kemudian
                                                                        buat
                                                                        logbook
                                                                        baru
                                                                        dengan
                                                                        informasi
                                                                        yang
                                                                        lebih
                                                                        lengkap
                                                                        dan
                                                                        akurat.
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-center py-3">
                                                        <i className="bi bi-hourglass-split fs-3 text-muted d-block mb-2"></i>
                                                        <p className="mb-0 text-muted">
                                                            Menunggu review dari
                                                            supervisor
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Timeline Info */}
                                <div className="card border-0 bg-light">
                                    <div className="card-body">
                                        <h6 className="text-muted mb-3">
                                            <i className="bi bi-clock-history me-2"></i>
                                            Timeline
                                        </h6>
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                            <div>
                                                <small className="text-muted d-block">
                                                    Dibuat
                                                </small>
                                                <strong className="small">
                                                    {new Date(
                                                        selectedLogbook.created_at
                                                    ).toLocaleString("id-ID")}
                                                </strong>
                                            </div>
                                            {selectedLogbook.updated_at &&
                                                selectedLogbook.updated_at !==
                                                    selectedLogbook.created_at && (
                                                    <div>
                                                        <small className="text-muted d-block">
                                                            Diupdate
                                                        </small>
                                                        <strong className="small">
                                                            {new Date(
                                                                selectedLogbook.updated_at
                                                            ).toLocaleString(
                                                                "id-ID"
                                                            )}
                                                        </strong>
                                                    </div>
                                                )}
                                            {selectedLogbook.reviewed_at && (
                                                <div>
                                                    <small className="text-muted d-block">
                                                        Direview
                                                    </small>
                                                    <strong className="small">
                                                        {new Date(
                                                            selectedLogbook.reviewed_at
                                                        ).toLocaleString(
                                                            "id-ID"
                                                        )}
                                                    </strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer bg-light border-0 flex-shrink-0">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setSelectedLogbook(null);
                                    }}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Tutup
                                </button>
                                {selectedLogbook.status === "pending" && (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            handleEdit(selectedLogbook);
                                        }}
                                    >
                                        <i className="bi bi-pencil me-2"></i>
                                        Edit Logbook
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && logbookToDelete && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowDeleteModal(false);
                            setLogbookToDelete(null);
                        }
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div
                                className="modal-header border-0"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
                                }}
                            >
                                <h5 className="modal-title d-flex align-items-center text-danger">
                                    <div className="bg-danger bg-opacity-10 rounded-circle p-2 me-3">
                                        <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                                    </div>
                                    <span className="fw-bold">
                                        Konfirmasi Hapus
                                    </span>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setLogbookToDelete(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="alert alert-warning border-0 shadow-sm mb-3">
                                    <div className="d-flex align-items-start">
                                        <i className="bi bi-info-circle-fill fs-5 me-3 text-warning"></i>
                                        <div>
                                            <strong>Perhatian!</strong> Data
                                            yang sudah dihapus tidak dapat
                                            dikembalikan.
                                        </div>
                                    </div>
                                </div>
                                <p className="mb-3">
                                    Apakah Anda yakin ingin menghapus logbook
                                    ini?
                                </p>
                                <div className="card border-0 bg-light">
                                    <div className="card-body">
                                        <div className="mb-2">
                                            <small className="text-muted">
                                                Tanggal:
                                            </small>
                                            <div className="fw-semibold">
                                                {new Date(
                                                    logbookToDelete.date
                                                ).toLocaleDateString("id-ID", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <small className="text-muted">
                                                Aktivitas:
                                            </small>
                                            <div className="fw-semibold">
                                                {logbookToDelete.activity}
                                            </div>
                                        </div>
                                        <div>
                                            <small className="text-muted">
                                                Deskripsi:
                                            </small>
                                            <div
                                                className="text-muted small"
                                                style={{
                                                    maxHeight: "60px",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {logbookToDelete.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-0">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setLogbookToDelete(null);
                                    }}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() =>
                                        handleDelete(logbookToDelete.id)
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

export default Logbook;
