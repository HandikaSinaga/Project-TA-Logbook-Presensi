import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl } from "../../utils/Constant";
import toast from "react-hot-toast";

const SupervisorLeave = () => {
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [filter, setFilter] = useState("pending");

    useEffect(() => {
        fetchLeaves();
    }, [filter]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(
                `/supervisor/izin?status=${filter}`
            );
            const data = response.data.data || response.data || [];
            setLeaves(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching leaves:", error);
            toast.error("Gagal memuat izin");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axiosInstance.put(`/supervisor/izin/${id}/approve`);
            toast.success("Izin disetujui");
            fetchLeaves();
            setShowModal(false);
        } catch (error) {
            console.error("Error approving leave:", error);
            toast.error("Gagal menyetujui izin");
        }
    };

    const handleReject = async (id) => {
        if (!rejectionReason.trim()) {
            toast.error("Alasan penolakan wajib diisi");
            return;
        }

        try {
            await axiosInstance.put(`/supervisor/izin/${id}/reject`, {
                rejection_reason: rejectionReason,
            });
            toast.success("Izin ditolak");
            fetchLeaves();
            setShowModal(false);
            setShowRejectModal(false);
            setRejectionReason("");
        } catch (error) {
            console.error("Error rejecting leave:", error);
            toast.error("Gagal menolak izin");
        }
    };

    const openRejectModal = (leave) => {
        setSelectedLeave(leave);
        setShowRejectModal(true);
        setShowModal(false);
    };

    const getTypeBadge = (type) => {
        const badges = {
            leave: "primary",
            sick: "warning",
            permission: "info",
        };
        return badges[type] || "secondary";
    };

    const getStatusBadge = (status) => {
        const badges = {
            approved: "success",
            pending: "warning",
            rejected: "danger",
        };
        return badges[status] || "secondary";
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
        <div className="supervisor-leave p-4">
            <h2 className="mb-4">Persetujuan Izin/Cuti</h2>

            {/* Filters */}
            <div className="btn-group mb-4" role="group">
                <button
                    type="button"
                    className={`btn ${
                        filter === "pending"
                            ? "btn-warning"
                            : "btn-outline-warning"
                    }`}
                    onClick={() => setFilter("pending")}
                >
                    <i className="bi bi-clock me-2"></i>
                    Pending
                </button>
                <button
                    type="button"
                    className={`btn ${
                        filter === "approved"
                            ? "btn-success"
                            : "btn-outline-success"
                    }`}
                    onClick={() => setFilter("approved")}
                >
                    <i className="bi bi-check-circle me-2"></i>
                    Approved
                </button>
                <button
                    type="button"
                    className={`btn ${
                        filter === "rejected"
                            ? "btn-danger"
                            : "btn-outline-danger"
                    }`}
                    onClick={() => setFilter("rejected")}
                >
                    <i className="bi bi-x-circle me-2"></i>
                    Rejected
                </button>
            </div>

            {/* Leave Requests */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>User</th>
                                    <th>Tipe</th>
                                    <th>Tanggal</th>
                                    <th>Durasi</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.length > 0 ? (
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
                                                        width="32"
                                                        height="32"
                                                        style={{
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
                                                    {leave.user?.name}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge bg-${getTypeBadge(
                                                        leave.type
                                                    )}`}
                                                >
                                                    {leave.type}
                                                </span>
                                            </td>
                                            <td>
                                                <small>
                                                    {new Date(
                                                        leave.start_date
                                                    ).toLocaleDateString(
                                                        "id-ID"
                                                    )}{" "}
                                                    -{" "}
                                                    {new Date(
                                                        leave.end_date
                                                    ).toLocaleDateString(
                                                        "id-ID"
                                                    )}
                                                </small>
                                            </td>
                                            <td>{leave.days} hari</td>
                                            <td>
                                                <span
                                                    className={`badge bg-${getStatusBadge(
                                                        leave.status
                                                    )}`}
                                                >
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => {
                                                            setSelectedLeave(
                                                                leave
                                                            );
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                    {leave.status ===
                                                        "pending" && (
                                                        <>
                                                            <button
                                                                className="btn btn-outline-success"
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        leave.id
                                                                    )
                                                                }
                                                            >
                                                                <i className="bi bi-check"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-danger"
                                                                onClick={() =>
                                                                    openRejectModal(
                                                                        leave
                                                                    )
                                                                }
                                                            >
                                                                <i className="bi bi-x"></i>
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
                                            className="text-center text-muted py-4"
                                        >
                                            Tidak ada permintaan izin {filter}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showModal && selectedLeave && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowModal(false);
                        }
                    }}
                >
                    <div className="modal-dialog modal-lg">
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
                                        <i className="bi bi-calendar-check text-primary fs-4"></i>
                                    </div>
                                    <span>Detail Izin/Cuti</span>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <strong>User:</strong>{" "}
                                    {selectedLeave.user?.name}
                                </div>
                                <div className="mb-3">
                                    <strong>Tipe:</strong>{" "}
                                    <span
                                        className={`badge bg-${getTypeBadge(
                                            selectedLeave.type
                                        )}`}
                                    >
                                        {selectedLeave.type}
                                    </span>
                                </div>
                                <div className="mb-3">
                                    <strong>Tanggal:</strong>{" "}
                                    {new Date(
                                        selectedLeave.start_date
                                    ).toLocaleDateString("id-ID")}{" "}
                                    -{" "}
                                    {new Date(
                                        selectedLeave.end_date
                                    ).toLocaleDateString("id-ID")}
                                </div>
                                <div className="mb-3">
                                    <strong>Durasi:</strong>{" "}
                                    {selectedLeave.days} hari
                                </div>
                                <div className="mb-3">
                                    <strong>Alasan:</strong>
                                    <p className="mt-2">
                                        {selectedLeave.reason}
                                    </p>
                                </div>
                                {selectedLeave.attachment && (
                                    <div className="mb-3">
                                        <strong>Lampiran:</strong>
                                        <br />
                                        <a
                                            href={selectedLeave.attachment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-outline-primary mt-2"
                                        >
                                            <i className="bi bi-download me-2"></i>
                                            Lihat File
                                        </a>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <strong>Status:</strong>{" "}
                                    <span
                                        className={`badge bg-${getStatusBadge(
                                            selectedLeave.status
                                        )}`}
                                    >
                                        {selectedLeave.status}
                                    </span>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Tutup
                                </button>
                                {selectedLeave.status === "pending" && (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() =>
                                                openRejectModal(selectedLeave)
                                            }
                                        >
                                            <i className="bi bi-x-circle me-2"></i>
                                            Tolak
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={() =>
                                                handleApprove(selectedLeave.id)
                                            }
                                        >
                                            <i className="bi bi-check-circle me-2"></i>
                                            Setujui
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal with Reason */}
            {showRejectModal && selectedLeave && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowRejectModal(false);
                            setRejectionReason("");
                        }
                    }}
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    <i className="bi bi-x-circle me-2"></i>
                                    Tolak Pengajuan Izin
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectionReason("");
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-warning">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    Anda akan menolak pengajuan izin dari{" "}
                                    <strong>{selectedLeave.user?.name}</strong>
                                </div>

                                <div className="mb-3">
                                    <strong>Tanggal Izin:</strong>
                                    <br />
                                    {new Date(
                                        selectedLeave.start_date
                                    ).toLocaleDateString("id-ID")}{" "}
                                    -{" "}
                                    {new Date(
                                        selectedLeave.end_date
                                    ).toLocaleDateString("id-ID")}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">
                                        Alasan Penolakan{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        placeholder="Jelaskan alasan penolakan izin ini..."
                                        value={rejectionReason}
                                        onChange={(e) =>
                                            setRejectionReason(e.target.value)
                                        }
                                    ></textarea>
                                    <small className="text-muted">
                                        Alasan ini akan dilihat oleh user
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectionReason("");
                                    }}
                                >
                                    <i className="bi bi-arrow-left me-2"></i>
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() =>
                                        handleReject(selectedLeave.id)
                                    }
                                    disabled={!rejectionReason.trim()}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Tolak Izin
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorLeave;
