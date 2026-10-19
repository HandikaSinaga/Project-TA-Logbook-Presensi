import React, { useState, useEffect } from "react";
import { getAvatarUrl } from "../utils/Constant";
import toast from "react-hot-toast";

/**
 * MemberDetailModal
 * Komponen modal detail profil anggota untuk User, Supervisor, dan Admin.
 */
const MemberDetailModal = ({ show, onClose, member, divisionName }) => {
    const [activeTab, setActiveTab] = useState("profile");

    // Close on Escape key & manage body scroll lock
    useEffect(() => {
        if (!show) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [show, onClose]);

    // Reset tab to profile when member changes
    useEffect(() => {
        if (show) {
            setActiveTab("profile");
        }
    }, [show, member?.id]);

    if (!show || !member) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Format clean Indonesian phone number for WhatsApp
    const getWhatsAppLink = (phone) => {
        if (!phone) return null;
        const cleanPhone = phone.replace(/\D/g, "");
        const phoneWithCode = cleanPhone.startsWith("62")
            ? cleanPhone
            : `62${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}`;
        return `https://wa.me/${phoneWithCode}`;
    };

    // Copy to clipboard helper
    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} berhasil disalin!`, {
            id: `copy-${label}`,
            icon: "📋",
        });
    };

    // Quick copy all contacts
    const copyAllContacts = () => {
        const lines = [
            `Nama: ${member.name}`,
            `Email: ${member.email}`,
            member.phone ? `WhatsApp: ${member.phone}` : null,
            member.nip ? `NIP/NIM: ${member.nip}` : null,
            member.position ? `Posisi: ${member.position}` : null,
        ].filter(Boolean);

        navigator.clipboard.writeText(lines.join("\n"));
        toast.success("Kontak lengkap disalin!", { icon: "📋" });
    };

    const hasSocialMedia = Boolean(
        member.instagram ||
        member.linkedin ||
        member.twitter ||
        member.facebook ||
        member.telegram ||
        member.github
    );

    const hasStats =
        member.attendance_count !== undefined ||
        member.logbook_count !== undefined;

    const isSupervisor = member.role === "supervisor";
    const isAdmin = member.role === "admin";

    // Header gradient by role
    const getHeaderGradient = () => {
        if (isSupervisor) {
            return "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%)";
        }
        if (isAdmin) {
            return "linear-gradient(135deg, #831843 0%, #be185d 50%, #e11d48 100%)";
        }
        return "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)";
    };

    return (
        <div
            onClick={handleOverlayClick}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(6px)",
                zIndex: 1060,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                overflowY: "auto",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="member-detail-modal-card"
                style={{
                    width: "100%",
                    maxWidth: "760px",
                    borderRadius: "1.25rem",
                    overflow: "hidden",
                    backgroundColor: "var(--bg-card, #ffffff)",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35)",
                    border: "1px solid var(--border-color, rgba(0,0,0,0.1))",
                    animation: "slideUpModalCustom 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "92vh",
                }}
            >
                {/* ─── HERO HEADER ─── */}
                <div
                    style={{
                        background: getHeaderGradient(),
                        padding: "1.75rem 2rem 1.5rem",
                        position: "relative",
                        color: "#ffffff",
                    }}
                >
                    {/* Background geometric accents */}
                    <div
                        style={{
                            position: "absolute",
                            top: "-20px",
                            right: "-20px",
                            width: "160px",
                            height: "160px",
                            borderRadius: "50%",
                            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            bottom: "-30px",
                            left: "30%",
                            width: "140px",
                            height: "140px",
                            borderRadius: "50%",
                            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                            pointerEvents: "none",
                        }}
                    />

                    {/* Top Row: Badges & Close Button */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                            <span
                                className="badge rounded-pill text-white"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.18)",
                                    backdropFilter: "blur(8px)",
                                    border: "1px solid rgba(255,255,255,0.25)",
                                    fontSize: "0.78rem",
                                    padding: "0.4rem 0.8rem",
                                    fontWeight: 500,
                                }}
                            >
                                <i className="bi bi-diagram-3-fill me-1"></i>
                                {divisionName || member.division?.name || "Divisi Aktif"}
                            </span>
                            <span
                                className="badge rounded-pill"
                                style={{
                                    backgroundColor: "rgba(16, 185, 129, 0.25)",
                                    color: "#34d399",
                                    border: "1px solid rgba(16, 185, 129, 0.4)",
                                    fontSize: "0.78rem",
                                    padding: "0.4rem 0.8rem",
                                    fontWeight: 600,
                                }}
                            >
                                <i className="bi bi-dot me-0 fs-6"></i>
                                Anggota Aktif
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-close btn-close-white"
                            aria-label="Tutup"
                            style={{
                                opacity: 0.9,
                                transition: "all 0.2s ease",
                                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                            }}
                        ></button>
                    </div>

                    {/* Profile Identity */}
                    <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-3 pt-1">
                        <div className="position-relative flex-shrink-0">
                            <img
                                src={getAvatarUrl(member)}
                                alt={member.name}
                                className="rounded-circle shadow-lg"
                                style={{
                                    width: "92px",
                                    height: "92px",
                                    objectFit: "cover",
                                    border: "3.5px solid #ffffff",
                                    backgroundColor: "#ffffff",
                                }}
                                onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        member.name || "User"
                                    )}&background=6366f1&color=fff&size=180&bold=true`;
                                }}
                            />
                            <span
                                className="position-absolute bottom-0 end-0 rounded-circle"
                                style={{
                                    width: "18px",
                                    height: "18px",
                                    backgroundColor: "#10b981",
                                    border: "3px solid #ffffff",
                                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                                }}
                                title="Status Aktif"
                            />
                        </div>

                        <div className="text-center text-sm-start flex-grow-1">
                            <h3
                                className="fw-bold mb-1 text-white"
                                style={{ letterSpacing: "-0.02em" }}
                            >
                                {member.name}
                            </h3>

                            <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-sm-start align-items-center mb-2">
                                {member.position && (
                                    <span
                                        className="text-white-50 small"
                                        style={{ fontSize: "0.9rem" }}
                                    >
                                        <i className="bi bi-briefcase-fill me-1 text-white opacity-75"></i>
                                        {member.position}
                                    </span>
                                )}

                                <span
                                    className="badge rounded-pill"
                                    style={{
                                        backgroundColor: isSupervisor
                                            ? "rgba(245, 158, 11, 0.25)"
                                            : "rgba(255, 255, 255, 0.2)",
                                        color: isSupervisor ? "#fbbf24" : "#ffffff",
                                        border: `1px solid ${
                                            isSupervisor
                                                ? "rgba(245, 158, 11, 0.5)"
                                                : "rgba(255, 255, 255, 0.3)"
                                        }`,
                                        fontSize: "0.75rem",
                                        padding: "0.3rem 0.75rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    <i
                                        className={`bi ${
                                            isSupervisor
                                                ? "bi-star-fill text-warning me-1"
                                                : "bi-person-badge-fill me-1"
                                        }`}
                                    ></i>
                                    {isSupervisor
                                        ? "Supervisor Pembimbing"
                                        : isAdmin
                                        ? "Administrator"
                                        : "Mahasiswa Magang / Anggota"}
                                </span>
                            </div>

                            {/* Secondary chips */}
                            <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-sm-start align-items-center small text-white-50">
                                <span title="Email Pengguna">
                                    <i className="bi bi-envelope me-1 text-white opacity-75"></i>
                                    {member.email}
                                </span>
                                {member.phone && (
                                    <span title="Nomor WhatsApp / HP">
                                        <i className="bi bi-whatsapp me-1 text-white opacity-75"></i>
                                        {member.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── QUICK ACTION BAR ─── */}
                <div
                    className="px-4 py-2 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom"
                    style={{
                        backgroundColor: "var(--bg-card, #ffffff)",
                        borderBottomColor: "var(--border-color, rgba(0,0,0,0.08))",
                    }}
                >
                    {/* Navigation Tabs */}
                    <div className="nav nav-pills gap-1 py-1" role="tablist">
                        <button
                            type="button"
                            onClick={() => setActiveTab("profile")}
                            className={`btn btn-sm rounded-pill px-3 py-1 fw-medium ${
                                activeTab === "profile"
                                    ? "btn-primary text-white"
                                    : "btn-outline-secondary border-0"
                            }`}
                            style={{ fontSize: "0.82rem" }}
                        >
                            <i className="bi bi-person-lines-fill me-1"></i>
                            Profil & Personal
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("social")}
                            className={`btn btn-sm rounded-pill px-3 py-1 fw-medium position-relative ${
                                activeTab === "social"
                                    ? "btn-primary text-white"
                                    : "btn-outline-secondary border-0"
                            }`}
                            style={{ fontSize: "0.82rem" }}
                        >
                            <i className="bi bi-share-fill me-1"></i>
                            Sosial & Kontak
                            {hasSocialMedia && (
                                <span
                                    className="position-absolute top-0 end-0 p-1 bg-success border border-light rounded-circle"
                                    style={{ transform: "translate(-2px, 2px)" }}
                                />
                            )}
                        </button>
                        {hasStats && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("performance")}
                                className={`btn btn-sm rounded-pill px-3 py-1 fw-medium ${
                                    activeTab === "performance"
                                        ? "btn-primary text-white"
                                        : "btn-outline-secondary border-0"
                                }`}
                                style={{ fontSize: "0.82rem" }}
                            >
                                <i className="bi bi-bar-chart-fill me-1"></i>
                                Kinerja & Aktivitas
                            </button>
                        )}
                    </div>

                    {/* Quick Outreach Shortcuts */}
                    <div className="d-flex align-items-center gap-2 ms-auto py-1">
                        {member.phone && (
                            <a
                                href={getWhatsAppLink(member.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-success rounded-pill px-3 py-1 shadow-sm d-flex align-items-center"
                                style={{ fontSize: "0.82rem", fontWeight: 500 }}
                            >
                                <i className="bi bi-whatsapp me-1"></i>
                                WhatsApp
                            </a>
                        )}
                        <a
                            href={`mailto:${member.email}`}
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 d-flex align-items-center"
                            style={{ fontSize: "0.82rem", fontWeight: 500 }}
                        >
                            <i className="bi bi-envelope-fill me-1"></i>
                            Email
                        </a>
                        <button
                            type="button"
                            onClick={copyAllContacts}
                            className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1"
                            title="Salin Kontak Lengkap"
                            style={{ fontSize: "0.82rem" }}
                        >
                            <i className="bi bi-clipboard"></i>
                        </button>
                    </div>
                </div>

                {/* ─── MODAL BODY CONTENT ─── */}
                <div
                    className="p-4"
                    style={{
                        overflowY: "auto",
                        flexGrow: 1,
                        backgroundColor: "var(--bg-card, #ffffff)",
                    }}
                >
                    {/* TAB 1: PROFIL & PERSONAL */}
                    {activeTab === "profile" && (
                        <div className="d-flex flex-column gap-3">
                            {/* Bio Callout */}
                            {member.bio ? (
                                <div
                                    className="p-3 rounded-3"
                                    style={{
                                        backgroundColor: "var(--bg-hover, rgba(99, 102, 241, 0.05))",
                                        borderLeft: "4px solid #6366f1",
                                        borderTop: "1px solid var(--border-color, rgba(0,0,0,0.06))",
                                        borderRight: "1px solid var(--border-color, rgba(0,0,0,0.06))",
                                        borderBottom: "1px solid var(--border-color, rgba(0,0,0,0.06))",
                                    }}
                                >
                                    <div className="d-flex align-items-center mb-1">
                                        <i className="bi bi-chat-quote-fill text-primary me-2 fs-5"></i>
                                        <span className="fw-semibold text-primary small text-uppercase" style={{ letterSpacing: "0.05em" }}>
                                            Bio & Deskripsi Singkat
                                        </span>
                                    </div>
                                    <p
                                        className="mb-0 text-secondary"
                                        style={{
                                            fontSize: "0.92rem",
                                            lineHeight: 1.6,
                                            fontStyle: "italic",
                                        }}
                                    >
                                        "{member.bio}"
                                    </p>
                                </div>
                            ) : null}

                            {/* Informasi Personal & Akademik Card */}
                            <div
                                className="card border shadow-none"
                                style={{
                                    borderRadius: "1rem",
                                    borderColor: "var(--border-color, rgba(0,0,0,0.1))",
                                    backgroundColor: "var(--bg-card, #ffffff)",
                                }}
                            >
                                <div className="card-body p-3 p-md-4">
                                    <h6 className="fw-bold mb-3 d-flex align-items-center text-primary">
                                        <i className="bi bi-person-vcard me-2 fs-5"></i>
                                        Informasi Akademik & Penempatan
                                    </h6>

                                    <div className="row g-3">
                                        {/* Periode */}
                                        <div className="col-12 col-sm-6">
                                            <div className="modal-info-box p-3 h-100">
                                                <small className="text-muted d-block mb-1">
                                                    <i className="bi bi-calendar3 me-1 text-primary"></i>
                                                    Periode Magang / Kerja
                                                </small>
                                                <div className="fw-bold text-dark">
                                                    {member.periode || (
                                                        <span className="text-muted fw-normal fst-italic">Belum diatur</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sumber Magang / Asal Kampus */}
                                        <div className="col-12 col-sm-6">
                                            <div className="modal-info-box p-3 h-100">
                                                <small className="text-muted d-block mb-1">
                                                    <i className="bi bi-building me-1 text-success"></i>
                                                    Instansi / Sumber Magang
                                                </small>
                                                <div className="fw-bold text-dark text-capitalize">
                                                    {member.sumber_magang || (
                                                        <span className="text-muted fw-normal fst-italic">Belum diatur</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* NIP / NIM */}
                                        <div className="col-12 col-sm-6">
                                            <div className="modal-info-box p-3 h-100">
                                                <small className="text-muted d-block mb-1">
                                                    <i className="bi bi-credit-card-2-front me-1 text-info"></i>
                                                    Nomor Induk (NIP / NIM)
                                                </small>
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="fw-bold font-monospace">
                                                        {member.nip || (
                                                            <span className="text-muted fw-normal fst-italic">Belum ada NIP</span>
                                                        )}
                                                    </div>
                                                    {member.nip && (
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(member.nip, "NIP")}
                                                            className="btn btn-sm btn-link text-decoration-none p-0 text-muted hover-primary"
                                                            title="Salin NIP"
                                                        >
                                                            <i className="bi bi-clipboard"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Posisi / Jabatan */}
                                        <div className="col-12 col-sm-6">
                                            <div className="modal-info-box p-3 h-100">
                                                <small className="text-muted d-block mb-1">
                                                    <i className="bi bi-briefcase me-1 text-warning"></i>
                                                    Jabatan / Posisi Tim
                                                </small>
                                                <div className="fw-bold">
                                                    {member.position || "Anggota Tim"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Alamat Lengkap */}
                                        <div className="col-12">
                                            <div className="modal-info-box p-3">
                                                <small className="text-muted d-block mb-1">
                                                    <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
                                                    Alamat Lengkap / Domisili
                                                </small>
                                                <div style={{ fontSize: "0.92rem", lineHeight: 1.5 }}>
                                                    {member.address || (
                                                        <span className="text-muted fst-italic">Alamat belum dicantumkan</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: KONTAK & MEDIA SOSIAL */}
                    {activeTab === "social" && (
                        <div className="d-flex flex-column gap-3">
                            {/* Primary Contact Cards */}
                            <div className="row g-3">
                                {/* Email Card */}
                                <div className="col-12 col-sm-6">
                                    <div className="modal-info-box p-3 h-100 d-flex flex-column justify-content-between">
                                        <div className="d-flex align-items-center mb-2">
                                            <div
                                                className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                                style={{ width: "40px", height: "40px", backgroundColor: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}
                                            >
                                                <i className="bi bi-envelope-fill fs-5"></i>
                                            </div>
                                            <div className="overflow-hidden">
                                                <small className="text-muted d-block">Email Resmi</small>
                                                <div className="fw-bold text-truncate" title={member.email} style={{ color: "var(--text-primary)" }}>
                                                    {member.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2 mt-2 pt-2 border-top">
                                            <a
                                                href={`mailto:${member.email}`}
                                                className="btn btn-sm btn-outline-primary rounded-pill flex-grow-1"
                                            >
                                                <i className="bi bi-send me-1"></i> Kirim Pesan
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(member.email, "Email")}
                                                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                                title="Salin Email"
                                            >
                                                <i className="bi bi-clipboard"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Phone / WhatsApp Card */}
                                <div className="col-12 col-sm-6">
                                    <div className="modal-info-box p-3 h-100 d-flex flex-column justify-content-between">
                                        <div className="d-flex align-items-center mb-2">
                                            <div
                                                className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                                style={{ width: "40px", height: "40px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}
                                            >
                                                <i className="bi bi-whatsapp fs-5"></i>
                                            </div>
                                            <div className="overflow-hidden">
                                                <small className="text-muted d-block">Nomor WhatsApp / HP</small>
                                                <div className="fw-bold text-truncate" style={{ color: "var(--text-primary)" }}>
                                                    {member.phone || <span className="text-muted fw-normal fst-italic">Belum dicantumkan</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2 mt-2 pt-2 border-top">
                                            {member.phone ? (
                                                <>
                                                    <a
                                                        href={getWhatsAppLink(member.phone)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-sm btn-success rounded-pill flex-grow-1"
                                                    >
                                                        <i className="bi bi-whatsapp me-1"></i> Buka Chat
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(member.phone, "Nomor HP")}
                                                        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                                        title="Salin Nomor"
                                                    >
                                                        <i className="bi bi-clipboard"></i>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-muted small py-1 fst-italic">Kontak WhatsApp tidak tersedia</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Media Grid */}
                            <div
                                className="card border shadow-none social-card-container"
                                style={{ borderRadius: "1rem" }}
                            >
                                <div className="card-body p-3 p-md-4">
                                    <h6 className="fw-bold mb-3 d-flex align-items-center text-primary">
                                        <i className="bi bi-globe me-2 fs-5"></i>
                                        Tautan Media Sosial & Jejaring Profesional
                                    </h6>

                                    {hasSocialMedia ? (
                                        <div className="row g-2">
                                            {/* LinkedIn */}
                                            {member.linkedin && (
                                                <div className="col-12 col-sm-6">
                                                    <a
                                                        href={member.linkedin.startsWith("http") ? member.linkedin : `https://linkedin.com/in/${member.linkedin.replace(/^@/, "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="social-link-card p-2 px-3 d-flex align-items-center justify-content-between text-decoration-none"
                                                    >
                                                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                            <i className="bi bi-linkedin fs-5 text-primary"></i>
                                                            <span className="fw-medium text-truncate small social-link-title">LinkedIn</span>
                                                        </div>
                                                        <i className="bi bi-box-arrow-up-right text-muted small"></i>
                                                    </a>
                                                </div>
                                            )}

                                            {/* GitHub */}
                                            {member.github && (
                                                <div className="col-12 col-sm-6">
                                                    <a
                                                        href={member.github.startsWith("http") ? member.github : `https://github.com/${member.github.replace(/^@/, "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="social-link-card p-2 px-3 d-flex align-items-center justify-content-between text-decoration-none"
                                                    >
                                                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                            <i className="bi bi-github fs-5 social-icon-github"></i>
                                                            <span className="fw-medium text-truncate small social-link-title">GitHub</span>
                                                        </div>
                                                        <i className="bi bi-box-arrow-up-right text-muted small"></i>
                                                    </a>
                                                </div>
                                            )}

                                            {/* Instagram */}
                                            {member.instagram && (
                                                <div className="col-12 col-sm-6">
                                                    <a
                                                        href={member.instagram.startsWith("http") ? member.instagram : `https://instagram.com/${member.instagram.replace(/^@/, "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="social-link-card p-2 px-3 d-flex align-items-center justify-content-between text-decoration-none"
                                                    >
                                                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                            <i className="bi bi-instagram fs-5 text-danger"></i>
                                                            <span className="fw-medium text-truncate small social-link-title">Instagram</span>
                                                        </div>
                                                        <i className="bi bi-box-arrow-up-right text-muted small"></i>
                                                    </a>
                                                </div>
                                            )}

                                            {/* Twitter/X */}
                                            {member.twitter && (
                                                <div className="col-12 col-sm-6">
                                                    <a
                                                        href={member.twitter.startsWith("http") ? member.twitter : `https://twitter.com/${member.twitter.replace(/^@/, "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="social-link-card p-2 px-3 d-flex align-items-center justify-content-between text-decoration-none"
                                                    >
                                                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                            <i className="bi bi-twitter-x fs-5 text-info"></i>
                                                            <span className="fw-medium text-truncate small social-link-title">Twitter / X</span>
                                                        </div>
                                                        <i className="bi bi-box-arrow-up-right text-muted small"></i>
                                                    </a>
                                                </div>
                                            )}

                                            {/* Telegram */}
                                            {member.telegram && (
                                                <div className="col-12 col-sm-6">
                                                    <a
                                                        href={member.telegram.startsWith("http") ? member.telegram : `https://t.me/${member.telegram.replace(/^@/, "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="social-link-card p-2 px-3 d-flex align-items-center justify-content-between text-decoration-none"
                                                    >
                                                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                            <i className="bi bi-telegram fs-5 text-info"></i>
                                                            <span className="fw-medium text-truncate small social-link-title">Telegram</span>
                                                        </div>
                                                        <i className="bi bi-box-arrow-up-right text-muted small"></i>
                                                    </a>
                                                </div>
                                            )}

                                            {/* Facebook */}
                                            {member.facebook && (
                                                <div className="col-12 col-sm-6">
                                                    <a
                                                        href={member.facebook.startsWith("http") ? member.facebook : `https://facebook.com/${member.facebook}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="social-link-card p-2 px-3 d-flex align-items-center justify-content-between text-decoration-none"
                                                    >
                                                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                            <i className="bi bi-facebook fs-5 text-primary"></i>
                                                            <span className="fw-medium text-truncate small social-link-title">Facebook</span>
                                                        </div>
                                                        <i className="bi bi-box-arrow-up-right text-muted small"></i>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-muted">
                                            <i className="bi bi-share text-secondary fs-2 d-block mb-2 opacity-50"></i>
                                            <p className="mb-0 small fw-medium">Belum ada tautan media sosial yang ditambahkan</p>
                                            <small className="text-muted">Rekan ini belum memperbarui profil media sosial mereka.</small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: KINERJA & AKTIVITAS (IF STATS EXIST) */}
                    {activeTab === "performance" && hasStats && (
                        <div className="d-flex flex-column gap-3">
                            <div className="row g-3">
                                <div className="col-12 col-sm-6">
                                    <div
                                        className="p-4 rounded-3 text-center border"
                                        style={{
                                            backgroundColor: "rgba(16, 185, 129, 0.05)",
                                            borderColor: "rgba(16, 185, 129, 0.2)",
                                        }}
                                    >
                                        <div className="text-success mb-2">
                                            <i className="bi bi-check-circle-fill fs-2"></i>
                                        </div>
                                        <div className="display-5 fw-bold text-success mb-1">
                                            {member.attendance_count || 0}
                                        </div>
                                        <div className="fw-semibold" style={{ color: "var(--text-primary, #1e293b)" }}>
                                            Total Kehadiran
                                        </div>
                                        <small className="text-muted">Presensi berhasil tercatat</small>
                                    </div>
                                </div>

                                <div className="col-12 col-sm-6">
                                    <div
                                        className="p-4 rounded-3 text-center border"
                                        style={{
                                            backgroundColor: "rgba(99, 102, 241, 0.05)",
                                            borderColor: "rgba(99, 102, 241, 0.2)",
                                        }}
                                    >
                                        <div className="text-primary mb-2">
                                            <i className="bi bi-journal-check fs-2"></i>
                                        </div>
                                        <div className="display-5 fw-bold text-primary mb-1">
                                            {member.logbook_count || 0}
                                        </div>
                                        <div className="fw-semibold" style={{ color: "var(--text-primary, #1e293b)" }}>
                                            Total Logbook
                                        </div>
                                        <small className="text-muted">Aktivitas harian diserahkan</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── MODAL FOOTER ─── */}
                <div
                    className="px-4 py-3 border-top d-flex justify-content-between align-items-center"
                    style={{
                        backgroundColor: "var(--bg-card, #ffffff)",
                        borderTopColor: "var(--border-color, rgba(0,0,0,0.08))",
                    }}
                >
                    <div className="small text-muted d-none d-sm-block">
                        <i className="bi bi-shield-check text-success me-1"></i>
                        Data profil sinkron dengan sistem presensi
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary rounded-pill px-4 ms-auto"
                        style={{ fontWeight: 500 }}
                    >
                        <i className="bi bi-x-lg me-1"></i>
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemberDetailModal;
