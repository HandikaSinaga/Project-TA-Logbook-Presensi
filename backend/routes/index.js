import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import supervisorRoutes from "./supervisorRoutes.js";
import adminRoutes from "./adminRoutes.js";
import ConfigController from "../controllers/ConfigController.js";
import {
    validateParamId,
    validateParamDate,
} from "../middlewares/inputValidator.js";

const router = express.Router();

// Apply Global Parameter Validation
// This will intercept ANY route using :id or :date
router.param("id", validateParamId);
router.param("date", validateParamDate);

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
