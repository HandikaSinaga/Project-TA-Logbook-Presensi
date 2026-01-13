import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { Card, Row, Col, Button, Alert, Spinner } from "react-bootstrap";

const AdminLocations = () => {
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        radius: "100",
    });

    // GPS Testing state
    const [testingLocation, setTestingLocation] = useState(false);
    const [locationTestResult, setLocationTestResult] = useState(null);

    useEffect(() => {
        fetchLocations();
    }, []);

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

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/admin/locations");
            setLocations(response.data);
        } catch (error) {
            console.error("Error fetching locations:", error);
            toast.error("Gagal memuat lokasi");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axiosInstance.put(
                    `/admin/locations/${editingId}`,
                    formData
                );
                toast.success("Lokasi berhasil diupdate");
            } else {
                await axiosInstance.post("/admin/locations", formData);
                toast.success("Lokasi berhasil ditambahkan");
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({
                name: "",
                address: "",
                latitude: "",
                longitude: "",
                radius: "100",
            });
            fetchLocations();
        } catch (error) {
            console.error("Error saving location:", error);
            toast.error(
                error.response?.data?.message || "Gagal menyimpan lokasi"
            );
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus lokasi ini?")) return;
        try {
            await axiosInstance.delete(`/admin/locations/${id}`);
            toast.success("Lokasi berhasil dihapus");
            fetchLocations();
        } catch (error) {
            console.error("Error deleting location:", error);
            toast.error("Gagal menghapus lokasi");
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation tidak didukung browser ini");
            return;
        }

        toast.loading("Mengambil lokasi saat ini...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                toast.dismiss();
                setFormData({
                    ...formData,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                });
                toast.success("Koordinat berhasil diambil");
            },
            (error) => {
                toast.dismiss();
                console.error("Error getting location:", error);
                toast.error("Gagal mengambil lokasi");
            }
        );
    };

    const handleTestLocation = () => {
        if (!navigator.geolocation) {
            setLocationTestResult({
                success: false,
                message: "Browser tidak mendukung Geolocation API",
                details: "Gunakan browser modern seperti Chrome atau Firefox",
            });
            toast.error("Geolocation tidak didukung");
            return;
        }

        setTestingLocation(true);
        setLocationTestResult(null);
        toast.loading("Testing GPS...", { id: "location-test" });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                    accuracy: Math.round(position.coords.accuracy),
                    altitude: position.coords.altitude
                        ? position.coords.altitude.toFixed(2)
                        : "N/A",
                    timestamp: new Date(
                        position.timestamp
                    ).toLocaleTimeString(),
                };

                setLocationTestResult({
                    success: true,
                    message: "GPS berhasil terdeteksi!",
                    details: coords,
                });

                toast.success(`GPS detected! Accuracy: ±${coords.accuracy}m`, {
                    id: "location-test",
                });
                setTestingLocation(false);
            },
            (error) => {
                let errorMsg = "Gagal mendapatkan lokasi GPS";
                let errorDetails = "";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorDetails =
                            "Akses GPS ditolak. Mohon izinkan akses lokasi di browser.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorDetails = "Informasi lokasi tidak tersedia.";
                        break;
                    case error.TIMEOUT:
                        errorDetails = "Request timeout. Coba lagi.";
                        break;
                    default:
                        errorDetails = error.message;
                }

                setLocationTestResult({
                    success: false,
                    message: errorMsg,
                    details: errorDetails,
                });

                toast.error(errorDetails, { id: "location-test" });
                setTestingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
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
        <div className="admin-locations p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Manajemen Lokasi Kantor</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowModal(true)}
                >
                    <i className="bi bi-plus-circle me-2"></i>
                    Tambah Lokasi
                </button>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Nama Lokasi</th>
                                    <th>Alamat</th>
                                    <th>Koordinat</th>
                                    <th>Radius (m)</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.length > 0 ? (
                                    locations.map((location) => (
                                        <tr key={location.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-geo-alt-fill text-danger me-2 fs-5"></i>
                                                    <strong>
                                                        {location.name}
                                                    </strong>
                                                </div>
                                            </td>
                                            <td>{location.address}</td>
                                            <td>
                                                <small className="text-muted">
                                                    {location.latitude},{" "}
                                                    {location.longitude}
                                                </small>
                                            </td>
                                            <td>
                                                <span className="badge bg-primary">
                                                    {location.radius}m
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => {
                                                            setEditingId(
                                                                location.id
                                                            );
                                                            setFormData({
                                                                name: location.name,
                                                                address:
                                                                    location.address,
                                                                latitude:
                                                                    location.latitude,
                                                                longitude:
                                                                    location.longitude,
                                                                radius: location.radius,
                                                            });
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger"
                                                        onClick={() =>
                                                            handleDelete(
                                                                location.id
                                                            )
                                                        }
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
                                            className="text-center text-muted py-4"
                                        >
                                            Belum ada lokasi
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowModal(false);
                            setEditingId(null);
                        }
                    }}
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingId
                                        ? "Edit Lokasi"
                                        : "Tambah Lokasi"}
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
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Nama Lokasi
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Alamat
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            value={formData.address}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    address: e.target.value,
                                                })
                                            }
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Latitude
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="form-control"
                                                value={formData.latitude}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        latitude:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                Longitude
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="form-control"
                                                value={formData.longitude}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        longitude:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={getCurrentLocation}
                                        >
                                            <i className="bi bi-crosshair me-2"></i>
                                            Gunakan Lokasi Saat Ini
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-success"
                                            onClick={handleTestLocation}
                                            disabled={testingLocation}
                                        >
                                            {testingLocation ? (
                                                <>
                                                    <Spinner
                                                        size="sm"
                                                        className="me-2"
                                                        animation="border"
                                                    />
                                                    Testing GPS...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-shield-check me-2"></i>
                                                    Test GPS
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {locationTestResult && (
                                        <Alert
                                            variant={
                                                locationTestResult.success
                                                    ? "success"
                                                    : "danger"
                                            }
                                            className="mb-3"
                                        >
                                            <strong>
                                                {locationTestResult.success
                                                    ? "✅ "
                                                    : "❌ "}
                                                {locationTestResult.message}
                                            </strong>
                                            {locationTestResult.details &&
                                                typeof locationTestResult.details ===
                                                    "object" && (
                                                    <div className="mt-2 small">
                                                        <div>
                                                            <strong>
                                                                Lat:
                                                            </strong>{" "}
                                                            {
                                                                locationTestResult
                                                                    .details
                                                                    .latitude
                                                            }
                                                        </div>
                                                        <div>
                                                            <strong>
                                                                Lng:
                                                            </strong>{" "}
                                                            {
                                                                locationTestResult
                                                                    .details
                                                                    .longitude
                                                            }
                                                        </div>
                                                        <div>
                                                            <strong>
                                                                Accuracy:
                                                            </strong>{" "}
                                                            ±
                                                            {
                                                                locationTestResult
                                                                    .details
                                                                    .accuracy
                                                            }
                                                            m
                                                        </div>
                                                    </div>
                                                )}
                                            {locationTestResult.details &&
                                                typeof locationTestResult.details ===
                                                    "string" && (
                                                    <div className="mt-1 small">
                                                        {
                                                            locationTestResult.details
                                                        }
                                                    </div>
                                                )}
                                        </Alert>
                                    )}

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Radius (meter)
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.radius}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    radius: e.target.value,
                                                })
                                            }
                                            required
                                            min="10"
                                        />
                                        <small className="text-muted">
                                            Jarak maksimal untuk presensi
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingId(null);
                                        }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        <i className="bi bi-save me-2"></i>
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLocations;
