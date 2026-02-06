import express from "express";
import multer from "multer";
import authMiddleware from "../middlewares/auth.js";
import roleCheck from "../middlewares/roleCheck.js";
import DashboardController from "../controllers/DashboardController.js";
import UserController from "../controllers/UserController.js";
import DivisionController from "../controllers/DivisionController.js";
import LocationController from "../controllers/LocationController.js";
import AttendanceController from "../controllers/AttendanceController.js";
import ReportController from "../controllers/ReportController.js";
import SettingsController from "../controllers/SettingsController.js";
import OfficeNetworkController from "../controllers/OfficeNetworkController.js";
import LogbookController from "../controllers/LogbookController.js";
import LeaveController from "../controllers/LeaveController.js";
import ProfileController from "../controllers/ProfileController.js";
import { uploadAvatar } from "../config/uploadConfig.js";

const router = express.Router();

// Configure multer for Excel file uploads (in-memory)
const upload = multer({ storage: multer.memoryStorage() });

// Apply auth middleware and admin role check
router.use(authMiddleware);
router.use(roleCheck(["admin"]));

// Dashboard
router.get("/dashboard", DashboardController.getAdminDashboard);

// User Management
router.get("/users", UserController.getAll);
router.post("/users", UserController.create);

// User Import/Export - MUST be before /users/:id
router.get("/users/template/download", UserController.downloadImportTemplate);
router.get("/users/export", UserController.exportUsers);
router.post("/users/import", upload.single("file"), UserController.importUsers);

// User CRUD with :id param - MUST be after specific routes
router.get("/users/:id", UserController.getById);
router.put("/users/:id", UserController.update);
router.delete("/users/:id", UserController.delete);
router.put("/users/:id/toggle-status", UserController.toggleStatus);
router.put("/users/:id/reset-password", UserController.resetPassword);

// Division Management
router.get("/divisions", DivisionController.getAll);
router.post("/divisions", DivisionController.create);
router.get("/divisions/:id", DivisionController.getById);
router.put("/divisions/:id", DivisionController.update);
router.delete("/divisions/:id", DivisionController.delete);
router.get("/divisions/:id/members", DivisionController.getMembers);
router.put(
    "/divisions/:id/assign-users",
    DivisionController.assignUsersToDivision,
);

// Location Management
router.get("/locations", LocationController.getAll);
router.post("/locations", LocationController.create);
router.get("/locations/:id", LocationController.getById);
router.put("/locations/:id", LocationController.update);
router.delete("/locations/:id", LocationController.delete);

// Attendance Overview
router.get("/attendance", AttendanceController.getAllAttendance);
router.get("/attendances", AttendanceController.getAllAttendance); // alias
router.get("/attendance/today", AttendanceController.getTodayAllAttendance);
router.get("/attendance/export", AttendanceController.exportAttendance);

// Logbook Monitoring
router.get("/logbook", LogbookController.getAllLogbooks); // singular alias
router.get("/logbooks", LogbookController.getAllLogbooks);
router.put("/logbooks/:id/approve", LogbookController.approveLogbook);
router.put("/logbooks/:id/reject", LogbookController.rejectLogbook);

// Izin Monitoring
router.get("/izin", LeaveController.getAllLeaves); // singular alias
router.get("/leaves", LeaveController.getAllLeaves); // keep for backward compatibility
router.put("/izin/:id/approve", LeaveController.approve);
router.put("/izin/:id/reject", LeaveController.reject);

// Reports
router.get("/reports/attendance", ReportController.getAttendanceReport);
router.get("/reports/logbook", ReportController.getLogbookReport);
router.get("/reports/izin", ReportController.getLeaveReport);
router.get("/reports/summary", ReportController.getSummaryReport);
router.get("/reports/division", ReportController.getDivisionReport);

// Export Reports
router.get(
    "/reports/attendance/export",
    ReportController.exportAttendanceReport,
);
router.get("/reports/logbook/export", ReportController.exportLogbookReport);
router.get("/reports/izin/export", ReportController.exportLeaveReport);
router.get("/reports/summary/export", ReportController.exportSummaryReport);
router.get("/reports/division/export", ReportController.exportDivisionReport);
router.get("/reports/export", ReportController.exportReport);

// Settings
router.get("/settings", SettingsController.getSettings);
router.put("/settings", SettingsController.updateSettings);
router.get("/settings/system", SettingsController.getSystemInfo);
router.get(
    "/settings/time-validation",
    SettingsController.getTimeValidationSettings,
);

// Office Networks
router.get("/office-networks/active", OfficeNetworkController.getActive);
router.get("/office-networks", OfficeNetworkController.getAll);
router.post("/office-networks", OfficeNetworkController.create);
router.put("/office-networks/:id", OfficeNetworkController.update);
router.delete("/office-networks/:id", OfficeNetworkController.delete);

// Office Location Testing (Admin can test detection without user role)
router.post(
    "/office-networks/test-detection",
    AttendanceController.preCheckWorkType,
);

// Get current IP information
router.get("/office-networks/my-ip", (req, res) => {
    try {
        const clientIp =
            req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
            req.headers["x-real-ip"] ||
            req.socket.remoteAddress ||
            req.connection.remoteAddress;

        // Clean IPv6-mapped IPv4 addresses
        const cleanIp = clientIp.replace("::ffff:", "");

        // Suggest IP range based on IP class
        let suggestedRange = { start: "", end: "" };

        if (cleanIp !== "127.0.0.1" && cleanIp !== "::1") {
            const parts = cleanIp.split(".");
            if (parts.length === 4) {
                // Class C network suggestion
                suggestedRange.start = `${parts[0]}.${parts[1]}.${parts[2]}.1`;
                suggestedRange.end = `${parts[0]}.${parts[1]}.${parts[2]}.254`;
            }
        }

        res.json({
            success: true,
            data: {
                ip: cleanIp,
                suggestedRange,
                isLocal: cleanIp === "127.0.0.1" || cleanIp === "::1",
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Get IP error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mendeteksi IP",
        });
    }
});

// Profile Management (Admin can also edit their own profile)
router.get("/profile", ProfileController.getProfile);
router.put("/profile", ProfileController.updateProfile);
router.put("/profile/password", ProfileController.changePassword);
router.post("/profile/avatar", uploadAvatar, ProfileController.uploadAvatar);

export default router;
