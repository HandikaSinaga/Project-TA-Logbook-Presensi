import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils/Constant";

const Attendance = () => {
    const [loading, setLoading] = useState(true);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Pagination state for history
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Location & Detection
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [workTypeDetection, setWorkTypeDetection] = useState(null); // { workType, isOnsite, reason, office }
    const [isDetectingWorkType, setIsDetectingWorkType] = useState(false);

    // Time validation settings
    const [timeSettings, setTimeSettings] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // OFFSITE form (hanya muncul jika OFFSITE detected)
    const [offsiteReason, setOffsiteReason] = useState("");
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    // Filter states
    const [filterWorkType, setFilterWorkType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [filteredHistory, setFilteredHistory] = useState([]);

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);

    // Prevent toast spam
    const [hasShownWorkTypeToast, setHasShownWorkTypeToast] = useState(false);

    useEffect(() => {
        fetchAttendanceData();
        fetchTimeSettings();
        getCurrentLocation();

        // Refresh time settings setiap 5 menit untuk catch perubahan dari admin
        const timeSettingsInterval = setInterval(() => {
            fetchTimeSettings();
        }, 5 * 60 * 1000); // 5 minutes

        // Update current time setiap detik
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timeSettingsInterval);
            clearInterval(timeInterval);
        };
    }, []);

    useEffect(() => {
        fetchAttendanceHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filterWorkType, filterStatus, filterDateFrom, filterDateTo]);

    // Remove the filter effect since we now fetch with filters
    // useEffect(() => {
    //     filterAttendanceData();
    // }, [...]);

    // Simplified - no more client-side filtering
    useEffect(() => {
        setFilteredHistory(attendanceHistory);
    }, [attendanceHistory]);

    // Simplified - no more client-side filtering needed since backend handles it
    useEffect(() => {
        setFilteredHistory(attendanceHistory);
    }, [attendanceHistory]);

    // Auto-detect work type setelah location tersedia
    // Untuk check-in: belum check-in
    // Untuk check-out: sudah check-in tapi belum check-out
    useEffect(() => {
        if (location) {
            // Detect untuk check-in (belum check-in)
            if (!todayAttendance?.check_in_time) {
                detectWorkType();
            }
            // Detect untuk check-out (sudah check-in, belum check-out)
            else if (
                todayAttendance?.check_in_time &&
                !todayAttendance?.check_out_time
            ) {
                detectWorkType();
            }
        }
    }, [location, todayAttendance]);

    const detectWorkType = async () => {
        try {
            setIsDetectingWorkType(true);

            // GPS opsional - WiFi/IP sebagai prioritas utama
            const payload = {};
            if (location) {
                payload.latitude = location.latitude;
                payload.longitude = location.longitude;
            }

            const response = await axiosInstance.post(
                "/user/attendance/pre-check",
                payload
            );

            setWorkTypeDetection(response.data);
            console.log("[Work Type Detected]", response.data);

            // Show notification based on work type (only once)
            if (!hasShownWorkTypeToast) {
                if (response.data.isOnsite) {
                    toast.success(
                        `🏢 ONSITE detected: ${response.data.reason}`,
                        {
                            duration: 4000,
                            id: "work-type-detection",
                        }
                    );
                } else {
                    toast(`📍 OFFSITE detected: ${response.data.reason}`, {
                        icon: "⚠️",
                        duration: 5000,
                        id: "work-type-detection",
                    });
                }
                setHasShownWorkTypeToast(true);
            }
        } catch (error) {
            console.error("Detect work type error:", error);
            const errorMsg =
                error.response?.data?.message || "Gagal mendeteksi tipe absen";
            toast.error(errorMsg, { id: "detect-error" });
        } finally {
            setIsDetectingWorkType(false);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation tidak didukung di browser Anda");
            toast.error("Browser tidak support GPS");
            return;
        }

        toast.loading("Mendeteksi lokasi...", { id: "location" });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                };
                setLocation(coords);
                setLocationError(null);
                toast.success(
                    `Lokasi terdeteksi (±${Math.round(coords.accuracy)}m)`,
                    {
                        id: "location",
                    }
                );
            },
            (error) => {
                let errorMsg = "Gagal mendapatkan lokasi";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg =
                            "Akses lokasi ditolak. Mohon izinkan akses GPS.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = "Informasi lokasi tidak tersedia";
                        break;
                    case error.TIMEOUT:
                        errorMsg = "Request lokasi timeout";
                        break;
                }
                setLocationError(errorMsg);
                toast.error(errorMsg, { id: "location" });
                console.error("Geolocation error:", error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const fetchAttendanceData = async () => {
        try {
            setLoading(true);
            // Fetch today's attendance (no pagination needed)
            const todayRes = await axiosInstance.get("/user/attendance/today");
            const todayData = todayRes.data.data || todayRes.data;
            setTodayAttendance(todayData);

            // Debug checkout offsite reason
            if (todayData && todayData.check_out_time) {
                console.log("[Today Attendance Debug]", {
                    hasCheckout: !!todayData.check_out_time,
                    checkoutOffsiteReason: todayData.checkout_offsite_reason,
                    checkoutPhoto: todayData.check_out_photo,
                    allData: todayData,
                });
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
            toast.error("Gagal memuat data presensi");
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeSettings = async () => {
        try {
            const response = await axiosInstance.get("/user/settings/time-validation");
            setTimeSettings(response.data.data);
        } catch (error) {
            console.error("Error fetching time settings:", error);
            // Non-critical, just log it
        }
    };

    const fetchAttendanceHistory = async () => {
        try {
            setHistoryLoading(true);
            const params = {
                page,
                limit: 20, // Show 20 records per page
            };

            // Apply filters
            if (filterWorkType && filterWorkType !== "all")
                params.work_type = filterWorkType;
            if (filterStatus && filterStatus !== "all")
                params.status = filterStatus;
            if (filterDateFrom) params.date_from = filterDateFrom;
            if (filterDateTo) params.date_to = filterDateTo;

            const historyRes = await axiosInstance.get("/user/attendance", {
                params,
            });
            setAttendanceHistory(historyRes.data.data || historyRes.data || []);
            setPagination(historyRes.data.pagination);
        } catch (error) {
            console.error("Error fetching attendance history:", error);
            toast.error("Gagal memuat riwayat presensi");
        } finally {
            setHistoryLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("File harus berupa gambar", { id: "photo-validation" });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB", { id: "photo-validation" });
            return;
        }

        setPhotoFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleCheckIn = async () => {
        // GPS tidak mandatory - prioritas WiFi/IP
        if (!location && !workTypeDetection) {
            toast("Mengambil lokasi GPS (opsional)...", {
                icon: "📍",
                id: "gps-optional",
            });
            getCurrentLocation();
            // Auto-detect setelah get location
            return;
        }

        if (!workTypeDetection) {
            toast.loading("Mendeteksi tipe absen...", { id: "detecting-type" });
            await detectWorkType();
            return;
        }

        // ========== VALIDATION OFFSITE ==========
        // OFFSITE wajib foto + keterangan
        if (!workTypeDetection.isOnsite) {
            if (!offsiteReason.trim()) {
                toast.error("Keterangan wajib diisi untuk absen OFFSITE", {
                    id: "offsite-validation",
                });
                return;
            }
            if (offsiteReason.length > 1000) {
                toast.error("Keterangan maksimal 1000 karakter", {
                    id: "offsite-validation",
                });
                return;
            }
            if (!photoFile) {
                toast.error("Foto wajib diunggah untuk absen OFFSITE", {
                    id: "offsite-validation",
                });
                return;
            }
        }

        // ========== VALIDATION ONSITE ==========
        // ONSITE tidak perlu foto/keterangan - langsung check-in

        try {
            setIsProcessing(true);

            const formData = new FormData();

            // GPS opsional
            if (location) {
                formData.append("latitude", location.latitude);
                formData.append("longitude", location.longitude);
            }

            // Hanya kirim keterangan dan foto jika OFFSITE
            if (!workTypeDetection.isOnsite) {
                formData.append("offsite_reason", offsiteReason);
                formData.append("photo", photoFile);
            }

            const response = await axiosInstance.post(
                "/user/attendance/check-in",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const workType =
                response.data.data?.work_type || workTypeDetection.workType;
            
            // Show success with time validation info
            const timeValidation = response.data.data?.time_validation;
            let successMessage = `✅ Check-in berhasil (${workType.toUpperCase()})!`;
            
            if (timeValidation) {
                if (timeValidation.is_late) {
                    successMessage += `\n⚠️ Terlambat ${timeValidation.late_minutes} menit`;
                } else if (timeValidation.status === "on_time") {
                    successMessage += "\n✅ Tepat waktu";
                }
            }
            
            toast.success(successMessage, {
                duration: 5000,
                id: "check-in-success",
            });

            // Reset form
            setOffsiteReason("");
            setPhotoFile(null);
            setPhotoPreview(null);
            setWorkTypeDetection(null);
            setHasShownWorkTypeToast(false);

            fetchAttendanceData();
            fetchAttendanceHistory();
        } catch (error) {
            console.error("Check-in error:", error);
            const errorData = error.response?.data;
            const errorMsg = errorData?.message || "Check-in gagal";
            
            // Handle time validation errors specifically
            if (errorData?.validation) {
                const validation = errorData.validation;
                
                if (validation.status === "too_early") {
                    toast.error(
                        <div>
                            <strong>⏰ {errorMsg}</strong>
                            <br />
                            <small>
                                Check-in dibuka mulai pukul{" "}
                                {validation.details?.check_in_start} WIB
                            </small>
                        </div>,
                        {
                            id: "check-in-error",
                            duration: 6000,
                        }
                    );
                } else if (validation.status === "too_late") {
                    toast.error(
                        <div>
                            <strong>⏰ {errorMsg}</strong>
                            <br />
                            <small>
                                Waktu check-in sudah ditutup (pukul{" "}
                                {validation.details?.check_in_end} WIB).
                                <br />
                                Silakan hubungi admin atau supervisor Anda.
                            </small>
                        </div>,
                        {
                            id: "check-in-error",
                            duration: 8000,
                        }
                    );
                } else {
                    toast.error(errorMsg, { id: "check-in-error" });
                }
            } else {
                toast.error(errorMsg, { id: "check-in-error" });
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCheckOut = async () => {
        // GPS tidak mandatory - prioritas WiFi/IP
        if (!location && !workTypeDetection) {
            toast("Mengambil lokasi GPS (opsional)...", {
                icon: "📍",
                id: "gps-optional",
            });
            getCurrentLocation();
            return;
        }

        // Detect work type untuk check-out (bisa berbeda dari check-in)
        if (!workTypeDetection) {
            toast.loading("Mendeteksi tipe absen...", { id: "detecting-type" });
            await detectWorkType();
            return;
        }

        // ========== VALIDATION OFFSITE ==========
        // Check-out OFFSITE wajib foto + keterangan (meski check-in ONSITE)
        if (!workTypeDetection.isOnsite) {
            if (!offsiteReason.trim()) {
                toast.error("Keterangan wajib diisi untuk check-out OFFSITE", {
                    id: "offsite-validation",
                });
                return;
            }
            if (offsiteReason.length > 1000) {
                toast.error("Keterangan maksimal 1000 karakter", {
                    id: "offsite-validation",
                });
                return;
            }
            if (!photoFile) {
                toast.error("Foto wajib diunggah untuk check-out OFFSITE", {
                    id: "offsite-validation",
                });
                return;
            }
        }

        // ========== VALIDATION ONSITE ==========
        // Check-out ONSITE tidak perlu foto/keterangan

        try {
            setIsProcessing(true);

            const formData = new FormData();

            // GPS opsional
            if (location) {
                formData.append("latitude", location.latitude);
                formData.append("longitude", location.longitude);
                if (location.address) {
                    formData.append("address", location.address);
                }
            }

            // Hanya kirim keterangan dan foto jika OFFSITE
            if (!workTypeDetection.isOnsite) {
                formData.append("offsite_reason", offsiteReason);
                formData.append("photo", photoFile);
            }

            // Debug FormData
            console.log("[Check-out FormData]", {
                hasLocation: !!location,
                latitude: location?.latitude,
                longitude: location?.longitude,
                address: location?.address,
                isOffsite: !workTypeDetection.isOnsite,
                hasPhoto: !!photoFile,
                hasReason: !!offsiteReason,
            });

            const response = await axiosInstance.post(
                "/user/attendance/check-out",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const workType =
                response.data.data?.work_type || workTypeDetection.workType;
            const workHours = response.data.data?.work_hours || "0";
            const timeValidation = response.data.data?.time_validation;
            
            // Build success message with time validation info
            let successMessage = `✅ Check-out berhasil (${workType.toUpperCase()})!\nJam kerja: ${workHours} jam`;
            
            if (timeValidation) {
                if (timeValidation.status === "early" && timeValidation.early_minutes > 0) {
                    successMessage += `\n⚠️ Pulang ${timeValidation.early_minutes} menit lebih awal`;
                    if (timeValidation.should_work_until) {
                        successMessage += `\n(Seharusnya sampai ${timeValidation.should_work_until} WIB)`;
                    }
                } else if (timeValidation.status === "overtime") {
                    successMessage += "\n⏰ Lembur (melewati batas waktu normal)";
                } else if (timeValidation.status === "on_time") {
                    successMessage += "\n✅ Tepat waktu";
                }
            }
            
            toast.success(successMessage, {
                duration: 6000,
                id: "check-out-success",
            });

            // Reset form
            setOffsiteReason("");
            setPhotoFile(null);
            setPhotoPreview(null);
            setWorkTypeDetection(null);
            setHasShownWorkTypeToast(false);

            fetchAttendanceData();
            fetchAttendanceHistory();
        } catch (error) {
            console.error("Check-out error:", error);
            console.error("Error response:", error.response?.data);
            const errorData = error.response?.data;
            const errorMsg = errorData?.message || "Check-out gagal";

            // Handle time validation errors specifically
            if (errorData?.validation) {
                const validation = errorData.validation;
                
                if (validation.status === "too_early") {
                    toast.error(
                        <div>
                            <strong>⏰ {errorMsg}</strong>
                            <br />
                            <small>
                                Waktu check-out mulai pukul{" "}
                                {validation.can_checkout_at} WIB
                                <br />
                                ⏳ Tunggu {validation.wait_minutes} menit lagi
                            </small>
                        </div>,
                        {
                            id: "check-out-error",
                            duration: 8000,
                        }
                    );
                } else {
                    toast.error(errorMsg, { id: "check-out-error" });
                }
            }
            // Special handling for logbook validation
            else if (errorMsg.includes("logbook")) {
                toast.error(
                    <div>
                        <strong>{errorMsg}</strong>
                        <br />
                        <small>
                            Silakan ke menu Logbook untuk mengisi aktivitas hari
                            ini.
                        </small>
                    </div>,
                    {
                        id: "check-out-error",
                        duration: 6000,
                    }
                );
            } else {
                toast.error(errorMsg, { id: "check-out-error" });
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (time) => {
        if (!time) return "-";
        return time;
    };

    const getStatusBadge = (status) => {
        const badges = {
            present: "success",
            late: "warning",
            early: "info",
            absent: "danger",
        };
        return badges[status] || "secondary";
    };

    const getWorkTypeBadge = (workType) => {
        return workType === "onsite" ? "primary" : "warning";
    };

    // Calculate late threshold dynamically from settings
    const getLateThreshold = () => {
        if (!timeSettings) return null;
        
        const workStart = timeSettings.working_hours.start; // e.g., "08:00"
        const tolerance = timeSettings.check_in.late_tolerance_minutes; // e.g., 15
        
        // Parse working hours start
        const [hours, minutes] = workStart.split(':').map(Number);
        
        // Add tolerance to get late threshold
        const totalMinutes = hours * 60 + minutes + tolerance;
        const lateHours = Math.floor(totalMinutes / 60);
        const lateMinutes = totalMinutes % 60;
        
        return `${String(lateHours).padStart(2, '0')}:${String(lateMinutes).padStart(2, '0')}`;
    };

    // Loading state
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

    // Main render
    return (
        <div className="user-attendance p-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <i className="bi bi-calendar-check me-2"></i>
                        Presensi Saya
                    </h2>
                    <p className="text-muted mb-0">
                        <i className="bi bi-calendar3 me-2"></i>
                        {new Date().toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>
                {todayAttendance?.check_in_time && (
                    <div className="text-end">
                        <span
                            className={`badge bg-${getWorkTypeBadge(
                                todayAttendance.work_type
                            )} fs-6 px-3 py-2`}
                        >
                            <i className="bi bi-geo-alt-fill me-2"></i>
                            {todayAttendance.work_type?.toUpperCase() || "N/A"}
                        </span>
                    </div>
                )}
            </div>

            {/* Time Settings Info Banner */}
            {timeSettings && (
                <>
                    {/* Current Time Display */}
                    <div className="alert alert-primary border-0 shadow-sm mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                                <i className="bi bi-clock-fill fs-3 me-3"></i>
                                <div>
                                    <strong className="d-block">Waktu Saat Ini</strong>
                                    <h4 className="mb-0">
                                        {currentTime.toLocaleTimeString('id-ID', { 
                                            hour: '2-digit', 
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false 
                                        })} WIB
                                    </h4>
                                </div>
                            </div>
                            <div className="text-end">
                                {(() => {
                                    const now = currentTime;
                                    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    
                                    // Check-in status
                                    if (!todayAttendance?.check_in_time) {
                                        if (currentTimeStr < timeSettings.check_in.start_time) {
                                            return (
                                                <span className="badge bg-warning text-dark px-3 py-2">
                                                    <i className="bi bi-hourglass-split me-2"></i>
                                                    Check-in belum dibuka
                                                </span>
                                            );
                                        } else if (currentTimeStr >= timeSettings.check_in.start_time && currentTimeStr <= timeSettings.check_in.end_time) {
                                            return (
                                                <span className="badge bg-success px-3 py-2">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Window Check-in BUKA
                                                </span>
                                            );
                                        } else {
                                            return (
                                                <span className="badge bg-danger px-3 py-2">
                                                    <i className="bi bi-x-circle me-2"></i>
                                                    Window Check-in TUTUP
                                                </span>
                                            );
                                        }
                                    }
                                    // Check-out status
                                    else if (!todayAttendance?.check_out_time) {
                                        if (currentTimeStr < timeSettings.check_out.start_time) {
                                            return (
                                                <span className="badge bg-warning text-dark px-3 py-2">
                                                    <i className="bi bi-hourglass-split me-2"></i>
                                                    Check-out belum dibuka
                                                </span>
                                            );
                                        } else if (currentTimeStr >= timeSettings.check_out.start_time) {
                                            return (
                                                <span className="badge bg-success px-3 py-2">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Bisa Check-out sekarang
                                                </span>
                                            );
                                        }
                                    } else {
                                        return (
                                            <span className="badge bg-info px-3 py-2">
                                                <i className="bi bi-check-all me-2"></i>
                                                Presensi Hari Ini Selesai
                                            </span>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="alert alert-info border-0 shadow-sm mb-4">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="d-flex align-items-start">
                                    <i className="bi bi-clock-history fs-4 me-3 text-info"></i>
                                    <div className="flex-grow-1">
                                        <strong className="d-block mb-2">
                                            <i className="bi bi-box-arrow-in-right me-2"></i>
                                            Jadwal Check-in
                                        </strong>
                                        <div className="mb-2">
                                            <span className="badge bg-success me-2 px-3 py-2">
                                                <i className="bi bi-unlock me-1"></i>
                                                Buka: {timeSettings.check_in.start_time}
                                            </span>
                                            <span className="badge bg-danger px-3 py-2">
                                                <i className="bi bi-lock me-1"></i>
                                                Tutup: {timeSettings.check_in.end_time}
                                            </span>
                                        </div>
                                        <div className="small">
                                            <div className="text-muted mb-1">
                                                <i className="bi bi-hourglass-split me-2"></i>
                                                <strong>Jam Kerja:</strong> {timeSettings.working_hours.start} WIB
                                            </div>
                                            <div className="text-muted mb-1">
                                                <i className="bi bi-clock me-2"></i>
                                                <strong>Toleransi:</strong> {timeSettings.check_in.late_tolerance_minutes} menit
                                            </div>
                                            <div className="text-warning">
                                                <i className="bi bi-exclamation-triangle me-2"></i>
                                                <strong>Dianggap Terlambat:</strong> Setelah {getLateThreshold()} WIB
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="d-flex align-items-start">
                                    <i className="bi bi-clock fs-4 me-3 text-primary"></i>
                                    <div className="flex-grow-1">
                                        <strong className="d-block mb-2">
                                            <i className="bi bi-box-arrow-right me-2"></i>
                                            Jadwal Check-out
                                        </strong>
                                        <div className="mb-2">
                                            <span className="badge bg-success me-2 px-3 py-2">
                                                <i className="bi bi-unlock me-1"></i>
                                                Buka: {timeSettings.check_out.start_time}
                                            </span>
                                            <span className="badge bg-warning text-dark px-3 py-2">
                                                <i className="bi bi-hourglass-split me-1"></i>
                                                Normal: {timeSettings.check_out.end_time}
                                            </span>
                                        </div>
                                        <div className="small">
                                            <div className="text-muted mb-1">
                                                <i className="bi bi-sunset me-2"></i>
                                                <strong>Jam Pulang:</strong> {timeSettings.working_hours.end} WIB
                                            </div>
                                            <div className="text-info">
                                                <i className="bi bi-info-circle me-2"></i>
                                                <strong>Catatan:</strong> Wajib isi logbook sebelum checkout
                                            </div>
                                            <div className="text-danger">
                                                <i className="bi bi-x-circle me-2"></i>
                                                <strong>Diblokir:</strong> Sebelum {timeSettings.check_out.start_time} WIB
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Quick Status Summary Cards */}
            {todayAttendance?.check_in_time && (
                <div className="row g-3 mb-4">
                    <div className="col-md-4">
                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                background:
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                            }}
                        >
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                                        <i className="bi bi-box-arrow-in-right fs-4 text-white"></i>
                                    </div>
                                    <div>
                                        <small className="opacity-75 d-block">
                                            Check-in
                                        </small>
                                        <h4 className="mb-0 fw-bold">
                                            {formatTime(
                                                todayAttendance.check_in_time
                                            )}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                background: todayAttendance.check_out_time
                                    ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                                    : "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                                color: todayAttendance.check_out_time
                                    ? "white"
                                    : "#333",
                            }}
                        >
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                                        <i
                                            className={`bi bi-box-arrow-right fs-4 ${
                                                todayAttendance.check_out_time
                                                    ? "text-white"
                                                    : "text-dark"
                                            }`}
                                        ></i>
                                    </div>
                                    <div>
                                        <small
                                            className={
                                                todayAttendance.check_out_time
                                                    ? "opacity-75 d-block"
                                                    : "d-block"
                                            }
                                        >
                                            Check-out
                                        </small>
                                        <h4 className="mb-0 fw-bold">
                                            {formatTime(
                                                todayAttendance.check_out_time
                                            ) || "Belum"}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                background:
                                    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                                color: "#333",
                            }}
                        >
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-white bg-opacity-50 p-3 me-3">
                                        <i className="bi bi-clock-history fs-4"></i>
                                    </div>
                                    <div>
                                        <small className="d-block">
                                            Status
                                        </small>
                                        <h4 className="mb-0 fw-bold text-capitalize">
                                            {todayAttendance.status ||
                                                "Present"}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Location Status Card with Enhanced Design */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div
                            className={`card-header border-0 text-white ${
                                location ? "bg-success" : "bg-danger"
                            }`}
                        >
                            <div className="d-flex align-items-center justify-content-between">
                                <h5 className="mb-0">
                                    <i
                                        className={`bi ${
                                            location
                                                ? "bi-geo-alt-fill"
                                                : "bi-geo-alt"
                                        } me-2`}
                                    ></i>
                                    {location ? (
                                        <>
                                            <span style={{ fontSize: "1.2em" }}>
                                                📍
                                            </span>{" "}
                                            Lokasi Terdeteksi
                                        </>
                                    ) : (
                                        <>
                                            <span style={{ fontSize: "1.2em" }}>
                                                ⚠️
                                            </span>{" "}
                                            Lokasi Tidak Terdeteksi
                                        </>
                                    )}
                                </h5>
                                <button
                                    className={`btn ${
                                        location
                                            ? "btn-light"
                                            : "btn-outline-light"
                                    } btn-sm`}
                                    onClick={getCurrentLocation}
                                    disabled={isProcessing}
                                >
                                    <i className="bi bi-arrow-clockwise me-1"></i>
                                    {isProcessing
                                        ? "Detecting..."
                                        : "Refresh GPS"}
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            {location ? (
                                <div>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                                    <i className="bi bi-geo text-success fs-4"></i>
                                                </div>
                                                <div>
                                                    <small className="text-muted d-block">
                                                        Koordinat GPS
                                                    </small>
                                                    <strong className="text-success">
                                                        {location.latitude.toFixed(
                                                            6
                                                        )}
                                                        ,{" "}
                                                        {location.longitude.toFixed(
                                                            6
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                                                    <i className="bi bi-check-circle text-info fs-4"></i>
                                                </div>
                                                <div>
                                                    <small className="text-muted d-block">
                                                        Status Deteksi
                                                    </small>
                                                    <strong className="text-info">
                                                        Lokasi Valid & Akurat
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {isDetectingWorkType && (
                                        <div className="alert alert-info mt-3 mb-0 d-flex align-items-center">
                                            <div
                                                className="spinner-border spinner-border-sm me-3"
                                                role="status"
                                            ></div>
                                            <div>
                                                <strong>
                                                    Sedang mendeteksi tipe
                                                    presensi...
                                                </strong>
                                                <small className="d-block">
                                                    Memverifikasi apakah Anda
                                                    berada di area kantor atau
                                                    offsite
                                                </small>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="alert alert-danger d-flex align-items-center mb-0">
                                    <i className="bi bi-exclamation-triangle-fill fs-3 me-3"></i>
                                    <div>
                                        <strong>GPS Tidak Terdeteksi</strong>
                                        <p className="mb-0 small mt-1">
                                            {locationError ||
                                                "Pastikan GPS/lokasi aktif dan izin lokasi telah diberikan. Klik tombol 'Refresh GPS' untuk mencoba lagi."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Work Type Detection Card - Enhanced Design */}
            {workTypeDetection &&
                location &&
                !todayAttendance?.check_in_time && (
                    <div className="row mb-4">
                        <div className="col-12">
                            <div
                                className={`card border-0 shadow-lg ${
                                    workTypeDetection.isOnsite
                                        ? "border-start border-primary border-5"
                                        : "border-start border-warning border-5"
                                }`}
                            >
                                <div
                                    className={`card-header border-0 ${
                                        workTypeDetection.isOnsite
                                            ? "bg-primary"
                                            : "bg-warning"
                                    } bg-opacity-10`}
                                >
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <div
                                                className={`rounded-circle ${
                                                    workTypeDetection.isOnsite
                                                        ? "bg-primary"
                                                        : "bg-warning"
                                                } bg-opacity-20 p-3 me-3`}
                                            >
                                                <i
                                                    className={`bi ${
                                                        workTypeDetection.isOnsite
                                                            ? "bi-building text-primary"
                                                            : "bi-house-door text-warning"
                                                    } fs-3`}
                                                ></i>
                                            </div>
                                            <div>
                                                <h5 className="mb-0">
                                                    {workTypeDetection.isOnsite ? (
                                                        <>
                                                            🏢 Presensi ONSITE
                                                            Terdeteksi
                                                        </>
                                                    ) : (
                                                        <>
                                                            🏠 Presensi OFFSITE
                                                            Terdeteksi
                                                        </>
                                                    )}
                                                </h5>
                                                <small className="text-muted">
                                                    Sistem otomatis menentukan
                                                    tipe berdasarkan lokasi Anda
                                                </small>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => {
                                                setHasShownWorkTypeToast(false);
                                                detectWorkType();
                                            }}
                                            disabled={isDetectingWorkType}
                                        >
                                            <i className="bi bi-arrow-clockwise me-1"></i>
                                            Re-detect
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <div
                                                className={`p-3 rounded ${
                                                    workTypeDetection.isOnsite
                                                        ? "bg-primary"
                                                        : "bg-warning"
                                                } bg-opacity-10`}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <i
                                                        className={`bi bi-circle-fill ${
                                                            workTypeDetection.isOnsite
                                                                ? "text-primary"
                                                                : "text-warning"
                                                        } me-2`}
                                                    ></i>
                                                    <div>
                                                        <small className="text-muted d-block">
                                                            Tipe Presensi
                                                        </small>
                                                        <strong className="fs-5">
                                                            {workTypeDetection.workType?.toUpperCase()}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="p-3 rounded bg-light">
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-info-circle-fill text-info me-2"></i>
                                                    <div>
                                                        <small className="text-muted d-block">
                                                            Alasan
                                                        </small>
                                                        <strong
                                                            className="text-truncate d-block"
                                                            style={{
                                                                maxWidth:
                                                                    "200px",
                                                            }}
                                                        >
                                                            {workTypeDetection.reason ||
                                                                "-"}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ONSITE Info */}
                                    {workTypeDetection.isOnsite ? (
                                        <div className="alert alert-success d-flex align-items-start mb-0">
                                            <i className="bi bi-check-circle-fill fs-4 me-3"></i>
                                            <div>
                                                <strong className="d-block mb-2">
                                                    <span
                                                        style={{
                                                            fontSize: "1.2em",
                                                        }}
                                                    >
                                                        ✅
                                                    </span>{" "}
                                                    Presensi ONSITE
                                                </strong>
                                                <ul className="mb-0 ps-3">
                                                    <li>
                                                        Anda berada di area
                                                        kantor
                                                    </li>
                                                    <li>
                                                        Tidak perlu upload foto
                                                        atau keterangan
                                                    </li>
                                                    <li>
                                                        Klik tombol check-in
                                                        untuk melanjutkan
                                                    </li>
                                                </ul>
                                                {workTypeDetection.office && (
                                                    <small className="d-block mt-2 text-muted">
                                                        <i className="bi bi-building me-1"></i>
                                                        Kantor:{" "}
                                                        <strong>
                                                            {
                                                                workTypeDetection
                                                                    .office.name
                                                            }
                                                        </strong>
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="alert alert-warning d-flex align-items-start mb-0">
                                            <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                                            <div>
                                                <strong className="d-block mb-2">
                                                    <span
                                                        style={{
                                                            fontSize: "1.2em",
                                                        }}
                                                    >
                                                        ⚠️
                                                    </span>{" "}
                                                    Presensi OFFSITE
                                                </strong>
                                                <ul className="mb-0 ps-3">
                                                    <li>
                                                        Anda berada di luar area
                                                        kantor
                                                    </li>
                                                    <li>
                                                        <strong className="text-danger">
                                                            WAJIB
                                                        </strong>{" "}
                                                        mengisi
                                                        keterangan/alasan
                                                    </li>
                                                    <li>
                                                        <strong className="text-danger">
                                                            WAJIB
                                                        </strong>{" "}
                                                        upload foto untuk
                                                        verifikasi
                                                    </li>
                                                    <li>
                                                        Koordinat GPS akan
                                                        disimpan otomatis
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {/* Check-in/Check-out Card - Enhanced Design */}
            <div className="row mb-4">
                <div className="col-lg-8 mx-auto">
                    <div className="card border-0 shadow-lg">
                        <div
                            className={`card-header border-0 ${
                                todayAttendance?.check_in_time
                                    ? "bg-success"
                                    : "bg-primary"
                            } bg-opacity-10`}
                        >
                            <h5 className="mb-0">
                                {todayAttendance?.check_in_time ? (
                                    <>
                                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                                        Status Presensi Hari Ini
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-box-arrow-in-right text-primary me-2"></i>
                                        Form Check-in
                                    </>
                                )}
                            </h5>
                        </div>
                        <div className="card-body p-4">
                            {todayAttendance &&
                            todayAttendance.check_in_time ? (
                                <div>
                                    {/* Time Display */}
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <div
                                                className="p-4 rounded-3"
                                                style={{
                                                    background:
                                                        "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                                                }}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <div className="rounded-circle bg-success bg-opacity-20 p-3 me-3">
                                                        <i className="bi bi-box-arrow-in-right text-success fs-3"></i>
                                                    </div>
                                                    <div>
                                                        <small className="text-muted d-block">
                                                            Check-in Time
                                                        </small>
                                                        <h3 className="mb-0 text-success fw-bold">
                                                            {formatTime(
                                                                todayAttendance.check_in_time
                                                            )}
                                                        </h3>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div
                                                className="p-4 rounded-3"
                                                style={{
                                                    background:
                                                        todayAttendance.check_out_time
                                                            ? "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)"
                                                            : "linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)",
                                                }}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <div
                                                        className={`rounded-circle ${
                                                            todayAttendance.check_out_time
                                                                ? "bg-danger bg-opacity-20"
                                                                : "bg-secondary bg-opacity-20"
                                                        } p-3 me-3`}
                                                    >
                                                        <i
                                                            className={`bi bi-box-arrow-right ${
                                                                todayAttendance.check_out_time
                                                                    ? "text-danger"
                                                                    : "text-secondary"
                                                            } fs-3`}
                                                        ></i>
                                                    </div>
                                                    <div>
                                                        <small className="text-muted d-block">
                                                            Check-out Time
                                                        </small>
                                                        <h3
                                                            className={`mb-0 fw-bold ${
                                                                todayAttendance.check_out_time
                                                                    ? "text-danger"
                                                                    : "text-secondary"
                                                            }`}
                                                        >
                                                            {formatTime(
                                                                todayAttendance.check_out_time
                                                            ) || "Belum"}
                                                        </h3>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Check-in Info Section */}
                                    {(todayAttendance.offsite_reason ||
                                        todayAttendance.check_in_photo) && (
                                        <div className="mb-3">
                                            {todayAttendance.offsite_reason && (
                                                <div className="alert alert-warning border-warning">
                                                    <div className="d-flex align-items-start">
                                                        <i className="bi bi-info-circle-fill fs-5 me-3"></i>
                                                        <div className="flex-grow-1">
                                                            <strong className="d-block mb-2">
                                                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                                                Keterangan
                                                                Check-in
                                                                OFFSITE:
                                                            </strong>
                                                            <p
                                                                className="mb-0"
                                                                style={{
                                                                    whiteSpace:
                                                                        "pre-wrap",
                                                                }}
                                                            >
                                                                {
                                                                    todayAttendance.offsite_reason
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {todayAttendance.check_in_photo && (
                                                <div
                                                    className={
                                                        todayAttendance.offsite_reason
                                                            ? "text-center mt-2"
                                                            : "text-center"
                                                    }
                                                >
                                                    <img
                                                        src={getImageUrl(
                                                            todayAttendance.check_in_photo
                                                        )}
                                                        alt="Check-in Photo"
                                                        className="img-fluid rounded shadow"
                                                        style={{
                                                            maxHeight: "200px",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={() =>
                                                            window.open(
                                                                getImageUrl(
                                                                    todayAttendance.check_in_photo
                                                                ),
                                                                "_blank"
                                                            )
                                                        }
                                                        onError={(e) => {
                                                            e.target.onerror =
                                                                null;
                                                            e.target.src =
                                                                "https://via.placeholder.com/200x200?text=Foto+Tidak+Tersedia";
                                                        }}
                                                    />
                                                    <div className="text-muted small mt-1">
                                                        <i className="bi bi-camera-fill me-1"></i>
                                                        Foto Check-in{" "}
                                                        {todayAttendance.offsite_reason
                                                            ? "OFFSITE"
                                                            : ""}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Check-out Info Section */}
                                    {todayAttendance.check_out_time &&
                                        (todayAttendance.checkout_offsite_reason ||
                                            todayAttendance.check_out_photo) && (
                                            <div className="mb-3">
                                                {todayAttendance.checkout_offsite_reason && (
                                                    <div className="alert alert-danger border-danger bg-danger bg-opacity-10">
                                                        <div className="d-flex align-items-start">
                                                            <i className="bi bi-info-circle-fill fs-5 me-3 text-danger"></i>
                                                            <div className="flex-grow-1">
                                                                <strong className="d-block mb-2">
                                                                    <i className="bi bi-box-arrow-right me-2"></i>
                                                                    Keterangan
                                                                    Check-out
                                                                    OFFSITE:
                                                                </strong>
                                                                <p
                                                                    className="mb-0"
                                                                    style={{
                                                                        whiteSpace:
                                                                            "pre-wrap",
                                                                    }}
                                                                >
                                                                    {
                                                                        todayAttendance.checkout_offsite_reason
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {todayAttendance.check_out_photo && (
                                                    <div className="text-center mt-2">
                                                        <img
                                                            src={getImageUrl(
                                                                todayAttendance.check_out_photo
                                                            )}
                                                            alt="Check-out Photo"
                                                            className="img-fluid rounded shadow"
                                                            style={{
                                                                maxHeight:
                                                                    "200px",
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() =>
                                                                window.open(
                                                                    getImageUrl(
                                                                        todayAttendance.check_out_photo
                                                                    ),
                                                                    "_blank"
                                                                )
                                                            }
                                                            onError={(e) => {
                                                                e.target.onerror =
                                                                    null;
                                                                e.target.src =
                                                                    "https://via.placeholder.com/200x200?text=Foto+Tidak+Tersedia";
                                                            }}
                                                        />
                                                        <div className="text-muted small mt-1">
                                                            <i className="bi bi-camera-fill me-1"></i>
                                                            Foto Check-out{" "}
                                                            {todayAttendance.checkout_offsite_reason
                                                                ? "OFFSITE"
                                                                : ""}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    {/* Check-out Section */}
                                    {!todayAttendance.check_out_time && (
                                        <div>
                                            <hr className="my-4" />
                                            <h6 className="mb-3">
                                                <i className="bi bi-box-arrow-right me-2"></i>
                                                Form Check-out
                                            </h6>
                                            {/* Form OFFSITE Check-out */}
                                            {workTypeDetection &&
                                                !workTypeDetection.isOnsite && (
                                                    <div className="mb-4">
                                                        <div className="alert alert-warning d-flex align-items-center mb-3">
                                                            <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                                                            <div>
                                                                <strong>
                                                                    Check-out
                                                                    OFFSITE
                                                                    Terdeteksi
                                                                </strong>
                                                                <small className="d-block">
                                                                    Lengkapi
                                                                    form di
                                                                    bawah untuk
                                                                    melakukan
                                                                    check-out
                                                                </small>
                                                            </div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="form-label fw-semibold">
                                                                Keterangan
                                                                Check-out{" "}
                                                                <span className="text-danger">
                                                                    *
                                                                </span>
                                                            </label>
                                                            <textarea
                                                                className="form-control"
                                                                rows="5"
                                                                value={
                                                                    offsiteReason
                                                                }
                                                                onChange={(e) =>
                                                                    setOffsiteReason(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Contoh: Selesai meeting dengan klien di lokasi proyek..."
                                                                maxLength={1000}
                                                                style={{
                                                                    resize: "none",
                                                                    overflowY:
                                                                        "auto",
                                                                }}
                                                            ></textarea>
                                                            <div className="form-text">
                                                                <i className="bi bi-info-circle me-1"></i>
                                                                {
                                                                    offsiteReason.length
                                                                }
                                                                /1000 karakter
                                                            </div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="form-label fw-semibold">
                                                                Upload Foto{" "}
                                                                <span className="text-danger">
                                                                    *
                                                                </span>
                                                            </label>
                                                            <input
                                                                ref={
                                                                    fileInputRef
                                                                }
                                                                type="file"
                                                                className="form-control"
                                                                accept="image/*"
                                                                onChange={
                                                                    handlePhotoChange
                                                                }
                                                            />
                                                            <small className="text-muted">
                                                                Max 5MB, format:
                                                                JPG, PNG, WebP
                                                            </small>
                                                        </div>

                                                        {photoPreview && (
                                                            <div className="mb-3">
                                                                <img
                                                                    src={
                                                                        photoPreview
                                                                    }
                                                                    alt="Preview"
                                                                    className="img-thumbnail"
                                                                    style={{
                                                                        maxHeight:
                                                                            "200px",
                                                                        objectFit:
                                                                            "cover",
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                            <button
                                                className={`btn w-100 ${
                                                    workTypeDetection &&
                                                    !workTypeDetection.isOnsite
                                                        ? "btn-warning"
                                                        : "btn-danger"
                                                }`}
                                                onClick={handleCheckOut}
                                                disabled={
                                                    isProcessing ||
                                                    !location ||
                                                    !workTypeDetection ||
                                                    isDetectingWorkType
                                                }
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Processing...
                                                    </>
                                                ) : isDetectingWorkType ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Detecting...
                                                    </>
                                                ) : !workTypeDetection ? (
                                                    <>
                                                        <i className="bi bi-hourglass-split me-2"></i>
                                                        Menunggu Deteksi...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-box-arrow-right me-2"></i>
                                                        {workTypeDetection.isOnsite
                                                            ? "Check-out Sekarang (ONSITE)"
                                                            : "Submit Check-out OFFSITE"}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <h5 className="mb-3">
                                        <i className="bi bi-box-arrow-in-right me-2"></i>
                                        Check-in Sekarang
                                    </h5>

                                    {/* Form OFFSITE - hanya tampil jika detected OFFSITE */}
                                    {workTypeDetection &&
                                        !workTypeDetection.isOnsite && (
                                            <div className="mb-3">
                                                <div className="alert alert-warning border-warning">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                                                        <strong>
                                                            Absen OFFSITE
                                                            Detected
                                                        </strong>
                                                    </div>
                                                    <small>
                                                        Harap lengkapi
                                                        keterangan dan foto
                                                        untuk melanjutkan
                                                    </small>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold">
                                                        Keterangan{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        className="form-control"
                                                        rows="5"
                                                        placeholder="Alasan/keperluan absen di luar kantor..."
                                                        value={offsiteReason}
                                                        onChange={(e) =>
                                                            setOffsiteReason(
                                                                e.target.value
                                                            )
                                                        }
                                                        maxLength={1000}
                                                        style={{
                                                            resize: "none",
                                                            overflowY: "auto",
                                                        }}
                                                    ></textarea>
                                                    <div className="form-text">
                                                        <i className="bi bi-info-circle me-1"></i>
                                                        {offsiteReason.length}
                                                        /1000 karakter
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Upload Foto{" "}
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        className="form-control"
                                                        accept="image/*"
                                                        onChange={
                                                            handlePhotoChange
                                                        }
                                                    />
                                                    <small className="text-muted">
                                                        Max 5MB, format: JPG,
                                                        PNG, WebP
                                                    </small>
                                                </div>

                                                {photoPreview && (
                                                    <div className="mb-3">
                                                        <img
                                                            src={photoPreview}
                                                            alt="Preview"
                                                            className="img-thumbnail"
                                                            style={{
                                                                maxHeight:
                                                                    "200px",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    <button
                                        className={`btn w-100 ${
                                            workTypeDetection &&
                                            !workTypeDetection.isOnsite
                                                ? "btn-warning"
                                                : "btn-primary"
                                        }`}
                                        onClick={handleCheckIn}
                                        disabled={
                                            isProcessing ||
                                            !location ||
                                            !workTypeDetection ||
                                            isDetectingWorkType
                                        }
                                    >
                                        {isProcessing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Processing...
                                            </>
                                        ) : isDetectingWorkType ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Detecting...
                                            </>
                                        ) : !workTypeDetection ? (
                                            <>
                                                <i className="bi bi-hourglass-split me-2"></i>
                                                Menunggu Deteksi...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                                {workTypeDetection.isOnsite
                                                    ? "Check-in Sekarang (ONSITE)"
                                                    : "Submit Check-in OFFSITE"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                    <h5 className="mb-0">
                        <i className="bi bi-clock-history me-2"></i>
                        Riwayat Presensi
                    </h5>
                </div>

                {/* Filter Section */}
                <div className="card-body border-bottom">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label fw-semibold mb-2">
                                <i className="bi bi-building me-2"></i>Tipe
                                Kerja
                            </label>
                            <select
                                className="form-select"
                                value={filterWorkType}
                                onChange={(e) => {
                                    setFilterWorkType(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="all">Semua Tipe</option>
                                <option value="onsite">Onsite</option>
                                <option value="offsite">Offsite</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold mb-2">
                                <i className="bi bi-flag me-2"></i>Status
                            </label>
                            <select
                                className="form-select"
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="all">Semua Status</option>
                                <option value="present">Present</option>
                                <option value="late">Late</option>
                                <option value="early">Early Leave</option>
                                <option value="absent">Absent</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-semibold mb-2">
                                <i className="bi bi-calendar-range me-2"></i>
                                Dari
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={filterDateFrom}
                                onChange={(e) => {
                                    setFilterDateFrom(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-semibold mb-2">
                                <i className="bi bi-calendar-check me-2"></i>
                                Sampai
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={filterDateTo}
                                onChange={(e) => {
                                    setFilterDateTo(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="col-md-2">
                            <button
                                className="btn btn-outline-secondary w-100"
                                onClick={() => {
                                    setFilterWorkType("all");
                                    setFilterStatus("all");
                                    setFilterDateFrom("");
                                    setFilterDateTo("");
                                    setPage(1);
                                    toast.success("Filter direset");
                                }}
                            >
                                <i className="bi bi-x-circle me-2"></i>Reset
                            </button>
                        </div>
                    </div>
                    {(filterWorkType !== "all" ||
                        filterStatus !== "all" ||
                        filterDateFrom ||
                        filterDateTo) && (
                        <div className="mt-3">
                            <span className="badge bg-primary me-2">
                                <i className="bi bi-funnel-fill me-1"></i>
                                Filter aktif
                                {pagination &&
                                    `: ${pagination.total_records} data`}
                            </span>
                        </div>
                    )}
                </div>

                <div className="card-body p-0">
                    {historyLoading ? (
                        <div className="text-center py-5">
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>
                            <div className="mt-2 text-muted">
                                Memuat riwayat presensi...
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Check-in</th>
                                        <th>Check-out</th>
                                        <th>Tipe</th>
                                        <th>Status</th>
                                        <th>Keterangan</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.length > 0 ? (
                                        filteredHistory.map((item, index) => (
                                            <tr key={index}>
                                                <td>{formatDate(item.date)}</td>
                                                <td>
                                                    {formatTime(
                                                        item.check_in_time
                                                    )}
                                                </td>
                                                <td>
                                                    {formatTime(
                                                        item.check_out_time
                                                    )}
                                                </td>
                                                <td>
                                                    {item.work_type && (
                                                        <span
                                                            className={`badge bg-${getWorkTypeBadge(
                                                                item.work_type
                                                            )}`}
                                                        >
                                                            {item.work_type.toUpperCase()}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge bg-${getStatusBadge(
                                                            item.status
                                                        )}`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small
                                                        className="text-muted text-truncate d-inline-block"
                                                        style={{
                                                            maxWidth: "200px",
                                                        }}
                                                    >
                                                        {item.offsite_reason ||
                                                            item.notes ||
                                                            "-"}
                                                    </small>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-info"
                                                        onClick={() => {
                                                            setSelectedAttendance(
                                                                item
                                                            );
                                                            setShowDetailModal(
                                                                true
                                                            );
                                                        }}
                                                        title="Lihat Detail"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="text-center text-muted py-4"
                                            >
                                                {attendanceHistory.length === 0
                                                    ? "Belum ada riwayat presensi"
                                                    : "Tidak ada data yang sesuai dengan filter"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!historyLoading &&
                        pagination &&
                        pagination.total_pages > 1 && (
                            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                                <div className="text-muted small">
                                    Menampilkan{" "}
                                    {(page - 1) * pagination.limit + 1} -{" "}
                                    {Math.min(
                                        page * pagination.limit,
                                        pagination.total_records
                                    )}{" "}
                                    dari {pagination.total_records} data
                                </div>
                                <nav>
                                    <ul className="pagination mb-0">
                                        <li
                                            className={`page-item ${
                                                !pagination.has_prev
                                                    ? "disabled"
                                                    : ""
                                            }`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() =>
                                                    setPage(page - 1)
                                                }
                                                disabled={!pagination.has_prev}
                                            >
                                                <i className="bi bi-chevron-left"></i>
                                            </button>
                                        </li>
                                        {Array.from(
                                            {
                                                length: Math.min(
                                                    pagination.total_pages,
                                                    5
                                                ),
                                            },
                                            (_, i) => {
                                                let pageNum;
                                                if (
                                                    pagination.total_pages <= 5
                                                ) {
                                                    pageNum = i + 1;
                                                } else if (page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (
                                                    page >=
                                                    pagination.total_pages - 2
                                                ) {
                                                    pageNum =
                                                        pagination.total_pages -
                                                        4 +
                                                        i;
                                                } else {
                                                    pageNum = page - 2 + i;
                                                }
                                                return (
                                                    <li
                                                        key={pageNum}
                                                        className={`page-item ${
                                                            page === pageNum
                                                                ? "active"
                                                                : ""
                                                        }`}
                                                    >
                                                        <button
                                                            className="page-link"
                                                            onClick={() =>
                                                                setPage(pageNum)
                                                            }
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    </li>
                                                );
                                            }
                                        )}
                                        <li
                                            className={`page-item ${
                                                !pagination.has_next
                                                    ? "disabled"
                                                    : ""
                                            }`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() =>
                                                    setPage(page + 1)
                                                }
                                                disabled={!pagination.has_next}
                                            >
                                                <i className="bi bi-chevron-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedAttendance && (
                <div
                    className="modal show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target.className.includes("modal show")) {
                            setShowDetailModal(false);
                            setSelectedAttendance(null);
                        }
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg">
                            <div
                                className="modal-header bg-gradient"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    color: "white",
                                }}
                            >
                                <h5 className="modal-title">
                                    <i className="bi bi-calendar-check me-2"></i>
                                    Detail Presensi
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setSelectedAttendance(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div className="border rounded p-3 bg-light">
                                            <small className="text-muted d-block mb-1">
                                                <i className="bi bi-calendar-event me-2"></i>
                                                Tanggal
                                            </small>
                                            <strong className="fs-6">
                                                {formatDate(
                                                    selectedAttendance.date
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded p-3 bg-light">
                                            <small className="text-muted d-block mb-1">
                                                <i className="bi bi-building me-2"></i>
                                                Tipe
                                            </small>
                                            {selectedAttendance.work_type && (
                                                <span
                                                    className={`badge bg-${getWorkTypeBadge(
                                                        selectedAttendance.work_type
                                                    )} fs-6`}
                                                >
                                                    {selectedAttendance.work_type.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="border rounded p-3 bg-light">
                                            <small className="text-muted d-block mb-1">
                                                <i className="bi bi-flag me-2"></i>
                                                Status
                                            </small>
                                            <span
                                                className={`badge bg-${getStatusBadge(
                                                    selectedAttendance.status
                                                )} fs-6`}
                                            >
                                                {selectedAttendance.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Time Display Section */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <div
                                            className="border rounded p-3"
                                            style={{ background: "#e8f5e9" }}
                                        >
                                            <small className="text-muted d-block mb-1">
                                                <i className="bi bi-box-arrow-in-right me-2 text-success"></i>
                                                Check-in Time
                                            </small>
                                            <strong className="fs-4 text-success">
                                                {formatTime(
                                                    selectedAttendance.check_in_time
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div
                                            className="border rounded p-3"
                                            style={{ background: "#ffebee" }}
                                        >
                                            <small className="text-muted d-block mb-1">
                                                <i className="bi bi-box-arrow-right me-2 text-danger"></i>
                                                Check-out Time
                                            </small>
                                            <strong className="fs-4 text-danger">
                                                {formatTime(
                                                    selectedAttendance.check_out_time
                                                ) || "Belum Checkout"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {/* GPS Locations */}
                                <div className="row g-3 mb-4">
                                    {selectedAttendance.check_in_latitude &&
                                        selectedAttendance.check_in_longitude && (
                                            <div className="col-md-6">
                                                <label className="fw-semibold text-muted mb-2">
                                                    <i className="bi bi-geo-alt-fill me-2 text-success"></i>
                                                    Lokasi Check-in
                                                </label>
                                                <div className="border rounded p-2 bg-white small">
                                                    <i className="bi bi-pin-map-fill text-primary me-1"></i>
                                                    {
                                                        selectedAttendance.check_in_latitude
                                                    }
                                                    ,{" "}
                                                    {
                                                        selectedAttendance.check_in_longitude
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    {selectedAttendance.check_out_latitude &&
                                        selectedAttendance.check_out_longitude && (
                                            <div className="col-md-6">
                                                <label className="fw-semibold text-muted mb-2">
                                                    <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
                                                    Lokasi Check-out
                                                </label>
                                                <div className="border rounded p-2 bg-white small">
                                                    <i className="bi bi-pin-map-fill text-danger me-1"></i>
                                                    {
                                                        selectedAttendance.check_out_latitude
                                                    }
                                                    ,{" "}
                                                    {
                                                        selectedAttendance.check_out_longitude
                                                    }
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* Check-in OFFSITE Info */}
                                {(selectedAttendance.offsite_reason ||
                                    selectedAttendance.check_in_photo) && (
                                    <div className="mb-4 pb-3 border-bottom">
                                        <h6 className="text-success mb-3">
                                            <i className="bi bi-box-arrow-in-right me-2"></i>
                                            CHECK-IN INFORMATION{" "}
                                            {selectedAttendance.offsite_reason &&
                                                "(OFFSITE)"}
                                        </h6>
                                        {selectedAttendance.offsite_reason && (
                                            <div className="mb-3">
                                                <label className="fw-semibold text-muted mb-2">
                                                    <i className="bi bi-chat-left-text-fill me-2"></i>
                                                    Keterangan Check-in OFFSITE
                                                </label>
                                                <div className="border rounded p-3 bg-warning bg-opacity-10 border-warning">
                                                    <p
                                                        className="mb-0"
                                                        style={{
                                                            whiteSpace:
                                                                "pre-wrap",
                                                        }}
                                                    >
                                                        {
                                                            selectedAttendance.offsite_reason
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedAttendance.check_in_photo && (
                                            <div>
                                                <label className="fw-semibold text-muted mb-2">
                                                    <i className="bi bi-camera-fill me-2"></i>
                                                    Foto Check-in{" "}
                                                    {selectedAttendance.offsite_reason &&
                                                        "OFFSITE"}
                                                </label>
                                                <div className="text-center border rounded p-3 bg-white">
                                                    <img
                                                        src={getImageUrl(
                                                            selectedAttendance.check_in_photo
                                                        )}
                                                        alt="Check-in Photo"
                                                        className="img-fluid rounded shadow"
                                                        style={{
                                                            maxHeight: "300px",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={() =>
                                                            window.open(
                                                                getImageUrl(
                                                                    selectedAttendance.check_in_photo
                                                                ),
                                                                "_blank"
                                                            )
                                                        }
                                                        onError={(e) => {
                                                            e.target.onerror =
                                                                null;
                                                            e.target.src =
                                                                "https://via.placeholder.com/300x300?text=Foto+Tidak+Tersedia";
                                                        }}
                                                    />
                                                    <div className="text-muted small mt-2">
                                                        <i className="bi bi-info-circle me-1"></i>
                                                        Klik untuk memperbesar
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Check-out OFFSITE Info */}
                                {selectedAttendance.check_out_time &&
                                    (selectedAttendance.checkout_offsite_reason ||
                                        selectedAttendance.check_out_photo) && (
                                        <div className="mb-4 pb-3 border-bottom">
                                            <h6 className="text-danger mb-3">
                                                <i className="bi bi-box-arrow-right me-2"></i>
                                                CHECK-OUT INFORMATION{" "}
                                                {selectedAttendance.checkout_offsite_reason &&
                                                    "(OFFSITE)"}
                                            </h6>
                                            {selectedAttendance.checkout_offsite_reason && (
                                                <div className="mb-3">
                                                    <label className="fw-semibold text-muted mb-2">
                                                        <i className="bi bi-chat-left-text-fill me-2"></i>
                                                        Keterangan Check-out
                                                        OFFSITE
                                                    </label>
                                                    <div className="border rounded p-3 bg-danger bg-opacity-10 border-danger">
                                                        <p
                                                            className="mb-0"
                                                            style={{
                                                                whiteSpace:
                                                                    "pre-wrap",
                                                            }}
                                                        >
                                                            {
                                                                selectedAttendance.checkout_offsite_reason
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedAttendance.check_out_photo && (
                                                <div>
                                                    <label className="fw-semibold text-muted mb-2">
                                                        <i className="bi bi-camera-fill me-2"></i>
                                                        Foto Check-out{" "}
                                                        {selectedAttendance.checkout_offsite_reason &&
                                                            "OFFSITE"}
                                                    </label>
                                                    <div className="text-center border rounded p-3 bg-white">
                                                        <img
                                                            src={getImageUrl(
                                                                selectedAttendance.check_out_photo
                                                            )}
                                                            alt="Check-out Photo"
                                                            className="img-fluid rounded shadow"
                                                            style={{
                                                                maxHeight:
                                                                    "300px",
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() =>
                                                                window.open(
                                                                    getImageUrl(
                                                                        selectedAttendance.check_out_photo
                                                                    ),
                                                                    "_blank"
                                                                )
                                                            }
                                                            onError={(e) => {
                                                                e.target.onerror =
                                                                    null;
                                                                e.target.src =
                                                                    "https://via.placeholder.com/300x300?text=Foto+Tidak+Tersedia";
                                                            }}
                                                        />
                                                        <div className="text-muted small mt-2">
                                                            <i className="bi bi-info-circle me-1"></i>
                                                            Klik untuk
                                                            memperbesar
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                {selectedAttendance.notes && (
                                    <div className="mb-4">
                                        <label className="fw-semibold text-muted mb-2">
                                            <i className="bi bi-sticky me-2"></i>
                                            CATATAN
                                        </label>
                                        <div className="border rounded p-3 bg-white">
                                            <p
                                                className="mb-0"
                                                style={{
                                                    whiteSpace: "pre-wrap",
                                                }}
                                            >
                                                {selectedAttendance.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-light">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setSelectedAttendance(null);
                                    }}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
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

export default Attendance;
