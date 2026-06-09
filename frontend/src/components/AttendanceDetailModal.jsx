import { getAvatarUrl, getImageUrl } from "../utils/Constant";

/**
 * AttendanceDetailModal â€” Komponen modal detail presensi yang seragam
 * digunakan oleh role user, supervisor, dan admin.
 *
 * Props:
 *  - show {boolean}
 *  - onClose {function}
 *  - attendance {object} â€” data presensi yang dipilih
 *  - showUserInfo {boolean} â€” tampilkan info karyawan (supervisor/admin)
 */
const AttendanceDetailModal = ({ show, onClose, attendance, showUserInfo = false }) => {
    if (!show || !attendance) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (t) => {
        if (!t) return null;
        return t;
    };

    const getStatusInfo = (status) => {
        const map = {
            present: { color: "#16a34a", textColor: "var(--color-present, #16a34a)", bg: "#dcfce7", darkBg: "#14532d", label: "Hadir", icon: "check-circle-fill" },
            late: { color: "#d97706", textColor: "var(--color-late, #d97706)", bg: "#fef3c7", darkBg: "#78350f", label: "Terlambat", icon: "clock-fill" },
            absent: { color: "#dc2626", textColor: "var(--color-absent, #dc2626)", bg: "#fee2e2", darkBg: "#7f1d1d", label: "Tidak Hadir", icon: "x-circle-fill" },
            excused: { color: "#2563eb", textColor: "var(--color-excused, #2563eb)", bg: "#dbeafe", darkBg: "#1e3a8a", label: "Izin", icon: "info-circle-fill" },
            early: { color: "#0891b2", textColor: "var(--color-early, #0891b2)", bg: "#cffafe", darkBg: "#164e63", label: "Pulang Cepat", icon: "box-arrow-left" },
            leave: { color: "#7c3aed", textColor: "var(--color-leave, #7c3aed)", bg: "#ede9fe", darkBg: "#4c1d95", label: "Cuti", icon: "file-earmark-text-fill" },
            sick: { color: "#64748b", textColor: "var(--color-sick, #64748b)", bg: "#f1f5f9", darkBg: "#1e293b", label: "Sakit", icon: "hospital" },
        };
        return map[status] || { color: "#64748b", textColor: "var(--color-unknown, #64748b)", bg: "#f1f5f9", darkBg: "#1e293b", label: status || "-", icon: "question-circle" };
    };

    const statusInfo = getStatusInfo(attendance.status);
    const isCheckInOnsite = attendance.work_type === "onsite";
    const isCheckOutOnsite = attendance.check_out_time &&
        !attendance.checkout_offsite_reason &&
        !attendance.check_out_photo;

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
                        maxWidth: "720px",
                        borderRadius: "1.25rem",
                        overflow: "hidden",
                        backgroundColor: "var(--bg-card, #fff)",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
                        border: "1px solid var(--border-color, rgba(0,0,0,0.1))",
                        animation: "slideUpModal 0.25s ease",
                    }}
                >
                    {/* â”€â”€â”€ HEADER â”€â”€â”€ */}
                    <div
                        style={{
                            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
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
                                <i className="bi bi-calendar-check-fill" style={{ color: "#fff", fontSize: "1.25rem" }} />
                            </div>
                            <div>
                                <h5 style={{ color: "#fff", margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>
                                    Detail Presensi
                                </h5>
                                <small style={{ color: "rgba(255,255,255,0.75)" }}>
                                    {formatDate(attendance.date)}
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

                    {/* â”€â”€â”€ BODY â”€â”€â”€ */}
                    <div style={{ padding: "1.5rem 1.75rem", maxHeight: "75vh", overflowY: "auto" }}>

                        {/* â”€â”€ INFO KARYAWAN (supervisor/admin only) â”€â”€ */}
                        {showUserInfo && attendance.user && (
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
                                    src={getAvatarUrl(attendance.user)}
                                    alt={attendance.user?.name}
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        flexShrink: 0,
                                        border: "3px solid rgba(79,70,229,0.3)",
                                    }}
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(attendance.user?.name || "User")}&background=4f46e5&color=fff&size=128`;
                                    }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.2rem" }}>
                                        {attendance.user?.name || "-"}
                                    </div>
                                    <div style={{ color: "var(--text-secondary, #64748b)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                                        {attendance.user?.email || "-"}
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                                        {attendance.user?.division?.name && (
                                            <span className="badge bg-primary-subtle text-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                <i className="bi bi-diagram-3" style={{ fontSize: "0.7rem" }} />
                                                {attendance.user.division.name}
                                            </span>
                                        )}
                                        {attendance.user?.periode && (
                                            <span className="badge bg-info-subtle text-info" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                <i className="bi bi-calendar-range" style={{ fontSize: "0.7rem" }} />
                                                {attendance.user.periode}
                                            </span>
                                        )}
                                        {attendance.user?.sumber_magang && (
                                            <span className="badge bg-warning-subtle text-warning" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                <i className="bi bi-building" style={{ fontSize: "0.7rem" }} />
                                                {attendance.user.sumber_magang}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* â”€â”€ SUMMARY CARDS: Status + Work Type â”€â”€ */}
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
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Status Kehadiran
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <i className={`bi bi-${statusInfo.icon}`} style={{ color: statusInfo.textColor, fontSize: "1.15rem" }} />
                                    <span style={{ fontWeight: 700, color: statusInfo.textColor, fontSize: "0.95rem" }}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                            </div>
                            {/* Work Type */}
                            <div
                                style={{
                                    borderRadius: "0.875rem",
                                    padding: "1rem 1.125rem",
                                    border: isCheckInOnsite ? "1.5px solid #2563eb40" : "1.5px solid #d9770640",
                                    background: isCheckInOnsite ? "#2563eb12" : "#d9770612",
                                }}
                            >
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Tipe Kerja
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <i
                                        className={`bi bi-${isCheckInOnsite ? "building-fill" : "house-door-fill"}`}
                                        style={{ color: isCheckInOnsite ? "var(--color-onsite, #2563eb)" : "var(--color-late, #d97706)", fontSize: "1.15rem" }}
                                    />
                                    <span style={{ fontWeight: 700, color: isCheckInOnsite ? "var(--color-onsite, #2563eb)" : "var(--color-late, #d97706)", fontSize: "0.95rem" }}>
                                        {isCheckInOnsite ? "ONSITE" : "OFFSITE"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* â”€â”€ WAKTU CHECK-IN & CHECK-OUT â”€â”€ */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "1.25rem" }}>
                            {/* Check-in */}
                            <div
                                style={{
                                    borderRadius: "0.875rem",
                                    padding: "1rem 1.125rem",
                                    border: "1.5px solid #16a34a30",
                                    background: "#16a34a0d",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                                    <i className="bi bi-box-arrow-in-right" style={{ color: "#16a34a", fontSize: "1rem" }} />
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Check-in Time
                                    </span>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: "1.6rem", color: "#16a34a", lineHeight: 1.1, marginBottom: "0.4rem" }}>
                                    {formatTime(attendance.check_in_time) || <span style={{ fontSize: "1rem", fontWeight: 400 }}>-</span>}
                                </div>
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.3rem",
                                        padding: "0.2rem 0.6rem",
                                        borderRadius: "99px",
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        background: isCheckInOnsite ? "#2563eb20" : "#d9770620",
                                        color: isCheckInOnsite ? "var(--color-onsite, #2563eb)" : "var(--color-late, #d97706)",
                                    }}
                                >
                                    <i className={`bi bi-${isCheckInOnsite ? "building" : "house-door"}`} />
                                    {isCheckInOnsite ? "ONSITE" : "OFFSITE"}
                                </span>
                                {/* ONSITE notice */}
                                {isCheckInOnsite && attendance.check_in_time && (
                                    <div style={{
                                        marginTop: "0.6rem",
                                        padding: "0.4rem 0.6rem",
                                        borderRadius: "0.5rem",
                                        background: "#2563eb10",
                                        border: "1px solid #2563eb25",
                                        fontSize: "0.75rem",
                                        color: "var(--color-onsite, #2563eb)",
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "0.35rem",
                                    }}>
                                        <i className="bi bi-info-circle-fill" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
                                        <span>User melakukan presensi onsite</span>
                                    </div>
                                )}
                            </div>

                            {/* Check-out */}
                            <div
                                style={{
                                    borderRadius: "0.875rem",
                                    padding: "1rem 1.125rem",
                                    border: "1.5px solid #dc262630",
                                    background: "#dc26260d",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                                    <i className="bi bi-box-arrow-right" style={{ color: "#dc2626", fontSize: "1rem" }} />
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Check-out Time
                                    </span>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: "1.6rem", color: attendance.check_out_time ? "#dc2626" : "var(--text-secondary, #64748b)", lineHeight: 1.1, marginBottom: "0.4rem" }}>
                                    {formatTime(attendance.check_out_time) || <span style={{ fontSize: "0.9rem", fontWeight: 400 }}>Belum Checkout</span>}
                                </div>
                                {attendance.check_out_time && (
                                    <>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.3rem",
                                                padding: "0.2rem 0.6rem",
                                                borderRadius: "99px",
                                                fontSize: "0.72rem",
                                                fontWeight: 700,
                                                background: isCheckOutOnsite ? "#2563eb20" : "#d9770620",
                                                color: isCheckOutOnsite ? "var(--color-onsite, #2563eb)" : "var(--color-late, #d97706)",
                                            }}
                                        >
                                            <i className={`bi bi-${isCheckOutOnsite ? "building" : "house-door"}`} />
                                            {isCheckOutOnsite ? "ONSITE" : "OFFSITE"}
                                        </span>
                                        {/* ONSITE notice */}
                                        {isCheckOutOnsite && (
                                            <div style={{
                                                marginTop: "0.6rem",
                                                padding: "0.4rem 0.6rem",
                                                borderRadius: "0.5rem",
                                                background: "#2563eb10",
                                                border: "1px solid #2563eb25",
                                                fontSize: "0.75rem",
                                                color: "var(--color-onsite, #2563eb)",
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: "0.35rem",
                                            }}>
                                                <i className="bi bi-info-circle-fill" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
                                                <span>User melakukan presensi onsite</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* â”€â”€ LOKASI GPS â”€â”€ */}
                        {(attendance.check_in_latitude || attendance.check_out_latitude || attendance.check_in_address || attendance.check_out_address) && (
                            <div style={{ marginBottom: "1.25rem" }}>
                                <SectionTitle icon="geo-alt-fill" label="Informasi Lokasi" />
                                <div style={{ display: "grid", gridTemplateColumns: attendance.check_in_latitude && attendance.check_out_latitude ? "1fr 1fr" : "1fr", gap: "0.75rem" }}>
                                    {(attendance.check_in_latitude || attendance.check_in_address) && (
                                        <LocationCard
                                            color="#16a34a"
                                            icon="box-arrow-in-right"
                                            label="Lokasi Check-in"
                                            lat={attendance.check_in_latitude}
                                            lng={attendance.check_in_longitude}
                                            address={attendance.check_in_address}
                                            ip={attendance.check_in_ip}
                                        />
                                    )}
                                    {(attendance.check_out_latitude || attendance.check_out_address) && (
                                        <LocationCard
                                            color="#dc2626"
                                            icon="box-arrow-right"
                                            label="Lokasi Check-out"
                                            lat={attendance.check_out_latitude}
                                            lng={attendance.check_out_longitude}
                                            address={attendance.check_out_address}
                                            ip={attendance.check_out_ip}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* â”€â”€ CHECK-IN INFORMATION â”€â”€ */}
                        {(attendance.offsite_reason || attendance.check_in_photo || isCheckInOnsite) && (
                            <div style={{ marginBottom: "1.25rem" }}>
                                <SectionTitle icon="box-arrow-in-right" label="Informasi Check-in" color="#16a34a" />
                                <div
                                    style={{
                                        borderRadius: "0.875rem",
                                        border: "1.5px solid #16a34a25",
                                        overflow: "hidden",
                                    }}
                                >
                                    {isCheckInOnsite ? (
                                        // ONSITE check-in: tidak ada foto
                                        <OnsiteNotice type="checkin" />
                                    ) : (
                                        <>
                                            {attendance.offsite_reason && (
                                                <div style={{ padding: "0.875rem 1rem", borderBottom: attendance.check_in_photo ? "1px solid var(--bs-border-color, rgba(0,0,0,0.08))" : "none" }}>
                                                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                        <i className="bi bi-chat-left-text me-1" />
                                                        Keterangan OFFSITE Check-in
                                                    </div>
                                                    <div style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "#d9770614", border: "1px solid #d9770640", fontSize: "0.9rem", whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--text-primary, #1e293b)" }}>
                                                        {attendance.offsite_reason}
                                                    </div>
                                                </div>
                                            )}
                                            {attendance.check_in_photo && (
                                                <PhotoDisplay
                                                    src={getImageUrl(attendance.check_in_photo)}
                                                    alt="Foto Check-in OFFSITE"
                                                    label="Foto Bukti Check-in OFFSITE"
                                                    accentColor="#d97706"
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* â”€â”€ CHECK-OUT INFORMATION â”€â”€ */}
                        {attendance.check_out_time && (
                            <div style={{ marginBottom: "1.25rem" }}>
                                <SectionTitle icon="box-arrow-right" label="Informasi Check-out" color="#dc2626" />
                                <div
                                    style={{
                                        borderRadius: "0.875rem",
                                        border: "1.5px solid #dc262625",
                                        overflow: "hidden",
                                    }}
                                >
                                    {isCheckOutOnsite ? (
                                        <OnsiteNotice type="checkout" />
                                    ) : (
                                        <>
                                            {attendance.checkout_offsite_reason && (
                                                <div style={{ padding: "0.875rem 1rem", borderBottom: attendance.check_out_photo ? "1px solid var(--bs-border-color, rgba(0,0,0,0.08))" : "none" }}>
                                                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                        <i className="bi bi-chat-left-text me-1" />
                                                        Keterangan OFFSITE Check-out
                                                    </div>
                                                    <div style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "#dc262614", border: "1px solid #dc262640", fontSize: "0.9rem", whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--text-primary, #1e293b)" }}>
                                                        {attendance.checkout_offsite_reason}
                                                    </div>
                                                </div>
                                            )}
                                            {attendance.check_out_photo && (
                                                <PhotoDisplay
                                                    src={getImageUrl(attendance.check_out_photo)}
                                                    alt="Foto Check-out OFFSITE"
                                                    label="Foto Bukti Check-out OFFSITE"
                                                    accentColor="#dc2626"
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* â”€â”€ CATATAN â”€â”€ */}
                        {attendance.notes && (
                            <div style={{ marginBottom: "1.25rem" }}>
                                <SectionTitle icon="sticky-fill" label="Catatan" />
                                <div style={{ padding: "0.875rem 1rem", borderRadius: "0.875rem", border: "1.5px solid var(--border-color, rgba(0,0,0,0.1))", background: "var(--bg-body, #f8f9fa)", fontSize: "0.9rem", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                                    {attendance.notes}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* â”€â”€â”€ FOOTER â”€â”€â”€ */}
                    <div
                        style={{
                            padding: "1rem 1.75rem",
                            borderTop: "1px solid var(--border-color, rgba(0,0,0,0.08))",
                            display: "flex",
                            justifyContent: "flex-end",
                            background: "var(--bg-body, #f8f9fa)",
                        }}
                    >
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
                    --color-present: #16a34a;
                    --color-late: #d97706;
                    --color-absent: #dc2626;
                    --color-excused: #2563eb;
                    --color-early: #0891b2;
                    --color-leave: #7c3aed;
                    --color-sick: #64748b;
                    --color-unknown: #64748b;
                    --color-onsite: #2563eb;
                    --color-onsite-notice: #4f46e5;
                    --bg-badge-info: #cffafe;
                    --text-badge-info: #0891b2;
                    --border-badge-info: #a5f3fc;
                    --bg-badge-warning: #fef3c7;
                    --text-badge-warning: #d97706;
                    --border-badge-warning: #fde68a;
                    --bg-badge-secondary: #f1f5f9;
                    --text-badge-secondary: #475569;
                    --border-badge-secondary: #e2e8f0;
                }
                
                [data-theme="dark"] {
                    --color-present: #4ade80;
                    --color-late: #fbbf24;
                    --color-absent: #f87171;
                    --color-excused: #60a5fa;
                    --color-early: #38bdf8;
                    --color-leave: #a78bfa;
                    --color-sick: #94a3b8;
                    --color-unknown: #94a3b8;
                    --color-onsite: #60a5fa;
                    --color-onsite-notice: #818cf8;
                    --bg-badge-info: #164e63;
                    --text-badge-info: #67e8f9;
                    --border-badge-info: #0891b2;
                    --bg-badge-warning: #78350f;
                    --text-badge-warning: #fcd34d;
                    --border-badge-warning: #d97706;
                    --bg-badge-secondary: #1e293b;
                    --text-badge-secondary: #cbd5e1;
                    --border-badge-secondary: #475569;
                }
            `}</style>
        </>
    );
};

/* â”€â”€â”€ Sub-components â”€â”€â”€ */

const SectionTitle = ({ icon, label, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
        <i className={`bi bi-${icon}`} style={{ color: color || "var(--text-primary, #1e293b)", fontSize: "1rem" }} />
        <span style={{ fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary, #64748b)" }}>
            {label}
        </span>
    </div>
);

const LocationCard = ({ color, icon, label, lat, lng, address, ip }) => (
    <div
        style={{
            padding: "0.75rem 0.875rem",
            borderRadius: "0.75rem",
            border: `1.5px solid ${color}25`,
            background: `${color}0a`,
        }}
    >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <i className={`bi bi-${icon}`} style={{ color, fontSize: "0.85rem" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        </div>
        {lat && lng && (
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary, #64748b)", marginBottom: "0.2rem" }}>
                <i className="bi bi-pin-map-fill me-1" style={{ color }} />
                {lat}, {lng}
            </div>
        )}
        {address && (
            <div style={{ fontSize: "0.8rem", color: "var(--text-primary, #1e293b)" }}>
                <i className="bi bi-building me-1" style={{ color: "var(--text-secondary, #64748b)" }} />
                {address}
            </div>
        )}
        {ip && (
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary, #64748b)", marginTop: "0.2rem" }}>
                <i className="bi bi-hdd-network me-1" />
                {ip}
            </div>
        )}
    </div>
);

const OnsiteNotice = ({ type }) => (
    <div
        style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            padding: "1.5rem 1.25rem",
            background: "linear-gradient(135deg, #2563eb08, #4f46e510)",
            minHeight: "110px",
        }}
    >
        <div
            style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(79,70,229,0.25)",
            }}
        >
            <i className="bi bi-building-check" style={{ color: "#fff", fontSize: "1.25rem" }} />
        </div>
        <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-onsite-notice, #4f46e5)", marginBottom: "0.25rem" }}>
                User melakukan presensi onsite
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary, #64748b)" }}>
                Presensi ONSITE tidak memerlukan bukti foto atau gambar
            </div>
        </div>
    </div>
);

const PhotoDisplay = ({ src, alt, label, accentColor }) => (
    <div style={{ padding: "0.875rem 1rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", fontWeight: 600, marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <i className="bi bi-camera-fill me-1" style={{ color: accentColor }} />
            {label}
        </div>
        <div
            style={{
                borderRadius: "0.75rem",
                overflow: "hidden",
                border: `1.5px solid ${accentColor}30`,
                cursor: "pointer",
                position: "relative",
            }}
            onClick={() => window.open(src, "_blank")}
            title="Klik untuk memperbesar"
        >
            <img
                src={src}
                alt={alt}
                style={{
                    width: "100%",
                    maxHeight: "280px",
                    objectFit: "contain",
                    background: "var(--bg-body, #f8f9fa)",
                    display: "block",
                }}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23f3f4f6' width='400' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' text-anchor='middle' x='200' y='100'%3EFoto tidak tersedia%3C/text%3E%3C/svg%3E";
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "0.5rem",
                    right: "0.5rem",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    borderRadius: "0.4rem",
                    padding: "0.2rem 0.5rem",
                    fontSize: "0.72rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    backdropFilter: "blur(4px)",
                }}
            >
                <i className="bi bi-zoom-in" />
                Perbesar
            </div>
        </div>
    </div>
);

export default AttendanceDetailModal;


