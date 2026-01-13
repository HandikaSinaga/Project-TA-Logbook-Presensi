import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import {
    Card,
    Row,
    Col,
    Form,
    Button,
    Badge,
    Spinner,
    Modal,
    Pagination,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap";
import { getAvatarUrl } from "../../utils/Constant";
import { getJakartaDate } from "../../utils/dateUtils";

const AdminLeave = () => {
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [users, setUsers] = useState([]);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [filters, setFilters] = useState({
        start_date: getJakartaDate(),
        end_date: getJakartaDate(),
        division_id: "",
        leave_type: "",
        periode: "",
        sumber_magang: "",
        status: "",
        search: "",
    });
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
    });
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== filters.search) {
                setFilters((prev) => ({ ...prev, search: searchTerm }));
                setPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchDivisions();
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchLeaves();
    }, [
        filters.start_date,
        filters.end_date,
        filters.division_id,
        filters.status,
        filters.search,
        page,
    ]);

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

    const fetchLeaves = async () => {
        try {
            setLoading(true);

            const params = {
                page,
                limit: 20,
            };

            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;
            if (filters.division_id) params.division_id = filters.division_id;
            if (filters.status) params.status = filters.status;
            if (filters.leave_type) params.type = filters.leave_type;
            if (filters.search && filters.search.trim() !== "") {
                params.search = filters.search.trim();
            }

            console.log("[Leave] Fetching with filters:", filters);
            console.log("[Leave] Query params:", params);

            const response = await axiosInstance.get("/admin/izin", {
                params,
            });
            const data = response.data.data || [];

            console.log("[Leave] Received", data.length, "records");
            console.log("[Leave] First 3 records:", data.slice(0, 3));

            setLeaves(data);
            setPagination(response.data.pagination);
            calculateStats(
                response.data.pagination?.total_records || data.length
            );
        } catch (error) {
            console.error("Fetch leave error:", error);
            toast.error(
                error.response?.data?.message || "Gagal memuat data perizinan"
            );
            setLeaves([]);
            setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (totalRecords) => {
        const data = leaves;
        const stats = {
            total: totalRecords || data.length,
            pending: data.filter((l) => l.status === "pending").length,
            approved: data.filter((l) => l.status === "approved").length,
            rejected: data.filter((l) => l.status === "rejected").length,
        };
        setStats(stats);
    };

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        if (field !== "search") {
            setPage(1);
        }
    };

    const handleResetFilters = () => {
        const today = getJakartaDate();
        setFilters({
            start_date: today,
            end_date: today,
            division_id: "",
            leave_type: "",
            periode: "",
            sumber_magang: "",
            status: "",
            search: "",
        });
        setSearchTerm("");
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
        setPage(1);
    };

    const handleViewDetail = (leave) => {
        setSelectedLeave(leave);
        setShowDetailModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: "warning",
            approved: "success",
            rejected: "danger",
        };
        return badges[status] || "secondary";
    };

    const getStatusText = (status) => {
        const texts = {
            pending: "Menunggu",
            approved: "Disetujui",
            rejected: "Ditolak",
        };
        return texts[status] || status;
    };

    const getLeaveTypeBadge = (type) => {
        const badges = {
            sakit: "danger",
            izin: "warning",
            cuti_tahunan: "primary",
            cuti_bersama: "info",
            keperluan_keluarga: "secondary",
            lainnya: "dark",
        };
        return badges[type] || "secondary";
    };

    const getLeaveTypeText = (type) => {
        const texts = {
            sakit: "Sakit",
            izin: "Izin",
            cuti_tahunan: "Cuti Tahunan",
            cuti_bersama: "Cuti Bersama",
            keperluan_keluarga: "Keperluan Keluarga",
            lainnya: "Lainnya",
        };
        return texts[type] || type;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const calculateDuration = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "400px" }}
            >
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Memuat data izin...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-leave">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <i className="bi bi-calendar-x me-2 text-primary"></i>
                        Monitoring Izin
                    </h2>
                    <p className="text-muted mb-0">
                        Kelola pengajuan izin dan cuti karyawan
                    </p>
                </div>
                <button
                    className="btn btn-outline-primary"
                    onClick={fetchLeaves}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div
                                    className="me-3"
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "12px",
                                        background:
                                            "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontSize: "1.5rem",
                                    }}
                                >
                                    <i className="bi bi-calendar-x"></i>
                                </div>
                                <div>
                                    <p className="mb-0 text-muted small">
                                        Total Izin
                                    </p>
                                    <h3 className="mb-0">{stats.total}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div
                                    className="me-3"
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "12px",
                                        background:
                                            "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontSize: "1.5rem",
                                    }}
                                >
                                    <i className="bi bi-clock-history"></i>
                                </div>
                                <div>
                                    <p className="mb-0 text-muted small">
                                        Menunggu
                                    </p>
                                    <h3 className="mb-0">{stats.pending}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div
                                    className="me-3"
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "12px",
                                        background:
                                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontSize: "1.5rem",
                                    }}
                                >
                                    <i className="bi bi-check-circle"></i>
                                </div>
                                <div>
                                    <p className="mb-0 text-muted small">
                                        Disetujui
                                    </p>
                                    <h3 className="mb-0">{stats.approved}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div
                                    className="me-3"
                                    style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "12px",
                                        background:
                                            "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontSize: "1.5rem",
                                    }}
                                >
                                    <i className="bi bi-x-circle"></i>
                                </div>
                                <div>
                                    <p className="mb-0 text-muted small">
                                        Ditolak
                                    </p>
                                    <h3 className="mb-0">{stats.rejected}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">
                            <i className="bi bi-funnel me-2"></i>
                            Filter Data
                        </h5>
                        <div className="d-flex gap-2">
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>Tampilkan data hari ini</Tooltip>
                                }
                            >
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => handleQuickDate("today")}
                                >
                                    <i className="bi bi-calendar-day me-1"></i>
                                    Hari Ini
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>
                                        Tampilkan data minggu ini (Senin -
                                        Minggu)
                                    </Tooltip>
                                }
                            >
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => handleQuickDate("thisWeek")}
                                >
                                    <i className="bi bi-calendar-week me-1"></i>
                                    Minggu Ini
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>Tampilkan data bulan ini</Tooltip>
                                }
                            >
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => handleQuickDate("thisMonth")}
                                >
                                    <i className="bi bi-calendar-month me-1"></i>
                                    Bulan Ini
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip>Tampilkan data tahun ini</Tooltip>
                                }
                            >
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => handleQuickDate("thisYear")}
                                >
                                    <i className="bi bi-calendar-range me-1"></i>
                                    Tahun Ini
                                </Button>
                            </OverlayTrigger>
                        </div>
                    </div>

                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold">
                                    Tanggal Mulai
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "start_date",
                                            e.target.value
                                        )
                                    }
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold">
                                    Tanggal Akhir
                                    <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "end_date",
                                            e.target.value
                                        )
                                    }
                                    min={filters.start_date}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold">
                                    Sumber Magang
                                </Form.Label>
                                <Form.Select
                                    value={filters.sumber_magang}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "sumber_magang",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">Semua Sumber</option>
                                    <option value="kampus">Kampus</option>
                                    <option value="pemerintah">
                                        Pemerintah
                                    </option>
                                    <option value="swasta">Swasta</option>
                                    <option value="internal">Internal</option>
                                    <option value="umum">Umum</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold">
                                    Periode/Batch
                                </Form.Label>
                                <Form.Select
                                    value={filters.periode}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "periode",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">Semua Periode</option>
                                    {[
                                        ...new Set(
                                            users
                                                .map((u) => u.periode)
                                                .filter(Boolean)
                                        ),
                                    ]
                                        .sort()
                                        .map((periode) => (
                                            <option
                                                key={periode}
                                                value={periode}
                                            >
                                                {periode}
                                            </option>
                                        ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold">
                                    Divisi
                                </Form.Label>
                                <Form.Select
                                    value={filters.division_id}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "division_id",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">Semua Divisi</option>
                                    {divisions.map((division) => (
                                        <option
                                            key={division.id}
                                            value={division.id}
                                        >
                                            {division.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold">
                                    Tipe Izin
                                </Form.Label>
                                <Form.Select
                                    value={filters.leave_type}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "leave_type",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">Semua Tipe</option>
                                    <option value="sick">Sakit</option>
                                    <option value="leave">Izin</option>
                                    <option value="annual">Cuti Tahunan</option>
                                    <option value="emergency">Darurat</option>
                                    <option value="other">Lainnya</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold">
                                    Status
                                </Form.Label>
                                <Form.Select
                                    value={filters.status}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "status",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">Semua Status</option>
                                    <option value="pending">Menunggu</option>
                                    <option value="approved">Disetujui</option>
                                    <option value="rejected">Ditolak</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end gap-2">
                            <Button
                                variant="primary"
                                onClick={fetchLeaves}
                                className="flex-grow-1"
                            >
                                <i className="bi bi-search me-2"></i>
                                Cari
                            </Button>
                            <Button
                                variant="outline-danger"
                                onClick={handleResetFilters}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Leave Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                        <table className="table table-hover mb-0">
                            <thead
                                className="table-light"
                                style={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 1,
                                }}
                            >
                                <tr>
                                    <th>User</th>
                                    <th>Divisi</th>
                                    <th>Jenis Izin</th>
                                    <th>Tanggal</th>
                                    <th>Durasi</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-center py-4"
                                        >
                                            <Spinner
                                                animation="border"
                                                size="sm"
                                                className="me-2"
                                            />
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : leaves.length > 0 ? (
                                    leaves.map((leave) => (
                                        <tr key={leave.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        src={getAvatarUrl(
                                                            leave.user
                                                        )}
                                                        alt={leave.user?.name}
                                                        className="rounded-circle me-2"
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            objectFit: "cover",
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                leave.user
                                                                    ?.name ||
                                                                    "User"
                                                            )}&background=0D8ABC&color=fff&size=128`;
                                                        }}
                                                    />
                                                    <div>
                                                        <div className="fw-semibold small">
                                                            {leave.user?.name ||
                                                                "Unknown"}
                                                        </div>
                                                        <div className="text-muted small">
                                                            {leave.user?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark">
                                                    {leave.user?.division
                                                        ?.name || "N/A"}
                                                </span>
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={getLeaveTypeBadge(
                                                        leave.type
                                                    )}
                                                >
                                                    {getLeaveTypeText(
                                                        leave.type
                                                    )}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="small">
                                                    <div>
                                                        <i className="bi bi-calendar-event me-1"></i>
                                                        {formatDate(
                                                            leave.start_date
                                                        )}
                                                    </div>
                                                    {leave.end_date &&
                                                        leave.end_date !==
                                                            leave.start_date && (
                                                            <div className="text-muted">
                                                                <i className="bi bi-arrow-right me-1"></i>
                                                                {formatDate(
                                                                    leave.end_date
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-info">
                                                    {calculateDuration(
                                                        leave.start_date,
                                                        leave.end_date
                                                    )}{" "}
                                                    hari
                                                </span>
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={getStatusBadge(
                                                        leave.status
                                                    )}
                                                >
                                                    {getStatusText(
                                                        leave.status
                                                    )}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleViewDetail(leave)
                                                    }
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="text-center py-4"
                                        >
                                            <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                                            <span className="text-muted">
                                                Tidak ada data perizinan
                                            </span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && pagination && pagination.total_pages > 1 && (
                        <div className="d-flex justify-content-between align-items-center p-3 border-top">
                            <div className="text-muted small">
                                Menampilkan {(page - 1) * pagination.limit + 1}{" "}
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
                                            onClick={() => setPage(page - 1)}
                                            disabled={!pagination.has_prev}
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
                                            if (pagination.total_pages <= 5) {
                                                pageNum = i + 1;
                                            } else if (page <= 3) {
                                                pageNum = i + 1;
                                            } else if (
                                                page >=
                                                pagination.total_pages - 2
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
                                                            setPage(pageNum)
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
                                            onClick={() => setPage(page + 1)}
                                            disabled={!pagination.has_next}
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Detail Modal */}
            <Modal
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Detail Perizinan</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedLeave && (
                        <div>
                            {/* User Info */}
                            <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                                <img
                                    src={getAvatarUrl(selectedLeave.user)}
                                    alt={selectedLeave.user?.name}
                                    className="rounded-circle me-3"
                                    style={{
                                        width: "64px",
                                        height: "64px",
                                        objectFit: "cover",
                                    }}
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            selectedLeave.user?.name || "User"
                                        )}&background=0D8ABC&color=fff&size=128`;
                                    }}
                                />
                                <div>
                                    <h5 className="mb-1">
                                        {selectedLeave.user?.name || "Unknown"}
                                    </h5>
                                    <p className="text-muted mb-1 small">
                                        {selectedLeave.user?.email}
                                    </p>
                                    <Badge bg="light" text="dark">
                                        {selectedLeave.user?.division?.name ||
                                            "N/A"}
                                    </Badge>
                                    {selectedLeave.user?.periode && (
                                        <Badge bg="info" className="ms-2">
                                            <i className="bi bi-calendar-range me-1"></i>
                                            {selectedLeave.user.periode}
                                        </Badge>
                                    )}
                                    {selectedLeave.user?.sumber_magang && (
                                        <Badge bg="secondary" className="ms-2">
                                            <i className="bi bi-building me-1"></i>
                                            {selectedLeave.user.sumber_magang}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Leave Info */}
                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <div className="mb-3">
                                        <label className="small text-muted">
                                            Jenis Izin
                                        </label>
                                        <div>
                                            <Badge
                                                bg={getLeaveTypeBadge(
                                                    selectedLeave.type
                                                )}
                                            >
                                                {getLeaveTypeText(
                                                    selectedLeave.type
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <label className="small text-muted">
                                            Status
                                        </label>
                                        <div>
                                            <Badge
                                                bg={getStatusBadge(
                                                    selectedLeave.status
                                                )}
                                            >
                                                {getStatusText(
                                                    selectedLeave.status
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <label className="small text-muted">
                                            Tanggal Mulai
                                        </label>
                                        <div>
                                            {formatDate(
                                                selectedLeave.start_date
                                            )}
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <label className="small text-muted">
                                            Tanggal Selesai
                                        </label>
                                        <div>
                                            {formatDate(selectedLeave.end_date)}
                                        </div>
                                    </div>
                                </Col>
                                <Col md={12}>
                                    <div className="mb-3">
                                        <label className="small text-muted">
                                            Durasi
                                        </label>
                                        <div>
                                            <Badge bg="info">
                                                {calculateDuration(
                                                    selectedLeave.start_date,
                                                    selectedLeave.end_date
                                                )}{" "}
                                                hari
                                            </Badge>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={12}>
                                    <div className="mb-3">
                                        <label className="small text-muted">
                                            Alasan
                                        </label>
                                        <div className="p-3 bg-light rounded">
                                            {selectedLeave.reason || "-"}
                                        </div>
                                    </div>
                                </Col>

                                {/* Review Info */}
                                {selectedLeave.status !== "pending" && (
                                    <Col md={12}>
                                        <div className="mb-3">
                                            <label className="small text-muted d-block mb-2">
                                                <i className="bi bi-chat-left-text me-1"></i>
                                                Hasil Review dari Supervisor
                                            </label>
                                            <Card
                                                className={`mt-2 border-2 border-${
                                                    selectedLeave.status ===
                                                    "approved"
                                                        ? "success"
                                                        : "danger"
                                                }`}
                                            >
                                                <Card.Body>
                                                    <div className="mb-3">
                                                        <h6
                                                            className={`text-${
                                                                selectedLeave.status ===
                                                                "approved"
                                                                    ? "success"
                                                                    : "danger"
                                                            } mb-2`}
                                                        >
                                                            <i
                                                                className={`bi bi-${
                                                                    selectedLeave.status ===
                                                                    "approved"
                                                                        ? "check-circle"
                                                                        : "x-circle"
                                                                }-fill me-2`}
                                                            ></i>
                                                            Feedback Review
                                                        </h6>
                                                        {selectedLeave.review_notes ? (
                                                            <p
                                                                className="mb-2"
                                                                style={{
                                                                    whiteSpace:
                                                                        "pre-wrap",
                                                                }}
                                                            >
                                                                {
                                                                    selectedLeave.review_notes
                                                                }
                                                            </p>
                                                        ) : (
                                                            <p className="mb-2 text-muted fst-italic">
                                                                Tidak ada
                                                                catatan
                                                            </p>
                                                        )}
                                                    </div>
                                                    {selectedLeave.reviewer && (
                                                        <div className="d-flex align-items-center mt-3 pt-2 border-top">
                                                            <i className="bi bi-person-circle me-2 text-muted"></i>
                                                            <small className="text-muted">
                                                                Direview oleh:{" "}
                                                                <span className="fw-semibold">
                                                                    {
                                                                        selectedLeave
                                                                            .reviewer
                                                                            .name
                                                                    }
                                                                </span>
                                                            </small>
                                                        </div>
                                                    )}
                                                    {selectedLeave.reviewed_at && (
                                                        <div className="d-flex align-items-center mt-1">
                                                            <i className="bi bi-clock me-2 text-muted"></i>
                                                            <small className="text-muted">
                                                                {new Date(
                                                                    selectedLeave.reviewed_at
                                                                ).toLocaleString(
                                                                    "id-ID",
                                                                    {
                                                                        dateStyle:
                                                                            "full",
                                                                        timeStyle:
                                                                            "short",
                                                                    }
                                                                )}
                                                            </small>
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDetailModal(false)}
                    >
                        Tutup
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminLeave;
