import { getAvatarUrl } from "../utils/Constant";

/**
 * LogbookDetailModal — Komponen modal detail logbook yang seragam
 * digunakan oleh role user, supervisor, dan admin.
 *
 * Props:
 *  - show {boolean}
 *  - onClose {function}
 *  - logbook {object} — data logbook yang dipilih
 *  - showUserInfo {boolean} — tampilkan info karyawan (supervisor/admin)
 *  - onEdit {function} — callback untuk edit (opsional, role user)
 *  - onApprove {function} — callback approve (opsional, role supervisor)
 *  - onReject {function} — callback reject (opsional, role supervisor)
 */
const LogbookDetailModal = ({
    show,
    onClose,
    logbook,
    showUserInfo = false,
    onEdit,
    onApprove,
    onReject,
}) => {
    if (!show || !logbook) return null;

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
        return new Date(dateStr).toLocaleString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusInfo = (status) => {
        const map = {
            approved: {
                color: "#16a34a",
                textColor: "var(--color-approved, #16a34a)",
                bg: "#dcfce7",
                label: "Disetujui",
                icon: "check-circle-fill",
                headerGradient: "linear-gradient(135deg, #4f46e5 0%, #059669 100%)",
            },
            pending: {
                color: "#d97706",
                textColor: "var(--color-pending, #d97706)",
                bg: "#fef3c7",
                label: "Menunggu Review",
                icon: "clock-fill",
                headerGradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
            },
            rejected: {
                color: "#dc2626",
                textColor: "var(--color-rejected, #dc2626)",
                bg: "#fee2e2",
                label: "Ditolak",
                icon: "x-circle-fill",
                headerGradient: "linear-gradient(135deg, #4f46e5 0%, #dc2626 100%)",
            },
            not_filled: {
                color: "#64748b",
                textColor: "var(--color-not_filled, #64748b)",
                bg: "#f1f5f9",
                label: "Tidak Mengisi",
                icon: "dash-circle-fill",
                headerGradient: "linear-gradient(135deg, #4f46e5 0%, #64748b 100%)",
            },
        };
        return map[status] || {
            color: "#64748b",
            textColor: "var(--color-unknown, #64748b)",
            bg: "#f1f5f9",
            label: status || "-",
            icon: "question-circle",
            headerGradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        };
    };

    const statusInfo = getStatusInfo(logbook.status);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

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
                        maxWidth: "680px",
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
                            background: statusInfo.headerGradient,
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
                                <i className="bi bi-journal-bookmark-fill" style={{ color: "#fff", fontSize: "1.25rem" }} />
                            </div>
                            <div>
                                <h5 style={{ color: "#fff", margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>
                                    Detail Logbook
                                </h5>
                                <small style={{ color: "rgba(255,255,255,0.75)" }}>
                                    {formatDate(logbook.date)}
                                </small>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                position: "absolute",
                                top: "1rem",
                                right: "1.25rem",
                                background: "rgba(255,255,255,0.15)",
                                border: "none",
                                borderRadius: "50%",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: "#fff",
                                fontSize: "1.1rem",
                                transition: "background 0.2s",
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                        >
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>

                    {/* ─── BODY ─── */}
                    <div style={{ padding: "1.5rem 1.75rem", maxHeight: "72vh", overflowY: "auto" }}>

                        {/* ── INFO KARYAWAN (supervisor/admin only) ── */}
                        {showUserInfo && logbook.user && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    padding: "1rem 1.25rem",
                                    borderRadius: "0.875rem",
                                    backgroundColor: "var(--bg-body, #f8f9fa)",
                                    border: "1px solid var(--border-color, rgba(0,0,0,0.08))",
                                    marginBottom: "1.25rem",
                                }}
                            >
                                <img
                                    src={getAvatarUrl(logbook.user)}
                                    alt={logbook.user?.name}
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        flexShrink: 0,
                                        border: "3px solid rgba(79,70,229,0.3)",
                                    }}
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(logbook.user?.name || "User")}&background=4f46e5&color=fff&size=128`;
                                    }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.2rem" }}>
                                        {logbook.user?.name || "-"}
                                    </div>
                                    <div style={{ color: "var(--text-secondary, #6c757d)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                                        {logbook.user?.email || "-"}
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                                        {logbook.user?.division?.name && (
                                            <span className="badge bg-primary-subtle text-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                <i className="bi bi-diagram-3" style={{ fontSize: "0.7rem" }} />
                                                {logbook.user.division.name}
                                            </span>
                                        )}
                                        {logbook.user?.periode && (
                                            <span className="badge bg-info-subtle text-info" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                <i className="bi bi-calendar-range" style={{ fontSize: "0.7rem" }} />
                                                {logbook.user.periode}
                                            </span>
                                        )}
                                        {logbook.user?.sumber_magang && (
                                            <span className="badge bg-warning-subtle text-warning" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                <i className="bi bi-building" style={{ fontSize: "0.7rem" }} />
                                                {logbook.user.sumber_magang}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STATUS + TANGGAL SUMMARY ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "1.25rem" }}>
                            {/* Status */}
                            <div
                                style={{
                                    borderRadius: "0.875rem",
                                    padding: "1rem 1.125rem",
                                    border: `1.5px solid ${statusInfo.color}40`,
                                    background: `${statusInfo.color}12`,
                                }}
                            >
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #6c757d)", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Status Logbook
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <i className={`bi bi-${statusInfo.icon}`} style={{ color: statusInfo.textColor, fontSize: "1.15rem" }} />
                                    <span style={{ fontWeight: 700, color: statusInfo.textColor, fontSize: "0.95rem" }}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                            </div>

                            {/* Tanggal & Dibuat */}
                            <div
                                style={{
                                    borderRadius: "0.875rem",
                                    padding: "1rem 1.125rem",
                                    border: "1.5px solid #0dcaf030",
                                    background: "#0dcaf010",
                                }}
                            >
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #6c757d)", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Tanggal Aktivitas
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <i className="bi bi-calendar-event-fill" style={{ color: "var(--color-cyan, #0dcaf0)", fontSize: "1.15rem" }} />
                                    <span style={{ fontWeight: 700, color: "var(--color-cyan, #0dcaf0)", fontSize: "0.88rem" }}>
                                        {formatDate(logbook.date)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── AKTIVITAS ── */}
                        <div style={{ marginBottom: "1.25rem" }}>
                            <SectionTitle icon="briefcase-fill" label="Aktivitas" color="var(--color-cyan, #0dcaf0)" />
                            <div
                                style={{
                                    padding: "0.875rem 1rem",
                                    borderRadius: "0.875rem",
                                    border: "1.5px solid #0dcaf025",
                                    background: "#0dcaf008",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    lineHeight: 1.5,
                                    color: "var(--text-primary, #1e293b)",
                                }}
                            >
                                {logbook.activity || <span style={{ color: "var(--text-secondary, #6c757d)", fontStyle: "italic", fontWeight: 400 }}>Tidak ada aktivitas</span>}
                            </div>
                        </div>

                        {/* ── DESKRIPSI ── */}
                        <div style={{ marginBottom: "1.25rem" }}>
                            <SectionTitle icon="text-paragraph" label="Deskripsi Detail" color="var(--color-darkcyan, #0891b2)" />
                            <div
                                style={{
                                    padding: "0.875rem 1rem",
                                    borderRadius: "0.875rem",
                                    border: "1.5px solid #0891b225",
                                    background: "#0891b208",
                                    fontSize: "0.9rem",
                                    whiteSpace: "pre-wrap",
                                    lineHeight: 1.8,
                                    color: "var(--text-primary, #1e293b)",
                                    minHeight: "80px",
                                }}
                            >
                                {logbook.description || <span style={{ color: "var(--text-secondary, #6c757d)", fontStyle: "italic" }}>Tidak ada deskripsi</span>}
                            </div>
                        </div>

                        {/* ── HASIL REVIEW ── */}
                        {(logbook.status === "approved" || logbook.status === "rejected") && (
                            <div style={{ marginBottom: "1.25rem" }}>
                                <SectionTitle
                                    icon={logbook.status === "approved" ? "check-circle-fill" : "x-circle-fill"}
                                    label={logbook.status === "approved" ? "Catatan Persetujuan" : "Alasan Penolakan"}
                                    color={logbook.status === "approved" ? "#16a34a" : "#dc2626"}
                                />
                                <div
                                    style={{
                                        borderRadius: "0.875rem",
                                        border: `1.5px solid ${logbook.status === "approved" ? "#16a34a25" : "#dc262625"}`,
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* Review Notes Box */}
                                    <div style={{ padding: "0.875rem 1rem" }}>
                                        <div
                                            style={{
                                                padding: "0.625rem 0.875rem",
                                                borderRadius: "0.5rem",
                                                background: logbook.status === "approved" ? "#16a34a10" : "#dc262610",
                                                border: `1px solid ${logbook.status === "approved" ? "#16a34a35" : "#dc262635"}`,
                                                fontSize: "0.9rem",
                                                whiteSpace: "pre-wrap",
                                                lineHeight: 1.6,
                                                color: "var(--text-primary, #1e293b)",
                                            }}
                                        >
                                            {logbook.review_notes
                                                ? logbook.review_notes
                                                : <span style={{ color: "var(--text-secondary, #6c757d)", fontStyle: "italic" }}>Tidak ada catatan review</span>
                                            }
                                        </div>
                                    </div>

                                    {/* Review Metadata */}
                                    {(logbook.reviewed_at || logbook.reviewer?.name) && (
                                        <div
                                            style={{
                                                padding: "0.75rem 1rem",
                                                borderTop: `1px solid var(--border-color, rgba(0,0,0,0.08))`,
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: "1rem",
                                                background: "var(--bg-body, #f8f9fa)",
                                            }}
                                        >
                                            {logbook.reviewed_at && (
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <i className="bi bi-calendar-check" style={{ color: "var(--text-secondary, #6c757d)", fontSize: "0.85rem" }} />
                                                    <div>
                                                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #6c757d)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                                                            Direview pada
                                                        </div>
                                                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary, #1e293b)" }}>
                                                            {formatDateTime(logbook.reviewed_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {logbook.reviewer?.name && (
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <i className="bi bi-person-check" style={{ color: "var(--text-secondary, #6c757d)", fontSize: "0.85rem" }} />
                                                    <div>
                                                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #6c757d)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                                                            Direview oleh
                                                        </div>
                                                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary, #1e293b)" }}>
                                                            {logbook.reviewer.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── PENDING: Menunggu review ── */}
                        {logbook.status === "pending" && (
                            <div style={{ marginBottom: "1.25rem" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.75rem",
                                        padding: "0.875rem 1rem",
                                        borderRadius: "0.875rem",
                                        background: "#d9770610",
                                        border: "1.5px solid #d9770630",
                                    }}
                                >
                                    <i className="bi bi-hourglass-split" style={{ color: "var(--color-pending, #d97706)", fontSize: "1.25rem", flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--color-pending, #d97706)", marginBottom: "0.15rem" }}>
                                            Menunggu Review Supervisor
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary, #6c757d)" }}>
                                            Logbook ini sedang menunggu review dari supervisor Anda
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TIMELINE ── */}
                        <div style={{ marginBottom: "0.25rem" }}>
                            <SectionTitle icon="clock-history" label="Timeline" />
                            <div
                                style={{
                                    padding: "0.875rem 1rem",
                                    borderRadius: "0.875rem",
                                    border: "1.5px solid var(--border-color, rgba(0,0,0,0.1))",
                                    background: "var(--bg-body, #f8f9fa)",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "1.25rem",
                                }}
                            >
                                <TimelineItem label="Dibuat" value={logbook.created_at} />
                                {logbook.updated_at && logbook.updated_at !== logbook.created_at && (
                                    <TimelineItem label="Diperbarui" value={logbook.updated_at} />
                                )}
                                {logbook.reviewed_at && (
                                    <TimelineItem label="Direview" value={logbook.reviewed_at} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─── FOOTER ─── */}
                    <div
                        style={{
                            padding: "1rem 1.75rem",
                            borderTop: "1px solid var(--border-color, rgba(0,0,0,0.08))",
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: "0.625rem",
                            background: "var(--bg-body, #f8f9fa)",
                        }}
                    >
                        {/* Supervisor/Admin: Approve & Reject buttons */}
                        {logbook.status === "pending" && onApprove && (
                            <button
                                onClick={() => onApprove(logbook.id)}
                                style={{
                                    padding: "0.55rem 1.25rem",
                                    borderRadius: "0.625rem",
                                    border: "none",
                                    background: "linear-gradient(135deg, #16a34a, #059669)",
                                    color: "#fff",
                                    fontWeight: 600,
                                    fontSize: "0.9rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    transition: "opacity 0.2s",
                                }}
                                onMouseOver={(e) => e.currentTarget.style.opacity = "0.88"}
                                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                            >
                                <i className="bi bi-check-circle-fill" />
                                Setujui
                            </button>
                        )}
                        {logbook.status === "pending" && onReject && (
                            <button
                                onClick={() => { onClose(); onReject(logbook); }}
                                style={{
                                    padding: "0.55rem 1.25rem",
                                    borderRadius: "0.625rem",
                                    border: "1.5px solid #dc2626",
                                    background: "transparent",
                                    color: "#dc2626",
                                    fontWeight: 600,
                                    fontSize: "0.9rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    transition: "all 0.2s",
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = "#dc262612"; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                                <i className="bi bi-x-circle-fill" />
                                Tolak
                            </button>
                        )}

                        {/* User: Edit button */}
                        {(logbook.status === "pending") && onEdit && (
                            <button
                                onClick={() => { onClose(); onEdit(logbook); }}
                                style={{
                                    padding: "0.55rem 1.25rem",
                                    borderRadius: "0.625rem",
                                    border: "none",
                                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                                    color: "#fff",
                                    fontWeight: 600,
                                    fontSize: "0.9rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    transition: "opacity 0.2s",
                                }}
                                onMouseOver={(e) => e.currentTarget.style.opacity = "0.88"}
                                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                            >
                                <i className="bi bi-pencil-square" />
                                Edit Logbook
                            </button>
                        )}

                        {/* Tutup */}
                        <button
                            onClick={onClose}
                            style={{
                                padding: "0.55rem 1.5rem",
                                borderRadius: "0.625rem",
                                border: "1px solid var(--border-color, rgba(0,0,0,0.15))",
                                background: "var(--bg-card, #fff)",
                                color: "var(--text-primary, #212529)",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                transition: "all 0.2s",
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = "var(--bg-body, #e9ecef)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = "var(--bg-card, #fff)"; }}
                        >
                            <i className="bi bi-x-circle" />
                            Tutup
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideUpModal {
                    from { opacity: 0; transform: translateY(24px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                :root {
                    --color-approved: #16a34a;
                    --color-pending: #d97706;
                    --color-rejected: #dc2626;
                    --color-not_filled: #64748b;
                    --color-unknown: #64748b;
                    --color-cyan: #0dcaf0;
                    --color-darkcyan: #0891b2;
                }
                
                [data-theme="dark"] {
                    --color-approved: #4ade80;
                    --color-pending: #fbbf24;
                    --color-rejected: #f87171;
                    --color-not_filled: #94a3b8;
                    --color-unknown: #94a3b8;
                    --color-cyan: #22d3ee;
                    --color-darkcyan: #38bdf8;
                }
            `}</style>
        </>
    );
};

/* ─── Sub-components ─── */

const SectionTitle = ({ icon, label, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
        <i className={`bi bi-${icon}`} style={{ color: color || "var(--text-secondary, #6c757d)", fontSize: "1rem" }} />
        <span style={{ fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary, #6c757d)" }}>
            {label}
        </span>
    </div>
);

const TimelineItem = ({ label, value }) => {
    if (!value) return null;
    const d = new Date(value);
    return (
        <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #6c757d)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: "0.15rem" }}>
                {label}
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary, #1e293b)" }}>
                {d.toLocaleString("id-ID")}
            </div>
        </div>
    );
};

export default LogbookDetailModal;
