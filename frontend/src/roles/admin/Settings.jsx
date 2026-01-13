import { useState, useEffect } from "react";
import { Tabs, Tab } from "react-bootstrap";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

// Constants untuk default values dan constraints
const DEFAULT_SETTINGS = {
    working_hours_start: "08:00",
    working_hours_end: "17:00",
    late_tolerance_minutes: "15",
    auto_checkout_enabled: false,
    auto_checkout_time: "17:30",
    max_leave_days_per_year: "12", // Untuk izin/permission (magang tidak ada cuti)
    notification_enabled: true,
};

const CONSTRAINTS = {
    MIN_LEAVE_DAYS: 1,
    MIN_TOLERANCE: 0,
};

const AdminSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/admin/settings");
            const data = response.data.data || response.data;

            // Merge with default settings to ensure all fields exist
            setSettings((prevSettings) => ({
                ...prevSettings,
                ...data,
            }));
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error(
                error.response?.data?.message || "Gagal memuat pengaturan"
            );
        } finally {
            setLoading(false);
        }
    };

    // Helper function untuk update settings secara clean
    const updateSetting = (key, value) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // Reusable input field component
    const TimeInput = ({
        label,
        icon,
        iconColor,
        value,
        settingKey,
        helpText,
    }) => (
        <div className="col-md-4">
            <label className="form-label">
                <i className={`bi ${icon} me-2 ${iconColor}`}></i>
                <strong>{label}</strong>
            </label>
            <input
                type="time"
                className="form-control form-control-lg"
                value={value}
                onChange={(e) => updateSetting(settingKey, e.target.value)}
            />
            <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                {helpText}
            </small>
        </div>
    );

    const NumberInput = ({
        label,
        icon,
        iconColor,
        value,
        settingKey,
        helpText,
        min,
        unit,
    }) => (
        <div className="col-md-4">
            <label className="form-label">
                <i className={`bi ${icon} me-2 ${iconColor}`}></i>
                <strong>{label}</strong>
            </label>
            <div className="input-group input-group-lg">
                <input
                    type="number"
                    className="form-control"
                    value={value}
                    onChange={(e) => updateSetting(settingKey, e.target.value)}
                    min={min}
                />
                {unit && <span className="input-group-text">{unit}</span>}
            </div>
            <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                {helpText}
            </small>
        </div>
    );

    const SwitchInput = ({
        label,
        description,
        value,
        settingKey,
        size = "normal",
    }) => (
        <div className="form-check form-switch">
            <input
                className="form-check-input"
                type="checkbox"
                style={
                    size === "large" ? { width: "3rem", height: "1.5rem" } : {}
                }
                checked={value}
                onChange={(e) => updateSetting(settingKey, e.target.checked)}
            />
            <label className="form-check-label ms-2">
                <strong className={size === "large" ? "fs-5" : ""}>
                    {label}
                </strong>
                {description && (
                    <>
                        <br />
                        <small className="text-muted">{description}</small>
                    </>
                )}
            </label>
        </div>
    );

    const handleSave = async () => {
        // Validasi komprehensif
        const validations = [
            {
                condition:
                    parseInt(settings.late_tolerance_minutes) <
                    CONSTRAINTS.MIN_TOLERANCE,
                message: "Toleransi keterlambatan tidak boleh negatif",
            },
            {
                condition:
                    parseInt(settings.max_leave_days_per_year) <
                    CONSTRAINTS.MIN_LEAVE_DAYS,
                message: `Kuota izin minimal ${CONSTRAINTS.MIN_LEAVE_DAYS} hari per tahun`,
            },
            {
                condition:
                    settings.working_hours_start >= settings.working_hours_end,
                message: "Jam masuk harus lebih awal dari jam pulang",
            },
            {
                condition:
                    settings.auto_checkout_enabled &&
                    !settings.auto_checkout_time,
                message:
                    "Waktu auto checkout harus diisi jika fitur diaktifkan",
            },
        ];

        // Cek semua validasi
        for (const validation of validations) {
            if (validation.condition) {
                toast.error(validation.message);
                return;
            }
        }

        try {
            setSaving(true);
            const response = await axiosInstance.put(
                "/admin/settings",
                settings
            );
            toast.success(
                response.data.message || "Pengaturan berhasil disimpan"
            );
            fetchSettings(); // Refresh data
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error(
                error.response?.data?.message || "Gagal menyimpan pengaturan"
            );
        } finally {
            setSaving(false);
        }
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
        <div className="admin-settings p-4">
            {/* Header with Enhanced Styling */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h2 className="mb-1">
                            <i className="bi bi-gear-fill me-2 text-primary"></i>
                            System Settings
                        </h2>
                        <p className="text-muted mb-0">
                            <i className="bi bi-info-circle me-1"></i>
                            Kelola konfigurasi sistem dan pengaturan global
                            aplikasi
                        </p>
                    </div>
                    <button
                        className="btn btn-primary px-4"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-save me-2"></i>
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>
                <hr className="mt-3" />
            </div>

            {/* Quick Stats Overview */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm border-start border-primary border-3">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-clock-history fs-3 text-primary me-3"></i>
                                <div>
                                    <small className="text-muted d-block">
                                        Jam Kerja
                                    </small>
                                    <strong className="fs-6">
                                        {settings.working_hours_start} -{" "}
                                        {settings.working_hours_end}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm border-start border-primary border-3">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-hourglass-split fs-3 text-primary me-3"></i>
                                <div>
                                    <small className="text-muted d-block">
                                        Toleransi Keterlambatan
                                    </small>
                                    <strong className="fs-6">
                                        {settings.late_tolerance_minutes} menit
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm border-start border-primary border-3">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-calendar-event fs-3 text-primary me-3"></i>
                                <div>
                                    <small className="text-muted d-block">
                                        Kuota Izin
                                    </small>
                                    <strong className="fs-6">
                                        {settings.max_leave_days_per_year} hari
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Content with Tabs */}
            <Tabs
                defaultActiveKey="working-hours"
                id="settings-tabs"
                className="mb-4"
            >
                {/* Tab 1: Working Hours */}
                <Tab
                    eventKey="working-hours"
                    title={
                        <span>
                            <i className="bi bi-clock me-2"></i>Jam Kerja
                        </span>
                    }
                >
                    <div className="row g-4 mt-2">
                        {/* Working Hours Card */}
                        <div className="col-12">
                            <div className="cards">
                                <div className="cards-title">
                                    <h5 className="mb-0">
                                        <i className="bi bi-clock-history me-2"></i>
                                        Pengaturan Jam Kerja
                                    </h5>
                                </div>
                                <div className="cards-body">
                                    <div className="row g-4">
                                        <TimeInput
                                            label="Jam Masuk"
                                            icon="bi-sunrise"
                                            iconColor="text-primary"
                                            value={settings.working_hours_start}
                                            settingKey="working_hours_start"
                                            helpText="Jam mulai kerja karyawan"
                                        />
                                        <TimeInput
                                            label="Jam Pulang"
                                            icon="bi-sunset"
                                            iconColor="text-primary"
                                            value={settings.working_hours_end}
                                            settingKey="working_hours_end"
                                            helpText="Jam selesai kerja karyawan"
                                        />
                                        <NumberInput
                                            label="Toleransi Keterlambatan"
                                            icon="bi-hourglass-split"
                                            iconColor="text-primary"
                                            value={
                                                settings.late_tolerance_minutes
                                            }
                                            settingKey="late_tolerance_minutes"
                                            helpText="Batas toleransi keterlambatan"
                                            min={CONSTRAINTS.MIN_TOLERANCE}
                                            unit="menit"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tab>

                {/* Tab 2: Auto Checkout */}
                <Tab
                    eventKey="auto-checkout"
                    title={
                        <span>
                            <i className="bi bi-clock-history me-2"></i>Auto
                            Checkout
                        </span>
                    }
                >
                    <div className="mt-3">
                        <div className="cards">
                            <div className="cards-title">
                                <h5 className="mb-0">
                                    <i className="bi bi-clock-history me-2"></i>
                                    Auto Checkout System
                                </h5>
                            </div>
                            <div className="cards-body">
                                {/* Force Checkout Info */}
                                <div className="alert alert-info border border-primary d-flex align-items-start mb-4">
                                    <i className="bi bi-info-circle fs-4 text-primary me-3 mt-1"></i>
                                    <div>
                                        <h6 className="alert-heading mb-2">
                                            <strong>
                                                Force Checkout Otomatis
                                            </strong>
                                        </h6>
                                        <p className="mb-0">
                                            Sistem akan otomatis melakukan
                                            checkout untuk semua user yang lupa
                                            checkout pada pukul{" "}
                                            <span className="badge bg-dark">
                                                23:59:59
                                            </span>{" "}
                                            setiap hari. Fitur ini memastikan
                                            tidak ada data presensi yang terbuka
                                            hingga hari berikutnya.
                                        </p>
                                    </div>
                                </div>

                                {/* Auto Checkout Toggle */}
                                <div className="card bg-light border-0 mb-4">
                                    <div className="card-body">
                                        <SwitchInput
                                            label="Aktifkan Auto Checkout Terjadwal"
                                            description="Checkout otomatis user pada waktu yang telah ditentukan (sebelum force checkout)"
                                            value={
                                                settings.auto_checkout_enabled
                                            }
                                            settingKey="auto_checkout_enabled"
                                            size="large"
                                        />
                                    </div>
                                </div>

                                {/* Auto Checkout Time Configuration */}
                                {settings.auto_checkout_enabled && (
                                    <div className="card border-primary">
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <TimeInput
                                                        label="Waktu Auto Checkout"
                                                        icon="bi-alarm"
                                                        iconColor="text-dark"
                                                        value={
                                                            settings.auto_checkout_time
                                                        }
                                                        settingKey="auto_checkout_time"
                                                        helpText="Sistem akan otomatis checkout user yang belum checkout pada waktu ini"
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="alert alert-warning mb-0 h-100 d-flex align-items-center">
                                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                                        <small>
                                                            Pastikan waktu auto
                                                            checkout{" "}
                                                            <strong>
                                                                sebelum 23:59:59
                                                            </strong>{" "}
                                                            (waktu force
                                                            checkout)
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Tab>

                {/* Tab 3: Leave & Notifications */}
                <Tab
                    eventKey="leave-notification"
                    title={
                        <span>
                            <i className="bi bi-calendar-event me-2"></i>Izin &
                            Notifikasi
                        </span>
                    }
                >
                    <div className="row g-4 mt-2">
                        {/* Leave Settings Card */}
                        <div className="col-12">
                            <div className="cards">
                                <div className="cards-title">
                                    <h5 className="mb-0">
                                        <i className="bi bi-calendar-x me-2"></i>
                                        Pengaturan Izin
                                    </h5>
                                </div>
                                <div className="cards-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <NumberInput
                                                label="Maksimal Izin per Tahun"
                                                icon="bi-calendar-event"
                                                iconColor="text-primary"
                                                value={
                                                    settings.max_leave_days_per_year
                                                }
                                                settingKey="max_leave_days_per_year"
                                                helpText="Kuota izin yang diberikan kepada setiap karyawan magang"
                                                min={CONSTRAINTS.MIN_LEAVE_DAYS}
                                                unit="hari"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <div className="alert alert-light border border-secondary mb-0 h-100 d-flex align-items-center">
                                                <i className="bi bi-info-circle text-secondary me-2"></i>
                                                <small>
                                                    <strong>Catatan:</strong>{" "}
                                                    Untuk karyawan magang,
                                                    sistem hanya menyediakan
                                                    izin (tidak ada cuti). Kuota
                                                    dapat disesuaikan dengan
                                                    kebijakan perusahaan.
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notifications Card */}
                        <div className="col-12">
                            <div className="cards">
                                <div className="cards-title">
                                    <h5 className="mb-0">
                                        <i className="bi bi-bell me-2"></i>
                                        Pengaturan Notifikasi
                                    </h5>
                                </div>
                                <div className="cards-body">
                                    <div className="card bg-primary bg-opacity-10 border-0">
                                        <div className="card-body">
                                            <SwitchInput
                                                label="Aktifkan Notifikasi Email"
                                                description="Kirim notifikasi email untuk aktivitas penting seperti permohonan cuti, approval, dan reminder"
                                                value={
                                                    settings.notification_enabled
                                                }
                                                settingKey="notification_enabled"
                                                size="large"
                                            />
                                        </div>
                                    </div>

                                    {settings.notification_enabled && (
                                        <div className="alert alert-info border border-primary mt-3 mb-0">
                                            <i className="bi bi-check-circle text-primary me-2"></i>
                                            <small>
                                                Notifikasi email aktif untuk
                                                semua user
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Tab>
            </Tabs>
        </div>
    );
};

export default AdminSettings;
