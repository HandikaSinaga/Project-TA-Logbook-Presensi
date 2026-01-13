import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl } from "../../utils/Constant";
import toast from "react-hot-toast";
import {
    Card,
    Row,
    Col,
    Form,
    InputGroup,
    Button,
    Badge,
    Spinner,
} from "react-bootstrap";

const ManageDivision = () => {
    const [loading, setLoading] = useState(true);
    const [division, setDivision] = useState(null);
    const [supervisedUsers, setSupervisedUsers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedSupervisedUser, setSelectedSupervisedUser] = useState(null);
    const [selectedAvailableUser, setSelectedAvailableUser] = useState(null);
    const [searchSupervised, setSearchSupervised] = useState("");
    const [searchAvailable, setSearchAvailable] = useState("");
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [userToRemove, setUserToRemove] = useState(null);
    const [userToAdd, setUserToAdd] = useState(null);
    const [detailUser, setDetailUser] = useState(null);
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalPresent: 0,
        totalLeave: 0,
    });

    useEffect(() => {
        fetchDivisionData();
    }, []);

    const fetchDivisionData = async () => {
        try {
            setLoading(true);
            const [divisionRes, supervisedRes, availableRes] =
                await Promise.all([
                    axiosInstance.get("/supervisor/division"),
                    axiosInstance.get("/supervisor/division/members"),
                    axiosInstance.get("/supervisor/division/available-users"),
                ]);

            setDivision(divisionRes.data.data || divisionRes.data);
            setSupervisedUsers(
                supervisedRes.data.data || supervisedRes.data || []
            );
            setAvailableUsers(
                availableRes.data.data || availableRes.data || []
            );
            calculateStats(supervisedRes.data.data || supervisedRes.data || []);
        } catch (error) {
            console.error("Error fetching division data:", error);
            toast.error("Gagal memuat data divisi");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (users) => {
        setStats({
            totalMembers: users.length,
            totalPresent: users.filter((u) => u.status === "present").length,
            totalLeave: users.filter((u) => u.status === "leave").length,
        });
    };

    const handleAssignUser = async () => {
        if (!userToAdd) {
            toast.error("Pilih user yang akan ditambahkan");
            return;
        }

        try {
            await axiosInstance.post("/supervisor/division/assign", {
                user_id: userToAdd.id,
            });
            toast.success(`${userToAdd.name} berhasil ditambahkan ke divisi`);
            setUserToAdd(null);
            setSelectedAvailableUser(null);
            setShowAddModal(false);
            fetchDivisionData();
        } catch (error) {
            console.error("Error assigning user:", error);
            toast.error(
                error.response?.data?.message || "Gagal menambahkan user"
            );
        }
    };

    const openAddModal = () => {
        if (!selectedAvailableUser) {
            toast.error("Pilih user yang akan ditambahkan");
            return;
        }
        setUserToAdd(selectedAvailableUser);
        setShowAddModal(true);
    };

    const handleRemoveUser = async () => {
        if (!userToRemove) {
            toast.error("Pilih user yang akan dihapus");
            return;
        }

        try {
            await axiosInstance.post("/supervisor/division/remove", {
                user_id: userToRemove.id,
            });
            toast.success(`${userToRemove.name} berhasil dihapus dari divisi`);
            setUserToRemove(null);
            setSelectedSupervisedUser(null);
            setShowRemoveModal(false);
            fetchDivisionData();
        } catch (error) {
            console.error("Error removing user:", error);
            toast.error(
                error.response?.data?.message || "Gagal menghapus user"
            );
        }
    };

    const openRemoveModal = () => {
        if (!selectedSupervisedUser) {
            toast.error("Pilih user yang akan dihapus");
            return;
        }
        setUserToRemove(selectedSupervisedUser);
        setShowRemoveModal(true);
    };

    const openDetailModal = (user) => {
        setDetailUser(user);
        setShowDetailModal(true);
    };

    const filteredSupervisedUsers = supervisedUsers.filter((user) =>
        user.name.toLowerCase().includes(searchSupervised.toLowerCase())
    );

    const filteredAvailableUsers = availableUsers.filter((user) =>
        user.name.toLowerCase().includes(searchAvailable.toLowerCase())
    );

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "400px" }}
            >
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="manage-division p-4">
            <div className="mb-4">
                <h2>Kelola Divisi</h2>
                {division && (
                    <p className="text-muted">
                        <i className="bi bi-building me-2"></i>
                        {division.name}
                    </p>
                )}
            </div>

            {/* Stats Cards */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card
                        className="border-0 shadow-sm"
                        style={{
                            background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                        }}
                    >
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-1 opacity-75">
                                        Total Anggota
                                    </p>
                                    <h2 className="mb-0">
                                        {stats.totalMembers}
                                    </h2>
                                </div>
                                <div style={{ fontSize: "2.5rem" }}>👥</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card
                        className="border-0 shadow-sm"
                        style={{
                            background:
                                "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                            color: "white",
                        }}
                    >
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-1 opacity-75">
                                        Hadir Hari Ini
                                    </p>
                                    <h2 className="mb-0">
                                        {stats.totalPresent}
                                    </h2>
                                </div>
                                <div style={{ fontSize: "2.5rem" }}>✅</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card
                        className="border-0 shadow-sm"
                        style={{
                            background:
                                "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            color: "white",
                        }}
                    >
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="mb-1 opacity-75">
                                        Izin Hari Ini
                                    </p>
                                    <h2 className="mb-0">{stats.totalLeave}</h2>
                                </div>
                                <div style={{ fontSize: "2.5rem" }}>📋</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* User Management */}
            <Row>
                {/* Supervised Users */}
                <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                                <div>
                                    <h5 className="mb-0">
                                        <i className="bi bi-people-fill me-2 text-success"></i>
                                        Anggota Divisi
                                    </h5>
                                </div>
                                <Badge bg="secondary" pill>
                                    {supervisedUsers.length}
                                </Badge>
                            </div>

                            <InputGroup className="mb-3">
                                <InputGroup.Text>
                                    <i className="bi bi-search"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Cari anggota..."
                                    value={searchSupervised}
                                    onChange={(e) =>
                                        setSearchSupervised(e.target.value)
                                    }
                                />
                            </InputGroup>

                            <div
                                style={{
                                    maxHeight: "400px",
                                    overflowY: "auto",
                                }}
                            >
                                {filteredSupervisedUsers.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i
                                            className="bi bi-inbox"
                                            style={{ fontSize: "3rem" }}
                                        ></i>
                                        <p className="mt-2">
                                            Belum ada anggota
                                        </p>
                                    </div>
                                ) : (
                                    filteredSupervisedUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`d-flex align-items-center p-3 mb-2 rounded ${
                                                selectedSupervisedUser?.id ===
                                                user.id
                                                    ? "bg-primary bg-opacity-10 border border-primary"
                                                    : "bg-light"
                                            }`}
                                            style={{ cursor: "pointer" }}
                                            onClick={() =>
                                                setSelectedSupervisedUser(user)
                                            }
                                        >
                                            <img
                                                src={getAvatarUrl(user)}
                                                alt={user.name}
                                                className="rounded-circle me-3"
                                                style={{
                                                    width: "48px",
                                                    height: "48px",
                                                    objectFit: "cover",
                                                }}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        user.name || "User"
                                                    )}&background=0D8ABC&color=fff&size=128`;
                                                }}
                                            />
                                            <div className="flex-grow-1">
                                                <div className="fw-semibold">
                                                    {user.name}
                                                </div>
                                                <small className="text-muted">
                                                    {user.email}
                                                </small>
                                            </div>
                                            <div className="d-flex gap-2 align-items-center">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDetailModal(user);
                                                    }}
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </Button>
                                                <Badge bg="success" pill>
                                                    Member
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-top">
                                <Button
                                    variant="danger"
                                    className="w-100"
                                    onClick={openRemoveModal}
                                    disabled={!selectedSupervisedUser}
                                >
                                    <i className="bi bi-dash-circle me-2"></i>
                                    Hapus dari Divisi
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Available Users */}
                <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                                <div>
                                    <h5 className="mb-0">
                                        <i className="bi bi-person-plus me-2 text-primary"></i>
                                        User Tersedia
                                    </h5>
                                </div>
                                <Badge bg="secondary" pill>
                                    {availableUsers.length}
                                </Badge>
                            </div>

                            <InputGroup className="mb-3">
                                <InputGroup.Text>
                                    <i className="bi bi-search"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Cari user..."
                                    value={searchAvailable}
                                    onChange={(e) =>
                                        setSearchAvailable(e.target.value)
                                    }
                                />
                            </InputGroup>

                            <div
                                style={{
                                    maxHeight: "400px",
                                    overflowY: "auto",
                                }}
                            >
                                {filteredAvailableUsers.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i
                                            className="bi bi-inbox"
                                            style={{ fontSize: "3rem" }}
                                        ></i>
                                        <p className="mt-2">
                                            Tidak ada user tersedia
                                        </p>
                                    </div>
                                ) : (
                                    filteredAvailableUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`d-flex align-items-center p-3 mb-2 rounded ${
                                                selectedAvailableUser?.id ===
                                                user.id
                                                    ? "bg-primary bg-opacity-10 border border-primary"
                                                    : "bg-light"
                                            }`}
                                            style={{ cursor: "pointer" }}
                                            onClick={() =>
                                                setSelectedAvailableUser(user)
                                            }
                                        >
                                            <img
                                                src={getAvatarUrl(user)}
                                                alt={user.name}
                                                className="rounded-circle me-3"
                                                style={{
                                                    width: "48px",
                                                    height: "48px",
                                                    objectFit: "cover",
                                                }}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        user.name || "User"
                                                    )}&background=0D8ABC&color=fff&size=128`;
                                                }}
                                            />
                                            <div className="flex-grow-1">
                                                <div className="fw-semibold">
                                                    {user.name}
                                                </div>
                                                <small className="text-muted">
                                                    {user.email}
                                                </small>
                                            </div>
                                            <div className="d-flex gap-2 align-items-center">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDetailModal(user);
                                                    }}
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </Button>
                                                <Badge bg="info" pill>
                                                    Available
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-top">
                                <Button
                                    variant="primary"
                                    className="w-100"
                                    onClick={openAddModal}
                                    disabled={!selectedAvailableUser}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Tambahkan ke Divisi
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Remove User Modal */}
            {showRemoveModal && userToRemove && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowRemoveModal(false);
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
                                            className="bi bi-exclamation-triangle fs-4"
                                            style={{ color: "#dc2626" }}
                                        ></i>
                                    </div>
                                    <span style={{ color: "#1f2937" }}>
                                        Konfirmasi Hapus Anggota
                                    </span>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowRemoveModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <div
                                    className="d-flex align-items-start p-3 rounded-3 mb-3"
                                    style={{
                                        backgroundColor: "#fef3c7",
                                        border: "1px solid #fde68a",
                                    }}
                                >
                                    <i
                                        className="bi bi-exclamation-triangle-fill fs-4 me-3"
                                        style={{ color: "#d97706" }}
                                    ></i>
                                    <div>
                                        <strong
                                            className="d-block mb-2"
                                            style={{ color: "#92400e" }}
                                        >
                                            Peringatan!
                                        </strong>
                                        <p
                                            className="mb-0"
                                            style={{ color: "#78350f" }}
                                        >
                                            Anda akan menghapus anggota dari
                                            divisi. Tindakan ini akan:
                                        </p>
                                        <ul
                                            className="mb-0 mt-2"
                                            style={{ color: "#78350f" }}
                                        >
                                            <li>
                                                Menghapus user dari divisi Anda
                                            </li>
                                            <li>
                                                User tidak akan lagi dalam
                                                pengawasan Anda
                                            </li>
                                            <li>
                                                Data historis user tetap
                                                tersimpan
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="card bg-light border-0 mt-3">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <img
                                                src={getAvatarUrl(userToRemove)}
                                                alt={userToRemove.name}
                                                className="rounded-circle me-3"
                                                style={{
                                                    width: "60px",
                                                    height: "60px",
                                                    objectFit: "cover",
                                                }}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        userToRemove.name
                                                    )}&background=random&color=fff&size=128`;
                                                }}
                                            />
                                            <div>
                                                <h6 className="mb-1">
                                                    {userToRemove.name}
                                                </h6>
                                                <p className="text-muted mb-0 small">
                                                    {userToRemove.email}
                                                </p>
                                                {userToRemove.role && (
                                                    <Badge
                                                        bg="secondary"
                                                        className="mt-1"
                                                    >
                                                        {userToRemove.role}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-muted small mt-3 mb-0">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Pastikan Anda yakin sebelum melanjutkan
                                </p>
                            </div>
                            <div className="modal-footer border-0 bg-light">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowRemoveModal(false)}
                                    className="px-4"
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleRemoveUser}
                                    className="px-4"
                                    style={{
                                        backgroundColor: "#dc2626",
                                        border: "none",
                                        color: "white",
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.target.style.backgroundColor =
                                            "#b91c1c")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.target.style.backgroundColor =
                                            "#dc2626")
                                    }
                                >
                                    <i className="bi bi-trash me-2"></i>
                                    Ya, Hapus dari Divisi
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddModal && userToAdd && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowAddModal(false);
                        }
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div
                                className="modal-header border-0"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)",
                                }}
                            >
                                <h5 className="modal-title d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                        <i className="bi bi-person-plus text-primary fs-4"></i>
                                    </div>
                                    <span>Konfirmasi Tambah Anggota</span>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowAddModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="alert alert-info d-flex align-items-start">
                                    <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                                    <div>
                                        <strong className="d-block mb-2">
                                            Informasi
                                        </strong>
                                        <p className="mb-0">
                                            Anda akan menambahkan user baru ke
                                            divisi. User akan:
                                        </p>
                                        <ul className="mb-0 mt-2">
                                            <li>
                                                Menjadi bagian dari divisi Anda
                                            </li>
                                            <li>
                                                Berada dalam pengawasan Anda
                                            </li>
                                            <li>
                                                Dapat mengakses fitur divisi
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="card bg-light border-0 mt-3">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <img
                                                src={getAvatarUrl(userToAdd)}
                                                alt={userToAdd.name}
                                                className="rounded-circle me-3"
                                                style={{
                                                    width: "60px",
                                                    height: "60px",
                                                    objectFit: "cover",
                                                }}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        userToAdd.name
                                                    )}&background=random&color=fff&size=128`;
                                                }}
                                            />
                                            <div>
                                                <h6 className="mb-1">
                                                    {userToAdd.name}
                                                </h6>
                                                <p className="text-muted mb-0 small">
                                                    {userToAdd.email}
                                                </p>
                                                {userToAdd.role && (
                                                    <Badge
                                                        bg="info"
                                                        className="mt-1"
                                                    >
                                                        {userToAdd.role}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-muted small mt-3 mb-0">
                                    <i className="bi bi-info-circle me-1"></i>
                                    User akan langsung tergabung dalam divisi
                                    setelah konfirmasi
                                </p>
                            </div>
                            <div className="modal-footer border-0 bg-light">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Batal
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleAssignUser}
                                >
                                    <i className="bi bi-check-circle me-2"></i>
                                    Ya, Tambahkan ke Divisi
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {showDetailModal && detailUser && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowDetailModal(false);
                        }
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg">
                            <div
                                className="modal-header border-0"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                }}
                            >
                                <h5 className="modal-title text-white d-flex align-items-center">
                                    <i className="bi bi-person-circle me-2 fs-4"></i>
                                    Detail Anggota
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowDetailModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="text-center mb-4">
                                    <img
                                        src={getAvatarUrl(detailUser)}
                                        alt={detailUser.name}
                                        className="rounded-circle border border-4 border-primary mb-3"
                                        style={{
                                            width: "120px",
                                            height: "120px",
                                            objectFit: "cover",
                                        }}
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                detailUser.name
                                            )}&background=random&color=fff&size=128`;
                                        }}
                                    />
                                    <h4 className="mb-2">{detailUser.name}</h4>
                                    {detailUser.role && (
                                        <Badge
                                            bg={
                                                detailUser.role === "supervisor"
                                                    ? "warning"
                                                    : "primary"
                                            }
                                            className="mb-2"
                                        >
                                            <i
                                                className={`bi ${
                                                    detailUser.role ===
                                                    "supervisor"
                                                        ? "bi-star-fill"
                                                        : "bi-person-fill"
                                                } me-1`}
                                            ></i>
                                            {detailUser.role === "supervisor"
                                                ? "Supervisor"
                                                : "Member"}
                                        </Badge>
                                    )}
                                </div>

                                {detailUser.bio && (
                                    <div className="alert alert-light border mb-4">
                                        <h6 className="mb-2">
                                            <i className="bi bi-chat-quote-fill text-primary me-2"></i>
                                            Bio
                                        </h6>
                                        <p className="mb-0 text-muted">
                                            {detailUser.bio}
                                        </p>
                                    </div>
                                )}

                                <div className="card bg-light border-0">
                                    <div className="card-body">
                                        <h6 className="mb-3">
                                            <i className="bi bi-info-circle-fill text-primary me-2"></i>
                                            Informasi Kontak
                                        </h6>

                                        <div className="mb-3">
                                            <label className="small text-muted mb-1">
                                                Email
                                            </label>
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-envelope-fill text-primary me-2"></i>
                                                <a
                                                    href={`mailto:${detailUser.email}`}
                                                    className="text-decoration-none"
                                                >
                                                    {detailUser.email}
                                                </a>
                                            </div>
                                        </div>

                                        {detailUser.phone && (
                                            <div className="mb-3">
                                                <label className="small text-muted mb-1">
                                                    Nomor HP
                                                </label>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-telephone-fill text-success me-2"></i>
                                                    <span>
                                                        {detailUser.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {detailUser.nip && (
                                            <div className="mb-3">
                                                <label className="small text-muted mb-1">
                                                    NIP
                                                </label>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-credit-card-fill text-info me-2"></i>
                                                    <span>
                                                        {detailUser.nip}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {detailUser.position && (
                                            <div>
                                                <label className="small text-muted mb-1">
                                                    Posisi
                                                </label>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-briefcase-fill text-warning me-2"></i>
                                                    <span>
                                                        {detailUser.position}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 bg-light">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageDivision;
