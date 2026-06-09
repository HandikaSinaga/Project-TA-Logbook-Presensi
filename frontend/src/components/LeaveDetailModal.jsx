import { getAvatarUrl, getImageUrl } from "../utils/Constant";

/**
 * LeaveDetailModal – Komponen modal detail perijinan yang seragam
 * digunakan oleh role supervisor dan admin.
 *
 * Props:
 *  - show {boolean}
 *  - onClose {function}
 *  - leave {object} – data izin yang dipilih
 *  - onApprove {function|null} – callback approve (supervisor only)
 *  - onReject {function|null} – callback reject (supervisor only)
 */
const LeaveDetailModal = ({ show, onClose, leave, onApprove = null, onReject = null }) => {
    if (!show || !leave) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

    const calculateDuration = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const getTypeInfo = (type) => {
        const map = {
            sick: { className: "badge bg-warning-subtle text-warning", label: "Sakit", icon: "hospital" },
            izin_sakit: { className: "badge bg-warning-subtle text-warning", label: "Sakit", icon: "hospital" },
            permission: { className: "badge bg-primary-subtle text-primary", label: "Izin Keperluan", icon: "clipboard-check" },
            izin: { className: "badge bg-primary-subtle text-primary", label: "Izin", icon: "clipboard-check" },
            izin_keperluan: { className: "badge bg-primary-subtle text-primary", label: "Izin Keperluan", icon: "clipboard-check" },
            leave: { className: "badge bg-info-subtle text-info", label: "Cuti", icon: "calendar-x" },
            cuti_tahunan: { className: "badge bg-info-subtle text-info", label: "Cuti Tahunan", icon: "calendar-x" },
            cuti_bersama: { className: "badge bg-success-subtle text-success", label: "Cuti Bersama", icon: "calendar-heart" },
            keperluan_keluarga: { className: "badge bg-danger-subtle text-danger", label: "Keperluan Keluarga", icon: "house-heart" },
            lainnya: { className: "badge bg-secondary-subtle text-secondary", label: "Lainnya", icon: "three-dots" },
        };
        return map[type] || { className: "badge bg-secondary-subtle text-secondary", label: type || "-", icon: "question-circle" };
    };

    const getStatusInfo = (status) => {
        const map = {
            approved: { className: "badge bg-success-subtle text-success", label: "Disetujui", icon: "check-circle-fill" },
            pending: { className: "badge bg-warning-subtle text-warning", label: "Menunggu Persetujuan", icon: "clock-history" },
            rejected: { className: "badge bg-danger-subtle text-danger", label: "Ditolak", icon: "x-circle-fill" },
        };
        return map[status] || { className: "badge bg-secondary-subtle text-secondary", label: status || "-", icon: "question-circle" };
    };

    const getAttachmentIcon = (attachment) => {
        if (!attachment) return "file-earmark";
        const ext = attachment.split(".").pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "file-earmark-image";
        if (ext === "pdf") return "file-earmark-pdf";
        if (["doc", "docx"].includes(ext)) return "file-earmark-word";
        return "file-earmark-text";
    };

    const typeInfo = getTypeInfo(leave.type);
    const statusInfo = getStatusInfo(leave.status);
    const duration = calculateDuration(leave.start_date, leave.end_date);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    // ─── Header gradient based on status ───────────────────────────────────────
    const headerGradient = leave.status === "approved"
        ? "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)"
        : leave.status === "rejected"
            ? "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)"
            : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)";

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleOverlayClick}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(4px)",
                    zIndex: 1050,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                    overflowY: "auto",
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "100%",
                        maxWidth: "720px",
                        borderRadius: "1.25rem",
                        overflow: "hidden",
                        backgroundColor: "var(--bg-card, #fff)",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
                        border: "1px solid var(--border-color, rgba(0,0,0,0.1))",
                        animation: "slideUpModal 0.25s ease",
                    }}
                >
                    {/* ─── HEADER ─── */}
                    <div
                        style={{
                            background: headerGradient,
                            padding: "1.5rem 1.75rem",
                            position: "relative",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                            <div
                                style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <i className={`bi bi-${typeInfo.icon}`} style={{ color: "#fff", fontSize: "1.25rem" }} />
                            </div>
                            <div>
                                <h5 style={{ color: "#fff", margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>
                                    Detail Pengajuan {typeInfo.label}
                                </h5>
                                <small style={{ color: "rgba(255,255,255,0.75)" }}>
                                    {formatDate(leave.start_date)}
                                    {leave.end_date && leave.end_date !== leave.start_date && ` – ${formatDate(leave.end_date)}`}
                                </small>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                position: "absolute",
                                top: "1rem",
                                right: "1rem",
                                background: "rgba(255,255,255,0.2)",
                                border: "none",
                                borderRadius: "50%",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: "#fff",
                                fontSize: "1rem",
                                transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.35)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                        >
                            <i className="bi bi-x" />
                        </button>
                    </div>

                    {/* ─── BODY ─── */}
                    <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", maxHeight: "70vh" }}>

                        {/* Status & Type badges */}
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                            {/* Status badge */}
                            <span
                                className={statusInfo.className}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.375rem",
                                    padding: "0.45rem 0.875rem",
                                    borderRadius: "999px",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                }}
                            >
                                <i className={`bi bi-${statusInfo.icon}`} />
                                {statusInfo.label}
                            </span>
                            {/* Type badge */}
                            <span
                                className={typeInfo.className}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.375rem",
                                    padding: "0.45rem 0.875rem",
                                    borderRadius: "999px",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                }}
                            >
                                <i className={`bi bi-${typeInfo.icon}`} />
                                {typeInfo.label}
                            </span>
                            {/* Duration badge */}
                            <span
                                className="badge bg-secondary-subtle text-secondary"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.375rem",
                                    padding: "0.45rem 0.875rem",
                                    borderRadius: "999px",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                }}
                            >
                                <i className="bi bi-calendar3" />
                                {duration} hari
                            </span>
                        </div>

                        {/* ─── USER INFO ─── */}
                        <section style={{ marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                                <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg, #4f46e5, #7c3aed)" }} />
                                <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary, #1e293b)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Informasi Karyawan
                                </h6>
                            </div>

                            <div
                                style={{
                                    borderRadius: "0.875rem",
                                    padding: "1rem 1.25rem",
                                    backgroundColor: "var(--bg-body, #f8fafc)",
                                    border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                }}
                            >
                                <img
                                    src={getAvatarUrl(leave.user)}
                                    alt={leave.user?.name}
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "3px solid #e2e8f0",
                                        flexShrink: 0,
                                    }}
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leave.user?.name || "User")}&background=4f46e5&color=fff&size=128`;
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary, #1e293b)", marginBottom: "0.25rem" }}>
                                        {leave.user?.name || "-"}
                                    </div>
                                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted, #64748b)", marginBottom: "0.5rem" }}>
                                        <i className="bi bi-envelope me-1" />
                                        {leave.user?.email || "-"}
                                    </div>
                                    {leave.user?.position && (
                                        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted, #64748b)", marginBottom: "0.5rem" }}>
                                            <i className="bi bi-briefcase me-1" />
                                            {leave.user.position}
                                        </div>
                                    )}
                                    {/* Tags */}
                                    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.375rem" }}>
                                        {leave.user?.division?.name && (
                                            <span className="badge bg-primary-subtle text-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                <i className="bi bi-diagram-3" style={{ fontSize: "0.7rem" }} />
                                                {leave.user.division.name}
                                            </span>
                                        )}
                                        {leave.user?.periode && (
                                            <span className="badge bg-info-subtle text-info" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                <i className="bi bi-calendar-range" style={{ fontSize: "0.7rem" }} />
                                                {leave.user.periode}
                                            </span>
                                        )}
                                        {leave.user?.sumber_magang && (
                                            <span className="badge bg-warning-subtle text-warning" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                <i className="bi bi-building" style={{ fontSize: "0.7rem" }} />
                                                {leave.user.sumber_magang}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ─── LEAVE DATES ─── */}
                        <section style={{ marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                                <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg, #4f46e5, #7c3aed)" }} />
                                <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary, #1e293b)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Periode Izin
                                </h6>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                {/* Start Date */}
                                <div
                                    style={{
                                        borderRadius: "0.875rem",
                                        padding: "1rem",
                                        backgroundColor: "var(--bg-body, #f8fafc)",
                                        border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
                                    }}
                                >
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)", marginBottom: "0.5rem", fontWeight: 600 }}>
                                        <i className="bi bi-calendar-event me-1 text-primary" />
                                        Tanggal Mulai
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary, #1e293b)" }}>
                                        {formatDate(leave.start_date)}
                                    </div>
                                </div>
                                {/* End Date */}
                                <div
                                    style={{
                                        borderRadius: "0.875rem",
                                        padding: "1rem",
                                        backgroundColor: "var(--bg-body, #f8fafc)",
                                        border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
                                    }}
                                >
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)", marginBottom: "0.5rem", fontWeight: 600 }}>
                                        <i className="bi bi-calendar-x me-1 text-danger" />
                                        Tanggal Selesai
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary, #1e293b)" }}>
                                        {formatDate(leave.end_date)}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ─── REASON ─── */}
                        <section style={{ marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                                <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg, #4f46e5, #7c3aed)" }} />
                                <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary, #1e293b)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Alasan Pengajuan
                                </h6>
                            </div>

                            <div
                                style={{
                                    borderRadius: "0.875rem",
                                    padding: "1rem 1.25rem",
                                    backgroundColor: "var(--bg-body, #f8fafc)",
                                    border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
                                    lineHeight: 1.7,
                                    color: "var(--text-primary, #1e293b)",
                                    fontSize: "0.9rem",
                                }}
                            >
                                {leave.reason || <span style={{ color: "var(--text-muted, #94a3b8)", fontStyle: "italic" }}>Tidak ada alasan yang diberikan</span>}
                            </div>
                        </section>

                        {/* ─── ATTACHMENT ─── */}
                        {leave.attachment && (
                            <section style={{ marginBottom: "1.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                                    <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg, #4f46e5, #7c3aed)" }} />
                                    <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary, #1e293b)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        Lampiran
                                    </h6>
                                </div>

                                <div
                                    style={{
                                        borderRadius: "0.875rem",
                                        padding: "1rem 1.25rem",
                                        backgroundColor: "var(--bg-body, #f8fafc)",
                                        border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "1rem",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <div
                                            className="bg-primary-subtle text-primary"
                                            style={{
                                                width: "42px",
                                                height: "42px",
                                                borderRadius: "0.625rem",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <i className={`bi bi-${getAttachmentIcon(leave.attachment)}`} style={{ fontSize: "1.25rem" }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary, #1e293b)" }}>Dokumen Pendukung</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)" }}>{leave.attachment.split("/").pop()}</div>
                                        </div>
                                    </div>
                                    <a
                                        href={getImageUrl(leave.attachment)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.375rem",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "0.625rem",
                                            fontSize: "0.8125rem",
                                            fontWeight: 600,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <i className="bi bi-download" />
                                        Unduh
                                    </a>
                                </div>
                            </section>
                        )}

                        {/* ─── REJECTION INFO ─── */}
                        {leave.status === "rejected" && (leave.rejection_reason || leave.review_notes) && (
                            <section style={{ marginBottom: "1.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                                    <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg, #dc2626, #ef4444)" }} />
                                    <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary, #1e293b)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        Alasan Penolakan
                                    </h6>
                                </div>
                                <div
                                    style={{
                                        borderRadius: "0.875rem",
                                        padding: "1rem 1.25rem",
                                        backgroundColor: "var(--bg-body, #f8fafc)",
                                        border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
                                    }}
                                >
                                    <div style={{ display: "flex", gap: "0.75rem" }}>
                                        <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: "1.125rem", flexShrink: 0, marginTop: "2px" }} />
                                        <div>
                                            {leave.reviewer && (
                                                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary, #1e293b)", marginBottom: "0.375rem" }}>
                                                    Ditolak oleh: {leave.reviewer?.name || "Reviewer"}
                                                </div>
                                            )}
                                            <div style={{ color: "var(--text-secondary, #64748b)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                                                {leave.rejection_reason || leave.review_notes || "Tidak ada alasan penolakan"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ─── APPROVAL INFO ─── */}
                        {leave.status === "approved" && leave.reviewer && (
                            <section style={{ marginBottom: "1.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                                    <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: "linear-gradient(180deg, #16a34a, #22c55e)" }} />
                                    <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary, #1e293b)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        Informasi Persetujuan
                                    </h6>
                                </div>
                                <div
                                    style={{
                                        borderRadius: "0.875rem",
                                        padding: "1rem 1.25rem",
                                        backgroundColor: "var(--bg-body, #f8fafc)",
                                        border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                                        <img
                                            src={getAvatarUrl(leave.reviewer)}
                                            alt={leave.reviewer.name}
                                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "2px solid #86efac", flexShrink: 0 }}
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leave.reviewer.name || "Reviewer")}&background=16a34a&color=fff&size=128`;
                                            }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", fontSize: "0.875rem" }}>
                                                Disetujui oleh: {leave.reviewer.name}
                                            </div>
                                            {(leave.approved_at || leave.reviewed_at) && (
                                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary, #64748b)", marginTop: "0.25rem" }}>
                                                    <i className="bi bi-clock-history me-1" />
                                                    {formatDateTime(leave.approved_at || leave.reviewed_at)}
                                                </div>
                                            )}
                                            {leave.review_notes && (
                                                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary, #64748b)", marginTop: "0.375rem", lineHeight: 1.5 }}>
                                                    {leave.review_notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ─── SUBMITTED AT ─── */}
                        {leave.created_at && (
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted, #94a3b8)", textAlign: "right" }}>
                                <i className="bi bi-clock me-1" />
                                Diajukan: {formatDateTime(leave.created_at)}
                            </div>
                        )}
                    </div>

                    {/* ─── FOOTER ─── */}
                    <div
                        style={{
                            padding: "1rem 1.75rem",
                            borderTop: "1px solid var(--border-color, rgba(0,0,0,0.08))",
                            backgroundColor: "var(--bg-body, #f8fafc)",
                            display: "flex",
                            justifyContent: leave.status === "pending" && (onApprove || onReject) ? "space-between" : "flex-end",
                            alignItems: "center",
                            gap: "0.75rem",
                        }}
                    >
                        <button
                            onClick={onClose}
                            style={{
                                padding: "0.5rem 1.25rem",
                                borderRadius: "0.625rem",
                                border: "1px solid var(--border-color, rgba(0,0,0,0.15))",
                                backgroundColor: "transparent",
                                color: "var(--text-primary, #374151)",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                        >
                            <i className="bi bi-x-circle me-2" />
                            Tutup
                        </button>

                        {/* Approve / Reject buttons (only for supervisor with pending status) */}
                        {leave.status === "pending" && (onApprove || onReject) && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                {onReject && (
                                    <button
                                        onClick={() => { onClose(); onReject(leave); }}
                                        style={{
                                            padding: "0.5rem 1.25rem",
                                            borderRadius: "0.625rem",
                                            border: "1.5px solid #dc2626",
                                            backgroundColor: "transparent",
                                            color: "#dc2626",
                                            fontWeight: 600,
                                            fontSize: "0.875rem",
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#dc2626"; }}
                                    >
                                        <i className="bi bi-x-circle me-2" />
                                        Tolak
                                    </button>
                                )}
                                {onApprove && (
                                    <button
                                        onClick={() => onApprove(leave.id)}
                                        style={{
                                            padding: "0.5rem 1.25rem",
                                            borderRadius: "0.625rem",
                                            border: "none",
                                            background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
                                            color: "#fff",
                                            fontWeight: 600,
                                            fontSize: "0.875rem",
                                            cursor: "pointer",
                                            transition: "opacity 0.2s",
                                            boxShadow: "0 4px 12px rgba(22,163,74,0.35)",
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                                    >
                                        <i className="bi bi-check-circle me-2" />
                                        Setujui
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideUpModal {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)   scale(1); }
                }
            `}</style>
        </>
    );
};

export default LeaveDetailModal;
