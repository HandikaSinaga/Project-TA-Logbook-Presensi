import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

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

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await axiosInstance.put(`/admin/divisions/${id}`, {
                is_active: !currentStatus,
            });
            toast.success(
                `Divisi berhasil ${
                    !currentStatus ? "diaktifkan" : "dinonaktifkan"
                }`
            );
            fetchDivisions();
        } catch (error) {
            console.error("Error toggling status:", error);
            toast.error("Gagal mengubah status divisi");
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

    // Filtered supervisors based on search
    const filteredSupervisors = supervisors.filter(
        (sup) =>
            sup.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
            sup.email.toLowerCase().includes(supervisorSearch.toLowerCase())
    );

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
                                                <button
                                                    className={`btn btn-sm ${
                                                        division.is_active
                                                            ? "btn-success"
                                                            : "btn-secondary"
                                                    }`}
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            division.id,
                                                            division.is_active
                                                        )
                                                    }
                                                    title={
                                                        division.is_active
                                                            ? "Klik untuk nonaktifkan"
                                                            : "Klik untuk aktifkan"
                                                    }
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
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => {
                                                            setEditingId(
                                                                division.id
                                                            );
                                                            setFormData({
                                                                name: division.name,
                                                                description:
                                                                    division.description ||
                                                                    "",
                                                                supervisor_id:
                                                                    division.supervisor_id ||
                                                                    "",
                                                                periode:
                                                                    division.periode ||
                                                                    "",
                                                                is_active:
                                                                    division.is_active,
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
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowModal(false);
                            setEditingId(null);
                            setSupervisorSearch("");
                            setUserSearch("");
                        }
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-primary text-white border-0">
                                <h5 className="modal-title d-flex align-items-center">
                                    <i
                                        className={`bi ${
                                            editingId
                                                ? "bi-pencil-square"
                                                : "bi-plus-circle"
                                        } me-2`}
                                    ></i>
                                    {editingId
                                        ? "Edit Divisi"
                                        : "Tambah Divisi"}
                                </h5>
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
                            <form onSubmit={handleSubmit}>
                                <div
                                    className="modal-body"
                                    ref={modalBodyRef}
                                    style={{
                                        maxHeight: "60vh",
                                        overflowY: "auto",
                                    }}
                                >
                                    <div className="row g-3">
                                        {/* Nama Divisi */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Nama Divisi
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Contoh: IT Department, HR, Finance"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        name: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                            <small className="text-muted">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Nama divisi harus unik
                                            </small>
                                        </div>

                                        {/* Periode */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Periode/Batch
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Contoh: 2024-01, Q1-2024, Angkatan 15"
                                                value={formData.periode}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        periode: e.target.value,
                                                    })
                                                }
                                            />
                                            <small className="text-muted">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Opsional - untuk periode
                                                tertentu
                                            </small>
                                        </div>

                                        {/* Deskripsi */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Deskripsi
                                            </label>
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                                placeholder="Deskripsi singkat tentang divisi ini..."
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        description:
                                                            e.target.value,
                                                    })
                                                }
                                            ></textarea>
                                            <small className="text-muted">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Opsional - jelaskan tugas dan
                                                tanggung jawab divisi
                                            </small>
                                        </div>

                                        {/* Supervisor */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Supervisor
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control mb-2"
                                                placeholder="Cari supervisor..."
                                                value={supervisorSearch}
                                                onChange={(e) =>
                                                    setSupervisorSearch(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <select
                                                className="form-select"
                                                value={formData.supervisor_id}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        supervisor_id:
                                                            e.target.value,
                                                    })
                                                }
                                                size="5"
                                                style={{ minHeight: "120px" }}
                                            >
                                                <option value="">
                                                    Belum ada supervisor
                                                </option>
                                                {filteredSupervisors.map(
                                                    (sup) => (
                                                        <option
                                                            key={sup.id}
                                                            value={sup.id}
                                                        >
                                                            {sup.name} -{" "}
                                                            {sup.email}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            <small className="text-muted">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Opsional - supervisor bisa di
                                                beberapa divisi
                                            </small>
                                        </div>

                                        {/* Status */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                Status
                                            </label>
                                            <select
                                                className="form-select"
                                                value={formData.is_active}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        is_active:
                                                            e.target.value ===
                                                            "true",
                                                    })
                                                }
                                            >
                                                <option value="true">
                                                    Aktif
                                                </option>
                                                <option value="false">
                                                    Nonaktif
                                                </option>
                                            </select>
                                            <small className="text-muted">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Status aktif/nonaktif divisi
                                            </small>
                                        </div>
                                    </div>

                                    {/* Assign Users Section */}
                                    <div className="mt-4 pt-3 border-top">
                                        <h6 className="mb-3">
                                            <i className="bi bi-people-fill me-2"></i>
                                            Assign Users ke Divisi Ini
                                            <small
                                                className="text-muted ms-2"
                                                style={{ fontWeight: "normal" }}
                                            >
                                                (Opsional)
                                            </small>
                                        </h6>

                                        <div className="mb-3">
                                            <label className="form-label">
                                                Cari User Belum Memiliki Divisi
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ketik nama atau email untuk mencari..."
                                                value={userSearch}
                                                onChange={(e) =>
                                                    setUserSearch(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div
                                            className="border rounded p-3 bg-light"
                                            style={{
                                                maxHeight: "200px",
                                                overflowY: "auto",
                                            }}
                                        >
                                            {unassignedUsers.length === 0 ? (
                                                <div className="text-center text-muted py-3">
                                                    <i
                                                        className="bi bi-inbox"
                                                        style={{
                                                            fontSize: "2rem",
                                                        }}
                                                    ></i>
                                                    <p className="mt-2 mb-0">
                                                        Tidak ada user yang
                                                        belum memiliki divisi
                                                    </p>
                                                </div>
                                            ) : filteredUnassignedUsers.length ===
                                              0 ? (
                                                <div className="text-center text-muted py-3">
                                                    <i
                                                        className="bi bi-search"
                                                        style={{
                                                            fontSize: "2rem",
                                                        }}
                                                    ></i>
                                                    <p className="mt-2 mb-0">
                                                        Tidak ada user yang
                                                        cocok dengan pencarian
                                                    </p>
                                                </div>
                                            ) : (
                                                filteredUnassignedUsers.map(
                                                    (user) => (
                                                        <div
                                                            key={user.id}
                                                            className="form-check mb-2 p-2 bg-white rounded border"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                id={`assign-user-${user.id}`}
                                                                checked={formData.assigned_user_ids.includes(
                                                                    user.id
                                                                )}
                                                                onChange={() =>
                                                                    handleToggleUserSelection(
                                                                        user.id
                                                                    )
                                                                }
                                                            />
                                                            <label
                                                                className="form-check-label w-100"
                                                                htmlFor={`assign-user-${user.id}`}
                                                                style={{
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                user.name
                                                                            }
                                                                        </strong>
                                                                        <div className="text-muted small">
                                                                            {
                                                                                user.email
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <span className="badge bg-secondary">
                                                                        {
                                                                            user.role
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </div>

                                        {formData.assigned_user_ids.length >
                                            0 && (
                                            <div className="alert alert-info mt-3 mb-0 d-flex align-items-center">
                                                <i className="bi bi-check-circle-fill me-2"></i>
                                                <strong>
                                                    {
                                                        formData
                                                            .assigned_user_ids
                                                            .length
                                                    }
                                                </strong>
                                                <span className="ms-1">
                                                    user akan ditambahkan ke
                                                    divisi ini
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-top">
                                    <button
                                        type="button"
                                        className="btn btn-secondary px-4"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingId(null);
                                            setSupervisorSearch("");
                                            setUserSearch("");
                                        }}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4"
                                    >
                                        <i className="bi bi-save me-2"></i>
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
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
                                    <i className="bi bi-trash me-2"></i>
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDivisions;
