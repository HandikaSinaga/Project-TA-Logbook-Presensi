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
import LogbookDetailModal from "../../components/LogbookDetailModal";
import AdvancedFilters from "../../components/common/AdvancedFilters";


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
    });
    
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        not_filled: 0,
    });
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedLogbook, setSelectedLogbook] = useState(null);



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
        filters.periode,
        filters.sumber_magang,
        selectedUserIds,
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

            const params = { page, limit: 20 };

            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;
            if (filters.division_id) params.division_id = filters.division_id;
            if (filters.status) params.status = filters.status;
            if (filters.periode) params.periode = filters.periode;
            if (filters.sumber_magang) params.sumber_magang = filters.sumber_magang;
            if (selectedUserIds.length > 0) {
                params.user_ids = selectedUserIds.join(",");
            }

            // Stats params â€” tanpa filter status agar tampilkan breakdown per status
            const statsParams = {};
            if (filters.start_date) statsParams.start_date = filters.start_date;
            if (filters.end_date) statsParams.end_date = filters.end_date;
            if (filters.division_id) statsParams.division_id = filters.division_id;
            if (filters.periode) statsParams.periode = filters.periode;
            if (filters.sumber_magang) statsParams.sumber_magang = filters.sumber_magang;
            if (selectedUserIds.length > 0) {
                statsParams.user_ids = selectedUserIds.join(",");
            }

            const [dataRes, statsRes] = await Promise.all([
                axiosInstance.get("/admin/logbook", { params }),
                axiosInstance.get("/admin/logbook/stats", { params: statsParams }),
            ]);

            const data = dataRes.data.data || [];
            setLogbooks(data);
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
            console.error("Fetch logbook error:", error);
            toast.error(error.response?.data?.message || "Gagal memuat data logbook");
            setLogbooks([]);
            setStats({ total: 0, pending: 0, approved: 0, rejected: 0, not_filled: 0 });
        } finally {
            setLoading(false);
        }
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
        });
        setSelectedUserIds([]);
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
            not_filled: "secondary",
        };
        return badges[status] || "secondary";
    };

    const getStatusText = (status) => {
        const texts = {
            pending: "Menunggu",
            approved: "Disetujui",
            rejected: "Ditolak",
            not_filled: "Tidak Mengisi",
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
                {[
                    { id: "", label: "Total", value: stats.total, icon: "bi-journal-text", bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
                    { id: "pending", label: "Menunggu", value: stats.pending, icon: "bi-clock-history", bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
                    { id: "approved", label: "Disetujui", value: stats.approved, icon: "bi-check-circle", bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
                    { id: "rejected", label: "Ditolak", value: stats.rejected, icon: "bi-x-circle", bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
                    { id: "not_filled", label: "Tidak Mengisi", value: stats.not_filled, icon: "bi-dash-circle", bg: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)" },
                ].map((card) => (
                    <div key={card.label} className="col-6 col-md">
                        <div 
                            className="card border-0 shadow-sm"
                            style={{ 
                                cursor: "pointer", 
                                transform: filters.status === card.id ? "scale(1.02)" : "scale(1)",
                                border: filters.status === card.id ? "2px solid #0d6efd" : "2px solid transparent",
                                transition: "all 0.2s ease-in-out"
                            }}
                            onClick={() => handleFilterChange("status", card.id)}
                        >
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="me-3" style={{ width: "48px", height: "48px", borderRadius: "12px", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem" }}>
                                        <i className={`bi ${card.icon}`}></i>
                                    </div>
                                    <div>
                                        <p className="mb-0 text-muted small">{card.label}</p>
                                        <h3 className="mb-0">{card.value}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
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

                    <AdvancedFilters
                        filters={filters}
                        setFilters={setFilters}
                        selectedUserIds={selectedUserIds}
                        setSelectedUserIds={setSelectedUserIds}
                        showDivision={true}
                        showPeriode={true}
                        showUser={true}
                        showSumberMagang={true}
                        role="admin"
                        externalUsers={users}
                        externalDivisions={divisions}
                    />

                    <Row className="g-3 mt-2">
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
                                <option value="not_filled">Tidak Mengisi</option>
                            </Form.Select>
                        </Col>
                        <Col md={2} className="d-flex align-items-end gap-2">
                            <Button
                                variant="primary"
                                className="flex-grow-1"
                                onClick={fetchLogbooks}
                            >
                                <i className="bi bi-search me-1"></i>
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

            <LogbookDetailModal
                show={showDetailModal && !!selectedLogbook}
                onClose={() => setShowDetailModal(false)}
                logbook={selectedLogbook}
                showUserInfo={true}
            />
        </div>
    );
};

export default AdminLogbook;
