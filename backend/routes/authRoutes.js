import express from "express";
import AuthController from "../controllers/AuthController.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/google-idtoken", AuthController.googleLogin);
router.get("/google", AuthController.googleAuth);
router.get("/google/callback", AuthController.googleCallback);

// Protected routes
router.post("/logout", authMiddleware, AuthController.logout);
router.get("/me", authMiddleware, AuthController.getCurrentUser);
router.post("/refresh", AuthController.refreshToken);

export default router;
