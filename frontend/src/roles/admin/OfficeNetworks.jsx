import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import {
    Modal,
    Button,
    Form,
    Card,
    Row,
    Col,
    Badge,
    Spinner,
    Alert,
} from "react-bootstrap";

const OfficeNetworks = () => {
    const [networks, setNetworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentNetwork, setCurrentNetwork] = useState({
        ssid: "",
        description: "",
        is_active: true,
        bssid: "",
        is_testing: false,
    });
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
    });

    // Testing WiFi states
    const [testingWifi, setTestingWifi] = useState(false);
    const [wifiTestResult, setWifiTestResult] = useState(null);

    useEffect(() => {
        fetchNetworks();
    }, []);

    const fetchNetworks = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/admin/office-networks");
            const networkData = response.data.data || response.data || [];
            setNetworks(Array.isArray(networkData) ? networkData : []);
            calculateStats(Array.isArray(networkData) ? networkData : []);
        } catch (error) {
            console.error("Error fetching networks:", error);
            toast.error(
                error.response?.data?.message || "Gagal memuat daftar WiFi"
            );
            setNetworks([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (networkList) => {
        const active = networkList.filter((n) => n.is_active).length;
        setStats({
            total: networkList.length,
            active: active,
            inactive: networkList.length - active,
        });
    };

    const handleOpenModal = (network = null) => {
        if (network) {
            setEditMode(true);
            setCurrentNetwork(network);
        } else {
            setEditMode(false);
            setCurrentNetwork({
                ssid: "",
                description: "",
                is_active: true,
                bssid: "",
                is_testing: false,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
        setCurrentNetwork({
            ssid: "",
            description: "",
            is_active: true,
            bssid: "",
            is_testing: false,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentNetwork.ssid.trim()) {
            toast.error("SSID tidak boleh kosong");
            return;
        }

        try {
            if (editMode) {
                await axiosInstance.put(
                    `/admin/office-networks/${currentNetwork.id}`,
                    currentNetwork
                );
                toast.success("WiFi berhasil diperbarui");
            } else {
                await axiosInstance.post(
                    "/admin/office-networks",
                    currentNetwork
                );
                toast.success("WiFi berhasil ditambahkan");
            }
            fetchNetworks();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving network:", error);
            toast.error(
                error.response?.data?.message || "Gagal menyimpan data WiFi"
            );
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus WiFi ini?")) return;

        try {
            await axiosInstance.delete(`/admin/office-networks/${id}`);
            toast.success("WiFi berhasil dihapus");
            fetchNetworks();
        } catch (error) {
            console.error("Error deleting network:", error);
            toast.error("Gagal menghapus WiFi");
        }
    };

    const handleToggleStatus = async (network) => {
        try {
            await axiosInstance.put(`/admin/office-networks/${network.id}`, {
                ...network,
                is_active: !network.is_active,
            });
            toast.success(
                `WiFi berhasil ${
                    !network.is_active ? "diaktifkan" : "dinonaktifkan"
                }`
            );
            fetchNetworks();
        } catch (error) {
            console.error("Error toggling network status:", error);
            toast.error("Gagal mengubah status WiFi");
        }
    };

    // Test Current WiFi Connection
    const handleTestWifi = async () => {
        setTestingWifi(true);
        setWifiTestResult(null);

        try {
            // Check if browser supports Network Information API
            if (!("connection" in navigator)) {
                toast.error("Browser tidak mendukung Network Information API");
                setWifiTestResult({
                    success: false,
                    message: "Browser tidak mendukung deteksi WiFi otomatis",
                });
                return;
            }

            // Simulate WiFi detection (since browsers can't directly access SSID)
            const connection =
                navigator.connection ||
                navigator.mozConnection ||
                navigator.webkitConnection;

            // Get active networks from database
            const response = await axiosInstance.get(
                "/admin/office-networks/active"
            );
            const activeNetworks = response.data.data || [];

            if (activeNetworks.length === 0) {
                setWifiTestResult({
                    success: false,
                    message: "Tidak ada WiFi aktif yang terdaftar",
                    details: "Silakan tambahkan minimal 1 WiFi aktif",
                });
                toast.warning("Tidak ada WiFi aktif");
                return;
            }

            setWifiTestResult({
                success: true,
                message: "Koneksi terdeteksi",
                details: {
                    type: connection?.effectiveType || "unknown",
                    downlink: connection?.downlink || "N/A",
                    rtt: connection?.rtt || "N/A",
                    saveData: connection?.saveData || false,
                    activeWifis: activeNetworks.map((n) => n.ssid),
                },
            });
            toast.success("Test WiFi berhasil!");
        } catch (error) {
            console.error("WiFi test error:", error);
            setWifiTestResult({
                success: false,
                message: "Gagal melakukan test WiFi",
                error: error.message,
            });
            toast.error("Test WiFi gagal");
        } finally {
            setTestingWifi(false);
        }
    };

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
        <div className="office-networks p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>WiFi Networks</h2>
                    <p className="text-muted">
                        Kelola daftar SSID WiFi kantor untuk validasi presensi
                    </p>
                </div>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Tambah WiFi
                </Button>
            </div>

            {/* Stats Cards */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center">
                                <div
                                    className="me-3"
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "12px",
                                        background:
                                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.5rem",
                                        color: "white",
                                    }}
                                >
                                    📶
                                </div>
                                <div>
                                    <p className="mb-1 text-muted">
                                        Total WiFi
                                    </p>
                                    <h3 className="mb-0">{stats.total}</h3>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center">
                                <div
                                    className="me-3"
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "12px",
                                        background:
                                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.5rem",
                                        color: "white",
                                    }}
                                >
                                    ✅
                                </div>
                                <div>
                                    <p className="mb-1 text-muted">Aktif</p>
                                    <h3 className="mb-0">{stats.active}</h3>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center">
                                <div
                                    className="me-3"
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "12px",
                                        background:
                                            "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.5rem",
                                        color: "white",
                                    }}
                                >
                                    ⏸️
                                </div>
                                <div>
                                    <p className="mb-1 text-muted">Nonaktif</p>
                                    <h3 className="mb-0">{stats.inactive}</h3>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Networks Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body>
                    {networks.length === 0 ? (
                        <div className="text-center py-5">
                            <div
                                style={{ fontSize: "4rem", opacity: 0.3 }}
                                className="mb-3"
                            >
                                📶
                            </div>
                            <h5 className="text-muted">
                                Belum ada WiFi terdaftar
                            </h5>
                            <p className="text-muted">
                                Tambahkan SSID WiFi kantor untuk validasi
                                presensi
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th style={{ width: "5%" }}>#</th>
                                        <th style={{ width: "25%" }}>SSID</th>
                                        <th style={{ width: "35%" }}>
                                            Deskripsi
                                        </th>
                                        <th style={{ width: "15%" }}>Status</th>
                                        <th
                                            style={{ width: "20%" }}
                                            className="text-end"
                                        >
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {networks.map((network, index) => (
                                        <tr key={network.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <strong>{network.ssid}</strong>
                                                {network.bssid && (
                                                    <small className="text-muted d-block mt-1">
                                                        <i className="bi bi-hdd-network me-1"></i>
                                                        {network.bssid}
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                {network.description || "-"}
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={
                                                        network.is_active
                                                            ? "success"
                                                            : "secondary"
                                                    }
                                                    className="me-1"
                                                >
                                                    {network.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </Badge>
                                                {network.is_testing && (
                                                    <Badge
                                                        bg="warning"
                                                        text="dark"
                                                    >
                                                        <i className="bi bi-flask me-1"></i>
                                                        Testing
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                <Button
                                                    variant={
                                                        network.is_active
                                                            ? "outline-warning"
                                                            : "outline-success"
                                                    }
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            network
                                                        )
                                                    }
                                                >
                                                    <i
                                                        className={`bi bi-${
                                                            network.is_active
                                                                ? "pause"
                                                                : "play"
                                                        }-circle`}
                                                    ></i>
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() =>
                                                        handleOpenModal(network)
                                                    }
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(network.id)
                                                    }
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editMode ? "Edit WiFi" : "Tambah WiFi"}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                SSID WiFi <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Contoh: OFFICE-WIFI-5G"
                                value={currentNetwork.ssid}
                                onChange={(e) =>
                                    setCurrentNetwork({
                                        ...currentNetwork,
                                        ssid: e.target.value,
                                    })
                                }
                                required
                            />
                            <Form.Text className="text-muted">
                                Nama WiFi yang akan divalidasi untuk presensi
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Deskripsi</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Deskripsi lokasi atau keterangan WiFi"
                                value={currentNetwork.description}
                                onChange={(e) =>
                                    setCurrentNetwork({
                                        ...currentNetwork,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                BSSID / MAC Address (Opsional)
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="00:11:22:33:44:55 atau 127.0.0.1"
                                value={currentNetwork.bssid || ""}
                                onChange={(e) =>
                                    setCurrentNetwork({
                                        ...currentNetwork,
                                        bssid: e.target.value,
                                    })
                                }
                            />
                            <Form.Text className="text-muted">
                                MAC Address WiFi atau IP untuk mode testing
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                label="WiFi Aktif"
                                checked={currentNetwork.is_active}
                                onChange={(e) =>
                                    setCurrentNetwork({
                                        ...currentNetwork,
                                        is_active: e.target.checked,
                                    })
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="🧪 Mode Testing (Bypass validasi SSID, hanya cek IP localhost)"
                                checked={currentNetwork.is_testing || false}
                                onChange={(e) =>
                                    setCurrentNetwork({
                                        ...currentNetwork,
                                        is_testing: e.target.checked,
                                    })
                                }
                            />
                            <Form.Text className="text-muted d-block">
                                Aktifkan untuk testing di environment
                                development (localhost)
                            </Form.Text>
                        </Form.Group>

                        {/* WiFi Testing in Modal */}
                        <div className="mt-3 p-3 bg-light rounded">
                            <h6 className="mb-2">
                                <i className="bi bi-shield-check me-2 text-primary"></i>
                                Test Koneksi WiFi
                            </h6>
                            <p className="small text-muted mb-2">
                                Test koneksi jaringan untuk memastikan SSID
                                dapat terdeteksi
                            </p>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleTestWifi}
                                disabled={testingWifi}
                                className="mb-2"
                            >
                                {testingWifi ? (
                                    <>
                                        <Spinner
                                            size="sm"
                                            className="me-2"
                                            animation="border"
                                        />
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-wifi me-2"></i>
                                        Test WiFi
                                    </>
                                )}
                            </Button>

                            {wifiTestResult && (
                                <Alert
                                    variant={
                                        wifiTestResult.success
                                            ? "success"
                                            : "danger"
                                    }
                                    className="mb-0 mt-2 small"
                                >
                                    <strong>
                                        {wifiTestResult.success ? "✅ " : "❌ "}
                                        {wifiTestResult.message}
                                    </strong>
                                    {wifiTestResult.details &&
                                        typeof wifiTestResult.details ===
                                            "object" && (
                                            <div className="mt-1">
                                                <div>
                                                    Type:{" "}
                                                    {
                                                        wifiTestResult.details
                                                            .type
                                                    }
                                                </div>
                                                <div>
                                                    Speed:{" "}
                                                    {
                                                        wifiTestResult.details
                                                            .downlink
                                                    }{" "}
                                                    Mbps
                                                </div>
                                                {wifiTestResult.details
                                                    .activeWifis && (
                                                    <div className="mt-1">
                                                        <strong>
                                                            WiFi Terdaftar:
                                                        </strong>
                                                        <ul className="mb-0 ps-3">
                                                            {wifiTestResult.details.activeWifis.map(
                                                                (ssid, idx) => (
                                                                    <li
                                                                        key={
                                                                            idx
                                                                        }
                                                                    >
                                                                        {ssid}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    {wifiTestResult.details &&
                                        typeof wifiTestResult.details ===
                                            "string" && (
                                            <div className="mt-1">
                                                {wifiTestResult.details}
                                            </div>
                                        )}
                                </Alert>
                            )}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Batal
                        </Button>
                        <Button variant="primary" type="submit">
                            {editMode ? "Update" : "Simpan"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default OfficeNetworks;
