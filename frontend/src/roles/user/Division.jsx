import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl } from "../../utils/Constant";
import toast from "react-hot-toast";
import MemberDetailModal from "../../components/MemberDetailModal";

const Division = () => {
    const [loading, setLoading] = useState(true);
    const [division, setDivision] = useState(null);
    const [members, setMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all"); // 'all' | 'supervisor' | 'member'
    const [sortBy, setSortBy] = useState("name_asc"); // 'name_asc' | 'name_desc' | 'position'
    const [selectedMember, setSelectedMember] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchDivisionData();
    }, []);

    const fetchDivisionData = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/user/divisions/my-division");
            const divisionData = response.data.data;
            setDivision(divisionData);
            setMembers(divisionData?.members || []);
        } catch (error) {
            console.error("Error fetching division:", error);
            toast.error("Gagal memuat data kelompok divisi");
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort members
    const filteredMembers = useMemo(() => {
        let result = [...members];

        // Role filter
        if (roleFilter === "supervisor") {
            result = result.filter((m) => m.role === "supervisor");
        } else if (roleFilter === "member") {
            result = result.filter((m) => m.role !== "supervisor");
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (m) =>
                    m.name?.toLowerCase().includes(query) ||
                    m.email?.toLowerCase().includes(query) ||
                    m.position?.toLowerCase().includes(query) ||
                    m.nip?.toLowerCase().includes(query) ||
                    m.sumber_magang?.toLowerCase().includes(query)
            );
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "name_asc") {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (sortBy === "name_desc") {
                return (b.name || "").localeCompare(a.name || "");
            }
            if (sortBy === "position") {
                return (a.position || "").localeCompare(b.position || "");
            }
            return 0;
        });

        return result;
    }, [members, searchQuery, roleFilter, sortBy]);

    const handleViewMember = (member) => {
        setSelectedMember(member);
        setShowModal(true);
    };

    const getWhatsAppLink = (phone) => {
        if (!phone) return null;
        const cleanPhone = phone.replace(/\D/g, "");
        const phoneWithCode = cleanPhone.startsWith("62")
            ? cleanPhone
            : `62${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}`;
        return `https://wa.me/${phoneWithCode}`;
    };

    const supervisorCount = useMemo(
        () => members.filter((m) => m.role === "supervisor").length,
        [members]
    );
    const regularMemberCount = useMemo(
        () => members.filter((m) => m.role !== "supervisor").length,
        [members]
    );

    if (loading) {
        return (
            <div className="user-division p-4">
                <div
                    className="d-flex flex-column justify-content-center align-items-center"
                    style={{ minHeight: "450px" }}
                >
                    <div
                        className="spinner-border text-primary mb-3"
                        role="status"
                        style={{ width: "3rem", height: "3rem" }}
                    >
                        <span className="visually-hidden">Memuat data divisi...</span>
                    </div>
                    <h6 className="text-muted fw-normal">Memuat informasi divisi Anda...</h6>
                </div>
            </div>
        );
    }

    return (
        <div className="user-division p-3 p-md-4">
            {/* ─── PAGE HEADER ─── */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <span
                            className="rounded-3 d-inline-flex align-items-center justify-content-center"
                            style={{
                                width: "42px",
                                height: "42px",
                                backgroundColor: "rgba(99, 102, 241, 0.12)",
                                color: "#6366f1",
                            }}
                        >
                            <i className="bi bi-people-fill fs-5"></i>
                        </span>
                        Kelompok Divisi
                    </h2>
                    <p className="text-muted mb-0">
                        Direktori anggota, supervisor pembimbing, dan kontak rekan kerja divisi Anda
                    </p>
                </div>

                {division && (
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary-subtle px-3 py-2">
                            <i className="bi bi-person-check-fill me-1"></i>
                            {members.length} Rekan Terdaftar
                        </span>
                    </div>
                )}
            </div>

            {/* ─── NO DIVISION STATE ─── */}
            {!division ? (
                <div
                    className="card border-0 shadow-sm text-center p-5 rounded-4"
                    style={{ backgroundColor: "var(--bg-card, #ffffff)" }}
                >
                    <div className="card-body py-5">
                        <div
                            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                            style={{
                                width: "90px",
                                height: "90px",
                                backgroundColor: "rgba(99, 102, 241, 0.1)",
                                color: "#6366f1",
                            }}
                        >
                            <i className="bi bi-diagram-3 fs-1"></i>
                        </div>
                        <h4 className="fw-bold mb-2">Belum Memiliki Divisi</h4>
                        <p
                            className="text-muted mx-auto mb-4"
                            style={{ maxWidth: "520px", lineHeight: 1.6 }}
                        >
                            Anda saat ini belum ditempatkan ke dalam divisi kerja mana pun.
                            Informasi kelompok divisi dan rekan tim akan otomatis tampil setelah
                            Anda di-assign oleh Admin atau Supervisor.
                        </p>
                        <button
                            type="button"
                            onClick={fetchDivisionData}
                            className="btn btn-outline-primary rounded-pill px-4"
                        >
                            <i className="bi bi-arrow-clockwise me-1"></i> Muat Ulang Halaman
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* ─── MODERN DIVISION HERO BANNER ─── */}
                    <div className="division-hero-card p-4 p-lg-5 mb-4 shadow">
                        {/* Decorative background shapes */}
                        <div
                            className="hero-accent-circle"
                            style={{
                                top: "-40px",
                                right: "-40px",
                                width: "220px",
                                height: "220px",
                                background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)",
                            }}
                        />
                        <div
                            className="hero-accent-circle"
                            style={{
                                bottom: "-60px",
                                left: "20%",
                                width: "180px",
                                height: "180px",
                                background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                            }}
                        />

                        <div className="row align-items-center g-4 position-relative">
                            {/* Left: Division Info */}
                            <div className="col-lg-7">
                                <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                                    <span
                                        className="badge rounded-pill"
                                        style={{
                                            backgroundColor: "rgba(255,255,255,0.2)",
                                            backdropFilter: "blur(8px)",
                                            border: "1px solid rgba(255,255,255,0.3)",
                                            fontSize: "0.78rem",
                                            padding: "0.4rem 0.85rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        <i className="bi bi-building-fill me-1"></i>
                                        Divisi Kerja & Magang
                                    </span>
                                    {division.periode && (
                                        <span
                                            className="badge rounded-pill"
                                            style={{
                                                backgroundColor: "rgba(255,255,255,0.15)",
                                                border: "1px solid rgba(255,255,255,0.25)",
                                                fontSize: "0.78rem",
                                                padding: "0.4rem 0.85rem",
                                            }}
                                        >
                                            <i className="bi bi-calendar3 me-1"></i>
                                            Periode: {division.periode}
                                        </span>
                                    )}
                                </div>

                                <h2 className="fw-bold mb-2 text-white display-6">
                                    {division.name}
                                </h2>

                                <p
                                    className="mb-4 text-white"
                                    style={{
                                        opacity: 0.9,
                                        lineHeight: 1.6,
                                        maxWidth: "600px",
                                        fontSize: "0.98rem",
                                    }}
                                >
                                    {division.description ||
                                        "Divisi ini menaungi kolaborasi antar mahasiswa magang dan supervisor dalam proyek operasional perusahaan."}
                                </p>

                                {/* Quick Division Metrics */}
                                <div className="d-flex flex-wrap gap-4 pt-2">
                                    <div>
                                        <div className="display-6 fw-bold text-white mb-0">
                                            {members.length}
                                        </div>
                                        <small className="text-white-50 text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                                            Total Rekan
                                        </small>
                                    </div>
                                    <div className="border-start border-white border-opacity-25 ps-4">
                                        <div className="display-6 fw-bold text-white mb-0">
                                            {supervisorCount}
                                        </div>
                                        <small className="text-white-50 text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                                            Supervisor
                                        </small>
                                    </div>
                                    <div className="border-start border-white border-opacity-25 ps-4">
                                        <div className="display-6 fw-bold text-white mb-0">
                                            {regularMemberCount}
                                        </div>
                                        <small className="text-white-50 text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                                            Mahasiswa Magang
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Supervisor Spotlight Card */}
                            <div className="col-lg-5">
                                {division.supervisor ? (
                                    <div className="supervisor-spotlight-card p-3 p-md-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span
                                                className="badge rounded-pill"
                                                style={{
                                                    backgroundColor: "rgba(245, 158, 11, 0.3)",
                                                    color: "#fde68a",
                                                    border: "1px solid rgba(245, 158, 11, 0.5)",
                                                    fontSize: "0.75rem",
                                                    padding: "0.35rem 0.75rem",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <i className="bi bi-star-fill text-warning me-1"></i>
                                                Supervisor Pembimbing
                                            </span>
                                            <span className="small text-white opacity-75">
                                                Penanggung Jawab
                                            </span>
                                        </div>

                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <img
                                                src={getAvatarUrl(division.supervisor)}
                                                alt={division.supervisor.name}
                                                className="rounded-circle shadow flex-shrink-0"
                                                style={{
                                                    width: "58px",
                                                    height: "58px",
                                                    objectFit: "cover",
                                                    border: "2.5px solid #ffffff",
                                                    backgroundColor: "#ffffff",
                                                }}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        division.supervisor.name
                                                    )}&background=3b82f6&color=fff&size=120&bold=true`;
                                                }}
                                            />
                                            <div className="overflow-hidden">
                                                <h5 className="fw-bold mb-1 text-white text-truncate">
                                                    {division.supervisor.name}
                                                </h5>
                                                <div className="small text-white opacity-90 text-truncate mb-1">
                                                    <i className="bi bi-envelope me-1"></i>
                                                    {division.supervisor.email}
                                                </div>
                                                {division.supervisor.position && (
                                                    <div className="small text-white-50 text-truncate">
                                                        <i className="bi bi-briefcase me-1"></i>
                                                        {division.supervisor.position}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons on supervisor card */}
                                        <div className="d-flex gap-2 pt-2 border-top border-white border-opacity-20">
                                            <button
                                                type="button"
                                                onClick={() => handleViewMember(division.supervisor)}
                                                className="btn btn-sm btn-supervisor-action rounded-pill flex-grow-1 fw-bold shadow-sm d-flex align-items-center justify-content-center"
                                                style={{
                                                    fontSize: "0.82rem",
                                                    backgroundColor: "#ffffff",
                                                    color: "#0f172a",
                                                    border: "1px solid rgba(255, 255, 255, 0.9)",
                                                }}
                                            >
                                                <i className="bi bi-eye me-1" style={{ color: "#0f172a" }}></i>
                                                <span style={{ color: "#0f172a" }}>Lihat Profil</span>
                                            </button>
                                            {division.supervisor.phone && (
                                                <a
                                                    href={getWhatsAppLink(division.supervisor.phone)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-success rounded-pill px-3 fw-medium d-flex align-items-center"
                                                    title="Hubungi WhatsApp"
                                                    style={{ fontSize: "0.82rem" }}
                                                >
                                                    <i className="bi bi-whatsapp"></i>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="supervisor-spotlight-card p-4 text-center">
                                        <i className="bi bi-person-x fs-1 text-white-50 mb-2 d-block"></i>
                                        <h6 className="fw-bold text-white mb-1">Belum Ada Supervisor</h6>
                                        <small className="text-white-50">
                                            Supervisor untuk divisi ini belum ditetapkan oleh Admin.
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─── SEARCH & FILTER CONTROLS ─── */}
                    <div
                        className="card border-0 shadow-sm mb-4 rounded-4"
                        style={{ backgroundColor: "var(--bg-card, #ffffff)" }}
                    >
                        <div className="card-body p-3 p-md-4">
                            <div className="row g-3 align-items-center">
                                {/* Search input */}
                                <div className="col-12 col-md-6 col-lg-5">
                                    <div className="input-group">
                                        <span
                                            className="input-group-text border-end-0 bg-transparent text-muted"
                                            style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                                        >
                                            <i className="bi bi-search"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0 ps-0 focus-ring"
                                            placeholder="Cari nama, email, posisi, NIP, kampus..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{
                                                borderColor: "var(--border-color, #e2e8f0)",
                                                backgroundColor: "var(--bg-card, #ffffff)",
                                                color: "var(--text-primary)",
                                            }}
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary border-start-0"
                                                onClick={() => setSearchQuery("")}
                                                style={{ borderColor: "var(--border-color, #e2e8f0)" }}
                                                title="Hapus pencarian"
                                            >
                                                <i className="bi bi-x-lg"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Role filter pills */}
                                <div className="col-12 col-md-6 col-lg-4">
                                    <div className="btn-group w-100" role="group">
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${
                                                roleFilter === "all"
                                                    ? "btn-primary"
                                                    : "btn-outline-secondary"
                                            }`}
                                            onClick={() => setRoleFilter("all")}
                                        >
                                            Semua ({members.length})
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${
                                                roleFilter === "supervisor"
                                                    ? "btn-primary"
                                                    : "btn-outline-secondary"
                                            }`}
                                            onClick={() => setRoleFilter("supervisor")}
                                        >
                                            Supervisor ({supervisorCount})
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${
                                                roleFilter === "member"
                                                    ? "btn-primary"
                                                    : "btn-outline-secondary"
                                            }`}
                                            onClick={() => setRoleFilter("member")}
                                        >
                                            Anggota ({regularMemberCount})
                                        </button>
                                    </div>
                                </div>

                                {/* Sort options */}
                                <div className="col-12 col-lg-3 ms-auto">
                                    <div className="d-flex align-items-center gap-2">
                                        <label className="small text-muted text-nowrap mb-0 d-none d-sm-inline">
                                            Urutkan:
                                        </label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            style={{
                                                backgroundColor: "var(--bg-card, #ffffff)",
                                                borderColor: "var(--border-color, #e2e8f0)",
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            <option value="name_asc">Nama (A - Z)</option>
                                            <option value="name_desc">Nama (Z - A)</option>
                                            <option value="position">Jabatan / Posisi</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Filter feedback */}
                            {(searchQuery || roleFilter !== "all") && (
                                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top small text-muted">
                                    <span>
                                        Ditemukan <strong>{filteredMembers.length}</strong> dari{" "}
                                        {members.length} anggota tim
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setRoleFilter("all");
                                        }}
                                        className="btn btn-sm btn-link p-0 text-decoration-none"
                                    >
                                        Reset Filter
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── MEMBERS GRID ─── */}
                    {filteredMembers.length > 0 ? (
                        <div className="row g-4">
                            {filteredMembers.map((member) => {
                                const isMemberSupervisor = member.role === "supervisor";
                                return (
                                    <div key={member.id} className="col-12 col-md-6 col-lg-4">
                                        <div
                                            className="member-grid-card h-100 shadow-sm"
                                            onClick={() => handleViewMember(member)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {/* Card Top Banner / Accent */}
                                            <div
                                                style={{
                                                    height: "6px",
                                                    background: isMemberSupervisor
                                                        ? "linear-gradient(90deg, #f59e0b, #d97706)"
                                                        : "linear-gradient(90deg, #6366f1, #a855f7)",
                                                    borderTopLeftRadius: "1rem",
                                                    borderTopRightRadius: "1rem",
                                                }}
                                            />

                                            <div className="p-4 d-flex flex-column h-100">
                                                {/* Header Row: Avatar & Badges */}
                                                <div className="d-flex align-items-start justify-content-between mb-3">
                                                    <div className="position-relative">
                                                        <img
                                                            src={getAvatarUrl(member)}
                                                            alt={member.name}
                                                            className="rounded-circle shadow-sm"
                                                            style={{
                                                                width: "68px",
                                                                height: "68px",
                                                                objectFit: "cover",
                                                                border: isMemberSupervisor
                                                                    ? "3px solid #fbbf24"
                                                                    : "3px solid #6366f1",
                                                                backgroundColor: "var(--bg-card, #ffffff)",
                                                            }}
                                                            onError={(e) => {
                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                    member.name
                                                                )}&background=6366f1&color=fff&size=140&bold=true`;
                                                            }}
                                                        />
                                                        <span
                                                            className="position-absolute bottom-0 end-0 rounded-circle"
                                                            style={{
                                                                width: "14px",
                                                                height: "14px",
                                                                backgroundColor: "#10b981",
                                                                border: "2px solid #ffffff",
                                                            }}
                                                            title="Aktif"
                                                        />
                                                    </div>

                                                    <span
                                                        className="badge rounded-pill"
                                                        style={{
                                                            backgroundColor: isMemberSupervisor
                                                                ? "rgba(245, 158, 11, 0.15)"
                                                                : "rgba(99, 102, 241, 0.12)",
                                                            color: isMemberSupervisor ? "#d97706" : "#4f46e5",
                                                            border: `1px solid ${
                                                                isMemberSupervisor
                                                                    ? "rgba(245, 158, 11, 0.3)"
                                                                    : "rgba(99, 102, 241, 0.25)"
                                                            }`,
                                                            fontSize: "0.75rem",
                                                            padding: "0.35rem 0.75rem",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        <i
                                                            className={`bi ${
                                                                isMemberSupervisor
                                                                    ? "bi-star-fill text-warning me-1"
                                                                    : "bi-person-fill me-1"
                                                            }`}
                                                        ></i>
                                                        {isMemberSupervisor ? "Supervisor" : "Anggota Tim"}
                                                    </span>
                                                </div>

                                                {/* Member Name & Position */}
                                                <div className="mb-3">
                                                    <h5
                                                        className="fw-bold mb-1 text-truncate"
                                                        title={member.name}
                                                        style={{ color: "var(--text-primary)" }}
                                                    >
                                                        {member.name}
                                                    </h5>
                                                    <div className="small text-muted d-flex align-items-center text-truncate">
                                                        <i className="bi bi-briefcase me-1 text-secondary"></i>
                                                        <span>{member.position || "Mahasiswa Magang"}</span>
                                                    </div>
                                                </div>

                                                {/* Info Pills */}
                                                <div className="d-flex flex-column gap-2 mb-4 flex-grow-1">
                                                    {/* Email */}
                                                    <div className="info-pill d-flex align-items-center text-truncate">
                                                        <i className="bi bi-envelope-fill text-primary me-2 flex-shrink-0"></i>
                                                        <span
                                                            className="text-truncate"
                                                            title={member.email}
                                                            style={{ color: "var(--text-primary)" }}
                                                        >
                                                            {member.email}
                                                        </span>
                                                    </div>

                                                    {/* Phone */}
                                                    {member.phone && (
                                                        <div className="info-pill d-flex align-items-center text-truncate">
                                                            <i className="bi bi-telephone-fill text-success me-2 flex-shrink-0"></i>
                                                            <span style={{ color: "var(--text-primary)" }}>
                                                                {member.phone}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* NIP or Sumber Magang */}
                                                    {member.nip ? (
                                                        <div className="info-pill d-flex align-items-center text-truncate">
                                                            <i className="bi bi-credit-card-2-front-fill text-info me-2 flex-shrink-0"></i>
                                                            <span className="font-monospace small" style={{ color: "var(--text-primary)" }}>
                                                                {member.nip}
                                                            </span>
                                                        </div>
                                                    ) : member.sumber_magang ? (
                                                        <div className="info-pill d-flex align-items-center text-truncate">
                                                            <i className="bi bi-building text-secondary me-2 flex-shrink-0"></i>
                                                            <span className="text-capitalize small" style={{ color: "var(--text-primary)" }}>
                                                                {member.sumber_magang}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {/* Card Action Buttons */}
                                                <div
                                                    className="d-flex gap-2 pt-3 border-top mt-auto"
                                                    style={{ borderColor: "var(--border-color, rgba(0,0,0,0.06))" }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewMember(member)}
                                                        className="btn btn-sm btn-outline-primary rounded-pill flex-grow-1 fw-medium d-flex align-items-center justify-content-center"
                                                    >
                                                        <i className="bi bi-eye me-1"></i>
                                                        Lihat Detail
                                                    </button>
                                                    {member.phone && (
                                                        <a
                                                            href={getWhatsAppLink(member.phone)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-success rounded-pill px-3 d-flex align-items-center justify-content-center"
                                                            title="Kirim pesan WhatsApp"
                                                        >
                                                            <i className="bi bi-whatsapp"></i>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Empty Search State */
                        <div
                            className="card border-0 shadow-sm text-center p-5 rounded-4"
                            style={{ backgroundColor: "var(--bg-card, #ffffff)" }}
                        >
                            <div className="card-body py-4">
                                <div
                                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                    style={{
                                        width: "70px",
                                        height: "70px",
                                        backgroundColor: "rgba(100, 116, 139, 0.1)",
                                        color: "#64748b",
                                    }}
                                >
                                    <i className="bi bi-search fs-2"></i>
                                </div>
                                <h5 className="fw-bold mb-1">Tidak Ditemukan Anggota Tim</h5>
                                <p className="text-muted mx-auto mb-3" style={{ maxWidth: "420px" }}>
                                    {searchQuery
                                        ? `Tidak ada anggota divisi yang sesuai dengan kata kunci "${searchQuery}".`
                                        : "Belum ada anggota yang terdaftar pada filter ini."}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setRoleFilter("all");
                                    }}
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-4"
                                >
                                    <i className="bi bi-arrow-repeat me-1"></i> Reset Pencarian
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ─── REUSABLE MEMBER DETAIL MODAL ─── */}
            <MemberDetailModal
                show={showModal}
                onClose={() => setShowModal(false)}
                member={selectedMember}
                divisionName={division?.name}
            />
        </div>
    );
};

export default Division;
