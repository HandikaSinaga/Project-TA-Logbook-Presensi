import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl } from "../../utils/Constant";
import toast from "react-hot-toast";

const SupervisorLogbook = () => {
    const [loading, setLoading] = useState(true);
    const [logbooks, setLogbooks] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedLogbook, setSelectedLogbook] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [filter, setFilter] = useState("pending");

    useEffect(() => {
        fetchLogbooks();
    }, [filter]);

    // Auto-scroll detail modal to top when opened
    useEffect(() => {
        if (showDetailModal) {
            setTimeout(() => {
                const modalBody = document.querySelector(".modal-body");
                if (modalBody) {
                    modalBody.scrollTop = 0;
                }
            }, 100);
        }
    }, [showDetailModal]);

    // Auto-scroll feedback modal to top when opened
    useEffect(() => {
        if (showFeedbackModal) {
            setTimeout(() => {
                const modalBody = document.querySelector(".modal-body");
                if (modalBody) {
                    modalBody.scrollTop = 0;
                }
            }, 100);
        }
    }, [showFeedbackModal]);

    const fetchLogbooks = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(
                `/supervisor/logbook?status=${filter}`
            );
            const data = response.data.data || response.data || [];
            setLogbooks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching logbooks:", error);
            toast.error("Gagal memuat logbook");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axiosInstance.put(`/supervisor/logbook/${id}/approve`);
            toast.success("Logbook disetujui");
            fetchLogbooks();
            setShowDetailModal(false);
        } catch (error) {
            console.error("Error approving logbook:", error);
            toast.error("Gagal menyetujui logbook");
        }
    };

    const handleReject = async () => {
        if (!feedback.trim()) {
            toast.error("Harap isi alasan penolakan");
            return;
        }
        try {
            await axiosInstance.put(
                `/supervisor/logbook/${selectedLogbook.id}/reject`,
                { feedback }
            );
            toast.success("Logbook ditolak");
            fetchLogbooks();
            setShowFeedbackModal(false);
            setFeedback("");
        } catch (error) {
            console.error("Error rejecting logbook:", error);
            toast.error("Gagal menolak logbook");
        }
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
        <div className="supervisor-logbook p-4">
            <h2 className="mb-4">Review Logbook Tim</h2>

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

            {/* Logbooks List */}
            <div className="row g-4">
                {logbooks.length > 0 ? (
                    logbooks.map((logbook) => (
                        <div key={logbook.id} className="col-12">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center">
                                            <img
                                                src={getAvatarUrl(logbook.user)}
                                                alt={logbook.user?.name}
                                                className="rounded-circle me-3"
                                                width="48"
                                                height="48"
                                                style={{ objectFit: "cover" }}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        logbook.user?.name ||
                                                            "User"
                                                    )}&background=0D8ABC&color=fff&size=128`;
                                                }}
                                            />
                                            <div>
                                                <h6 className="mb-0">
                                                    {logbook.user?.name}
                                                </h6>
                                                <small className="text-muted">
                                                    {new Date(
                                                        logbook.date
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                        {
                                                            weekday: "long",
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        }
                                                    )}
                                                </small>
                                            </div>
                                        </div>
                                        <span
                                            className={`badge bg-${getStatusBadge(
                                                logbook.status
                                            )}`}
                                        >
                                            {logbook.status}
                                        </span>
                                    </div>
                                    <h5 className="mb-2">{logbook.title}</h5>
                                    <p className="text-muted mb-3">
                                        {logbook.description}
                                    </p>
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => {
                                                setSelectedLogbook(logbook);
                                                setShowDetailModal(true);
                                            }}
                                        >
                                            <i className="bi bi-eye me-2"></i>
                                            Detail
                                        </button>
                                        {logbook.status === "pending" && (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() =>
                                                        handleApprove(
                                                            logbook.id
                                                        )
                                                    }
                                                >
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Setujui
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => {
                                                        setSelectedLogbook(
                                                            logbook
                                                        );
                                                        setShowFeedbackModal(
                                                            true
                                                        );
                                                    }}
                                                >
                                                    <i className="bi bi-x-circle me-2"></i>
                                                    Tolak
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12">
                        <div className="text-center text-muted py-5">
                            <i className="bi bi-journal-text fs-1 d-block mb-3"></i>
                            <p>Tidak ada logbook {filter}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedLogbook && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowDetailModal(false);
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
                                        <i className="bi bi-journal-text text-primary fs-4"></i>
                                    </div>
                                    <span>Detail Logbook</span>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowDetailModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <strong>User:</strong>{" "}
                                    {selectedLogbook.user?.name}
                                </div>
                                <div className="mb-3">
                                    <strong>Tanggal:</strong>{" "}
                                    {new Date(
                                        selectedLogbook.date
                                    ).toLocaleDateString("id-ID")}
                                </div>
                                <div className="mb-3">
                                    <strong>Judul:</strong>{" "}
                                    {selectedLogbook.title}
                                </div>
                                <div className="mb-3">
                                    <strong>Deskripsi:</strong>
                                    <p className="mt-2">
                                        {selectedLogbook.description}
                                    </p>
                                </div>
                                <div className="mb-3">
                                    <strong>Status:</strong>{" "}
                                    <span
                                        className={`badge bg-${getStatusBadge(
                                            selectedLogbook.status
                                        )}`}
                                    >
                                        {selectedLogbook.status}
                                    </span>
                                </div>
                                {selectedLogbook.feedback && (
                                    <div className="alert alert-info">
                                        <strong>Feedback:</strong>{" "}
                                        {selectedLogbook.feedback}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && selectedLogbook && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowFeedbackModal(false);
                            setFeedback("");
                        }
                    }}
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Tolak Logbook</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowFeedbackModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    Berikan alasan penolakan untuk:{" "}
                                    <strong>{selectedLogbook.title}</strong>
                                </p>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    placeholder="Masukkan alasan penolakan..."
                                    value={feedback}
                                    onChange={(e) =>
                                        setFeedback(e.target.value)
                                    }
                                    required
                                ></textarea>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowFeedbackModal(false)}
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleReject}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Tolak
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorLogbook;
