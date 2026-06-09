import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl, getImageUrl } from "../../utils/Constant";
import toast from "react-hot-toast";
import { Modal, Button, Badge, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import LeaveDetailModal from "../../components/LeaveDetailModal";
import AdvancedFilters from "../../components/common/AdvancedFilters";

const SupervisorLeave = () => {
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [users, setUsers] = useState([]);

    // Enhanced Filters
    const [filters, setFilters] = useState({
        status: "all",
        type: "all",
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
        sick: 0,
        permission: 0,
    });



    useEffect(() => {
        fetchUsers();
        fetchLeaves();
    }, [
        filters.status,
        filters.type,
        filters.date_from,
        filters.date_to,
        filters.date_to,
        filters.periode,
        filters.sumber_magang,
        selectedUserIds,
        page,
    ]);

    const fetchUsers = async () => {
        try {
            const response = await axiosInstance.get("/supervisor/division/members");
            const data = response.data.data || [];
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching division members:", error);
        }
    };

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
            if (filters.periode) {
                params.periode = filters.periode;
            }
            if (filters.sumber_magang) {
                params.sumber_magang = filters.sumber_magang;
            }
            if (selectedUserIds.length > 0) {
                params.user_ids = selectedUserIds.join(",");
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
                    (l) => l.type === "sick" || l.type === "izin_sakit",
                ).length,
                permission: leavesArray.filter(
                    (l) =>
                        l.type === "permission" ||
                        l.type === "izin_keperluan" ||
                        l.type === "izin",
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
                error.response?.data?.message || "Gagal menyetujui izin",
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
                { rejection_reason: rejectionReason.trim() },
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

    const uniquePeriodes = [...new Set(users.map((u) => u.periode).filter(Boolean))].sort();

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
                        <div className="col-md-6">
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
                                            e.target.value,
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
                                            e.target.value,
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
                                                leave.type,
                                            );
                                            const statusBadge = getStatusBadge(
                                                leave.status,
                                            );
                                            const duration = calculateDuration(
                                                leave.start_date,
                                                leave.end_date,
                                            );

                                            return (
                                                <tr key={leave.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={getAvatarUrl(
                                                                    leave.user,
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
                                                                    e,
                                                                ) => {
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                        leave
                                                                            .user
                                                                            ?.name ||
                                                                            "User",
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
                                                                    leave.start_date,
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    },
                                                                )}
                                                            </small>
                                                            <small className="text-muted">
                                                                <i className="bi bi-arrow-down me-1"></i>
                                                                {new Date(
                                                                    leave.end_date,
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                    {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    },
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
                                                                leave.created_at,
                                                            ).toLocaleDateString(
                                                                "id-ID",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                },
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
                                                                        leave,
                                                                    );
                                                                    setShowDetailModal(
                                                                        true,
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
                                                                                leave.id,
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
                                                                                leave,
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
                                            pagination.total_records,
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
                                                        pagination.total_pages,
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
                                                                        pageNum,
                                                                    )
                                                                }
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        </li>
                                                    );
                                                },
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

            {/* Detail Modal – shared component */}
            <LeaveDetailModal
                show={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                leave={selectedLeave}
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
