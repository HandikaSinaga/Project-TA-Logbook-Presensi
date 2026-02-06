import express from "express";
import authMiddleware from "../middlewares/auth.js";
import roleCheck from "../middlewares/roleCheck.js";
import DashboardController from "../controllers/DashboardController.js";
import AttendanceController, {
    uploadAttendancePhoto,
} from "../controllers/AttendanceController.js";
import LogbookController from "../controllers/LogbookController.js";
import LeaveController from "../controllers/LeaveController.js";
import DivisionController from "../controllers/DivisionController.js";
import ProfileController from "../controllers/ProfileController.js";
import SettingsController from "../controllers/SettingsController.js";
import { uploadAvatar, uploadLeaveAttachment } from "../config/uploadConfig.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(roleCheck(["user", "supervisor", "admin"]));

// Dashboard
router.get("/dashboard", DashboardController.getUserDashboard);

// Attendance
router.get("/attendance", AttendanceController.getUserAttendance);
router.get("/attendance/today", AttendanceController.getTodayAttendance);
router.get("/attendance/recent", AttendanceController.getRecentAttendance);
router.post("/attendance/pre-check", AttendanceController.preCheckWorkType);
router.post(
    "/attendance/check-in",
    uploadAttendancePhoto,
    AttendanceController.checkIn,
);
router.post(
    "/attendance/check-out",
    uploadAttendancePhoto,
    AttendanceController.checkOut,
);

// Logbook
router.get("/logbook", LogbookController.getUserLogbooks);
router.get("/logbook/today", LogbookController.getTodayLogbook);
router.get("/logbook/recent", LogbookController.getRecentLogbooks);
router.post("/logbook", LogbookController.create);
router.get("/logbook/:id", LogbookController.getById);
router.put("/logbook/:id", LogbookController.update);
router.delete("/logbook/:id", LogbookController.delete);

// Izin (Leave)
router.get("/izin", LeaveController.getUserLeaves);
router.get("/izin/quota", LeaveController.getQuota);
router.get("/izin/pending", LeaveController.getUserPendingLeaves);
router.post("/izin", uploadLeaveAttachment, LeaveController.create);
router.get("/izin/:id", LeaveController.getById);
router.put("/izin/:id", LeaveController.update);
router.delete("/izin/:id", LeaveController.delete);

// Division
router.get("/division", DivisionController.getUserDivision);
router.get(
    "/divisions/my-division",
    DivisionController.getMyDivisionWithMembers,
);

// Profile
router.get("/profile", ProfileController.getProfile);
router.put("/profile", ProfileController.updateProfile);
router.put("/profile/password", ProfileController.changePassword);
router.post("/profile/avatar", uploadAvatar, ProfileController.uploadAvatar);

// Settings (read-only for users)
router.get("/settings", SettingsController.getSettings);
router.get(
    "/settings/time-validation",
    SettingsController.getTimeValidationSettings,
);

export default router;
