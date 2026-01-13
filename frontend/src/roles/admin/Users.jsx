import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_URL, getAvatarUrl } from "../../utils/Constant";
import toast from "react-hot-toast";

const AdminUsers = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form data dengan SEMUA field database
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        nip: "",
        phone: "",
        address: "",
        role: "user",
        division_id: "",
        periode: "",
        sumber_magang: "kampus",
        supervisor_id: "",
        password: "",
    });

    // Filter states
    const [filters, setFilters] = useState({
        role: "",
        division_id: "",
        periode: "",
        sumber_magang: "",
        is_active: "",
        search: "",
    });

    // Import/Export states
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    // Export Modal state
    const [showExportModal, setShowExportModal] = useState(false);

    // Reset Password states
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [resetPasswordUserId, setResetPasswordUserId] = useState(null);
    const [resetPasswordData, setResetPasswordData] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Show/Hide password toggle
    const [showPassword, setShowPassword] = useState(false);

    // Refs for modals
    const modalBodyRef = useRef(null);
    const importModalRef = useRef(null);
    const resetPasswordModalRef = useRef(null);
    const exportModalRef = useRef(null);

    useEffect(() => {
        fetchUsers();
        fetchDivisions();
        fetchSupervisors();
    }, []);

    // Auto-scroll modal to top when opened
    useEffect(() => {
        if (showModal && modalBodyRef.current) {
            modalBodyRef.current.scrollTop = 0;
            setTimeout(() => {
                if (modalBodyRef.current) {
                    modalBodyRef.current.scrollTop = 0;
                }
            }, 50);
        }
    }, [showModal, editingId]);

    // Auto-scroll reset password modal to top
    useEffect(() => {
        if (showResetPasswordModal && resetPasswordModalRef.current) {
            resetPasswordModalRef.current.scrollTop = 0;
            setTimeout(() => {
                if (resetPasswordModalRef.current) {
                    resetPasswordModalRef.current.scrollTop = 0;
                }
            }, 50);
        }
    }, [showResetPasswordModal]);

    // Auto-scroll import modal to top
    useEffect(() => {
        if (showImportModal && importModalRef.current) {
            importModalRef.current.scrollTop = 0;
            setTimeout(() => {
                if (importModalRef.current) {
                    importModalRef.current.scrollTop = 0;
                }
            }, 50);
        }
    }, [showImportModal]);

    // Auto-scroll export modal to top
    useEffect(() => {
        if (showExportModal && exportModalRef.current) {
            exportModalRef.current.scrollTop = 0;
            setTimeout(() => {
                if (exportModalRef.current) {
                    exportModalRef.current.scrollTop = 0;
                }
            }, 50);
        }
    }, [showExportModal]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/admin/users", {
                params: {
                    ...filters,
                    role: filters.role || undefined,
                    division_id: filters.division_id || undefined,
                    periode: filters.periode || undefined,
                    sumber_magang: filters.sumber_magang || undefined,
                    is_active: filters.is_active || undefined,
                },
            });
            const data = response.data.data || response.data || [];
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Gagal memuat users");
        } finally {
            setLoading(false);
        }
    };

    const fetchDivisions = async () => {
        try {
            const response = await axiosInstance.get("/admin/divisions");
            const data = response.data.data || response.data || [];
            setDivisions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching divisions:", error);
        }
    };

    const fetchSupervisors = async () => {
        try {
            const response = await axiosInstance.get("/admin/users", {
                params: { role: "supervisor" },
            });
            const data = response.data.data || response.data || [];
            setSupervisors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching supervisors:", error);
        }
    };

    // Apply filters
    useEffect(() => {
        fetchUsers();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({
            role: "",
            division_id: "",
            periode: "",
            sumber_magang: "",
            is_active: "",
            search: "",
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validasi password untuk user baru
        if (
            !editingId &&
            (!formData.password || formData.password.length < 6)
        ) {
            toast.error(
                "Password wajib diisi minimal 6 karakter untuk user baru"
            );
            // Scroll to password field
            setTimeout(() => {
                const passwordField = document.querySelector(
                    'input[type="password"]'
                );
                if (passwordField) {
                    passwordField.focus();
                    passwordField.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            }, 100);
            return;
        }

        try {
            const submitData = { ...formData };

            // Clean empty values, EXCEPT password untuk new user
            Object.keys(submitData).forEach((key) => {
                // Jangan hapus password jika sedang tambah user baru (required)
                if (key === "password" && !editingId) {
                    return; // Keep password for new user
                }
                // Hapus field kosong lainnya
                if (submitData[key] === "" || submitData[key] === null) {
                    delete submitData[key];
                }
            });

            if (editingId) {
                await axiosInstance.put(
                    `/admin/users/${editingId}`,
                    submitData
                );
                toast.success("User berhasil diupdate");
            } else {
                await axiosInstance.post("/admin/users", submitData);
                toast.success("User berhasil ditambahkan");
            }

            setShowModal(false);
            setEditingId(null);
            setShowPassword(false);
            setFormData({
                name: "",
                email: "",
                nip: "",
                phone: "",
                address: "",
                role: "user",
                division_id: "",
                periode: "",
                sumber_magang: "kampus",
                supervisor_id: "",
                password: "",
                is_active: true,
            });
            fetchUsers();
        } catch (error) {
            console.error("Error saving user:", error);
            toast.error(
                error.response?.data?.message || "Gagal menyimpan user"
            );
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Yakin ingin menghapus user ini?")) {
            try {
                await axiosInstance.delete(`/admin/users/${id}`);
                toast.success("User berhasil dihapus");
                fetchUsers();
            } catch (error) {
                console.error("Error deleting user:", error);
                toast.error("Gagal menghapus user");
            }
        }
    };

    // ========== RESET PASSWORD FUNCTION ==========

    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Validasi password match
        if (
            resetPasswordData.newPassword !== resetPasswordData.confirmPassword
        ) {
            toast.error("Password dan konfirmasi password tidak sama");
            return;
        }

        // Validasi minimum length
        if (resetPasswordData.newPassword.length < 6) {
            toast.error("Password minimal 6 karakter");
            return;
        }

        try {
            await axiosInstance.put(`/admin/users/${resetPasswordUserId}`, {
                password: resetPasswordData.newPassword,
            });

            toast.success("Password berhasil direset");
            setShowResetPasswordModal(false);
            setResetPasswordUserId(null);
            setResetPasswordData({
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error(
                error.response?.data?.message || "Gagal reset password"
            );
        }
    };

    // ========== IMPORT/EXPORT FUNCTIONS ==========

    const handleDownloadTemplate = async (e) => {
        try {
            // Prevent form submission and event bubbling
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            console.log("Downloading template...");

            const response = await axiosInstance.get(
                "/admin/users/template/download",
                {
                    responseType: "blob",
                }
            );

            console.log("Response received:", response.data);
            console.log("Blob size:", response.data.size);

            // Pastikan response adalah blob dan tidak kosong
            if (!response.data || response.data.size === 0) {
                throw new Error("Template file is empty");
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "Template_Import_User.xlsx");
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                link.remove();
                window.URL.revokeObjectURL(url);
            }, 100);

            toast.success("Template berhasil didownload");
        } catch (error) {
            console.error("Error downloading template:", error);
            toast.error("Gagal mendownload template: " + error.message);
        }
    };

    const handleExportUsers = async () => {
        try {
            const params = new URLSearchParams();

            // Add all active filters
            if (filters.periode) params.append("periode", filters.periode);
            if (filters.role) params.append("role", filters.role);
            if (filters.division_id)
                params.append("division_id", filters.division_id);
            if (filters.sumber_magang)
                params.append("sumber_magang", filters.sumber_magang);
            if (filters.is_active)
                params.append("is_active", filters.is_active);

            const response = await axiosInstance.get(
                `/admin/users/export?${params.toString()}`,
                {
                    responseType: "blob",
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;

            // Generate dynamic filename based on filters
            let filename = "Export_Users";
            if (filters.periode) filename += `_${filters.periode}`;
            if (filters.role) filename += `_${filters.role}`;
            if (filters.sumber_magang) filename += `_${filters.sumber_magang}`;
            filename += `.xlsx`;

            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setShowExportModal(false);
            toast.success("Data berhasil diexport");
        } catch (error) {
            console.error("Error exporting users:", error);
            toast.error("Gagal export data");
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileSelect = (file) => {
        if (!file) return;

        // Validate file type
        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ];

        if (!validTypes.includes(file.type)) {
            toast.error("File harus berformat Excel (.xlsx atau .xls)");
            return;
        }

        setImportFile(file);
    };

    const handleImportSubmit = async () => {
        if (!importFile) {
            toast.error("Pilih file terlebih dahulu");
            return;
        }

        try {
            setImporting(true);
            const formData = new FormData();
            formData.append("file", importFile);

            const response = await axiosInstance.post(
                "/admin/users/import",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                toast.success(
                    response.data.message ||
                        `Berhasil import ${response.data.data?.count || 0} user`
                );

                setShowImportModal(false);
                setImportFile(null);
                fetchUsers();
            } else {
                // Show detailed validation errors
                if (
                    response.data.errors &&
                    Array.isArray(response.data.errors)
                ) {
                    const errorMessages = response.data.errors
                        .map(
                            (err) =>
                                `Baris ${err.row}: ${err.errors.join(", ")}`
                        )
                        .join("\n");
                    toast.error(
                        `${response.data.message}\n\n${errorMessages.substring(
                            0,
                            200
                        )}${errorMessages.length > 200 ? "..." : ""}`,
                        { autoClose: 8000 }
                    );
                } else {
                    toast.error(response.data.message || "Import gagal");
                }
            }
        } catch (error) {
            console.error("Error importing users:", error);
            console.error("Error response:", error.response?.data);

            // Show detailed error from server
            if (
                error.response?.data?.errors &&
                Array.isArray(error.response.data.errors)
            ) {
                const errorMessages = error.response.data.errors
                    .map((err) => `Baris ${err.row}: ${err.errors.join(", ")}`)
                    .join("\n");
                toast.error(
                    `${
                        error.response.data.message
                    }\n\n${errorMessages.substring(0, 200)}${
                        errorMessages.length > 200 ? "..." : ""
                    }`,
                    { autoClose: 8000 }
                );
            } else {
                toast.error(
                    error.response?.data?.message || "Gagal import data"
                );
            }
        } finally {
            setImporting(false);
        }
    };

    // ========== PAGINATION ==========

    const filteredUsers = users.filter((user) => {
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return (
                user.name?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower) ||
                user.nip?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // ========== GET UNIQUE VALUES FOR FILTERS ==========

    const uniquePeriodes = [
        ...new Set(users.map((u) => u.periode).filter(Boolean)),
    ];

    return (
        <div className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">
                        <i className="bi bi-people-fill me-2"></i>
                        Manajemen User
                    </h2>
                    <p className="text-muted">
                        Kelola data user, import dari Excel, dan export data
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="card mb-4 shadow-sm">
                <div className="card-body">
                    <div className="row g-2">
                        <div className="col-md-3">
                            <button
                                className="btn btn-primary w-100"
                                onClick={() => setShowModal(true)}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Tambah User
                            </button>
                        </div>
                        <div className="col-md-3">
                            <button
                                className="btn btn-success w-100"
                                onClick={() => setShowImportModal(true)}
                            >
                                <i className="bi bi-upload me-2"></i>
                                Import Excel
                            </button>
                        </div>
                        <div className="col-md-3">
                            <button
                                className="btn btn-info w-100 position-relative"
                                onClick={() => setShowExportModal(true)}
                                title="Export data user ke Excel"
                            >
                                <i className="bi bi-download me-2"></i>
                                Export Excel
                                {Object.values(filters).some((v) => v) && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark">
                                        <i className="bi bi-funnel-fill"></i>
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
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
                                placeholder="Cari nama, email, NIP..."
                                value={filters.search}
                                onChange={(e) =>
                                    handleFilterChange("search", e.target.value)
                                }
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                Sumber Magang
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.sumber_magang}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "sumber_magang",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">Semua Sumber</option>
                                <option value="kampus">Kampus</option>
                                <option value="pemerintah">Pemerintah</option>
                                <option value="swasta">Swasta</option>
                                <option value="internal">Internal</option>
                                <option value="umum">Umum</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                Periode/Batch
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.periode}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "periode",
                                        e.target.value
                                    )
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
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                Divisi
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.division_id}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "division_id",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">Semua Divisi</option>
                                {divisions.map((div) => (
                                    <option key={div.id} value={div.id}>
                                        {div.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-semibold">
                                Role
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.role}
                                onChange={(e) =>
                                    handleFilterChange("role", e.target.value)
                                }
                            >
                                <option value="">Semua Role</option>
                                <option value="user">User</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="col-md-1">
                            <label className="form-label small fw-semibold">
                                Status
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.is_active}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "is_active",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">Semua</option>
                                <option value="1">Aktif</option>
                                <option value="0">Nonaktif</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-3 d-flex justify-content-between align-items-center">
                        <button
                            className="btn btn-sm btn-outline-danger px-3 shadow-sm"
                            onClick={resetFilters}
                        >
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Reset Semua Filter
                        </button>
                        <div className="d-flex align-items-center gap-3">
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
                                <i className="bi bi-people-fill me-1"></i>
                                <strong>
                                    {filteredUsers.length}
                                </strong> dari <strong>{users.length}</strong>{" "}
                                user
                            </span>
                            {Object.values(filters).some((v) => v) && (
                                <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2">
                                    <i className="bi bi-funnel-fill me-1"></i>
                                    Filter Aktif
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card shadow-sm">
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
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: "60px" }}>
                                                Avatar
                                            </th>
                                            <th>Nama</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Divisi</th>
                                            <th>Periode</th>
                                            <th>Sumber</th>
                                            <th>Status</th>
                                            <th style={{ width: "150px" }}>
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentUsers.length > 0 ? (
                                            currentUsers.map((user) => (
                                                <tr key={user.id}>
                                                    <td>
                                                        <img
                                                            src={getAvatarUrl(
                                                                user
                                                            )}
                                                            alt={user.name}
                                                            className="rounded-circle"
                                                            style={{
                                                                width: "40px",
                                                                height: "40px",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="fw-bold">
                                                                {user.name}
                                                            </div>
                                                            {user.nip && (
                                                                <small className="text-muted">
                                                                    NIP:{" "}
                                                                    {user.nip}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        <span
                                                            className={`badge ${
                                                                user.role ===
                                                                "admin"
                                                                    ? "bg-danger"
                                                                    : user.role ===
                                                                      "supervisor"
                                                                    ? "bg-warning"
                                                                    : "bg-primary"
                                                            }`}
                                                        >
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {user.division
                                                            ?.name || (
                                                            <span className="text-muted">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {user.periode || (
                                                            <span className="text-muted">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {user.sumber_magang || (
                                                            <span className="text-muted">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge ${
                                                                user.is_active
                                                                    ? "bg-success"
                                                                    : "bg-secondary"
                                                            }`}
                                                        >
                                                            {user.is_active
                                                                ? "Aktif"
                                                                : "Nonaktif"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                className="btn btn-outline-primary"
                                                                onClick={() => {
                                                                    setEditingId(
                                                                        user.id
                                                                    );
                                                                    setFormData(
                                                                        {
                                                                            name: user.name,
                                                                            email: user.email,
                                                                            nip:
                                                                                user.nip ||
                                                                                "",
                                                                            phone:
                                                                                user.phone ||
                                                                                "",
                                                                            address:
                                                                                user.address ||
                                                                                "",
                                                                            role: user.role,
                                                                            division_id:
                                                                                user.division_id ||
                                                                                "",
                                                                            periode:
                                                                                user.periode ||
                                                                                "",
                                                                            sumber_magang:
                                                                                user.sumber_magang ||
                                                                                "kampus",
                                                                            supervisor_id:
                                                                                user.supervisor_id ||
                                                                                "",
                                                                            password:
                                                                                "",
                                                                            is_active:
                                                                                user.is_active !==
                                                                                undefined
                                                                                    ? user.is_active
                                                                                    : true,
                                                                        }
                                                                    );
                                                                    setShowModal(
                                                                        true
                                                                    );
                                                                }}
                                                                title="Edit User"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-warning"
                                                                onClick={() => {
                                                                    setResetPasswordUserId(
                                                                        user.id
                                                                    );
                                                                    setShowResetPasswordModal(
                                                                        true
                                                                    );
                                                                }}
                                                                title="Reset Password"
                                                            >
                                                                <i className="bi bi-key"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-danger"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        user.id
                                                                    )
                                                                }
                                                                title="Hapus User"
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
                                                    colSpan="9"
                                                    className="text-center text-muted py-4"
                                                >
                                                    Belum ada data user
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <nav className="mt-3">
                                    <ul className="pagination pagination-sm justify-content-center">
                                        <li
                                            className={`page-item ${
                                                currentPage === 1
                                                    ? "disabled"
                                                    : ""
                                            }`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() =>
                                                    paginate(currentPage - 1)
                                                }
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(totalPages)].map(
                                            (_, index) => (
                                                <li
                                                    key={index + 1}
                                                    className={`page-item ${
                                                        currentPage ===
                                                        index + 1
                                                            ? "active"
                                                            : ""
                                                    }`}
                                                >
                                                    <button
                                                        className="page-link"
                                                        onClick={() =>
                                                            paginate(index + 1)
                                                        }
                                                    >
                                                        {index + 1}
                                                    </button>
                                                </li>
                                            )
                                        )}
                                        <li
                                            className={`page-item ${
                                                currentPage === totalPages
                                                    ? "disabled"
                                                    : ""
                                            }`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() =>
                                                    paginate(currentPage + 1)
                                                }
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowModal(false);
                            setEditingId(null);
                            setShowPassword(false);
                        }
                    }}
                >
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-primary text-white border-0">
                                <h5 className="modal-title d-flex align-items-center">
                                    <i
                                        className={`bi ${
                                            editingId
                                                ? "bi-pencil-square"
                                                : "bi-person-plus-fill"
                                        } me-2`}
                                    ></i>
                                    {editingId ? "Edit User" : "Tambah User"}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingId(null);
                                        setShowPassword(false);
                                    }}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div
                                    className="modal-body"
                                    ref={modalBodyRef}
                                    style={{
                                        maxHeight: "70vh",
                                        overflowY: "auto",
                                    }}
                                >
                                    {/* Info Dasar Section */}
                                    <div className="mb-4">
                                        <h6 className="text-primary mb-3 pb-2 border-bottom">
                                            <i className="bi bi-person-badge me-2"></i>
                                            Informasi Dasar
                                        </h6>
                                        <div className="row g-3">
                                            {/* Nama */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    Nama Lengkap{" "}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Masukkan nama lengkap"
                                                    value={formData.name}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            name: e.target
                                                                .value,
                                                        })
                                                    }
                                                    required
                                                />
                                            </div>

                                            {/* Email */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    Email{" "}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <i className="bi bi-envelope"></i>
                                                    </span>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        placeholder="email@example.com"
                                                        value={formData.email}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                email: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* NIP */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    NIP{" "}
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">
                                                        Optional
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Nomor Induk Pegawai"
                                                    value={formData.nip}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            nip: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>

                                            {/* Phone */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    Telepon{" "}
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">
                                                        Optional
                                                    </span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <i className="bi bi-telephone"></i>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="08xxxxxxxxxx"
                                                        value={formData.phone}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                phone: e.target
                                                                    .value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div className="col-12">
                                                <label className="form-label fw-semibold">
                                                    Alamat{" "}
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">
                                                        Optional
                                                    </span>
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    rows="2"
                                                    placeholder="Masukkan alamat lengkap"
                                                    value={formData.address}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            address:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role & Akses Section */}
                                    <div className="mb-4">
                                        <h6 className="text-success mb-3 pb-2 border-bottom">
                                            <i className="bi bi-shield-check me-2"></i>
                                            Role & Akses
                                        </h6>
                                        <div className="row g-3">
                                            {/* Role */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    Role{" "}
                                                    <span className="text-danger">
                                                        *
                                                    </span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={formData.role}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            role: e.target
                                                                .value,
                                                        })
                                                    }
                                                    required
                                                >
                                                    <option value="user">
                                                        👤 User
                                                    </option>
                                                    <option value="supervisor">
                                                        👔 Supervisor
                                                    </option>
                                                    <option value="admin">
                                                        🛡️ Admin
                                                    </option>
                                                </select>
                                            </div>

                                            {/* Division */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    Divisi{" "}
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">
                                                        Optional
                                                    </span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={formData.division_id}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            division_id:
                                                                e.target.value,
                                                        })
                                                    }
                                                >
                                                    <option value="">
                                                        Tidak ada divisi
                                                    </option>
                                                    {divisions.map((div) => (
                                                        <option
                                                            key={div.id}
                                                            value={div.id}
                                                        >
                                                            {div.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <small className="text-muted">
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Untuk User dan Supervisor
                                                </small>
                                            </div>

                                            {/* Supervisor (only for role: user) */}
                                            {formData.role === "user" && (
                                                <div className="col-12">
                                                    <label className="form-label fw-semibold">
                                                        Supervisor{" "}
                                                        <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">
                                                            Optional
                                                        </span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        value={
                                                            formData.supervisor_id
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                supervisor_id:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    >
                                                        <option value="">
                                                            Belum ada supervisor
                                                        </option>
                                                        {supervisors.map(
                                                            (sup) => (
                                                                <option
                                                                    key={sup.id}
                                                                    value={
                                                                        sup.id
                                                                    }
                                                                >
                                                                    {sup.name} -{" "}
                                                                    {sup.email}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                    <small className="text-muted">
                                                        <i className="bi bi-info-circle me-1"></i>
                                                        Khusus untuk role User
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Magang Section */}
                                    <div className="mb-4">
                                        <h6 className="text-info mb-3 pb-2 border-bottom">
                                            <i className="bi bi-briefcase me-2"></i>
                                            Informasi Magang
                                        </h6>
                                        <div className="row g-3">
                                            {/* Periode */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    Periode/Batch{" "}
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">
                                                        Optional
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Contoh: 2024-01, Angkatan 15"
                                                    value={formData.periode}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            periode:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                                <small className="text-muted">
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Batch atau angkatan user
                                                </small>
                                            </div>

                                            {/* Sumber Magang */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    Sumber Magang{" "}
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">
                                                        Optional
                                                    </span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={
                                                        formData.sumber_magang
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            sumber_magang:
                                                                e.target.value,
                                                        })
                                                    }
                                                >
                                                    <option value="kampus">
                                                        Kampus
                                                    </option>
                                                    <option value="pemerintah">
                                                        Pemerintah
                                                    </option>
                                                    <option value="swasta">
                                                        Swasta
                                                    </option>
                                                    <option value="internal">
                                                        Internal
                                                    </option>
                                                    <option value="umum">
                                                        Umum
                                                    </option>
                                                </select>
                                            </div>

                                            {/* Status */}
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    Status{" "}
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1">
                                                        Optional
                                                    </span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={formData.is_active}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            is_active:
                                                                e.target
                                                                    .value ===
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
                                                <small className="text-muted d-block mt-1">
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    Status aktif/nonaktif user
                                                </small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Section - Only for new user */}
                                    {!editingId && (
                                        <div className="mb-2">
                                            <h6 className="text-warning mb-3 pb-2 border-bottom">
                                                <i className="bi bi-key me-2"></i>
                                                Keamanan
                                            </h6>
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    <label className="form-label fw-semibold">
                                                        Password{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <div className="input-group">
                                                        <span className="input-group-text">
                                                            <i className="bi bi-lock"></i>
                                                        </span>
                                                        <input
                                                            type={
                                                                showPassword
                                                                    ? "text"
                                                                    : "password"
                                                            }
                                                            className="form-control"
                                                            placeholder="Minimal 6 karakter"
                                                            value={
                                                                formData.password
                                                            }
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    password:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            required
                                                            minLength="6"
                                                            autoComplete="new-password"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() =>
                                                                setShowPassword(
                                                                    !showPassword
                                                                )
                                                            }
                                                            title={
                                                                showPassword
                                                                    ? "Hide password"
                                                                    : "Show password"
                                                            }
                                                        >
                                                            <i
                                                                className={`bi bi-eye${
                                                                    showPassword
                                                                        ? "-slash"
                                                                        : ""
                                                                }`}
                                                            ></i>
                                                        </button>
                                                    </div>
                                                    <small className="text-muted">
                                                        <i className="bi bi-shield-lock me-1"></i>
                                                        Minimal 6 karakter -
                                                        Password akan di-hash
                                                        untuk keamanan
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Info untuk Edit Mode */}
                                    {editingId && (
                                        <div className="alert alert-info border-info mb-0">
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                                                <div>
                                                    <strong>Info:</strong> Untuk
                                                    mengubah password user,
                                                    gunakan tombol{" "}
                                                    <strong>
                                                        Reset Password
                                                    </strong>{" "}
                                                    di tabel untuk keamanan yang
                                                    lebih baik.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer bg-light border-top">
                                    <button
                                        type="button"
                                        className="btn btn-secondary px-4"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingId(null);
                                            setShowPassword(false);
                                        }}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4"
                                    >
                                        <i className="bi bi-check-circle me-2"></i>
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowImportModal(false);
                            setImportFile(null);
                        }
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-success text-white border-0">
                                <h5 className="modal-title d-flex align-items-center">
                                    <i className="bi bi-file-earmark-arrow-up me-2"></i>
                                    Import User dari Excel
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportFile(null);
                                    }}
                                ></button>
                            </div>
                            <div
                                className="modal-body"
                                ref={importModalRef}
                                style={{ maxHeight: "70vh", overflowY: "auto" }}
                            >
                                {/* Drag & Drop Area */}
                                <div
                                    className={`border-3 border-dashed rounded-3 p-5 text-center transition-all ${
                                        isDragging
                                            ? "border-success bg-success bg-opacity-10 shadow-sm"
                                            : "border-secondary"
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    style={{
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                    }}
                                >
                                    <i
                                        className={`bi bi-cloud-arrow-up ${
                                            isDragging
                                                ? "text-success"
                                                : "text-secondary"
                                        }`}
                                        style={{
                                            fontSize: "4rem",
                                        }}
                                    ></i>
                                    <p className="mt-3 mb-2 fw-semibold">
                                        {importFile ? (
                                            <>
                                                <i className="bi bi-file-earmark-excel-fill text-success me-2"></i>
                                                <span className="text-success">
                                                    {importFile.name}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-dark">
                                                    Drag & drop file Excel di
                                                    sini
                                                </span>
                                                <br />
                                                <span className="text-muted">
                                                    atau klik untuk memilih file
                                                </span>
                                            </>
                                        )}
                                    </p>
                                    {importFile && (
                                        <small className="text-muted d-block">
                                            <i className="bi bi-check-circle-fill text-success me-1"></i>
                                            File siap diimport
                                        </small>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) =>
                                            handleFileSelect(e.target.files[0])
                                        }
                                        style={{ display: "none" }}
                                    />
                                </div>

                                {/* Instructions */}
                                <div className="alert alert-info border-info mt-4 mb-3">
                                    <h6 className="alert-heading d-flex align-items-center mb-3">
                                        <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                                        Panduan Import
                                    </h6>
                                    <ul className="mb-0">
                                        <li className="mb-2">
                                            <i className="bi bi-1-circle me-2 text-info"></i>
                                            Download template Excel terlebih
                                            dahulu
                                        </li>
                                        <li className="mb-2">
                                            <i className="bi bi-2-circle me-2 text-info"></i>
                                            Isi data sesuai format template
                                        </li>
                                        <li className="mb-2">
                                            <i className="bi bi-3-circle me-2 text-info"></i>
                                            <strong>Field Wajib:</strong> Nama,
                                            Email, Password, Role
                                        </li>
                                        <li className="mb-2">
                                            <i className="bi bi-4-circle me-2 text-info"></i>
                                            <strong>Field Opsional:</strong>{" "}
                                            NIP, Phone, Division, Periode,
                                            Sumber Magang, Jenis Izin
                                        </li>
                                        <li>
                                            <i className="bi bi-5-circle me-2 text-info"></i>
                                            Format file: <strong>.xlsx</strong>{" "}
                                            atau <strong>.xls</strong>
                                        </li>
                                    </ul>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-outline-success w-100 py-2"
                                    onClick={handleDownloadTemplate}
                                >
                                    <i className="bi bi-download me-2"></i>
                                    Download Template Excel
                                </button>
                            </div>
                            <div className="modal-footer bg-light border-top">
                                <button
                                    type="button"
                                    className="btn btn-secondary px-4"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportFile(null);
                                    }}
                                    disabled={importing}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success px-4"
                                    onClick={handleImportSubmit}
                                    disabled={!importFile || importing}
                                >
                                    {importing ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></span>
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle me-2"></i>
                                            Import Sekarang
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowResetPasswordModal(false);
                            setResetPasswordUserId(null);
                            setResetPasswordData({
                                newPassword: "",
                                confirmPassword: "",
                            });
                        }
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-warning text-dark border-0">
                                <h5 className="modal-title d-flex align-items-center">
                                    <i className="bi bi-key-fill me-2"></i>
                                    Reset Password User
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowResetPasswordModal(false);
                                        setResetPasswordUserId(null);
                                        setResetPasswordData({
                                            newPassword: "",
                                            confirmPassword: "",
                                        });
                                    }}
                                ></button>
                            </div>
                            <form onSubmit={handleResetPassword}>
                                <div
                                    className="modal-body"
                                    ref={resetPasswordModalRef}
                                    style={{
                                        maxHeight: "70vh",
                                        overflowY: "auto",
                                    }}
                                >
                                    <div className="alert alert-warning border-warning d-flex align-items-start">
                                        <i className="bi bi-exclamation-triangle-fill me-2 fs-5 flex-shrink-0 mt-1"></i>
                                        <div>
                                            <strong>Perhatian:</strong> Password
                                            user akan diganti dengan password
                                            baru yang Anda tentukan.
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Password Baru{" "}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="bi bi-lock-fill"></i>
                                            </span>
                                            <input
                                                type="password"
                                                className="form-control"
                                                placeholder="Minimal 6 karakter"
                                                value={
                                                    resetPasswordData.newPassword
                                                }
                                                onChange={(e) =>
                                                    setResetPasswordData({
                                                        ...resetPasswordData,
                                                        newPassword:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                                minLength="6"
                                                autoFocus
                                            />
                                        </div>
                                        <small className="text-muted">
                                            <i className="bi bi-shield-lock me-1"></i>
                                            Password minimal 6 karakter
                                        </small>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Konfirmasi Password Baru{" "}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="bi bi-lock-fill"></i>
                                            </span>
                                            <input
                                                type="password"
                                                className="form-control"
                                                placeholder="Ketik ulang password baru"
                                                value={
                                                    resetPasswordData.confirmPassword
                                                }
                                                onChange={(e) =>
                                                    setResetPasswordData({
                                                        ...resetPasswordData,
                                                        confirmPassword:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                                minLength="6"
                                            />
                                        </div>
                                        {resetPasswordData.confirmPassword &&
                                            resetPasswordData.newPassword !==
                                                resetPasswordData.confirmPassword && (
                                                <div className="mt-2 p-2 bg-danger bg-opacity-10 border border-danger rounded">
                                                    <small className="text-danger fw-semibold">
                                                        <i className="bi bi-x-circle-fill me-1"></i>
                                                        Password tidak sama
                                                    </small>
                                                </div>
                                            )}
                                        {resetPasswordData.confirmPassword &&
                                            resetPasswordData.newPassword ===
                                                resetPasswordData.confirmPassword && (
                                                <div className="mt-2 p-2 bg-success bg-opacity-10 border border-success rounded">
                                                    <small className="text-success fw-semibold">
                                                        <i className="bi bi-check-circle-fill me-1"></i>
                                                        Password sama
                                                    </small>
                                                </div>
                                            )}
                                    </div>

                                    <div className="alert alert-info border-info mb-0">
                                        <div className="d-flex align-items-start">
                                            <i className="bi bi-lightbulb-fill me-2 fs-5 flex-shrink-0"></i>
                                            <div>
                                                <strong>Tips Keamanan:</strong>
                                                <ul className="mb-0 mt-1 small">
                                                    <li>
                                                        Gunakan kombinasi huruf
                                                        besar, kecil, angka, dan
                                                        simbol
                                                    </li>
                                                    <li>
                                                        Sarankan user untuk
                                                        segera mengubah password
                                                        setelah login
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-top">
                                    <button
                                        type="button"
                                        className="btn btn-secondary px-4"
                                        onClick={() => {
                                            setShowResetPasswordModal(false);
                                            setResetPasswordUserId(null);
                                            setResetPasswordData({
                                                newPassword: "",
                                                confirmPassword: "",
                                            });
                                        }}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-warning px-4"
                                        disabled={
                                            !resetPasswordData.newPassword ||
                                            !resetPasswordData.confirmPassword ||
                                            resetPasswordData.newPassword !==
                                                resetPasswordData.confirmPassword
                                        }
                                    >
                                        <i className="bi bi-check-circle me-2"></i>
                                        Reset Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Confirmation Modal */}
            {showExportModal && (
                <div
                    className="modal fade show d-block"
                    style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowExportModal(false);
                        }
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-info text-white border-0">
                                <h5 className="modal-title d-flex align-items-center">
                                    <i className="bi bi-file-earmark-arrow-down me-2"></i>
                                    Konfirmasi Export Data
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowExportModal(false)}
                                ></button>
                            </div>
                            <div
                                className="modal-body"
                                ref={exportModalRef}
                                style={{ maxHeight: "70vh", overflowY: "auto" }}
                            >
                                <div className="text-center mb-4">
                                    <i
                                        className="bi bi-file-earmark-excel-fill text-success"
                                        style={{ fontSize: "4rem" }}
                                    ></i>
                                </div>

                                <h6 className="text-center mb-4">
                                    Apakah Anda ingin mengeksport data user ke
                                    Excel?
                                </h6>

                                {Object.values(filters).some((v) => v) ? (
                                    <div className="alert alert-warning border-warning">
                                        <div className="d-flex align-items-center mb-3">
                                            <i className="bi bi-funnel-fill me-2 fs-5"></i>
                                            <strong className="fs-6">
                                                Export dengan Filter Aktif
                                            </strong>
                                        </div>
                                        <ul className="mb-0 ps-4">
                                            {filters.periode && (
                                                <li className="mb-2">
                                                    <span className="badge bg-primary me-2">
                                                        Periode
                                                    </span>
                                                    <strong>
                                                        {filters.periode}
                                                    </strong>
                                                </li>
                                            )}
                                            {filters.role && (
                                                <li className="mb-2">
                                                    <span className="badge bg-success me-2">
                                                        Role
                                                    </span>
                                                    <strong>
                                                        {filters.role.toUpperCase()}
                                                    </strong>
                                                </li>
                                            )}
                                            {filters.division_id && (
                                                <li className="mb-2">
                                                    <span className="badge bg-info me-2">
                                                        Divisi
                                                    </span>
                                                    <strong>
                                                        {
                                                            divisions.find(
                                                                (d) =>
                                                                    d.id ===
                                                                    parseInt(
                                                                        filters.division_id
                                                                    )
                                                            )?.name
                                                        }
                                                    </strong>
                                                </li>
                                            )}
                                            {filters.sumber_magang && (
                                                <li className="mb-2">
                                                    <span className="badge bg-warning text-dark me-2">
                                                        Sumber Magang
                                                    </span>
                                                    <strong>
                                                        {filters.sumber_magang
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            filters.sumber_magang.slice(
                                                                1
                                                            )}
                                                    </strong>
                                                </li>
                                            )}
                                            {filters.is_active && (
                                                <li className="mb-2">
                                                    <span className="badge bg-secondary me-2">
                                                        Status
                                                    </span>
                                                    <strong>
                                                        {filters.is_active ===
                                                        "1"
                                                            ? "Aktif"
                                                            : "Nonaktif"}
                                                    </strong>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="alert alert-info border-info">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                                            <div>
                                                Export{" "}
                                                <strong>SEMUA DATA USER</strong>{" "}
                                                tanpa filter
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center p-3 bg-light rounded">
                                    <i className="bi bi-file-earmark-spreadsheet-fill text-success me-2"></i>
                                    <span className="text-muted">
                                        File akan didownload dalam format Excel
                                        (.xlsx)
                                    </span>
                                </div>
                            </div>
                            <div className="modal-footer bg-light border-top">
                                <button
                                    type="button"
                                    className="btn btn-secondary px-4"
                                    onClick={() => setShowExportModal(false)}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-info text-white px-4"
                                    onClick={handleExportUsers}
                                >
                                    <i className="bi bi-check-circle me-2"></i>
                                    Lanjutkan Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
