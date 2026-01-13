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

const AdminLogbook = () => {
    const [loading, setLoading] = useState(true);
    const [logbooks, setLogbooks] = useState([]);
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
    const [selectedLogbook, setSelectedLogbook] = useState(null);

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
        fetchLogbooks();
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

    const fetchLogbooks = async () => {
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
            if (filters.search && filters.search.trim() !== "") {
                params.search = filters.search.trim();
            }

            console.log("[Logbook] Fetching with filters:", filters);
            console.log("[Logbook] Query params:", params);

            const response = await axiosInstance.get("/admin/logbook", {
                params,
            });
            const data = response.data.data || [];

            console.log("[Logbook] Received", data.length, "records");
            console.log("[Logbook] First 3 records:", data.slice(0, 3));

            setLogbooks(data);
            setPagination(response.data.pagination);
            calculateStats(
                response.data.pagination?.total_records || data.length
            );
        } catch (error) {
            console.error("Fetch logbook error:", error);
            toast.error(
                error.response?.data?.message || "Gagal memuat data logbook"
            );
            setLogbooks([]);
            setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (totalRecords) => {
        const data = logbooks;
        const stats = {
            total: totalRecords || data.length,
            pending: data.filter((l) => l.status === "pending").length,
            approved: data.filter((l) => l.status === "approved").length,
            rejected: data.filter((l) => l.status === "rejected").length,
        };
        setStats(stats);
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
        setCurrentPage(1);
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
        if (key !== "search") {
            setPage(1);
        }
    };

    const handleResetFilters = () => {
        setFilters({
            start_date: getJakartaDate(),
            end_date: getJakartaDate(),
            division_id: "",
            periode: "",
            sumber_magang: "",
            status: "",
            search: "",
        });
        setSearchTerm("");
        setPage(1);
    };

    const handleViewDetail = (logbook) => {
        setSelectedLogbook(logbook);
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

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "400px" }}
            >
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Memuat data logbook...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-logbook">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <i className="bi bi-journal-text me-2 text-primary"></i>
                        Monitoring Logbook
                    </h2>
                    <p className="text-muted mb-0">
                        Pantau aktivitas dan laporan harian karyawan
                    </p>
                </div>
                <button
                    className="btn btn-outline-primary"
                    onClick={fetchLogbooks}
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
                                    <i className="bi bi-journal-text"></i>
                                </div>
                                <div>
                                    <p className="mb-0 text-muted small">
                                        Total Logbook
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

                    <Row className="g-3 align-items-end">
                        <Col md={3}>
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
                        </Col>
                        <Col md={3}>
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
                        </Col>
                        <Col md={2}>
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
                                <option value="pemerintah">Pemerintah</option>
                                <option value="swasta">Swasta</option>
                                <option value="internal">Internal</option>
                                <option value="umum">Umum</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
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
                                        <option key={periode} value={periode}>
                                            {periode}
                                        </option>
                                    ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
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
                                {divisions.map((div) => (
                                    <option key={div.id} value={div.id}>
                                        {div.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold">
                                Status
                            </Form.Label>
                            <Form.Select
                                value={filters.status}
                                onChange={(e) =>
                                    handleFilterChange("status", e.target.value)
                                }
                            >
                                <option value="">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold">
                                &nbsp;
                            </Form.Label>
                            <Button
                                variant="primary"
                                className="w-100"
                                onClick={fetchLogbooks}
                            >
                                <i className="bi bi-search me-1"></i>
                                Cari
                            </Button>
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small fw-semibold">
                                &nbsp;
                            </Form.Label>
                            <Button
                                variant="outline-danger"
                                className="w-100"
                                onClick={handleResetFilters}
                            >
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Logbook Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div
                        className="table-responsive"
                        style={{ maxHeight: "600px", overflowY: "auto" }}
                    >
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
                                    <th>Tanggal</th>
                                    <th>Aktivitas</th>
                                    <th>Status</th>
                                    <th className="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="6"
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
                                ) : logbooks.length > 0 ? (
                                    logbooks.map((logbook) => (
                                        <tr key={logbook.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        src={getAvatarUrl(
                                                            logbook.user
                                                        )}
                                                        alt={logbook.user?.name}
                                                        className="rounded-circle me-2"
                                                        width="32"
                                                        height="32"
                                                        style={{
                                                            objectFit: "cover",
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                logbook.user
                                                                    ?.name ||
                                                                    "User"
                                                            )}&background=0D8ABC&color=fff&size=128`;
                                                        }}
                                                    />
                                                    <div>
                                                        <strong>
                                                            {logbook.user?.name}
                                                        </strong>
                                                        <br />
                                                        <small className="text-muted">
                                                            {logbook.user?.nip}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {logbook.user?.division?.name ||
                                                    "-"}
                                            </td>
                                            <td>
                                                <i className="bi bi-calendar3 me-1"></i>
                                                {logbook.date
                                                    ? new Date(
                                                          logbook.date
                                                      ).toLocaleDateString(
                                                          "id-ID",
                                                          {
                                                              day: "2-digit",
                                                              month: "short",
                                                              year: "numeric",
                                                          }
                                                      )
                                                    : "-"}
                                            </td>
                                            <td>
                                                <div
                                                    style={{
                                                        maxWidth: "300px",
                                                    }}
                                                >
                                                    <small className="text-truncate d-block">
                                                        {logbook.activity ||
                                                            logbook.description ||
                                                            "-"}
                                                    </small>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={getStatusBadge(
                                                        logbook.status
                                                    )}
                                                >
                                                    {getStatusText(
                                                        logbook.status
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="text-center">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleViewDetail(
                                                            logbook
                                                        )
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
                                            colSpan="6"
                                            className="text-center text-muted py-4"
                                        >
                                            Tidak ada data logbook
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
                    <Modal.Title>Detail Logbook</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedLogbook && (
                        <div>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <div className="mb-3">
                                        <small className="text-muted d-block">
                                            Karyawan
                                        </small>
                                        <div className="d-flex align-items-center mt-1">
                                            <img
                                                src={getAvatarUrl(
                                                    selectedLogbook.user
                                                )}
                                                alt={selectedLogbook.user?.name}
                                                className="rounded-circle me-2"
                                                width="40"
                                                height="40"
                                                style={{ objectFit: "cover" }}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        selectedLogbook.user
                                                            ?.name || "User"
                                                    )}&background=0D8ABC&color=fff&size=128`;
                                                }}
                                            />
                                            <div>
                                                <strong>
                                                    {selectedLogbook.user?.name}
                                                </strong>
                                                <br />
                                                <small className="text-muted">
                                                    {selectedLogbook.user?.nip}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <small className="text-muted d-block">
                                            Divisi
                                        </small>
                                        <strong>
                                            {selectedLogbook.user?.division
                                                ?.name || "-"}
                                        </strong>
                                    </div>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                {selectedLogbook.user?.periode && (
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <small className="text-muted d-block">
                                                Periode
                                            </small>
                                            <Badge bg="info">
                                                <i className="bi bi-calendar-range me-1"></i>
                                                {selectedLogbook.user.periode}
                                            </Badge>
                                        </div>
                                    </Col>
                                )}
                                {selectedLogbook.user?.sumber_magang && (
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <small className="text-muted d-block">
                                                Sumber Magang
                                            </small>
                                            <Badge bg="secondary">
                                                <i className="bi bi-building me-1"></i>
                                                {
                                                    selectedLogbook.user
                                                        .sumber_magang
                                                }
                                            </Badge>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <div className="mb-3">
                                        <small className="text-muted d-block">
                                            Tanggal
                                        </small>
                                        <strong>
                                            {selectedLogbook.date
                                                ? new Date(
                                                      selectedLogbook.date
                                                  ).toLocaleDateString(
                                                      "id-ID",
                                                      {
                                                          weekday: "long",
                                                          day: "numeric",
                                                          month: "long",
                                                          year: "numeric",
                                                      }
                                                  )
                                                : "-"}
                                        </strong>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <small className="text-muted d-block">
                                            Status
                                        </small>
                                        <Badge
                                            bg={getStatusBadge(
                                                selectedLogbook.status
                                            )}
                                            className="mt-1"
                                        >
                                            {getStatusText(
                                                selectedLogbook.status
                                            )}
                                        </Badge>
                                    </div>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <div className="mb-3">
                                        <small className="text-muted d-block">
                                            Waktu
                                        </small>
                                        <strong>
                                            <i className="bi bi-clock me-2 text-info"></i>
                                            {selectedLogbook.time || "-"}
                                        </strong>
                                    </div>
                                </Col>
                                {selectedLogbook.location && (
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <small className="text-muted d-block">
                                                Lokasi
                                            </small>
                                            <strong>
                                                <i className="bi bi-geo-alt me-2 text-danger"></i>
                                                {selectedLogbook.location}
                                            </strong>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                            <div className="mb-3">
                                <small className="text-muted d-block">
                                    Nama Kegiatan
                                </small>
                                <Card className="mt-2 border-0 bg-light">
                                    <Card.Body>
                                        <p className="mb-0 fw-semibold">
                                            {selectedLogbook.activity ||
                                                "Kegiatan Harian"}
                                        </p>
                                    </Card.Body>
                                </Card>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block">
                                    Deskripsi Aktivitas
                                </small>
                                <Card className="mt-2 border-0 bg-light">
                                    <Card.Body>
                                        <p
                                            className="mb-0"
                                            style={{ whiteSpace: "pre-wrap" }}
                                        >
                                            {selectedLogbook.description ||
                                                "Tidak ada deskripsi"}
                                        </p>
                                    </Card.Body>
                                </Card>
                            </div>
                            {selectedLogbook.attachments &&
                                selectedLogbook.attachments.length > 0 && (
                                    <div className="mb-3">
                                        <small className="text-muted d-block mb-2">
                                            <i className="bi bi-paperclip me-1"></i>
                                            Lampiran (
                                            {selectedLogbook.attachments.length}
                                            )
                                        </small>
                                        <Row className="g-2">
                                            {selectedLogbook.attachments.map(
                                                (attachment, index) => {
                                                    const isImage =
                                                        /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                                            attachment
                                                        );
                                                    return (
                                                        <Col md={6} key={index}>
                                                            {isImage ? (
                                                                <Card className="border-0 shadow-sm">
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
                                                                    <Card.Body className="p-2 text-center">
                                                                        <small className="text-muted">
                                                                            <i className="bi bi-zoom-in me-1"></i>
                                                                            Klik
                                                                            untuk
                                                                            memperbesar
                                                                        </small>
                                                                    </Card.Body>
                                                                </Card>
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
                                                        </Col>
                                                    );
                                                }
                                            )}
                                        </Row>
                                    </div>
                                )}

                            {/* Feedback */}
                            {selectedLogbook.status !== "pending" && (
                                <div className="mb-3">
                                    <small className="text-muted d-block mb-2">
                                        <i className="bi bi-chat-left-text me-1"></i>
                                        Hasil Review dari Supervisor
                                    </small>
                                    <Card
                                        className={`mt-2 border-2 border-${
                                            selectedLogbook.status ===
                                            "approved"
                                                ? "success"
                                                : "danger"
                                        }`}
                                    >
                                        <Card.Body>
                                            <div className="mb-3">
                                                <h6
                                                    className={`text-${
                                                        selectedLogbook.status ===
                                                        "approved"
                                                            ? "success"
                                                            : "danger"
                                                    } mb-2`}
                                                >
                                                    <i
                                                        className={`bi bi-${
                                                            selectedLogbook.status ===
                                                            "approved"
                                                                ? "check-circle"
                                                                : "x-circle"
                                                        }-fill me-2`}
                                                    ></i>
                                                    {selectedLogbook.status ===
                                                    "approved"
                                                        ? "Feedback Approval"
                                                        : "Alasan Penolakan"}
                                                </h6>
                                                {selectedLogbook.review_notes ? (
                                                    <p
                                                        className="mb-2"
                                                        style={{
                                                            whiteSpace:
                                                                "pre-wrap",
                                                        }}
                                                    >
                                                        {
                                                            selectedLogbook.review_notes
                                                        }
                                                    </p>
                                                ) : (
                                                    <p className="mb-2 text-muted fst-italic">
                                                        Tidak ada catatan
                                                    </p>
                                                )}
                                            </div>
                                            {selectedLogbook.reviewer && (
                                                <div className="d-flex align-items-center mt-3 pt-2 border-top">
                                                    <i className="bi bi-person-circle me-2 text-muted"></i>
                                                    <small className="text-muted">
                                                        Direview oleh:{" "}
                                                        <span className="fw-semibold">
                                                            {
                                                                selectedLogbook
                                                                    .reviewer
                                                                    .name
                                                            }
                                                        </span>
                                                    </small>
                                                </div>
                                            )}
                                            {selectedLogbook.reviewed_at && (
                                                <div className="d-flex align-items-center mt-1">
                                                    <i className="bi bi-clock me-2 text-muted"></i>
                                                    <small className="text-muted">
                                                        {new Date(
                                                            selectedLogbook.reviewed_at
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
                            )}
                            {selectedLogbook.status === "pending" && (
                                <div className="mb-3">
                                    <Card
                                        className="border-0"
                                        bg="info"
                                        text="white"
                                    >
                                        <Card.Body className="py-2">
                                            <small>
                                                <i className="bi bi-info-circle me-2"></i>
                                                Logbook ini sedang menunggu
                                                review dari supervisor.
                                            </small>
                                        </Card.Body>
                                    </Card>
                                </div>
                            )}
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

export default AdminLogbook;
