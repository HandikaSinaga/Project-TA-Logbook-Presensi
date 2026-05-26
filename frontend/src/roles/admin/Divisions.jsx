import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { getAvatarUrl } from "../../utils/Constant";

const AdminDivisions = () => {
    const [loading, setLoading] = useState(true);
    const [divisions, setDivisions] = useState([]);
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [users, setUsers] = useState([]);
    const [unassignedUsers, setUnassignedUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        supervisor_id: "",
        periode: "",
        is_active: true,
        assigned_user_ids: [], // User yang akan di-assign ke divisi ini
    });

    // Search states for select
    const [supervisorSearch, setSupervisorSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");

    // Filter states
    const [filters, setFilters] = useState({
        search: "",
        is_active: "",
        has_supervisor: "",
        periode: "",
    });

    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState("info");
    const modalBodyRef = useRef(null);

    useEffect(() => {
        fetchDivisions();
        fetchSupervisors();
        fetchUsers();
        fetchUnassignedUsers();
    }, []);

    // Auto-scroll modal to top when opened
    useEffect(() => {
        if (showModal && modalBodyRef.current) {
            setTimeout(() => {
                modalBodyRef.current.scrollTop = 0;
            }, 100);
        }
    }, [showModal]);

    // Apply filters
    useEffect(() => {
        let result = [...divisions];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(
                (div) =>
                    div.name.toLowerCase().includes(searchLower) ||
                    div.description?.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (filters.is_active !== "") {
            result = result.filter(
                (div) => div.is_active === (filters.is_active === "1")
            );
        }

        // Has supervisor filter
        if (filters.has_supervisor !== "") {
            result = result.filter((div) => {
                if (filters.has_supervisor === "1") {
                    return div.supervisor_id !== null;
                } else {
                    return div.supervisor_id === null;
                }
            });
        }

        // Periode filter
        if (filters.periode) {
            result = result.filter((div) => div.periode === filters.periode);
        }

        setFilteredDivisions(result);
    }, [divisions, filters]);

    const fetchDivisions = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/admin/divisions");
            console.log("Divisions response:", response.data);
            // Backend returns array directly
            const divisionsData = Array.isArray(response.data)
                ? response.data
                : [];
            console.log("Divisions data:", divisionsData);
            setDivisions(divisionsData);
        } catch (error) {
            console.error("Error fetching divisions:", error);
            toast.error("Gagal memuat divisi");
            setDivisions([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchSupervisors = async () => {
        try {
            const response = await axiosInstance.get(
                "/admin/users?role=supervisor"
            );
            // Ensure response.data is an array
            const supervisorsData = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];
            setSupervisors(supervisorsData);
        } catch (error) {
            console.error("Error fetching supervisors:", error);
            setSupervisors([]); // Set empty array on error
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axiosInstance.get("/admin/users");
            const usersData = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
        }
    };

    const fetchUnassignedUsers = async () => {
        try {
            const response = await axiosInstance.get("/admin/users");
            const usersData = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];
            // Filter users without division
            const unassigned = usersData.filter(
                (user) => !user.division_id && user.role === "user"
            );
            setUnassignedUsers(unassigned);
        } catch (error) {
            console.error("Error fetching unassigned users:", error);
            setUnassignedUsers([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };

            if (editingId) {
                await axiosInstance.put(
                    `/admin/divisions/${editingId}`,
                    payload
                );

                // Assign users jika ada yang dipilih (untuk edit)
                if (formData.assigned_user_ids.length > 0) {
                    await axiosInstance.put(
                        `/admin/divisions/${editingId}/assign-users`,
                        { user_ids: formData.assigned_user_ids }
                    );
                }

                toast.success("Divisi berhasil diupdate");
            } else {
                const response = await axiosInstance.post(
                    "/admin/divisions",
                    payload
                );
                const newDivisionId = response.data.data.id;

                // Assign users setelah create divisi baru
                if (formData.assigned_user_ids.length > 0) {
                    await axiosInstance.put(
                        `/admin/divisions/${newDivisionId}/assign-users`,
                        { user_ids: formData.assigned_user_ids }
                    );
                }

                toast.success("Divisi berhasil ditambahkan");
            }

            setShowModal(false);
            setEditingId(null);
            setSupervisorSearch("");
            setUserSearch("");
            setFormData({
                name: "",
                description: "",
                supervisor_id: "",
                periode: "",
                is_active: true,
                assigned_user_ids: [],
            });
            fetchDivisions();
            fetchUnassignedUsers();
        } catch (error) {
            console.error("Error saving division:", error);
            toast.error(
                error.response?.data?.message || "Gagal menyimpan divisi"
            );
        }
    };



    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`/admin/divisions/${id}`);
            toast.success("Divisi berhasil dihapus");
            setShowDeleteModal(false);
            setDeleteTarget(null);
            fetchDivisions();
        } catch (error) {
            console.error("Error deleting division:", error);
            toast.error(
                error.response?.data?.message || "Gagal menghapus divisi"
            );
        }
    };

    const resetFilters = () => {
        setFilters({
            search: "",
            is_active: "",
            has_supervisor: "",
            periode: "",
        });
    };

    const handleToggleUserSelection = (userId) => {
        setFormData((prev) => {
            const isSelected = prev.assigned_user_ids.includes(userId);
            if (isSelected) {
                return {
                    ...prev,
                    assigned_user_ids: prev.assigned_user_ids.filter(
                        (id) => id !== userId
                    ),
                };
            } else {
                return {
                    ...prev,
                    assigned_user_ids: [...prev.assigned_user_ids, userId],
                };
            }
        });
    };

    const handleRemoveMember = async (memberId) => {
        if (!editingId) return;
        
        try {
            await axiosInstance.delete(`/admin/divisions/${editingId}/members/${memberId}`);
            toast.success("Anggota berhasil dikeluarkan dari divisi");
            
            // Refresh data
            fetchDivisions();
            fetchUnassignedUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal mengeluarkan anggota");
        }
    };

    // Get unique periodes from divisions
    const uniquePeriodes = [
        ...new Set(
            Array.isArray(divisions)
                ? divisions.map((d) => d.periode).filter(Boolean)
                : []
        ),
    ];

    const activeFiltersCount = Object.values(filters).filter(
        (v) => v !== ""
    ).length;

    // Filtered supervisors based on search and availability
    const filteredSupervisors = supervisors.filter((sup) => {
        // Find if this supervisor is already leading ANY division
        const isLeadingAnotherDivision = divisions.some(d => 
            d.supervisor_id === sup.id || d.supervisor_id === String(sup.id)
        );
        
        let isAvailable = !isLeadingAnotherDivision;
        
        // Show if they are the ORIGINAL supervisor of this division being edited
        const currentDivision = divisions.find(d => d.id === editingId);
        const originalSupId = currentDivision ? currentDivision.supervisor_id : null;
        if (editingId && originalSupId && (originalSupId === sup.id || originalSupId === String(sup.id))) {
            isAvailable = true;
        }

        if (!isAvailable) return false;

        return sup.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
               sup.email.toLowerCase().includes(supervisorSearch.toLowerCase());
    });

    // Filtered unassigned users based on search
    const filteredUnassignedUsers = unassignedUsers.filter(
        (user) =>
            user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearch.toLowerCase())
    );

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
        <div className="admin-divisions p-4">
            {/* Header */}
            <div className="card mb-4 border-0 shadow-sm">
                <div className="card-body">
                    <div className="row align-items-center g-3">
                        <div className="col-md-6">
                            <h2 className="mb-0">
                                <i className="bi bi-diagram-3 me-2 text-primary"></i>
                                Manajemen Divisi
                            </h2>
                            <p className="text-muted mb-0 small">
                                Kelola divisi dan struktur organisasi
                            </p>
                        </div>
                        <div className="col-md-6 text-md-end">
                            <button
                                className="btn btn-primary px-4"
                                onClick={() => {
                                    setShowModal(true);
                                    setEditingId(null);
                                    setActiveTab("info");
                                    setSupervisorSearch("");
                                    setUserSearch("");
                                    setFormData({
                                        name: "",
                                        description: "",
                                        supervisor_id: "",
                                        periode: "",
                                        is_active: true,
                                        assigned_user_ids: [],
                                    });
                                }}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Tambah Divisi
                            </button>
                            <button
                                className="btn btn-outline-secondary ms-2 px-4"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <i className="bi bi-funnel me-2"></i>
                                Filter
                                {activeFiltersCount > 0 && (
                                    <span className="badge bg-primary ms-2">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="card mb-4 shadow-sm">
                    <div className="card-body">
                        <h6 className="card-title mb-3">
                            <i className="bi bi-funnel me-2"></i>
                            Filter Data
                        </h6>
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label small fw-semibold">
                                    Pencarian
                                </label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Cari nama atau deskripsi..."
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            search: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small fw-semibold">
                                    Status
                                </label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.is_active}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            is_active: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Semua Status</option>
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small fw-semibold">
                                    Memiliki Supervisor
                                </label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.has_supervisor}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            has_supervisor: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Semua</option>
                                    <option value="1">Ya</option>
                                    <option value="0">Tidak</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small fw-semibold">
                                    Periode
                                </label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.periode}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            periode: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Semua Periode</option>
                                    {uniquePeriodes.map((periode) => (
                                        <option key={periode} value={periode}>
                                            {periode}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {activeFiltersCount > 0 && (
                            <div className="mt-3">
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={resetFilters}
                                >
                                    <i className="bi bi-x-circle me-1"></i>
                                    Reset Filter
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stats Card */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-white-50 mb-1 small">
                                        Total Divisi
                                    </h6>
                                    <h3 className="mb-0">
                                        {Array.isArray(divisions)
                                            ? divisions.length
                                            : 0}
                                    </h3>
                                </div>
                                <i className="bi bi-diagram-3 fs-1 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-white-50 mb-1 small">
                                        Divisi Aktif
                                    </h6>
                                    <h3 className="mb-0">
                                        {Array.isArray(divisions)
                                            ? divisions.filter(
                                                  (d) => d.is_active
                                              ).length
                                            : 0}
                                    </h3>
                                </div>
                                <i className="bi bi-check-circle fs-1 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-warning text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-white-50 mb-1 small">
                                        Divisi Nonaktif
                                    </h6>
                                    <h3 className="mb-0">
                                        {Array.isArray(divisions)
                                            ? divisions.filter(
                                                  (d) => !d.is_active
                                              ).length
                                            : 0}
                                    </h3>
                                </div>
                                <i className="bi bi-x-circle fs-1 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-info text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-white-50 mb-1 small">
                                        Hasil Filter
                                    </h6>
                                    <h3 className="mb-0">
                                        {Array.isArray(filteredDivisions)
                                            ? filteredDivisions.length
                                            : 0}
                                    </h3>
                                </div>
                                <i className="bi bi-funnel fs-1 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 fw-semibold">#</th>
                                    <th className="px-4 py-3 fw-semibold">
                                        Nama Divisi
                                    </th>
                                    <th className="px-4 py-3 fw-semibold">
                                        Deskripsi
                                    </th>
                                    <th className="px-4 py-3 fw-semibold">
                                        Supervisor
                                    </th>
                                    <th className="px-4 py-3 fw-semibold">
                                        Periode
                                    </th>
                                    <th className="px-4 py-3 fw-semibold text-center">
                                        Anggota
                                    </th>
                                    <th className="px-4 py-3 fw-semibold text-center">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 fw-semibold text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDivisions.length > 0 ? (
                                    filteredDivisions.map((division, index) => (
                                        <tr key={division.id}>
                                            <td className="px-4 py-3">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="fw-semibold">
                                                    {division.name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div
                                                    className="text-muted small"
                                                    style={{
                                                        maxWidth: "300px",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                    title={division.description}
                                                >
                                                    {division.description ||
                                                        "-"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {division.supervisor?.name ? (
                                                    <span className="badge bg-info">
                                                        <i className="bi bi-person-badge me-1"></i>
                                                        {
                                                            division.supervisor
                                                                .name
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="text-muted small">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {division.periode ? (
                                                    <span className="badge bg-secondary">
                                                        {division.periode}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted small">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="badge bg-primary">
                                                    <i className="bi bi-people me-1"></i>
                                                    {division.members?.length ||
                                                        0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`badge ${
                                                        division.is_active
                                                            ? "bg-success"
                                                            : "bg-secondary"
                                                    }`}
                                                >
                                                    <i
                                                        className={`bi ${
                                                            division.is_active
                                                                ? "bi-check-circle"
                                                                : "bi-x-circle"
                                                        } me-1`}
                                                    ></i>
                                                    {division.is_active
                                                        ? "Aktif"
                                                        : "Nonaktif"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => {
                                                            setEditingId(
                                                                division.id
                                                            );
                                                            setActiveTab("info");
                                                            setFormData({
                                                                name: division.name || "",
                                                                description:
                                                                    division.description ||
                                                                    "",
                                                                supervisor_id:
                                                                    division.supervisor_id ||
                                                                    division.supervisor?.id ||
                                                                    "",
                                                                periode:
                                                                    division.periode ||
                                                                    "",
                                                                is_active:
                                                                    division.is_active !== undefined ? division.is_active : true,
                                                                assigned_user_ids:
                                                                    [], // Reset saat edit
                                                            });
                                                            setShowModal(true);
                                                        }}
                                                        title="Edit"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger"
                                                        onClick={() => {
                                                            setDeleteTarget(
                                                                division
                                                            );
                                                            setShowDeleteModal(
                                                                true
                                                            );
                                                        }}
                                                        title="Hapus"
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
                                            colSpan="8"
                                            className="text-center py-5"
                                        >
                                            <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                                            <p className="text-muted">
                                                {filters.search ||
                                                filters.is_active ||
                                                filters.supervisor_id ||
                                                filters.periode
                                                    ? "Tidak ada divisi yang sesuai dengan filter"
                                                    : "Belum ada divisi"}
                                            </p>
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
                    className="modal fade show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowModal(false);
                            setEditingId(null);
                            setSupervisorSearch("");
                            setUserSearch("");
                        }
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <form onSubmit={handleSubmit} className="modal-content shadow-lg border-0 overflow-hidden" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-0 bg-primary text-white p-4">
                                <div>
                                    <h5 className="modal-title fw-bold mb-1">
                                        {editingId ? "Edit Divisi" : "Tambah Divisi Baru"}
                                    </h5>
                                    <p className="mb-0 small text-white-50">
                                        {editingId ? "Perbarui informasi divisi dan struktur keanggotaan." : "Buat divisi baru dan tetapkan supervisor beserta anggotanya."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingId(null);
                                        setSupervisorSearch("");
                                        setUserSearch("");
                                    }}
                                ></button>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="bg-light border-bottom px-4 pt-3">
                                <ul className="nav nav-tabs border-0" style={{ gap: '5px' }}>
                                    <li className="nav-item">
                                        <button
                                            type="button"
                                            className={`nav-link border-0 rounded-top ${activeTab === 'info' ? 'active bg-white fw-bold text-primary shadow-sm' : 'text-muted'}`}
                                            onClick={(e) => { e.preventDefault(); setActiveTab('info'); }}
                                            style={{ padding: '10px 20px', transition: 'all 0.2s' }}
                                        >
                                            <i className="bi bi-info-circle me-2"></i>
                                            Informasi Dasar
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            type="button"
                                            className={`nav-link border-0 rounded-top ${activeTab === 'supervisor' ? 'active bg-white fw-bold text-primary shadow-sm' : 'text-muted'}`}
                                            onClick={(e) => { e.preventDefault(); setActiveTab('supervisor'); }}
                                            style={{ padding: '10px 20px', transition: 'all 0.2s' }}
                                        >
                                            <i className="bi bi-person-badge me-2"></i>
                                            Supervisor
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            type="button"
                                            className={`nav-link border-0 rounded-top ${activeTab === 'members' ? 'active bg-white fw-bold text-primary shadow-sm' : 'text-muted'}`}
                                            onClick={(e) => { e.preventDefault(); setActiveTab('members'); }}
                                            style={{ padding: '10px 20px', transition: 'all 0.2s' }}
                                        >
                                            <i className="bi bi-people me-2"></i>
                                            Anggota Divisi
                                            {formData.assigned_user_ids.length > 0 && (
                                                <span className="badge bg-primary ms-2 rounded-pill">
                                                    {formData.assigned_user_ids.length}
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            <div
                                className="modal-body p-4 bg-white"
                                    ref={modalBodyRef}
                                >
                                    {/* Tab Content: Info */}
                                    {activeTab === 'info' && (
                                        <div className="row g-4 animation-fade-in">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold text-dark">
                                                    Nama Divisi <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0 focus-ring focus-ring-primary"
                                                    placeholder="Contoh: IT Department, HR"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold text-dark">
                                                    Periode/Batch
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0 focus-ring focus-ring-primary"
                                                    placeholder="Contoh: 2024-01"
                                                    value={formData.periode}
                                                    onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                                                />
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label fw-semibold text-dark">
                                                    Deskripsi
                                                </label>
                                                <textarea
                                                    className="form-control bg-light border-0 focus-ring focus-ring-primary"
                                                    rows="4"
                                                    placeholder="Jelaskan peran dan tanggung jawab divisi ini..."
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                ></textarea>
                                            </div>

                                            <div className="col-12">
                                                <div className="card border-0 bg-light rounded-3">
                                                    <div className="card-body d-flex align-items-center justify-content-between p-3">
                                                        <div>
                                                            <h6 className="mb-1 fw-semibold text-dark">Status Divisi</h6>
                                                            <p className="mb-0 small text-muted">Aktifkan atau nonaktifkan divisi ini</p>
                                                        </div>
                                                        <div className="form-check form-switch fs-4 mb-0">
                                                            <input
                                                                className="form-check-input cursor-pointer"
                                                                type="checkbox"
                                                                role="switch"
                                                                checked={formData.is_active}
                                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab Content: Supervisor */}
                                    {activeTab === 'supervisor' && (
                                        <div className="animation-fade-in">
                                            <div className="alert border-0 bg-primary bg-opacity-10 text-primary d-flex align-items-center p-3 mb-4 rounded-3">
                                                <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                                                <div>
                                                    <strong className="d-block">Pilih Supervisor (Opsional)</strong>
                                                    <span className="small opacity-75">Supervisor akan memiliki akses untuk mengelola kehadiran dan logbook anggota divisi.</span>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-3 position-relative">
                                                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0 ps-5 focus-ring focus-ring-primary"
                                                    placeholder="Cari nama atau email supervisor..."
                                                    value={supervisorSearch}
                                                    onChange={(e) => setSupervisorSearch(e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="border border-light-subtle rounded-3 overflow-hidden bg-white shadow-sm" style={{ height: "300px" }}>
                                                <div className="list-group list-group-flush h-100 overflow-auto custom-scrollbar">
                                                    <button
                                                        type="button"
                                                        className={`list-group-item list-group-item-action p-3 border-bottom ${formData.supervisor_id === "" ? "bg-light-primary border-primary border-start border-4" : ""}`}
                                                        onClick={() => setFormData({ ...formData, supervisor_id: "" })}
                                                        style={{ backgroundColor: formData.supervisor_id === "" ? "rgba(13, 110, 253, 0.05)" : "" }}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-circle bg-secondary text-white me-3 d-flex align-items-center justify-content-center rounded-circle" style={{ width: '40px', height: '40px' }}>
                                                                <i className="bi bi-person-dash"></i>
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0 fw-semibold text-dark">Tanpa Supervisor</h6>
                                                                <small className="text-muted">Kosongkan supervisor untuk divisi ini</small>
                                                            </div>
                                                            {formData.supervisor_id === "" && (
                                                                <i className="bi bi-check-circle-fill text-primary ms-auto fs-5"></i>
                                                            )}
                                                        </div>
                                                    </button>
                                                    {filteredSupervisors.length === 0 ? (
                                                        <div className="text-center text-muted py-5">
                                                            <i className="bi bi-search fs-1 mb-2"></i>
                                                            <p>Tidak ada supervisor yang cocok dengan pencarian.</p>
                                                        </div>
                                                    ) : (
                                                        filteredSupervisors
                                                            .sort((a, b) => {
                                                                const currentDivision = divisions.find(d => d.id === editingId);
                                                                const originalSupId = currentDivision ? currentDivision.supervisor_id : null;
                                                                const aIsOriginal = originalSupId && (originalSupId === a.id || originalSupId === String(a.id));
                                                                const bIsOriginal = originalSupId && (originalSupId === b.id || originalSupId === String(b.id));
                                                                if (aIsOriginal && !bIsOriginal) return -1;
                                                                if (!aIsOriginal && bIsOriginal) return 1;
                                                                return 0;
                                                            })
                                                            .map((sup) => {
                                                                const isSelected = formData.supervisor_id === sup.id || formData.supervisor_id === String(sup.id);
                                                                const currentDivision = divisions.find(d => d.id === editingId);
                                                                const originalSupId = currentDivision ? currentDivision.supervisor_id : null;
                                                                const isOriginalSupervisor = originalSupId && (originalSupId === sup.id || originalSupId === String(sup.id));
                                                                
                                                                return (
                                                                <button
                                                                    type="button"
                                                                    key={sup.id}
                                                                    className={`list-group-item list-group-item-action p-3 border-bottom ${isSelected ? "border-primary border-start border-4" : ""}`}
                                                                    onClick={() => setFormData({ ...formData, supervisor_id: sup.id })}
                                                                    style={{ backgroundColor: isSelected ? "rgba(13, 110, 253, 0.05)" : "" }}
                                                                >
                                                                    <div className="d-flex align-items-center">
                                                                        <img src={getAvatarUrl(sup)} alt="Avatar" className="rounded-circle me-3 shadow-sm border" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                                        <div className="text-start">
                                                                            <h6 className="mb-0 fw-semibold text-dark">
                                                                                {sup.name}
                                                                                {isOriginalSupervisor && editingId && (
                                                                                    <span className="badge bg-primary ms-2 rounded-pill" style={{ fontSize: '10px' }}>Supervisor Saat Ini</span>
                                                                                )}
                                                                            </h6>
                                                                            <small className="text-muted"><i className="bi bi-envelope me-1"></i>{sup.email}</small>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <i className="bi bi-check-circle-fill text-primary ms-auto fs-5"></i>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab Content: Members */}
                                    {activeTab === 'members' && (
                                        <div className="animation-fade-in">
                                            {editingId && (
                                                <div className="mb-4">
                                                    <h6 className="mb-3 text-dark fw-bold border-bottom pb-2">
                                                        <i className="bi bi-people-fill me-2 text-primary"></i>
                                                        Anggota Saat Ini
                                                    </h6>
                                                    <div className="bg-light rounded p-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                                                        {(() => {
                                                            const currentDivision = divisions.find(d => d.id === editingId);
                                                            let currentMembers = currentDivision?.members || [];
                                                            
                                                            const currentSupId = parseInt(formData.supervisor_id || currentDivision?.supervisor_id);
                                                            
                                                            currentMembers = [...currentMembers].sort((a, b) => {
                                                                if (a.id === currentSupId) return -1;
                                                                if (b.id === currentSupId) return 1;
                                                                return 0;
                                                            });

                                                            if (currentMembers.length === 0) {
                                                                return (
                                                                    <div className="text-center text-muted py-2">
                                                                        <i className="bi bi-inbox fs-4 d-block mb-1"></i>
                                                                        <small>Belum ada anggota di divisi ini</small>
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <ul className="list-group list-group-flush">
                                                                    {currentMembers.map(member => (
                                                                        <li key={member.id} className="list-group-item bg-transparent px-0 py-2 d-flex align-items-center border-bottom-0">
                                                                            <img src={getAvatarUrl(member)} alt="Avatar" className="rounded-circle me-3 border" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                                                                            <div>
                                                                                <div className="fw-semibold text-dark d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                                                                                    {member.name}
                                                                                    {member.id === currentSupId && (
                                                                                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill" style={{ fontSize: '10px' }}>
                                                                                            <i className="bi bi-star-fill me-1"></i>
                                                                                            Supervisor
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-muted" style={{ fontSize: '12px' }}>{member.email}</div>
                                                                            </div>
                                                                            <span className="badge bg-success ms-auto rounded-pill me-2" style={{ fontSize: '11px' }}>Aktif</span>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-outline-danger border-0 rounded-circle"
                                                                                onClick={() => setMemberToRemove(member)}
                                                                                title="Keluarkan dari divisi"
                                                                            >
                                                                                <i className="bi bi-person-x-fill"></i>
                                                                            </button>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mb-3">
                                                <h6 className="mb-3 text-dark fw-bold border-bottom pb-2">
                                                    <i className="bi bi-person-plus-fill me-2 text-primary"></i>
                                                    Tambahkan Anggota Baru <small className="text-muted fw-normal">(Opsional)</small>
                                                </h6>
                                                <div className="position-relative">
                                                    <i className="bi bi-search position-absolute text-muted" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)' }}></i>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-lg bg-light border-0 focus-ring focus-ring-primary ps-5"
                                                        placeholder="Cari user yang belum memiliki divisi..."
                                                        value={userSearch}
                                                        onChange={(e) => setUserSearch(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="border border-light-subtle rounded-3 overflow-hidden bg-white shadow-sm" style={{ maxHeight: "300px", overflowY: "auto" }}>
                                                {unassignedUsers.length === 0 ? (
                                                    <div className="text-center text-muted py-5 bg-light">
                                                        <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                                                        <p className="mb-0 fw-medium">Tidak ada user yang tersedia</p>
                                                        <small>Semua user saat ini sudah masuk ke divisi</small>
                                                    </div>
                                                ) : filteredUnassignedUsers.length === 0 ? (
                                                    <div className="text-center text-muted py-5 bg-light">
                                                        <i className="bi bi-search fs-1 d-block mb-2 text-secondary"></i>
                                                        <p className="mb-0 fw-medium">User tidak ditemukan</p>
                                                        <small>Coba gunakan kata kunci pencarian yang lain</small>
                                                    </div>
                                                ) : (
                                                    <div className="list-group list-group-flush h-100 overflow-auto custom-scrollbar">
                                                        {filteredUnassignedUsers.map((user) => (
                                                            <label
                                                                key={user.id}
                                                                className={`list-group-item list-group-item-action p-3 cursor-pointer border-bottom ${formData.assigned_user_ids.includes(user.id) ? "border-info border-start border-4" : ""}`}
                                                                style={{ backgroundColor: formData.assigned_user_ids.includes(user.id) ? "rgba(13, 202, 240, 0.05)" : "" }}
                                                            >
                                                                <div className="d-flex align-items-center">
                                                                    <div className="form-check mb-0 me-3">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input fs-5 shadow-sm"
                                                                            checked={formData.assigned_user_ids.includes(user.id)}
                                                                            onChange={() => handleToggleUserSelection(user.id)}
                                                                        />
                                                                    </div>
                                                                    <img src={getAvatarUrl(user)} alt="Avatar" className="rounded-circle me-3 shadow-sm border" style={{ width: '36px', height: '36px', objectFit: 'cover' }} />
                                                                    <div>
                                                                        <h6 className="mb-0 fw-semibold text-dark">{user.name}</h6>
                                                                        <small className="text-muted"><i className="bi bi-envelope me-1"></i>{user.email}</small>
                                                                    </div>
                                                                    <span className="badge bg-light text-secondary border ms-auto rounded-pill px-3 py-2">
                                                                        {user.role}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer bg-light border-top p-3 px-4 d-flex justify-content-end align-items-center">
                                    <button
                                        type="button"
                                        className="btn btn-light rounded-pill px-4 border me-2"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingId(null);
                                            setSupervisorSearch("");
                                            setUserSearch("");
                                        }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary rounded-pill px-4 shadow-sm"
                                    >
                                        <i className="bi bi-save me-2"></i>
                                        Simpan Divisi
                                    </button>
                                </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deleteTarget && (
                <div
                    className="modal fade show d-block"
                    style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDeleteModal(false);
                            setDeleteTarget(null);
                        }
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-danger text-white border-0">
                                <h5 className="modal-title d-flex align-items-center">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    Konfirmasi Hapus Divisi
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteTarget(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <i
                                        className="bi bi-trash-fill text-danger"
                                        style={{ fontSize: "4rem" }}
                                    ></i>
                                </div>
                                <p className="text-center mb-3">
                                    Apakah Anda yakin ingin menghapus divisi:
                                </p>
                                <div className="alert alert-warning border-warning">
                                    <h6 className="mb-1">
                                        <i className="bi bi-diagram-3 me-2"></i>
                                        {deleteTarget.name}
                                    </h6>
                                    {deleteTarget.periode && (
                                        <small className="text-muted">
                                            Periode: {deleteTarget.periode}
                                        </small>
                                    )}
                                </div>
                                <div className="alert alert-danger">
                                    <i className="bi bi-exclamation-circle-fill me-2"></i>
                                    <strong>Perhatian:</strong> Tindakan ini
                                    tidak dapat dibatalkan.
                                    {deleteTarget.members &&
                                        deleteTarget.members.length > 0 && (
                                            <div className="mt-2">
                                                <small>
                                                    Divisi ini memiliki{" "}
                                                    <strong>
                                                        {
                                                            deleteTarget.members
                                                                .length
                                                        }
                                                    </strong>{" "}
                                                    member yang akan kehilangan
                                                    divisi mereka.
                                                </small>
                                            </div>
                                        )}
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-top">
                                <button
                                    type="button"
                                    className="btn btn-secondary px-4"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteTarget(null);
                                    }}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger px-4"
                                    onClick={() =>
                                        handleDelete(deleteTarget.id)
                                    }
                                >
                                    <i className="bi bi-trash-fill me-2"></i>
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Member Confirmation Modal */}
            {memberToRemove && (
                <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setMemberToRemove(null);
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow border-0 rounded-4">
                            <div className="modal-body text-center p-4">
                                <div className="mb-3">
                                    <i className="bi bi-exclamation-circle text-warning" style={{ fontSize: "3rem" }}></i>
                                </div>
                                <h5 className="mb-2 fw-bold">Keluarkan Anggota?</h5>
                                <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
                                    Apakah Anda yakin ingin mengeluarkan <strong>{memberToRemove.name}</strong> dari divisi ini?
                                </p>
                                <div className="d-flex gap-2 justify-content-center">
                                    <button
                                        type="button"
                                        className="btn btn-light rounded-pill px-4"
                                        onClick={() => setMemberToRemove(null)}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger rounded-pill px-4"
                                        onClick={() => {
                                            handleRemoveMember(memberToRemove.id);
                                            setMemberToRemove(null);
                                        }}
                                    >
                                        Keluarkan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDivisions;
