import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { getAvatarUrl } from "../../utils/Constant";
import toast from "react-hot-toast";

const Division = () => {
    const [loading, setLoading] = useState(true);
    const [division, setDivision] = useState(null);
    const [members, setMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMember, setSelectedMember] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchDivisionData();
    }, []);

    const fetchDivisionData = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(
                "/user/divisions/my-division"
            );
            const divisionData = response.data.data || response.data;
            setDivision(divisionData);
            setMembers(divisionData.members || []);
        } catch (error) {
            console.error("Error fetching division:", error);
            toast.error("Gagal memuat data divisi");
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(
        (member) =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (member.position &&
                member.position
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()))
    );

    const handleViewMember = (member) => {
        setSelectedMember(member);
        setShowModal(true);
    };

    const getWhatsAppLink = (phone) => {
        if (!phone) return null;
        // Remove all non-numeric characters
        const cleanPhone = phone.replace(/\D/g, "");
        // Add country code if not present (assuming Indonesia +62)
        const phoneWithCode = cleanPhone.startsWith("62")
            ? cleanPhone
            : `62${
                  cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone
              }`;
        return `https://wa.me/${phoneWithCode}`;
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
        <div className="user-division p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <i className="bi bi-people-fill text-primary me-2"></i>
                        Kelompok Divisi
                    </h2>
                    <p className="text-muted mb-0">
                        Lihat informasi dan kontak rekan divisi Anda
                    </p>
                </div>
            </div>

            {division && (
                <div
                    className="card border-0 shadow-sm mb-4"
                    style={{
                        background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                >
                    <div className="card-body p-4 text-white">
                        <div className="row align-items-center">
                            <div className="col-md-8">
                                <h3 className="mb-2 text-white">
                                    <i className="bi bi-diagram-3-fill me-2"></i>
                                    {division.name}
                                </h3>
                                <p className="mb-2 opacity-75">
                                    {division.description}
                                </p>
                                {division.supervisor && (
                                    <div
                                        className="mt-3 p-3 rounded"
                                        style={{
                                            background: "rgba(255,255,255,0.1)",
                                            backdropFilter: "blur(10px)",
                                        }}
                                    >
                                        <small className="opacity-75 d-block mb-2">
                                            <i className="bi bi-star-fill me-1"></i>
                                            Supervisor
                                        </small>
                                        <div className="d-flex align-items-center">
                                            <img
                                                src={getAvatarUrl(
                                                    division.supervisor
                                                )}
                                                alt={division.supervisor.name}
                                                className="rounded-circle me-3 border border-2 border-white"
                                                width="50"
                                                height="50"
                                                style={{ objectFit: "cover" }}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        division.supervisor.name
                                                    )}&background=random&color=fff&size=128`;
                                                }}
                                            />
                                            <div>
                                                <strong className="d-block">
                                                    {division.supervisor.name}
                                                </strong>
                                                <small className="opacity-75">
                                                    <i className="bi bi-envelope me-1"></i>
                                                    {division.supervisor.email}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="col-md-4 text-md-end mt-3 mt-md-0">
                                <div className="display-3 fw-bold">
                                    {members.length}
                                </div>
                                <div className="opacity-75">Anggota Divisi</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <i className="bi bi-search text-muted"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0 ps-0"
                            placeholder="Cari anggota berdasarkan nama, email, atau posisi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => setSearchQuery("")}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <small className="text-muted mt-2 d-block">
                            Ditemukan {filteredMembers.length} dari{" "}
                            {members.length} anggota
                        </small>
                    )}
                </div>
            </div>

            {/* Members Grid */}
            <div className="row g-4">
                {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                        <div
                            key={member.id}
                            className="col-12 col-md-6 col-lg-4"
                        >
                            <div
                                className="card border-0 shadow-sm h-100 hover-card"
                                style={{
                                    transition: "all 0.3s ease",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform =
                                        "translateY(-5px)";
                                    e.currentTarget.style.boxShadow =
                                        "0 8px 20px rgba(0,0,0,0.15)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform =
                                        "translateY(0)";
                                    e.currentTarget.style.boxShadow = "";
                                }}
                                onClick={() => handleViewMember(member)}
                            >
                                <div className="card-body text-center p-4">
                                    <div className="position-relative d-inline-block mb-3">
                                        <img
                                            src={getAvatarUrl(member)}
                                            alt={member.name}
                                            className="rounded-circle border border-3 border-primary"
                                            width="100"
                                            height="100"
                                            style={{ objectFit: "cover" }}
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                    member.name
                                                )}&background=random&color=fff&size=128`;
                                            }}
                                        />
                                        <span className="position-absolute bottom-0 end-0 badge rounded-pill bg-success">
                                            <i className="bi bi-check-lg"></i>
                                        </span>
                                    </div>
                                    <h5 className="mb-2">{member.name}</h5>
                                    <span
                                        className="badge bg-gradient-primary mb-3"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                        }}
                                    >
                                        <i
                                            className={`bi ${
                                                member.role === "supervisor"
                                                    ? "bi-star-fill"
                                                    : "bi-person-fill"
                                            } me-1`}
                                        ></i>
                                        {member.role === "supervisor"
                                            ? "Supervisor"
                                            : "Member"}
                                    </span>

                                    <div className="text-start mt-3">
                                        <div className="d-flex align-items-center mb-2 p-2 rounded bg-light">
                                            <i className="bi bi-envelope-fill text-primary me-2"></i>
                                            <small className="text-truncate">
                                                {member.email}
                                            </small>
                                        </div>
                                        {member.phone && (
                                            <div className="d-flex align-items-center mb-2 p-2 rounded bg-light">
                                                <i className="bi bi-telephone-fill text-success me-2"></i>
                                                <small>{member.phone}</small>
                                            </div>
                                        )}
                                        {member.nip && (
                                            <div className="d-flex align-items-center p-2 rounded bg-light">
                                                <i className="bi bi-credit-card-fill text-info me-2"></i>
                                                <small>{member.nip}</small>
                                            </div>
                                        )}
                                    </div>

                                    <button className="btn btn-sm btn-outline-primary mt-3 w-100">
                                        <i className="bi bi-eye me-1"></i>
                                        Lihat Detail
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12">
                        <div className="alert alert-info text-center border-0 shadow-sm">
                            <i className="bi bi-info-circle-fill fs-3 d-block mb-2"></i>
                            {searchQuery
                                ? `Tidak ditemukan anggota dengan kata kunci "${searchQuery}"`
                                : "Belum ada anggota divisi"}
                        </div>
                    </div>
                )}
            </div>

            {/* Member Detail Modal */}
            {selectedMember && (
                <div
                    className={`modal fade ${showModal ? "show d-block" : ""}`}
                    style={{
                        backgroundColor: showModal
                            ? "rgba(0,0,0,0.5)"
                            : "transparent",
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg">
                            <div
                                className="modal-header border-0 bg-gradient"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                }}
                            >
                                <h5 className="modal-title text-white">
                                    <i className="bi bi-person-circle me-2"></i>
                                    Detail Anggota
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="text-center mb-4">
                                    <img
                                        src={getAvatarUrl(selectedMember)}
                                        alt={selectedMember.name}
                                        className="rounded-circle border border-4 border-primary mb-3"
                                        width="120"
                                        height="120"
                                        style={{ objectFit: "cover" }}
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                selectedMember.name
                                            )}&background=random&color=fff&size=128`;
                                        }}
                                    />
                                    <h4 className="mb-2">
                                        {selectedMember.name}
                                    </h4>
                                    <span
                                        className="badge bg-gradient-primary"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                        }}
                                    >
                                        <i
                                            className={`bi ${
                                                selectedMember.role ===
                                                "supervisor"
                                                    ? "bi-star-fill"
                                                    : "bi-person-fill"
                                            } me-1`}
                                        ></i>
                                        {selectedMember.role === "supervisor"
                                            ? "Supervisor"
                                            : "Member"}
                                    </span>
                                </div>

                                {selectedMember.bio && (
                                    <div className="alert alert-light border mb-4">
                                        <h6 className="mb-2">
                                            <i className="bi bi-chat-quote-fill text-primary me-2"></i>
                                            Bio
                                        </h6>
                                        <p className="mb-0 text-muted">
                                            {selectedMember.bio}
                                        </p>
                                    </div>
                                )}

                                <div className="row g-3">
                                    <div className="col-12">
                                        <div className="card bg-light border-0">
                                            <div className="card-body">
                                                <h6 className="mb-3">
                                                    <i className="bi bi-info-circle-fill text-primary me-2"></i>
                                                    Informasi Kontak
                                                </h6>

                                                <div className="mb-3">
                                                    <label className="small text-muted mb-1">
                                                        Email
                                                    </label>
                                                    <div className="d-flex align-items-center">
                                                        <i className="bi bi-envelope-fill text-primary me-2"></i>
                                                        <a
                                                            href={`mailto:${selectedMember.email}`}
                                                            className="text-decoration-none"
                                                        >
                                                            {
                                                                selectedMember.email
                                                            }
                                                        </a>
                                                    </div>
                                                </div>

                                                {selectedMember.phone && (
                                                    <div className="mb-3">
                                                        <label className="small text-muted mb-1">
                                                            Nomor HP / WhatsApp
                                                        </label>
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div>
                                                                <i className="bi bi-telephone-fill text-success me-2"></i>
                                                                <span>
                                                                    {
                                                                        selectedMember.phone
                                                                    }
                                                                </span>
                                                            </div>
                                                            <a
                                                                href={getWhatsAppLink(
                                                                    selectedMember.phone
                                                                )}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-sm btn-success"
                                                            >
                                                                <i className="bi bi-whatsapp me-1"></i>
                                                                Chat WhatsApp
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedMember.nip && (
                                                    <div>
                                                        <label className="small text-muted mb-1">
                                                            NIP
                                                        </label>
                                                        <div className="d-flex align-items-center">
                                                            <i className="bi bi-credit-card-fill text-info me-2"></i>
                                                            <span>
                                                                {
                                                                    selectedMember.nip
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Social Media Links */}
                                    {(selectedMember.instagram ||
                                        selectedMember.linkedin ||
                                        selectedMember.twitter ||
                                        selectedMember.facebook ||
                                        selectedMember.telegram ||
                                        selectedMember.github) && (
                                        <div className="col-12">
                                            <div className="card bg-light border-0">
                                                <div className="card-body">
                                                    <h6 className="mb-3">
                                                        <i className="bi bi-share-fill text-primary me-2"></i>
                                                        Media Sosial
                                                    </h6>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {selectedMember.instagram && (
                                                            <a
                                                                href={
                                                                    selectedMember.instagram.startsWith(
                                                                        "http"
                                                                    )
                                                                        ? selectedMember.instagram
                                                                        : `https://instagram.com/${selectedMember.instagram}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Instagram"
                                                            >
                                                                <i className="bi bi-instagram me-1"></i>
                                                                Instagram
                                                            </a>
                                                        )}
                                                        {selectedMember.linkedin && (
                                                            <a
                                                                href={
                                                                    selectedMember.linkedin.startsWith(
                                                                        "http"
                                                                    )
                                                                        ? selectedMember.linkedin
                                                                        : `https://linkedin.com/in/${selectedMember.linkedin}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-outline-primary btn-sm"
                                                                title="LinkedIn"
                                                            >
                                                                <i className="bi bi-linkedin me-1"></i>
                                                                LinkedIn
                                                            </a>
                                                        )}
                                                        {selectedMember.twitter && (
                                                            <a
                                                                href={
                                                                    selectedMember.twitter.startsWith(
                                                                        "http"
                                                                    )
                                                                        ? selectedMember.twitter
                                                                        : `https://twitter.com/${selectedMember.twitter}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-outline-info btn-sm"
                                                                title="Twitter/X"
                                                            >
                                                                <i className="bi bi-twitter me-1"></i>
                                                                Twitter
                                                            </a>
                                                        )}
                                                        {selectedMember.facebook && (
                                                            <a
                                                                href={
                                                                    selectedMember.facebook.startsWith(
                                                                        "http"
                                                                    )
                                                                        ? selectedMember.facebook
                                                                        : `https://facebook.com/${selectedMember.facebook}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-outline-primary btn-sm"
                                                                title="Facebook"
                                                            >
                                                                <i className="bi bi-facebook me-1"></i>
                                                                Facebook
                                                            </a>
                                                        )}
                                                        {selectedMember.telegram && (
                                                            <a
                                                                href={
                                                                    selectedMember.telegram.startsWith(
                                                                        "http"
                                                                    )
                                                                        ? selectedMember.telegram
                                                                        : `https://t.me/${selectedMember.telegram}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-outline-info btn-sm"
                                                                title="Telegram"
                                                            >
                                                                <i className="bi bi-telegram me-1"></i>
                                                                Telegram
                                                            </a>
                                                        )}
                                                        {selectedMember.github && (
                                                            <a
                                                                href={
                                                                    selectedMember.github.startsWith(
                                                                        "http"
                                                                    )
                                                                        ? selectedMember.github
                                                                        : `https://github.com/${selectedMember.github}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-outline-dark btn-sm"
                                                                title="GitHub"
                                                            >
                                                                <i className="bi bi-github me-1"></i>
                                                                GitHub
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer border-0 bg-light">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    <i className="bi bi-x-lg me-1"></i>
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Division;
