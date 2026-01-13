import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { Card, Row, Col, Form, Button, Alert } from "react-bootstrap";

const AdminSystemSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        // Attendance Settings
        check_in_start_time: "06:00",
        check_in_end_time: "08:30",
        check_out_start_time: "16:00",
        check_out_end_time: "20:00",
        working_hours_start: "08:00",
        working_hours_end: "17:00",
        late_tolerance_minutes: "15",
        auto_checkout_enabled: false,
        auto_checkout_time: "17:30",

        // Leave Settings
        max_leave_days_per_year: "12",
        leave_require_approval: true,
        leave_min_notice_days: "3",
        leave_submission_deadline_hours: "24", // H-1 default
        leave_min_reason_chars: "10", // Minimal characters for reason

        // Notification Settings
        notification_enabled: true,
        notification_late_checkout: true,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/admin/settings");
            const data = response.data.data || response.data;
            setSettings({ ...settings, ...data });
        } catch (error) {
            toast.error("Gagal memuat pengaturan");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validasi
        if (settings.check_in_start_time >= settings.check_in_end_time) {
            toast.error(
                "Waktu mulai check-in harus lebih awal dari batas akhir"
            );
            return;
        }
        if (settings.check_out_start_time >= settings.check_out_end_time) {
            toast.error(
                "Waktu mulai check-out harus lebih awal dari batas akhir"
            );
            return;
        }
        if (settings.working_hours_start >= settings.working_hours_end) {
            toast.error("Jam masuk harus lebih awal dari jam pulang");
            return;
        }

        try {
            setSaving(true);
            await axiosInstance.put("/admin/settings", settings);
            toast.success("Pengaturan berhasil disimpan");
            fetchSettings(); // Refresh data
        } catch (error) {
            toast.error("Gagal menyimpan pengaturan");
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
        <div className="admin-system-settings p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <i className="bi bi-gear-fill me-2"></i>
                        Pengaturan Sistem
                    </h2>
                    <p className="text-muted mb-0">
                        Konfigurasi sistem untuk attendance dan logbook user
                    </p>
                </div>
                <button
                    className="btn btn-primary"
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

            <Alert variant="info" className="mb-4">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Catatan:</strong> Pengaturan radius lokasi diatur di
                menu <strong>Locations</strong>, dan WiFi networks diatur di
                menu <strong>WiFi Networks</strong> (dalam Management)
            </Alert>

            {/* SECTION 1: ATTENDANCE SETTINGS */}
            <h4 className="mb-3 mt-4">
                <i className="bi bi-calendar-check me-2 text-primary"></i>
                Pengaturan Attendance
            </h4>

            {/* Attendance Time Configuration */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <h5 className="mb-0">
                        <i className="bi bi-clock-history me-2"></i>
                        Konfigurasi Waktu Attendance
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Alert variant="light" className="mb-4">
                        <div className="d-flex align-items-start">
                            <i className="bi bi-info-circle text-info me-2 fs-5"></i>
                            <div>
                                <strong>Penjelasan:</strong>
                                <ul className="mb-0 mt-2 small">
                                    <li>
                                        <strong>Window Check-In:</strong>{" "}
                                        Rentang waktu saat user bisa melakukan
                                        check-in (contoh: 06:00 - 08:30)
                                    </li>
                                    <li>
                                        <strong>Jam Kerja:</strong> Jam kerja
                                        resmi perusahaan untuk menghitung
                                        keterlambatan (contoh: 08:00 - 17:00)
                                    </li>
                                    <li>
                                        <strong>Window Check-Out:</strong>{" "}
                                        Rentang waktu saat user bisa melakukan
                                        check-out (contoh: 16:00 - 20:00)
                                    </li>
                                    <li>
                                        <strong>Toleransi:</strong> Menit
                                        toleransi sebelum dianggap terlambat
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Alert>

                    <Row className="g-4">
                        {/* Check-In Window */}
                        <Col md={12}>
                            <h6 className="text-primary mb-3">
                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                Window Check-In
                            </h6>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Mulai Check-In</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={settings.check_in_start_time}
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    check_in_start_time:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                        <Form.Text className="text-muted">
                                            User bisa mulai check-in dari jam
                                            ini
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Batas Check-In</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={settings.check_in_end_time}
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    check_in_end_time:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                        <Form.Text className="text-muted">
                                            Check-in ditutup setelah jam ini
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Col>

                        <Col md={12}>
                            <hr />
                        </Col>

                        {/* Working Hours */}
                        <Col md={12}>
                            <h6 className="text-success mb-3">
                                <i className="bi bi-briefcase me-2"></i>
                                Jam Kerja Resmi
                            </h6>
                            <Row className="g-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Jam Masuk</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={settings.working_hours_start}
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    working_hours_start:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                        <Form.Text className="text-muted">
                                            Jam kerja dimulai
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Jam Pulang</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={settings.working_hours_end}
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    working_hours_end:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                        <Form.Text className="text-muted">
                                            Jam kerja berakhir
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>
                                            Toleransi (menit)
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={
                                                settings.late_tolerance_minutes
                                            }
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    late_tolerance_minutes:
                                                        e.target.value,
                                                })
                                            }
                                            min="0"
                                            max="60"
                                        />
                                        <Form.Text className="text-muted">
                                            Toleransi keterlambatan
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Col>

                        <Col md={12}>
                            <hr />
                        </Col>

                        {/* Check-Out Window */}
                        <Col md={12}>
                            <h6 className="text-danger mb-3">
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Window Check-Out
                            </h6>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Mulai Check-Out</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={
                                                settings.check_out_start_time
                                            }
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    check_out_start_time:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                        <Form.Text className="text-muted">
                                            User bisa mulai check-out dari jam
                                            ini
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Batas Check-Out</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={settings.check_out_end_time}
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    check_out_end_time:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                        <Form.Text className="text-muted">
                                            Check-out ditutup setelah jam ini
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    {/* Example */}
                    <Alert variant="success" className="mt-4 mb-0">
                        <strong>Contoh Konfigurasi:</strong>
                        <br />
                        <small>
                            ΓÇó Check-In: 06:00 - 08:30 | Jam Kerja: 08:00 -
                            17:00 | Check-Out: 16:00 - 20:00
                            <br />
                            ΓÇó User check-in jam 08:10 ΓåÆ Terlambat 10 menit
                            (dari jam kerja 08:00)
                            <br />
                            ΓÇó User check-in jam 08:35 ΓåÆ Ditolak (melewati
                            batas check-in 08:30)
                        </small>
                    </Alert>
                </Card.Body>
            </Card>

            {/* Auto Checkout */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <h5 className="mb-0">
                        <i className="bi bi-clock-history me-2"></i>
                        Auto Checkout
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form.Check
                        type="switch"
                        id="auto-checkout-switch"
                        label="Aktifkan Auto Checkout"
                        checked={settings.auto_checkout_enabled}
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                auto_checkout_enabled: e.target.checked,
                            })
                        }
                        className="mb-3"
                    />
                    {settings.auto_checkout_enabled && (
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Waktu Auto Checkout</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={settings.auto_checkout_time}
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                auto_checkout_time:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                    <Form.Text className="text-muted">
                                        Sistem akan otomatis checkout user yang
                                        lupa checkout pada jam ini
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                    {settings.auto_checkout_enabled && (
                        <Alert variant="info" className="mt-3 mb-0">
                            <small>
                                <i className="bi bi-info-circle me-2"></i>
                                <strong>Catatan:</strong> User yang belum
                                checkout akan otomatis di-checkout oleh sistem
                                pada waktu yang ditentukan. Check-out address
                                akan tercatat sebagai{" "}
                                <strong>"Auto Checkout"</strong> dan tidak
                                memerlukan foto/lokasi.
                            </small>
                        </Alert>
                    )}
                    {!settings.auto_checkout_enabled && (
                        <Alert variant="warning" className="mt-3 mb-0">
                            <small>
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                <strong>Perhatian:</strong> Fitur Auto Checkout
                                dinonaktifkan. Namun, sistem tetap akan
                                melakukan{" "}
                                <strong>
                                    force checkout otomatis pada jam 00:00
                                </strong>{" "}
                                untuk user yang lupa checkout. Check-out address
                                akan tercatat sebagai{" "}
                                <strong>"Tidak Checkout"</strong>. Ini untuk
                                mencegah user tidak bisa check-in di hari
                                berikutnya.
                            </small>
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* REMOVED: Logbook Settings Section - Not yet implemented in backend */}
            <Alert variant="warning" className="mb-4">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Pengaturan Logbook:</strong> Fitur validasi logbook
                (minimal kata, upload foto, batas entry, waktu edit) belum
                diimplementasikan di sistem. Akan ditambahkan di versi
                berikutnya.
            </Alert>

            {/* SECTION 2: LEAVE SETTINGS */}
            <h4 className="mb-3 mt-5">
                <i className="bi bi-calendar-x me-2 text-warning"></i>
                Pengaturan Cuti & Izin
            </h4>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <h5 className="mb-0">
                        <i className="bi bi-calendar-range me-2"></i>
                        Kebijakan Cuti
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Maksimal Cuti per Tahun (hari)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={settings.max_leave_days_per_year}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            max_leave_days_per_year:
                                                e.target.value,
                                        })
                                    }
                                    min="1"
                                    max="30"
                                />
                                <Form.Text className="text-muted">
                                    Kuota cuti tahunan untuk setiap user
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    Minimal Pemberitahuan (hari)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={settings.leave_min_notice_days}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            leave_min_notice_days:
                                                e.target.value,
                                        })
                                    }
                                    min="0"
                                    max="14"
                                />
                                <Form.Text className="text-muted">
                                    User harus mengajukan cuti ... hari
                                    sebelumnya
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    <i className="bi bi-clock-history me-2"></i>
                                    Batas Waktu Pengajuan Izin (jam)
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={
                                        settings.leave_submission_deadline_hours
                                    }
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            leave_submission_deadline_hours:
                                                e.target.value,
                                        })
                                    }
                                    min="1"
                                    max="168"
                                />
                                <Form.Text className="text-muted">
                                    Izin harus diajukan minimal X jam sebelum
                                    tanggal izin (24 jam = H-1)
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>
                                    <i className="bi bi-fonts me-2"></i>
                                    Minimal Karakter Alasan Izin
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={settings.leave_min_reason_chars}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            leave_min_reason_chars:
                                                e.target.value,
                                        })
                                    }
                                    min="10"
                                    max="100"
                                />
                                <Form.Text className="text-muted">
                                    Minimal karakter yang harus diisi user saat
                                    mengajukan izin (untuk penjelasan yang
                                    jelas)
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Check
                                type="switch"
                                id="leave-approval-switch"
                                label="Wajib Persetujuan Supervisor/Admin"
                                checked={settings.leave_require_approval}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        leave_require_approval:
                                            e.target.checked,
                                    })
                                }
                            />
                            <Form.Text className="text-muted">
                                Jika aktif, cuti harus disetujui oleh supervisor
                                atau admin
                            </Form.Text>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* SECTION 3: NOTIFICATIONS */}
            <h4 className="mb-3 mt-5">
                <i className="bi bi-bell me-2 text-info"></i>
                Pengaturan Notifikasi
            </h4>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <h5 className="mb-0">
                        <i className="bi bi-envelope me-2"></i>
                        Notifikasi Email
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Form.Check
                        type="switch"
                        id="notification-enabled-switch"
                        label="Aktifkan Notifikasi Email"
                        checked={settings.notification_enabled}
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                notification_enabled: e.target.checked,
                            })
                        }
                        className="mb-3"
                    />
                    <Form.Check
                        type="switch"
                        id="notification-late-switch"
                        label="Notifikasi Keterlambatan Check-out"
                        checked={settings.notification_late_checkout}
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                notification_late_checkout: e.target.checked,
                            })
                        }
                        disabled={!settings.notification_enabled}
                    />
                    <Form.Text className="text-muted">
                        Kirim email reminder jika user lupa checkout
                    </Form.Text>
                </Card.Body>
            </Card>

            {/* Save Button at Bottom */}
            <div className="text-end mt-4">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Menyimpan Perubahan...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check-circle me-2"></i>
                            Simpan Semua Pengaturan
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default AdminSystemSettings;
