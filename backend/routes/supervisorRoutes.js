import express from "express";
import authMiddleware from "../middlewares/auth.js";
import roleCheck from "../middlewares/roleCheck.js";
import DashboardController from "../controllers/DashboardController.js";
import AttendanceController from "../controllers/AttendanceController.js";
import LogbookController from "../controllers/LogbookController.js";
import LeaveController from "../controllers/LeaveController.js";
import DivisionController from "../controllers/DivisionController.js";
import ProfileController from "../controllers/ProfileController.js";
import { uploadAvatar } from "../config/uploadConfig.js";

const router = express.Router();

// Apply auth middleware and supervisor role check
router.use(authMiddleware);
router.use(roleCheck(["supervisor", "admin"]));

// Dashboard
router.get("/dashboard", DashboardController.getSupervisorDashboard);

// Team Attendance (Monitoring & Approval)
router.get("/attendance", AttendanceController.getTeamAttendance);
router.get("/attendance/today", AttendanceController.getTeamTodayAttendance);
router.put("/attendance/:id/approve", AttendanceController.approveAttendance);
router.put("/attendance/:id/reject", AttendanceController.rejectAttendance);

// Team Logbook
router.get("/logbook", LogbookController.getTeamLogbooks);
router.get("/logbook/:id", LogbookController.getById);
router.put("/logbook/:id/approve", LogbookController.approveLogbook);
router.put("/logbook/:id/reject", LogbookController.rejectLogbook);
router.put("/logbook/:id/review", LogbookController.reviewLogbook);

// Izin Approvals
router.get("/izin", LeaveController.getTeamLeaves);
router.get("/izin/pending", LeaveController.getPendingLeaves);
router.put("/izin/:id/approve", LeaveController.approve);
router.put("/izin/:id/reject", LeaveController.reject);

// Division Management
router.get("/division", DivisionController.getSupervisorDivision);
router.get("/division/members", DivisionController.getDivisionMembers);
router.get("/division/available-users", DivisionController.getAvailableUsers);
router.post("/division/assign", DivisionController.assignUserToDivision);
router.post("/division/remove", DivisionController.removeUserFromDivision);

// Reports
router.get("/reports/attendance", AttendanceController.getAttendanceReport);
router.get("/reports/logbook", LogbookController.getLogbookReport);
router.get("/reports/izin", LeaveController.getLeaveReport);

// Profile Management
router.get("/profile", ProfileController.getProfile);
router.put("/profile", ProfileController.updateProfile);
router.put("/profile/password", ProfileController.changePassword);
router.post("/profile/avatar", uploadAvatar, ProfileController.uploadAvatar);

export default router;
