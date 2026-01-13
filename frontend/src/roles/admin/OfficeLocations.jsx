import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

const OfficeLocations = () => {
    const [loading, setLoading] = useState(true);
    const [offices, setOffices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        ip_address: "",
        ip_range_start: "",
        ip_range_end: "",
        latitude: "",
        longitude: "",
        radius_meters: "100",
        is_active: true,
    });

    // Testing states
    const [testingLocation, setTestingLocation] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [testResult, setTestResult] = useState(null);

    const modalBodyRef = useRef(null);

    useEffect(() => {
        fetchOffices();
    }, []);

    useEffect(() => {
        if (showModal && modalBodyRef.current) {
            setTimeout(() => {
                modalBodyRef.current.scrollTop = 0;
            }, 100);
        }
    }, [showModal]);

    const fetchOffices = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/admin/office-networks");
            const data = Array.isArray(response.data)
                ? response.data
                : response.data.data || [];
            setOffices(data);
        } catch (error) {
            console.error("Error fetching offices:", error);
            toast.error("Gagal memuat data kantor");
            setOffices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error("Nama kantor wajib diisi");
            return;
        }

        // Validate at least one detection method
        const hasIP =
            formData.ip_address ||
            (formData.ip_range_start && formData.ip_range_end);
        const hasGPS = formData.latitude && formData.longitude;

        if (!hasIP && !hasGPS) {
            toast.error("Minimal harus mengisi IP Address ATAU Koordinat GPS");
            return;
        }

        try {
            if (editingId) {
                await axiosInstance.put(
                    `/admin/office-networks/${editingId}`,
                    formData
                );
                toast.success("Kantor berhasil diupdate");
            } else {
                await axiosInstance.post("/admin/office-networks", formData);
                toast.success("Kantor berhasil ditambahkan");
            }

            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchOffices();
        } catch (error) {
            console.error("Error saving office:", error);
            toast.error(
                error.response?.data?.message || "Gagal menyimpan data kantor"
            );
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            await axiosInstance.delete(
                `/admin/office-networks/${deleteTarget.id}`
            );
            toast.success("Kantor berhasil dihapus");
            setShowDeleteModal(false);
            setDeleteTarget(null);
            fetchOffices();
        } catch (error) {
            console.error("Error deleting office:", error);
            toast.error("Gagal menghapus data kantor");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            ip_address: "",
            ip_range_start: "",
            ip_range_end: "",
            latitude: "",
            longitude: "",
            radius_meters: "100",
            is_active: true,
        });
        setTestResult(null);
        setCurrentLocation(null);
    };

    const getCurrentGPS = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation tidak didukung browser ini");
            return;
        }

        setGettingLocation(true);
        toast.loading("Mengambil koordinat GPS...", { id: "gps" });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    latitude: position.coords.latitude.toFixed(8),
                    longitude: position.coords.longitude.toFixed(8),
                    accuracy: Math.round(position.coords.accuracy),
                };

                setFormData({
                    ...formData,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                });
                setCurrentLocation(coords);

                toast.success(
                    `GPS berhasil diambil (akurasi ±${coords.accuracy}m)`,
                    { id: "gps" }
                );
                setGettingLocation(false);
            },
            (error) => {
                let errorMsg = "Gagal mendapatkan lokasi GPS";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg =
                            "Akses GPS ditolak. Mohon izinkan akses GPS.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = "Informasi lokasi tidak tersedia";
                        break;
                    case error.TIMEOUT:
                        errorMsg = "Request lokasi timeout";
                        break;
                }
                toast.error(errorMsg, { id: "gps" });
                setGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const testOfficeDetection = async () => {
        // GPS tidak mandatory - bisa test dengan IP saja
        setTestingLocation(true);
        toast.loading("Melakukan test deteksi...", { id: "test-detection" });

        try {
            const payload = {};

            // GPS opsional
            if (formData.latitude && formData.longitude) {
                payload.latitude = parseFloat(formData.latitude);
                payload.longitude = parseFloat(formData.longitude);
            }

            const response = await axiosInstance.post(
                "/admin/office-networks/test-detection",
                payload
            );

            setTestResult(response.data);

            if (response.data.isOnsite) {
                toast.success(`✅ ONSITE Detected: ${response.data.reason}`, {
                    id: "test-detection",
                });
            } else {
                toast.error(`❌ OFFSITE Detected: ${response.data.reason}`, {
                    id: "test-detection",
                });
            }
        } catch (error) {
            console.error("Test detection error:", error);

            let errorMessage = "Gagal melakukan test deteksi";
            if (error.response) {
                if (error.response.status === 404) {
                    errorMessage =
                        "Endpoint pre-check tidak ditemukan. Pastikan backend sudah running.";
                } else if (error.response.status === 401) {
                    errorMessage = "Unauthorized. Silakan login kembali.";
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.request) {
                errorMessage =
                    "Tidak dapat terhubung ke server. Pastikan backend running di port 3001.";
            }

            toast.error(errorMessage, { id: "test-detection" });
        } finally {
            setTestingLocation(false);
        }
    };

    const detectCurrentIP = async () => {
        setTestingLocation(true);
        toast.loading("Mendeteksi IP Anda saat ini...", { id: "detect-ip" });

        try {
            // Call backend to get current IP
            const response = await axiosInstance.post(
                "/admin/office-networks/test-detection",
                {} // Empty payload - backend will detect IP from request
            );

            if (response.data.success) {
                // Get IP from backend detection
                // Since backend uses locationHelper.getClientIp(req), we'll get it from test
                toast.success("IP terdeteksi! Mengisi form...", {
                    id: "detect-ip",
                });

                // For now, show result and let admin input manually
                // Backend should return current IP info
                toast.success(
                    `Detection Method: ${
                        response.data.detectionMethod
                    }\nStatus: ${
                        response.data.isOnsite ? "ONSITE" : "OFFSITE"
                    }`,
                    { id: "detect-ip", duration: 5000 }
                );
            }
        } catch (error) {
            console.error("Detect IP error:", error);
            toast.error("Gagal mendeteksi IP. Silakan isi manual.", {
                id: "detect-ip",
            });
        } finally {
            setTestingLocation(false);
        }
    };

    const autoFillCurrentLocation = async () => {
        setTestingLocation(true);
        toast.loading("Auto-fill WiFi & GPS...", { id: "auto-fill" });

        try {
            // Get current IP from backend
            const ipResponse = await axiosInstance.get(
                "/admin/office-networks/my-ip"
            );

            if (ipResponse.data.success) {
                const ipData = ipResponse.data.data;

                // Update formData with IP info
                setFormData((prev) => ({
                    ...prev,
                    ip_address: ipData.ip,
                    ip_range_start: ipData.suggestedRange.start,
                    ip_range_end: ipData.suggestedRange.end,
                }));

                // Show IP info
                toast.success(
                    `✅ IP terdeteksi: ${ipData.ip}${
                        ipData.isLocal ? " (localhost)" : ""
                    }`,
                    { id: "auto-fill", duration: 3000 }
                );
            }

            // Get GPS
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const coords = {
                            latitude: position.coords.latitude.toFixed(8),
                            longitude: position.coords.longitude.toFixed(8),
                            accuracy: Math.round(position.coords.accuracy),
                        };

                        setFormData((prev) => ({
                            ...prev,
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                        }));
                        setCurrentLocation(coords);

                        toast.success(
                            `✅ WiFi & GPS berhasil terisi otomatis!\nIP: ${ipResponse.data.data.ip}\nGPS: ±${coords.accuracy}m`,
                            { id: "auto-fill", duration: 5000 }
                        );
                        setTestingLocation(false);
                    },
                    (error) => {
                        toast.success(
                            `✅ WiFi berhasil terisi! GPS tidak dapat diakses (opsional).`,
                            { id: "auto-fill", duration: 4000 }
                        );
                        setTestingLocation(false);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0,
                    }
                );
            } else {
                toast.success(
                    `✅ WiFi berhasil terisi! Browser tidak support GPS (opsional).`,
                    { id: "auto-fill", duration: 4000 }
                );
                setTestingLocation(false);
            }
        } catch (error) {
            console.error("Auto-fill error:", error);
            toast.error("Gagal auto-fill. Silakan isi manual.", {
                id: "auto-fill",
            });
            setTestingLocation(false);
        }
    };

    const stats = {
        total: offices.length,
        active: offices.filter((o) => o.is_active).length,
        inactive: offices.filter((o) => !o.is_active).length,
        hasIP: offices.filter((o) => o.ip_address || o.ip_range_start).length,
        hasGPS: offices.filter((o) => o.latitude && o.longitude).length,
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
        <div className="office-locations p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Manajemen Lokasi Kantor</h2>
                    <p className="text-muted mb-0">
                        Kelola WiFi dan GPS untuk deteksi ONSITE/OFFSITE
                    </p>
                </div>
                <button
                    className="btn btn-primary px-4"
                    onClick={() => {
                        setShowModal(true);
                        setEditingId(null);
                        resetForm();
                    }}
                >
                    <i className="bi bi-plus-circle me-2"></i>
                    Tambah Kantor
                </button>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-building fs-1 me-3"></i>
                                <div>
                                    <h3 className="mb-0">{stats.total}</h3>
                                    <small>Total Kantor</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-check-circle fs-1 me-3"></i>
                                <div>
                                    <h3 className="mb-0">{stats.active}</h3>
                                    <small>Aktif</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-info text-white">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-wifi fs-1 me-3"></i>
                                <div>
                                    <h3 className="mb-0">{stats.hasIP}</h3>
                                    <small>WiFi/IP Configured</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-warning text-white">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-geo-alt fs-1 me-3"></i>
                                <div>
                                    <h3 className="mb-0">{stats.hasGPS}</h3>
                                    <small>GPS Configured</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Office List */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        Daftar Lokasi Kantor
                    </h5>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="px-4">Nama Kantor</th>
                                    <th>WiFi/IP Detection</th>
                                    <th>GPS Detection</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offices.length > 0 ? (
                                    offices.map((office) => (
                                        <tr key={office.id}>
                                            <td className="px-4">
                                                <div>
                                                    <strong className="d-block">
                                                        {office.name}
                                                    </strong>
                                                    {office.description && (
                                                        <small className="text-muted">
                                                            {office.description}
                                                        </small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {office.ip_address ? (
                                                    <div>
                                                        <span className="badge bg-info me-2">
                                                            <i className="bi bi-wifi me-1"></i>
                                                            IP
                                                        </span>
                                                        <small className="text-muted d-block mt-1">
                                                            {office.ip_address}
                                                        </small>
                                                    </div>
                                                ) : office.ip_range_start &&
                                                  office.ip_range_end ? (
                                                    <div>
                                                        <span className="badge bg-info me-2">
                                                            <i className="bi bi-diagram-3 me-1"></i>
                                                            IP Range
                                                        </span>
                                                        <small className="text-muted d-block mt-1">
                                                            {
                                                                office.ip_range_start
                                                            }{" "}
                                                            -{" "}
                                                            {
                                                                office.ip_range_end
                                                            }
                                                        </small>
                                                    </div>
                                                ) : (
                                                    <span className="badge bg-secondary">
                                                        Tidak dikonfigurasi
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {office.latitude &&
                                                office.longitude ? (
                                                    <div>
                                                        <span className="badge bg-warning text-dark me-2">
                                                            <i className="bi bi-geo-alt me-1"></i>
                                                            GPS
                                                        </span>
                                                        <small className="text-muted d-block mt-1">
                                                            Radius:{" "}
                                                            {
                                                                office.radius_meters
                                                            }
                                                            m
                                                        </small>
                                                    </div>
                                                ) : (
                                                    <span className="badge bg-secondary">
                                                        Tidak dikonfigurasi
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <span
                                                    className={`badge bg-${
                                                        office.is_active
                                                            ? "success"
                                                            : "danger"
                                                    }`}
                                                >
                                                    {office.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => {
                                                            setEditingId(
                                                                office.id
                                                            );
                                                            setFormData({
                                                                name: office.name,
                                                                description:
                                                                    office.description ||
                                                                    "",
                                                                ip_address:
                                                                    office.ip_address ||
                                                                    "",
                                                                ip_range_start:
                                                                    office.ip_range_start ||
                                                                    "",
                                                                ip_range_end:
                                                                    office.ip_range_end ||
                                                                    "",
                                                                latitude:
                                                                    office.latitude ||
                                                                    "",
                                                                longitude:
                                                                    office.longitude ||
                                                                    "",
                                                                radius_meters:
                                                                    office.radius_meters ||
                                                                    "100",
                                                                is_active:
                                                                    office.is_active,
                                                            });
                                                            setShowModal(true);
                                                        }}
                                                        title="Edit"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger"
                                                        onClick={() => {
                                                            setDeleteTarget(
                                                                office
                                                            );
                                                            setShowDeleteModal(
                                                                true
                                                            );
                                                        }}
                                                        title="Hapus"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="text-center py-5"
                                        >
                                            <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                                            <p className="text-muted mb-0">
                                                Belum ada lokasi kantor
                                                terdaftar
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowModal(false);
                            setEditingId(null);
                            resetForm();
                        }
                    }}
                >
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-primary text-white border-0">
                                <h5 className="modal-title d-flex align-items-center">
                                    <i
                                        className={`bi ${
                                            editingId
                                                ? "bi-pencil-square"
                                                : "bi-plus-circle"
                                        } me-2`}
                                    ></i>
                                    {editingId
                                        ? "Edit Lokasi Kantor"
                                        : "Tambah Lokasi Kantor"}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingId(null);
                                        resetForm();
                                    }}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div
                                    className="modal-body"
                                    ref={modalBodyRef}
                                    style={{
                                        maxHeight: "70vh",
                                        overflowY: "auto",
                                    }}
                                >
                                    {/* Basic Info */}
                                    <div className="border-bottom pb-4 mb-4">
                                        <h6 className="text-primary mb-3">
                                            <i className="bi bi-info-circle me-2"></i>
                                            Informasi Dasar
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-md-8">
                                                <label className="form-label fw-semibold">
                                                    Nama Kantor{" "}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.name}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            name: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Contoh: Kantor Pusat Jakarta"
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">
                                                    Status
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={formData.is_active}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            is_active:
                                                                e.target
                                                                    .value ===
                                                                "true",
                                                        })
                                                    }
                                                >
                                                    <option value="true">
                                                        Aktif
                                                    </option>
                                                    <option value="false">
                                                        Nonaktif
                                                    </option>
                                                </select>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-semibold">
                                                    Deskripsi (Opsional)
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    rows="2"
                                                    value={formData.description}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            description:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Contoh: Gedung A Lantai 5, Jakarta Selatan"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    {/* WiFi/IP Detection */}
                                    <div className="border-bottom pb-4 mb-4">
                                        <h6 className="text-info mb-2">
                                            <i className="bi bi-wifi me-2"></i>
                                            WiFi/IP Detection (Priority 1)
                                        </h6>
                                        
                                        {/* Auto-Fill Button - Primary Action */}
                                        <div className="alert alert-primary bg-light border-primary mb-3">
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                <div>
                                                    <i className="bi bi-magic me-2"></i>
                                                    <strong>Quick Start:</strong> Deteksi otomatis lokasi Anda saat ini
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={
                                                        autoFillCurrentLocation
                                                    }
                                                    disabled={testingLocation}
                                                >
                                                    {testingLocation ? (
                                                        <>
                                                            <span
                                                                className="spinner-border spinner-border-sm me-2"
                                                                role="status"
                                                            ></span>
                                                            Detecting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-radar me-2"></i>
                                                            Auto-Fill WiFi & GPS
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <small className="text-muted d-block mt-2">
                                                Akan mengisi IP Address, IP Range, dan GPS secara otomatis
                                            </small>
                                        </div>
                                        
                                        <p className="text-muted small mb-3">
                                            User yang terhubung ke WiFi kantor akan otomatis terdeteksi ONSITE. Anda bisa mengisi manual atau gunakan tombol Auto-Fill di atas.
                                        </p>

                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label">
                                                    IP Address Langsung
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.ip_address}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            ip_address:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="192.168.1.100"
                                                />
                                                <small className="text-muted">
                                                    Untuk IP static/gateway
                                                </small>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">
                                                    IP Range Start
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={
                                                        formData.ip_range_start
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            ip_range_start:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="192.168.1.1"
                                                />
                                                <small className="text-muted">
                                                    Range awal subnet
                                                </small>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">
                                                    IP Range End
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={
                                                        formData.ip_range_end
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            ip_range_end:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="192.168.1.254"
                                                />
                                                <small className="text-muted">
                                                    Range akhir subnet
                                                </small>
                                            </div>
                                        </div>

                                        <div className="alert alert-info mt-3 mb-0">
                                            <i className="bi bi-lightbulb me-2"></i>
                                            <strong>Tips WiFi/IP:</strong>
                                            <ul className="mb-0 mt-2">
                                                <li><strong>IP Address:</strong> Gunakan untuk single IP static (router/gateway)</li>
                                                <li><strong>IP Range:</strong> Gunakan untuk subnet kantor (contoh: 192.168.1.1 - 192.168.1.254)</li>
                                                <li><strong>Auto-Fill:</strong> Klik tombol "Auto-Fill WiFi & GPS" untuk otomatis terisi dengan IP dan GPS saat ini</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* GPS Detection */}
                                    <div className="pb-3">
                                        <h6 className="text-warning mb-2">
                                            <i className="bi bi-geo-alt me-2"></i>
                                            GPS Detection (Priority 2 - Optional)
                                        </h6>
                                        <p className="text-muted small mb-3">
                                            User yang berada dalam radius kantor
                                            akan terdeteksi ONSITE (jika bukan
                                            WiFi kantor). GPS bersifat <strong>opsional</strong> dan hanya sebagai validasi tambahan.
                                            <br/>
                                            <em>💡 Tip: Gunakan tombol "Auto-Fill WiFi & GPS" di atas untuk mengisi GPS secara otomatis.</em>
                                        </p>

                                        <div className="row g-3 mb-3">
                                            <div className="col-md-5">
                                                <label className="form-label">
                                                    Latitude
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.latitude}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            latitude:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="-6.200000"
                                                />
                                                <small className="text-muted">
                                                    <a 
                                                        href="#" 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            getCurrentGPS();
                                                        }}
                                                        className="text-decoration-none"
                                                    >
                                                        <i className="bi bi-crosshair me-1"></i>
                                                        Ambil dari lokasi saat ini
                                                    </a>
                                                </small>
                                            </div>
                                            <div className="col-md-5">
                                                <label className="form-label">
                                                    Longitude
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.longitude}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            longitude:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="106.816666"
                                                />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label">
                                                    Radius (m)
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={
                                                        formData.radius_meters
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            radius_meters:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="100"
                                                    min="10"
                                                    max="5000"
                                                />
                                            </div>
                                        </div>

                                        <div className="d-flex gap-2 mb-3 flex-wrap">
                                            <button
                                                type="button"
                                                className="btn btn-outline-success"
                                                onClick={testOfficeDetection}
                                                disabled={testingLocation}
                                            >
                                                {testingLocation ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Testing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check-circle me-2"></i>
                                                        Test Deteksi (WiFi
                                                        Priority)
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="alert alert-info mb-3">
                                            <i className="bi bi-info-circle me-2"></i>
                                            <strong>Cara Test:</strong>
                                            <ul className="mb-0 mt-2">
                                                <li>
                                                    <strong>
                                                        WiFi Detection (Priority
                                                        1):
                                                    </strong>{" "}
                                                    Klik "Test Deteksi" untuk
                                                    cek IP Anda saat ini
                                                </li>
                                                <li>
                                                    <strong>
                                                        GPS Detection (Priority
                                                        2):
                                                    </strong>{" "}
                                                    Isi GPS atau klik "Ambil
                                                    GPS" lalu "Test Deteksi"
                                                </li>
                                                <li>
                                                    <strong>
                                                        Best Practice:
                                                    </strong>{" "}
                                                    WiFi/IP sebagai prioritas
                                                    utama, GPS opsional untuk
                                                    validasi tambahan
                                                </li>
                                            </ul>
                                        </div>

                                        {currentLocation && (
                                            <div className="alert alert-success">
                                                <i className="bi bi-check-circle me-2"></i>
                                                <strong>GPS Berhasil:</strong>{" "}
                                                {currentLocation.latitude},{" "}
                                                {currentLocation.longitude}
                                                <span className="ms-2 badge bg-success">
                                                    Akurasi: ±
                                                    {currentLocation.accuracy}m
                                                </span>
                                            </div>
                                        )}

                                        {testResult && (
                                            <div
                                                className={`alert ${
                                                    testResult.isOnsite
                                                        ? "alert-success"
                                                        : "alert-danger"
                                                }`}
                                            >
                                                <h6 className="alert-heading">
                                                    {testResult.isOnsite ? (
                                                        <>
                                                            <i className="bi bi-check-circle me-2"></i>
                                                            ONSITE Detected
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-x-circle me-2"></i>
                                                            OFFSITE Detected
                                                        </>
                                                    )}
                                                </h6>
                                                <p className="mb-2">
                                                    <strong>Reason:</strong>{" "}
                                                    {testResult.reason}
                                                </p>
                                                {testResult.office && (
                                                    <p className="mb-2">
                                                        <strong>Office:</strong>{" "}
                                                        {testResult.office.name}
                                                    </p>
                                                )}
                                                {testResult.distance !==
                                                    null && (
                                                    <p className="mb-0">
                                                        <strong>
                                                            Distance:
                                                        </strong>{" "}
                                                        {testResult.distance}m
                                                        dari kantor
                                                    </p>
                                                )}
                                                <p className="mb-0 mt-2">
                                                    <span className="badge bg-info">
                                                        Method:{" "}
                                                        {
                                                            testResult.detectionMethod
                                                        }
                                                    </span>
                                                </p>
                                            </div>
                                        )}

                                        <div className="alert alert-warning mb-0">
                                            <i className="bi bi-exclamation-triangle me-2"></i>
                                            <strong>Best Practice:</strong>
                                            <br />•{" "}
                                            <strong>
                                                WiFi/IP (Priority 1):
                                            </strong>{" "}
                                            Deteksi paling reliable, tidak perlu
                                            GPS presisi
                                            <br />•{" "}
                                            <strong>
                                                GPS (Priority 2):
                                            </strong>{" "}
                                            Opsional, untuk user yang tidak di
                                            WiFi kantor
                                            <br />• <strong>
                                                ONSITE:
                                            </strong>{" "}
                                            Tidak perlu foto/keterangan -
                                            langsung check-in
                                            <br />• <strong>
                                                OFFSITE:
                                            </strong>{" "}
                                            Wajib foto + keterangan untuk
                                            validasi
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-top">
                                    <button
                                        type="button"
                                        className="btn btn-secondary px-4"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingId(null);
                                            resetForm();
                                        }}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4"
                                    >
                                        <i className="bi bi-save me-2"></i>
                                        {editingId ? "Update" : "Simpan"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deleteTarget && (
                <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDeleteModal(false);
                            setDeleteTarget(null);
                        }
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-danger text-white border-0">
                                <h5 className="modal-title d-flex align-items-center">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    Konfirmasi Hapus Kantor
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteTarget(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <i
                                        className="bi bi-trash-fill text-danger"
                                        style={{ fontSize: "4rem" }}
                                    ></i>
                                </div>
                                <p className="text-center mb-3">
                                    Apakah Anda yakin ingin menghapus kantor:
                                </p>
                                <div className="alert alert-warning border-warning">
                                    <h6 className="mb-1">
                                        <i className="bi bi-building me-2"></i>
                                        {deleteTarget.name}
                                    </h6>
                                    {deleteTarget.description && (
                                        <small className="text-muted">
                                            {deleteTarget.description}
                                        </small>
                                    )}
                                </div>
                                <div className="alert alert-danger">
                                    <i className="bi bi-exclamation-circle-fill me-2"></i>
                                    <strong>Perhatian:</strong> Tindakan ini
                                    tidak dapat dibatalkan. User tidak akan bisa
                                    terdeteksi ONSITE di lokasi ini.
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-top">
                                <button
                                    type="button"
                                    className="btn btn-secondary px-4"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteTarget(null);
                                    }}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger px-4"
                                    onClick={handleDelete}
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

export default OfficeLocations;
