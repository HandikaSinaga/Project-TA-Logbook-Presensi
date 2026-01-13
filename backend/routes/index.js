import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import supervisorRoutes from "./supervisorRoutes.js";
import adminRoutes from "./adminRoutes.js";
import ConfigController from "../controllers/ConfigController.js";

const router = express.Router();

// Public config endpoint (no auth required)
router.get("/config", ConfigController.getPublicConfig);

// Auth routes (no prefix - routes are accessed directly from /api)
router.use(authRoutes);

// User routes
router.use("/user", userRoutes);

// Supervisor routes
router.use("/supervisor", supervisorRoutes);

// Admin routes
router.use("/admin", adminRoutes);

export default router;
