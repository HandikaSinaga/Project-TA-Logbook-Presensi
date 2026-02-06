import { useState, useEffect } from "react";
import { Tabs, Tab } from "react-bootstrap";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";

// Constants untuk default values dan constraints
const DEFAULT_SETTINGS = {
    check_in_start_time: "06:00",
    check_in_end_time: "08:30",
    check_out_start_time: "16:00",
    check_out_end_time: "20:00",
    working_hours_start: "08:00",
    working_hours_end: "17:00",
    late_tolerance_minutes: "15",
    auto_checkout_enabled: false,
    auto_checkout_time: "17:30",
    max_leave_days_per_year: "12", // Untuk izin/permission (magang tidak ada cuti)
    leave_submission_deadline_hours: "24",
    leave_min_notice_days: "3",
    leave_min_reason_chars: "10",
    leave_require_approval: true,
    notification_enabled: true,
    notification_late_checkout: true,
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
                error.response?.data?.message || "Gagal memuat pengaturan",
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
                    settings.check_in_start_time >= settings.check_in_end_time,
                message:
                    "Waktu mulai check-in harus lebih awal dari waktu akhir check-in",
            },
            {
                condition:
                    settings.check_out_start_time >=
                    settings.check_out_end_time,
                message:
                    "Waktu mulai check-out harus lebih awal dari waktu akhir check-out",
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
                settings,
            );
            toast.success(
                response.data.message || "Pengaturan berhasil disimpan",
            );
            fetchSettings(); // Refresh data
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error(
                error.response?.data?.message || "Gagal menyimpan pengaturan",
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
                <div className="col-md-3">
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
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm border-start border-success border-3">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-door-open fs-3 text-success me-3"></i>
                                <div>
                                    <small className="text-muted d-block">
                                        Check-in Window
                                    </small>
                                    <strong className="fs-6">
                                        {settings.check_in_start_time} -{" "}
                                        {settings.check_in_end_time}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm border-start border-warning border-3">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-door-closed fs-3 text-warning me-3"></i>
                                <div>
                                    <small className="text-muted d-block">
                                        Check-out Window
                                    </small>
                                    <strong className="fs-6">
                                        {settings.check_out_start_time} -{" "}
                                        {settings.check_out_end_time}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm border-start border-info border-3">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-hourglass-split fs-3 text-info me-3"></i>
                                <div>
                                    <small className="text-muted d-block">
                                        Toleransi
                                    </small>
                                    <strong className="fs-6">
                                        {settings.late_tolerance_minutes} menit
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Content with Tabs */}
            <Tabs
                defaultActiveKey="time-validation"
                id="settings-tabs"
                className="mb-4"
            >
                {/* Tab 0: Time Validation (NEW - HIGH PRIORITY) */}
                <Tab
                    eventKey="time-validation"
                    title={
                        <span>
                            <i className="bi bi-alarm me-2"></i>Validasi Waktu
                        </span>
                    }
                >
                    <div className="row g-4 mt-2">
                        {/* Check-in Time Window Card */}
                        <div className="col-12">
                            <div className="cards">
                                <div className="cards-title bg-success bg-opacity-10">
                                    <h5 className="mb-0 text-success">
                                        <i className="bi bi-door-open me-2"></i>
                                        Window Check-in
                                    </h5>
                                </div>
                                <div className="cards-body">
                                    <div className="alert alert-success border-success d-flex align-items-start mb-4">
                                        <i className="bi bi-info-circle fs-5 me-3 mt-1"></i>
                                        <div>
                                            <strong className="d-block mb-2">
                                                Apa itu Window Check-in?
                                            </strong>
                                            <p className="mb-2">
                                                Window check-in adalah rentang
                                                waktu dimana karyawan{" "}
                                                <strong>diizinkan</strong>{" "}
                                                melakukan check-in. Di luar
                                                rentang waktu ini, sistem akan{" "}
                                                <strong>memblokir</strong>{" "}
                                                check-in dan menampilkan pesan
                                                error.
                                            </p>
                                            <ul className="mb-0 ps-3">
                                                <li>
                                                    Sebelum{" "}
                                                    <strong>
                                                        {
                                                            settings.check_in_start_time
                                                        }
                                                    </strong>
                                                    : Check-in{" "}
                                                    <span className="badge bg-danger">
                                                        DITOLAK
                                                    </span>{" "}
                                                    - "Check-in belum dibuka"
                                                </li>
                                                <li>
                                                    Antara{" "}
                                                    <strong>
                                                        {
                                                            settings.check_in_start_time
                                                        }{" "}
                                                        -{" "}
                                                        {
                                                            settings.check_in_end_time
                                                        }
                                                    </strong>
                                                    : Check-in{" "}
                                                    <span className="badge bg-success">
                                                        DIIZINKAN
                                                    </span>{" "}
                                                    (bisa on-time atau late)
                                                </li>
                                                <li>
                                                    Setelah{" "}
                                                    <strong>
                                                        {
                                                            settings.check_in_end_time
                                                        }
                                                    </strong>
                                                    : Check-in{" "}
                                                    <span className="badge bg-danger">
                                                        DITOLAK
                                                    </span>{" "}
                                                    - "Hubungi admin/supervisor"
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="row g-4">
                                        <TimeInput
                                            label="Waktu Buka Check-in"
                                            icon="bi-door-open"
                                            iconColor="text-success"
                                            value={settings.check_in_start_time}
                                            settingKey="check_in_start_time"
                                            helpText="Karyawan bisa mulai check-in dari jam ini (contoh: 06:00 untuk early bird)"
                                        />
                                        <TimeInput
                                            label="Waktu Tutup Check-in"
                                            icon="bi-door-closed"
                                            iconColor="text-danger"
                                            value={settings.check_in_end_time}
                                            settingKey="check_in_end_time"
                                            helpText="Batas terakhir check-in, setelah ini akan ditolak (contoh: 08:30)"
                                        />
                                        <div className="col-md-4">
                                            <div className="card bg-light h-100">
                                                <div className="card-body">
                                                    <div className="mb-2">
                                                        <i className="bi bi-lightbulb text-warning me-2"></i>
                                                        <strong>
                                                            Rekomendasi
                                                        </strong>
                                                    </div>
                                                    <small className="text-muted">
                                                        • Buka check-in 1-2 jam
                                                        sebelum jam kerja
                                                        <br />
                                                        • Tutup check-in 30
                                                        menit setelah jam kerja
                                                        + toleransi
                                                        <br />• Contoh: Jam
                                                        kerja 08:00, toleransi
                                                        15 menit → tutup 08:30
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Check-out Time Window Card */}
                        <div className="col-12">
                            <div className="cards">
                                <div className="cards-title bg-warning bg-opacity-10">
                                    <h5 className="mb-0 text-warning">
                                        <i className="bi bi-door-closed me-2"></i>
                                        Window Check-out
                                    </h5>
                                </div>
                                <div className="cards-body">
                                    <div className="alert alert-warning border-warning d-flex align-items-start mb-4">
                                        <i className="bi bi-exclamation-triangle fs-5 me-3 mt-1"></i>
                                        <div>
                                            <strong className="d-block mb-2">
                                                Apa itu Window Check-out?
                                            </strong>
                                            <p className="mb-2">
                                                Window check-out adalah rentang
                                                waktu dimana karyawan{" "}
                                                <strong>diizinkan</strong>{" "}
                                                melakukan check-out. Berbeda
                                                dengan check-in, check-out
                                                memiliki validasi lebih ketat:
                                            </p>
                                            <ul className="mb-0 ps-3">
                                                <li>
                                                    Sebelum{" "}
                                                    <strong>
                                                        {
                                                            settings.check_out_start_time
                                                        }
                                                    </strong>
                                                    : Check-out{" "}
                                                    <span className="badge bg-danger">
                                                        DIBLOKIR
                                                    </span>{" "}
                                                    - "Belum waktunya, bisa
                                                    dalam X menit lagi"
                                                </li>
                                                <li>
                                                    Antara{" "}
                                                    <strong>
                                                        {
                                                            settings.check_out_start_time
                                                        }{" "}
                                                        -{" "}
                                                        {
                                                            settings.check_out_end_time
                                                        }
                                                    </strong>
                                                    : Check-out{" "}
                                                    <span className="badge bg-success">
                                                        DIIZINKAN
                                                    </span>{" "}
                                                    (bisa on-time atau early
                                                    dengan warning)
                                                </li>
                                                <li>
                                                    Setelah{" "}
                                                    <strong>
                                                        {
                                                            settings.check_out_end_time
                                                        }
                                                    </strong>
                                                    : Check-out{" "}
                                                    <span className="badge bg-warning">
                                                        DIIZINKAN
                                                    </span>{" "}
                                                    tapi dengan warning
                                                    "overtime"
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="row g-4">
                                        <TimeInput
                                            label="Waktu Buka Check-out"
                                            icon="bi-clock"
                                            iconColor="text-warning"
                                            value={
                                                settings.check_out_start_time
                                            }
                                            settingKey="check_out_start_time"
                                            helpText="Karyawan bisa mulai check-out dari jam ini (contoh: 16:00)"
                                        />
                                        <TimeInput
                                            label="Waktu Tutup Check-out"
                                            icon="bi-clock-history"
                                            iconColor="text-danger"
                                            value={settings.check_out_end_time}
                                            settingKey="check_out_end_time"
                                            helpText="Batas normal check-out, setelah ini dianggap overtime (contoh: 20:00)"
                                        />
                                        <div className="col-md-4">
                                            <div className="card bg-light h-100">
                                                <div className="card-body">
                                                    <div className="mb-2">
                                                        <i className="bi bi-lightbulb text-warning me-2"></i>
                                                        <strong>
                                                            Rekomendasi
                                                        </strong>
                                                    </div>
                                                    <small className="text-muted">
                                                        • Buka check-out 1 jam
                                                        sebelum jam pulang
                                                        <br />
                                                        • Tutup check-out 3-4
                                                        jam setelah jam pulang
                                                        <br />• Contoh: Jam
                                                        pulang 17:00 → buka
                                                        16:00, tutup 20:00
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Timeline */}
                                    <div className="card bg-primary bg-opacity-10 border-primary mt-4">
                                        <div className="card-body">
                                            <h6 className="mb-3">
                                                <i className="bi bi-diagram-3 me-2"></i>
                                                Timeline Visualisasi
                                            </h6>
                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                <div className="badge bg-danger p-2">
                                                    &lt;{" "}
                                                    {
                                                        settings.check_out_start_time
                                                    }{" "}
                                                    : BLOCKED
                                                </div>
                                                <i className="bi bi-arrow-right"></i>
                                                <div className="badge bg-success p-2">
                                                    {
                                                        settings.check_out_start_time
                                                    }{" "}
                                                    -{" "}
                                                    {
                                                        settings.check_out_end_time
                                                    }{" "}
                                                    : ALLOWED
                                                </div>
                                                <i className="bi bi-arrow-right"></i>
                                                <div className="badge bg-warning text-dark p-2">
                                                    &gt;{" "}
                                                    {
                                                        settings.check_out_end_time
                                                    }{" "}
                                                    : OVERTIME
                                                </div>
                                            </div>
                                            <small className="text-muted mt-2 d-block">
                                                <i className="bi bi-info-circle me-1"></i>
                                                User akan melihat countdown
                                                timer dan pesan yang jelas untuk
                                                setiap status
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Real-world Example */}
                        <div className="col-12">
                            <div className="card border-info">
                                <div className="card-header bg-info bg-opacity-10">
                                    <h6 className="mb-0">
                                        <i className="bi bi-book me-2"></i>
                                        Contoh Skenario (Setting Saat Ini)
                                    </h6>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="card h-100">
                                                <div className="card-body">
                                                    <h6 className="text-success mb-3">
                                                        <i className="bi bi-check-circle me-2"></i>
                                                        Scenario 1: Normal Day
                                                    </h6>
                                                    <ul className="small mb-0 ps-3">
                                                        <li className="mb-2">
                                                            <strong>
                                                                07:30
                                                            </strong>{" "}
                                                            - User check-in{" "}
                                                            <span className="badge bg-success">
                                                                ✓
                                                            </span>{" "}
                                                            "Tepat waktu"
                                                        </li>
                                                        <li className="mb-2">
                                                            <strong>
                                                                15:00
                                                            </strong>{" "}
                                                            - User isi logbook{" "}
                                                            <span className="badge bg-success">
                                                                ✓
                                                            </span>
                                                        </li>
                                                        <li className="mb-2">
                                                            <strong>
                                                                17:00
                                                            </strong>{" "}
                                                            - User check-out{" "}
                                                            <span className="badge bg-success">
                                                                ✓
                                                            </span>{" "}
                                                            "Selesai jam kerja"
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="card h-100">
                                                <div className="card-body">
                                                    <h6 className="text-danger mb-3">
                                                        <i className="bi bi-x-circle me-2"></i>
                                                        Scenario 2: Too Early
                                                        Check-out
                                                    </h6>
                                                    <ul className="small mb-0 ps-3">
                                                        <li className="mb-2">
                                                            <strong>
                                                                07:45
                                                            </strong>{" "}
                                                            - User check-in{" "}
                                                            <span className="badge bg-success">
                                                                ✓
                                                            </span>
                                                        </li>
                                                        <li className="mb-2">
                                                            <strong>
                                                                14:00
                                                            </strong>{" "}
                                                            - User isi logbook{" "}
                                                            <span className="badge bg-success">
                                                                ✓
                                                            </span>
                                                        </li>
                                                        <li className="mb-2">
                                                            <strong>
                                                                14:30
                                                            </strong>{" "}
                                                            - User coba
                                                            check-out{" "}
                                                            <span className="badge bg-danger">
                                                                ✗
                                                            </span>{" "}
                                                            "Belum waktunya,
                                                            bisa dalam 90 menit
                                                            lagi"
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tab>

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
