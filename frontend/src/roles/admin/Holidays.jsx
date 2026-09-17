import React, { useState, useEffect } from "react";
import { Card, Button, Table, Badge, Form, InputGroup, Modal, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";

const Holidays = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showSyncConfirm, setShowSyncConfirm] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    
    const [formData, setFormData] = useState({
        name: "",
        date: "",
        type: "company",
        description: "",
        is_national: false,
        is_active: true
    });

    const typeOptions = [
        { value: "national", label: "Nasional" },
        { value: "religious", label: "Keagamaan" },
        { value: "company", label: "Perusahaan" },
        { value: "regional", label: "Daerah" }
    ];

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            // Default load 100 limit just to be safe, filter by year
            const response = await axiosInstance.get("/admin/holidays", {
                params: { year: yearFilter, limit: 100, is_active: undefined } 
            });
            if (response.data.success) {
                setHolidays(response.data.data.holidays || []);
            }
        } catch (error) {
            console.error("Error fetching holidays:", error);
            toast.error("Gagal memuat data hari libur");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, [yearFilter]);

    const handleCloseModal = () => {
        setShowModal(false);
        setTimeout(() => {
            setFormData({
                name: "",
                date: "",
                type: "company",
                description: "",
                is_national: false,
                is_active: true
            });
            setEditingId(null);
        }, 200);
    };

    const handleShowAddModal = () => {
        setModalMode("add");
        setShowModal(true);
    };

    const handleShowEditModal = (holiday) => {
        setModalMode("edit");
        setEditingId(holiday.id);
        setFormData({
            name: holiday.name,
            date: holiday.date,
            type: holiday.type,
            description: holiday.description || "",
            is_national: holiday.is_national,
            is_active: holiday.is_active
        });
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.date || !formData.type) {
            toast.error("Silakan isi nama, tanggal, dan tipe libur.");
            return;
        }

        try {
            setIsSubmitting(true);
            if (modalMode === "add") {
                await axiosInstance.post("/admin/holidays", formData);
                toast.success("Hari libur berhasil ditambahkan");
            } else {
                await axiosInstance.put(`/admin/holidays/${editingId}`, formData);
                toast.success("Hari libur berhasil diperbarui");
            }
            handleCloseModal();
            fetchHolidays();
        } catch (error) {
            console.error("Error saving holiday:", error);
            toast.error(error.response?.data?.message || "Gagal menyimpan data hari libur");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id, isNational, createdBy) => {
        if (isNational && createdBy === null) {
            toast.error("Hari libur nasional hasil sinkronisasi otomatis tidak dapat dihapus.");
            return;
        }
        
        setDeleteItem(id);
    };

    const confirmDelete = async () => {
        if (!deleteItem) return;
        try {
            await axiosInstance.delete(`/admin/holidays/${deleteItem}`);
            toast.success("Hari libur berhasil dihapus");
            fetchHolidays();
        } catch (error) {
            console.error("Error deleting holiday:", error);
            toast.error("Gagal menghapus hari libur");
        } finally {
            setDeleteItem(null);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await axiosInstance.patch(`/admin/holidays/${id}/toggle`);
            toast.success(`Hari libur berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`);
            fetchHolidays();
        } catch (error) {
            console.error("Error toggling status:", error);
            toast.error("Gagal mengubah status hari libur");
        }
    };

    const handleSyncNationalHolidays = () => {
        setShowSyncConfirm(true);
    };

    const confirmSyncNationalHolidays = async () => {
        setShowSyncConfirm(false);

        try {
            setIsSyncing(true);
            toast.loading("Menarik data libur nasional...", { id: "sync-toast" });
            
            // Panggil endpoint backend yang sudah dilengkapi Cron Job & Fallback
            const response = await axiosInstance.post("/admin/holidays/sync-now", { year: yearFilter });
            
            if (response.data.success) {
                toast.success(response.data.message || `Sinkronisasi berhasil!`, { id: "sync-toast" });
                fetchHolidays();
            } else {
                throw new Error(response.data.message || "Gagal sinkronisasi");
            }
        } catch (error) {
            console.error("Sync error:", error);
            toast.error(error.response?.data?.message || "Gagal melakukan sinkronisasi libur nasional", { id: "sync-toast" });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold text-dark">
                        <i className="bi bi-calendar2-event text-danger me-2"></i>
                        Manajemen Hari Libur
                    </h2>
                    <p className="text-muted mb-0">
                        Kelola hari libur nasional dan kustom perusahaan yang akan terintegrasi ke seluruh kalender.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-success" 
                        onClick={handleSyncNationalHolidays} 
                        disabled={isSyncing}
                        className="rounded-3 shadow-sm px-4"
                    >
                        {isSyncing ? (
                            <><Spinner size="sm" className="me-2"/> Menyinkronkan...</>
                        ) : (
                            <><i className="bi bi-arrow-repeat me-2"></i> Sync Libur Nasional</>
                        )}
                    </Button>
                    <Button variant="primary" onClick={handleShowAddModal} className="rounded-3 shadow-sm px-4">
                        <i className="bi bi-plus-lg me-2"></i>
                        Tambah Libur
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Card.Header className="bg-white border-bottom py-3">
                    <div className="d-flex align-items-center gap-3">
                        <i className="bi bi-filter-circle text-primary fs-5"></i>
                        <h6 className="mb-0 fw-bold">Filter Tahun</h6>
                        <Form.Select 
                            size="sm" 
                            style={{ width: "120px" }}
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                        >
                            {[...Array(4)].map((_, i) => {
                                const y = new Date().getFullYear() - i;
                                return <option key={y} value={y}>{y}</option>;
                            })}
                        </Form.Select>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center p-5">
                            <Spinner animation="border" variant="primary" />
                            <div className="mt-2 text-muted">Memuat data...</div>
                        </div>
                    ) : holidays.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <i className="bi bi-calendar-x display-1 d-block mb-3 opacity-25"></i>
                            <p>Tidak ada hari libur ditemukan pada tahun {yearFilter}</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0 align-middle">
                                <thead className="bg-light text-muted">
                                    <tr>
                                        <th className="px-4 py-3 font-weight-normal border-0">Tanggal</th>
                                        <th className="py-3 font-weight-normal border-0">Nama Libur</th>
                                        <th className="py-3 font-weight-normal border-0">Tipe</th>
                                        <th className="py-3 font-weight-normal border-0 text-center">Nasional</th>
                                        <th className="px-4 py-3 font-weight-normal border-0 text-end">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holidays.map((h) => (
                                        <tr key={h.id}>
                                            <td className="px-4 fw-medium text-dark">
                                                {new Date(h.date).toLocaleDateString("id-ID", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                })}
                                            </td>
                                            <td>
                                                <div className="fw-semibold text-dark">{h.name}</div>
                                                {h.description && (
                                                    <small className="text-muted text-truncate d-inline-block" style={{maxWidth: "200px"}}>
                                                        {h.description}
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <Badge bg={
                                                    h.type === "national" ? "danger" : 
                                                    h.type === "company" ? "primary" : 
                                                    h.type === "religious" ? "success" : "info"
                                                } className="px-3 rounded-pill">
                                                    {typeOptions.find(t => t.value === h.type)?.label || h.type}
                                                </Badge>
                                            </td>
                                            <td className="text-center">
                                                {h.is_national ? (
                                                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                                ) : (
                                                    <i className="bi bi-dash-circle text-muted"></i>
                                                )}
                                            </td>
                                            <td className="px-4 text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm"
                                                        className="rounded-circle btn-icon"
                                                        onClick={() => handleShowEditModal(h)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Button>
                                                    {(!h.is_national || h.created_by !== null) && (
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm"
                                                            className="rounded-circle btn-icon"
                                                            onClick={() => handleDelete(h.id, h.is_national, h.created_by)}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Add/Edit */}
            <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        {modalMode === "add" ? "Tambah Hari Libur" : "Edit Hari Libur"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Nama Hari Libur <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Contoh: Hari Raya Idul Fitri"
                                required
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Tanggal <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Tipe Libur <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                {typeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Deskripsi Tambahan</Form.Label>
                            <Form.Control 
                                as="textarea"
                                rows={2}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Opsional: Keterangan tambahan mengenai hari libur"
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-between p-3 bg-light rounded-3 mt-4">
                            <Form.Check 
                                type="switch"
                                id="is_national_switch"
                                label="Libur Nasional Resmi"
                                name="is_national"
                                checked={formData.is_national}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={handleCloseModal} disabled={isSubmitting}>
                                Batal
                            </Button>
                            <Button variant="primary" type="submit" disabled={isSubmitting} className="px-4">
                                {isSubmitting ? (
                                    <><Spinner size="sm" className="me-2"/> Menyimpan...</>
                                ) : "Simpan"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Sync Confirm Modal */}
            {showSyncConfirm && (
                <div
                    onClick={() => setShowSyncConfirm(false)}
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
                        animation: "fadeIn 0.2s ease"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: "450px",
                            borderRadius: "1.25rem",
                            overflow: "hidden",
                            backgroundColor: "var(--bg-card, #fff)",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
                            border: "1px solid var(--border-color, rgba(0,0,0,0.1))",
                            animation: "slideUpModal 0.25s ease",
                        }}
                    >
                        <div
                            style={{
                                background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                                padding: "1.25rem 1.5rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.875rem",
                            }}
                        >
                            <div
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    fontSize: "1.2rem",
                                }}
                            >
                                <i className="bi bi-arrow-repeat"></i>
                            </div>
                            <div>
                                <h5 style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "1.1rem" }}>
                                    Konfirmasi Sinkronisasi
                                </h5>
                            </div>
                        </div>

                        <div style={{ padding: "1.5rem", backgroundColor: "var(--dm-bg-card, #fff)" }}>
                            <p style={{ color: "var(--dm-text, #6c757d)", marginBottom: "1.5rem", fontSize: "0.95rem", lineHeight: "1.5" }}>
                                Sistem akan menarik data libur nasional dan cuti bersama tahun <strong style={{color: "var(--dm-text-label, #000)"}}>{yearFilter}</strong> secara otomatis dari server publik. Lanjutkan?
                            </p>

                            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setShowSyncConfirm(false)}
                                    className="btn btn-light"
                                    style={{ borderRadius: "0.5rem", fontWeight: 600, padding: "0.5rem 1rem" }}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmSyncNationalHolidays}
                                    className="btn btn-primary"
                                    style={{ borderRadius: "0.5rem", fontWeight: 600, padding: "0.5rem 1.25rem", border: "none", background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)" }}
                                >
                                    Ya, Lanjutkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteItem && (
                <div
                    onClick={() => setDeleteItem(null)}
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
                        animation: "fadeIn 0.2s ease"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: "450px",
                            borderRadius: "1.25rem",
                            overflow: "hidden",
                            backgroundColor: "var(--bg-card, #fff)",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
                            border: "1px solid var(--border-color, rgba(0,0,0,0.1))",
                            animation: "slideUpModal 0.25s ease",
                        }}
                    >
                        <div
                            style={{
                                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                padding: "1.25rem 1.5rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.875rem",
                            }}
                        >
                            <div
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    fontSize: "1.2rem",
                                }}
                            >
                                <i className="bi bi-exclamation-triangle"></i>
                            </div>
                            <div>
                                <h5 style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: "1.1rem" }}>
                                    Konfirmasi Hapus
                                </h5>
                            </div>
                        </div>

                        <div style={{ padding: "1.5rem", backgroundColor: "var(--dm-bg-card, #fff)" }}>
                            <p style={{ color: "var(--dm-text, #6c757d)", marginBottom: "1.5rem", fontSize: "0.95rem", lineHeight: "1.5" }}>
                                Apakah Anda yakin ingin menghapus hari libur ini? Tindakan ini tidak dapat dibatalkan.
                            </p>

                            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setDeleteItem(null)}
                                    className="btn btn-light"
                                    style={{ borderRadius: "0.5rem", fontWeight: 600, padding: "0.5rem 1rem" }}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="btn btn-danger"
                                    style={{ borderRadius: "0.5rem", fontWeight: 600, padding: "0.5rem 1.25rem", border: "none", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Holidays;
