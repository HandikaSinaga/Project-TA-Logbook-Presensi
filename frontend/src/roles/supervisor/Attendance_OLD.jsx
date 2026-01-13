import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_URL } from "../../utils/Constant";
import toast from "react-hot-toast";
import { Modal, Button, Badge } from "react-bootstrap";

const Attendance = () => {
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);

    useEffect(() => {
        fetchAttendances();
    }, [filter]);

    const fetchAttendances = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter === "pending") params.approval_status = "pending";
            if (filter === "approved") params.approval_status = "approved";
            if (filter === "rejected") params.approval_status = "rejected";

            const response = await axiosInstance.get("/supervisor/attendance", {
                params,
            });
            setAttendances(response.data.data || []);
        } catch (error) {
            console.error("Error fetching attendances:", error);
            toast.error("Gagal memuat data presensi");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axiosInstance.put(`/supervisor/attendance/${id}/approve`);
            toast.success("Presensi disetujui");
            fetchAttendances();
        } catch (error) {
            console.error("Error approving attendance:", error);
            toast.error("Gagal menyetujui presensi");
        }
    };

    const handleReject = async (id, reason) => {
        try {
            await axiosInstance.put(`/supervisor/attendance/${id}/reject`, {
                reason,
            });
            toast.success("Presensi ditolak");
            fetchAttendances();
        } catch (error) {
            console.error("Error rejecting attendance:", error);
            toast.error("Gagal menolak presensi");
        }
    };

    const handleShowDetail = (attendance) => {
        setSelectedAttendance(attendance);
        setShowDetailModal(true);
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setSelectedAttendance(null);
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <i className="bi bi-calendar-check me-2"></i>
                    Approval Presensi
                </h2>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <div className="btn-group" role="group">
                        <button
                            className={`btn ${
                                filter === "all"
                                    ? "btn-primary"
                                    : "btn-outline-primary"
                            }`}
                            onClick={() => setFilter("all")}
                        >
                            Semua
                        </button>
                        <button
                            className={`btn ${
                                filter === "pending"
                                    ? "btn-warning"
                                    : "btn-outline-warning"
                            }`}
                            onClick={() => setFilter("pending")}
                        >
                            Pending
                        </button>
                        <button
                            className={`btn ${
                                filter === "approved"
                                    ? "btn-success"
                                    : "btn-outline-success"
                            }`}
                            onClick={() => setFilter("approved")}
                        >
                            Disetujui
                        </button>
                        <button
                            className={`btn ${
                                filter === "rejected"
                                    ? "btn-danger"
                                    : "btn-outline-danger"
                            }`}
                            onClick={() => setFilter("rejected")}
                        >
                            Ditolak
                        </button>
                    </div>
                </div>

                <div className="card-body">
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
                        </div>
                    ) : attendances.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox display-1 text-muted"></i>
                            <p className="text-muted mt-3">
                                Tidak ada data presensi
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Nama</th>
                                        <th>Divisi</th>
                                        <th>Waktu Masuk</th>
                                        <th>Waktu Keluar</th>
                                        <th>Work Type</th>
                                        <th>Lokasi</th>
                                        <th>Status Approval</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendances.map((attendance) => (
                                        <tr key={attendance.id}>
                                            <td>
                                                {new Date(
                                                    attendance.date
                                                ).toLocaleDateString("id-ID")}
                                            </td>
                                            <td>
                                                {attendance.user?.name || "-"}
                                            </td>
                                            <td>
                                                {attendance.user?.division
                                                    ?.name || "-"}
                                            </td>
                                            <td>
                                                {attendance.check_in_time ||
                                                    "-"}
                                            </td>
                                            <td>
                                                {attendance.check_out_time ||
                                                    "-"}
                                            </td>
                                            <td>
                                                {attendance.work_type ===
                                                "offsite" ? (
                                                    <div>
                                                        <span className="badge bg-info mb-1">
                                                            <i className="bi bi-house-door me-1"></i>
                                                            Offsite
                                                        </span>
                                                        {attendance.offsite_reason && (
                                                            <small
                                                                className="d-block text-muted"
                                                                style={{
                                                                    fontSize:
                                                                        "0.75rem",
                                                                }}
                                                            >
                                                                {
                                                                    attendance.offsite_reason
                                                                }
                                                            </small>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="badge bg-success">
                                                        <i className="bi bi-building me-1"></i>
                                                        Onsite
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <small
                                                    className="text-muted"
                                                    style={{
                                                        fontSize: "0.75rem",
                                                    }}
                                                >
                                                    {attendance.check_in_address ? (
                                                        <>
                                                            <i className="bi bi-geo-alt me-1"></i>
                                                            {attendance
                                                                .check_in_address
                                                                .length > 30
                                                                ? attendance.check_in_address.substring(
                                                                      0,
                                                                      30
                                                                  ) + "..."
                                                                : attendance.check_in_address}
                                                            <br />
                                                        </>
                                                    ) : (
                                                        "-"
                                                    )}
                                                    {(attendance.check_in_ip ||
                                                        attendance.check_out_ip) && (
                                                        <span className="text-muted">
                                                            <i className="bi bi-hdd-network me-1"></i>
                                                            {attendance.check_in_ip ||
                                                                "-"}
                                                        </span>
                                                    )}
                                                </small>
                                            </td>
                                            <td>
                                                {attendance.approval_status ===
                                                    "pending" && (
                                                    <span className="badge bg-warning">
                                                        <i className="bi bi-clock-history me-1"></i>
                                                        Pending
                                                    </span>
                                                )}
                                                {attendance.approval_status ===
                                                    "approved" && (
                                                    <div>
                                                        <span className="badge bg-success mb-1">
                                                            <i className="bi bi-check-circle me-1"></i>
                                                            Disetujui
                                                        </span>
                                                        {attendance.approver && (
                                                            <small
                                                                className="d-block text-muted"
                                                                style={{
                                                                    fontSize:
                                                                        "0.7rem",
                                                                }}
                                                            >
                                                                oleh{" "}
                                                                {
                                                                    attendance
                                                                        .approver
                                                                        .name
                                                                }
                                                                {attendance.approved_at && (
                                                                    <span className="d-block">
                                                                        {new Date(
                                                                            attendance.approved_at
                                                                        ).toLocaleString(
                                                                            "id-ID",
                                                                            {
                                                                                day: "2-digit",
                                                                                month: "short",
                                                                                hour: "2-digit",
                                                                                minute: "2-digit",
                                                                            }
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </small>
                                                        )}
                                                    </div>
                                                )}
                                                {attendance.approval_status ===
                                                    "rejected" && (
                                                    <div>
                                                        <span className="badge bg-danger mb-1">
                                                            <i className="bi bi-x-circle me-1"></i>
                                                            Ditolak
                                                        </span>
                                                        {attendance.rejector && (
                                                            <small
                                                                className="d-block text-muted"
                                                                style={{
                                                                    fontSize:
                                                                        "0.7rem",
                                                                }}
                                                            >
                                                                oleh{" "}
                                                                {
                                                                    attendance
                                                                        .rejector
                                                                        .name
                                                                }
                                                                {attendance.rejected_at && (
                                                                    <span className="d-block">
                                                                        {new Date(
                                                                            attendance.rejected_at
                                                                        ).toLocaleString(
                                                                            "id-ID",
                                                                            {
                                                                                day: "2-digit",
                                                                                month: "short",
                                                                                hour: "2-digit",
                                                                                minute: "2-digit",
                                                                            }
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </small>
                                                        )}
                                                        {attendance.rejection_reason && (
                                                            <small
                                                                className="d-block text-danger mt-1"
                                                                style={{
                                                                    fontSize:
                                                                        "0.7rem",
                                                                }}
                                                            >
                                                                <i className="bi bi-chat-left-text me-1"></i>
                                                                {
                                                                    attendance.rejection_reason
                                                                }
                                                            </small>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-info me-2"
                                                    onClick={() =>
                                                        handleShowDetail(
                                                            attendance
                                                        )
                                                    }
                                                    title="Lihat Detail"
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                                {attendance.approval_status ===
                                                    "pending" && (
                                                    <div className="btn-group btn-group-sm d-inline-flex">
                                                        <button
                                                            className="btn btn-success"
                                                            onClick={() =>
                                                                handleApprove(
                                                                    attendance.id
                                                                )
                                                            }
                                                            title="Setujui"
                                                        >
                                                            <i className="bi bi-check-circle"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => {
                                                                const reason =
                                                                    prompt(
                                                                        "Alasan penolakan:"
                                                                    );
                                                                if (reason)
                                                                    handleReject(
                                                                        attendance.id,
                                                                        reason
                                                                    );
                                                            }}
                                                            title="Tolak"
                                                        >
                                                            <i className="bi bi-x-circle"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Attendance Modal */}
            <Modal show={showDetailModal} onHide={handleCloseDetail} size="lg">
                <Modal.Header
                    closeButton
                    style={{
                        background:
                            "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)",
                        border: "none",
                    }}
                >
                    <Modal.Title className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                            <i className="bi bi-info-circle text-primary fs-4"></i>
                        </div>
                        <span>Detail Presensi</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedAttendance && (
                        <div>
                            {/* User Info */}
                            <div className="mb-4 pb-3 border-bottom">
                                <h6 className="text-muted mb-3">
                                    Informasi Karyawan
                                </h6>
                                <div className="row">
                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Nama
                                        </small>
                                        <p className="mb-2">
                                            <strong>
                                                {selectedAttendance.user
                                                    ?.name || "-"}
                                            </strong>
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Divisi
                                        </small>
                                        <p className="mb-2">
                                            <strong>
                                                {selectedAttendance.user
                                                    ?.division?.name || "-"}
                                            </strong>
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Email
                                        </small>
                                        <p className="mb-2">
                                            {selectedAttendance.user?.email ||
                                                "-"}
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Tanggal
                                        </small>
                                        <p className="mb-2">
                                            {new Date(
                                                selectedAttendance.date
                                            ).toLocaleDateString("id-ID", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Check-in Info */}
                            <div className="mb-4 pb-3 border-bottom">
                                <h6 className="text-muted mb-3">
                                    <i className="bi bi-box-arrow-in-right me-2 text-success"></i>
                                    Check-in
                                </h6>
                                <div className="row">
                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Waktu
                                        </small>
                                        <p className="mb-2">
                                            <strong>
                                                {selectedAttendance.check_in_time ||
                                                    "-"}
                                            </strong>
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Status
                                        </small>
                                        <p className="mb-2">
                                            <Badge
                                                bg={
                                                    selectedAttendance.status ===
                                                    "present"
                                                        ? "success"
                                                        : selectedAttendance.status ===
                                                          "late"
                                                        ? "warning"
                                                        : "danger"
                                                }
                                            >
                                                {selectedAttendance.status ===
                                                "present"
                                                    ? "Hadir"
                                                    : selectedAttendance.status ===
                                                      "late"
                                                    ? "Terlambat"
                                                    : selectedAttendance.status ||
                                                      "-"}
                                            </Badge>
                                        </p>
                                    </div>
                                    <div className="col-md-12">
                                        <small className="text-muted">
                                            Lokasi
                                        </small>
                                        <p className="mb-2">
                                            <i className="bi bi-geo-alt me-1"></i>
                                            {selectedAttendance.check_in_address ||
                                                "-"}
                                        </p>
                                        <small className="text-muted">
                                            Koordinat:{" "}
                                        </small>
                                        <span className="text-muted small">
                                            {
                                                selectedAttendance.check_in_latitude
                                            }
                                            ,{" "}
                                            {
                                                selectedAttendance.check_in_longitude
                                            }
                                        </span>
                                    </div>
                                    <div className="col-md-6 mt-2">
                                        <small className="text-muted">
                                            IP Address
                                        </small>
                                        <p className="mb-2">
                                            <i className="bi bi-hdd-network me-1"></i>
                                            <code>
                                                {selectedAttendance.check_in_ip ||
                                                    "-"}
                                            </code>
                                        </p>
                                    </div>
                                    <div className="col-md-6 mt-2">
                                        <small className="text-muted">
                                            Work Type
                                        </small>
                                        <p className="mb-2">
                                            {selectedAttendance.work_type ===
                                            "offsite" ? (
                                                <Badge bg="info">
                                                    <i className="bi bi-house-door me-1"></i>
                                                    Offsite
                                                </Badge>
                                            ) : (
                                                <Badge bg="success">
                                                    <i className="bi bi-building me-1"></i>
                                                    Onsite
                                                </Badge>
                                            )}
                                        </p>
                                    </div>
                                    {selectedAttendance.offsite_reason && (
                                        <div className="col-md-12 mt-2">
                                            <small className="text-muted">
                                                Alasan Offsite
                                            </small>
                                            <p className="mb-2 p-2 bg-light rounded">
                                                <i className="bi bi-chat-left-text me-1"></i>
                                                {
                                                    selectedAttendance.offsite_reason
                                                }
                                            </p>
                                        </div>
                                    )}
                                    {selectedAttendance.check_in_photo && (
                                        <div className="col-md-12 mt-2">
                                            <small className="text-muted">
                                                Foto Check-in
                                            </small>
                                            <div className="mt-2">
                                                <img
                                                    src={`${API_URL.replace(
                                                        "/api",
                                                        ""
                                                    )}/uploads/${
                                                        selectedAttendance.check_in_photo
                                                    }`}
                                                    alt="Check-in"
                                                    className="img-fluid rounded"
                                                    style={{
                                                        maxHeight: "200px",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Check-out Info */}
                            {selectedAttendance.check_out_time && (
                                <div className="mb-4 pb-3 border-bottom">
                                    <h6 className="text-muted mb-3">
                                        <i className="bi bi-box-arrow-right me-2 text-danger"></i>
                                        Check-out
                                    </h6>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <small className="text-muted">
                                                Waktu
                                            </small>
                                            <p className="mb-2">
                                                <strong>
                                                    {
                                                        selectedAttendance.check_out_time
                                                    }
                                                </strong>
                                            </p>
                                        </div>
                                        <div className="col-md-6">
                                            <small className="text-muted">
                                                IP Address
                                            </small>
                                            <p className="mb-2">
                                                <i className="bi bi-hdd-network me-1"></i>
                                                <code>
                                                    {selectedAttendance.check_out_ip ||
                                                        "-"}
                                                </code>
                                            </p>
                                        </div>
                                        <div className="col-md-12">
                                            <small className="text-muted">
                                                Lokasi
                                            </small>
                                            <p className="mb-2">
                                                <i className="bi bi-geo-alt me-1"></i>
                                                {selectedAttendance.check_out_address ||
                                                    "-"}
                                            </p>
                                            <small className="text-muted">
                                                Koordinat:{" "}
                                            </small>
                                            <span className="text-muted small">
                                                {
                                                    selectedAttendance.check_out_latitude
                                                }
                                                ,{" "}
                                                {
                                                    selectedAttendance.check_out_longitude
                                                }
                                            </span>
                                        </div>
                                        {selectedAttendance.checkout_offsite_reason && (
                                            <div className="col-md-12 mt-2">
                                                <small className="text-muted">
                                                    Alasan Check-out Offsite
                                                </small>
                                                <p className="mb-2 p-2 bg-danger bg-opacity-10 border border-danger rounded">
                                                    <i className="bi bi-chat-left-text me-1"></i>
                                                    {
                                                        selectedAttendance.checkout_offsite_reason
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedAttendance.check_out_photo && (
                                            <div className="col-md-12 mt-2">
                                                <small className="text-muted">
                                                    Foto Check-out
                                                </small>
                                                <div className="mt-2">
                                                    <img
                                                        src={`${API_URL.replace(
                                                            "/api",
                                                            ""
                                                        )}/uploads/${
                                                            selectedAttendance.check_out_photo
                                                        }`}
                                                        alt="Check-out"
                                                        className="img-fluid rounded"
                                                        style={{
                                                            maxHeight: "200px",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Approval Status */}
                            <div className="mb-3">
                                <h6 className="text-muted mb-3">
                                    <i className="bi bi-clipboard-check me-2"></i>
                                    Status Approval
                                </h6>
                                <div
                                    className="p-3 rounded"
                                    style={{
                                        backgroundColor:
                                            selectedAttendance.approval_status ===
                                            "approved"
                                                ? "#d1f2eb"
                                                : selectedAttendance.approval_status ===
                                                  "rejected"
                                                ? "#f8d7da"
                                                : "#fff3cd",
                                    }}
                                >
                                    <div className="d-flex align-items-center mb-2">
                                        {selectedAttendance.approval_status ===
                                            "pending" && (
                                            <Badge
                                                bg="warning"
                                                className="me-2"
                                            >
                                                <i className="bi bi-clock-history me-1"></i>
                                                Menunggu Approval
                                            </Badge>
                                        )}
                                        {selectedAttendance.approval_status ===
                                            "approved" && (
                                            <Badge
                                                bg="success"
                                                className="me-2"
                                            >
                                                <i className="bi bi-check-circle me-1"></i>
                                                Disetujui
                                            </Badge>
                                        )}
                                        {selectedAttendance.approval_status ===
                                            "rejected" && (
                                            <Badge bg="danger" className="me-2">
                                                <i className="bi bi-x-circle me-1"></i>
                                                Ditolak
                                            </Badge>
                                        )}
                                    </div>

                                    {selectedAttendance.approver && (
                                        <div className="mt-2">
                                            <small className="text-muted">
                                                Disetujui oleh:
                                            </small>
                                            <p className="mb-1">
                                                <strong>
                                                    {
                                                        selectedAttendance
                                                            .approver.name
                                                    }
                                                </strong>
                                            </p>
                                            {selectedAttendance.approved_at && (
                                                <small className="text-muted">
                                                    <i className="bi bi-calendar-check me-1"></i>
                                                    {new Date(
                                                        selectedAttendance.approved_at
                                                    ).toLocaleString("id-ID", {
                                                        day: "2-digit",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </small>
                                            )}
                                        </div>
                                    )}

                                    {selectedAttendance.rejector && (
                                        <div className="mt-2">
                                            <small className="text-muted">
                                                Ditolak oleh:
                                            </small>
                                            <p className="mb-1">
                                                <strong>
                                                    {
                                                        selectedAttendance
                                                            .rejector.name
                                                    }
                                                </strong>
                                            </p>
                                            {selectedAttendance.rejected_at && (
                                                <small className="text-muted">
                                                    <i className="bi bi-calendar-x me-1"></i>
                                                    {new Date(
                                                        selectedAttendance.rejected_at
                                                    ).toLocaleString("id-ID", {
                                                        day: "2-digit",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </small>
                                            )}
                                        </div>
                                    )}

                                    {selectedAttendance.rejection_reason && (
                                        <div className="mt-3 p-2 bg-white rounded border border-danger">
                                            <small className="text-muted d-block mb-1">
                                                <i className="bi bi-chat-left-text me-1"></i>
                                                Alasan Penolakan:
                                            </small>
                                            <p className="mb-0 text-danger">
                                                {
                                                    selectedAttendance.rejection_reason
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedAttendance.notes && (
                                <div className="mt-3">
                                    <small className="text-muted">
                                        Catatan
                                    </small>
                                    <p className="p-2 bg-light rounded">
                                        {selectedAttendance.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDetail}>
                        Tutup
                    </Button>
                    {selectedAttendance?.approval_status === "pending" && (
                        <>
                            <Button
                                variant="success"
                                onClick={() => {
                                    handleApprove(selectedAttendance.id);
                                    handleCloseDetail();
                                }}
                            >
                                <i className="bi bi-check-circle me-1"></i>
                                Setujui
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    const reason = prompt("Alasan penolakan:");
                                    if (reason) {
                                        handleReject(
                                            selectedAttendance.id,
                                            reason
                                        );
                                        handleCloseDetail();
                                    }
                                }}
                            >
                                <i className="bi bi-x-circle me-1"></i>
                                Tolak
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Attendance;
