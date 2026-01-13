import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import models from "../models/index.js";
import { verifyGoogleToken } from "../middlewares/googleAuth.js";

const { User } = models;

class AuthController {
    // Login with email and password
    async login(req, res) {
        try {
            const { email, password, remember } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required",
                });
            }

            // Find user by email
            const user = await User.findOne({
                where: { email },
                attributes: [
                    "id",
                    "name",
                    "email",
                    "password",
                    "role",
                    "is_active",
                    "division_id",
                    "avatar",
                ],
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Check if user is active
            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: "Your account has been deactivated",
                });
            }

            // Compare password
            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Generate JWT token
            const tokenExpiry = remember ? "30d" : "1d";
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: tokenExpiry }
            );

            // Set cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: remember
                    ? 30 * 24 * 60 * 60 * 1000
                    : 24 * 60 * 60 * 1000,
            });

            // Return user data without password
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                division_id: user.division_id,
                avatar: user.avatar,
            };

            res.json({
                success: true,
                message: "Login successful",
                token,
                user: userData,
            });
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({
                success: false,
                message: "Login failed. Please try again.",
            });
        }
    }

    // Register new user
    async register(req, res) {
        try {
            const { name, email, password, division_id } = req.body;

            // Validate input
            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Name, email, and password are required",
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Email already registered",
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = await User.create({
                name,
                email,
                password: hashedPassword,
                role: "user",
                division_id: division_id || null,
                is_active: true,
            });

            res.status(201).json({
                success: true,
                message: "Registration successful",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({
                success: false,
                message: "Registration failed. Please try again.",
            });
        }
    }

    // Logout
    async logout(req, res) {
        try {
            res.clearCookie("token");
            res.json({
                success: true,
                message: "Logout successful",
            });
        } catch (error) {
            console.error("Logout error:", error);
            res.status(500).json({
                success: false,
                message: "Logout failed",
            });
        }
    }

    // Get current user
    async getCurrentUser(req, res) {
        try {
            const user = await User.findByPk(req.user.id, {
                attributes: [
                    "id",
                    "name",
                    "email",
                    "role",
                    "division_id",
                    "avatar",
                    "is_active",
                ],
                include: [
                    {
                        association: "division",
                        attributes: ["id", "name"],
                    },
                ],
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            res.json({
                success: true,
                user,
            });
        } catch (error) {
            console.error("Get current user error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get user data",
            });
        }
    }

    // Google OAuth
    async googleAuth(req, res) {
        // Redirect to Google OAuth URL
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&response_type=code&scope=email profile`;
        res.redirect(googleAuthUrl);
    }

    // Google OAuth Callback
    async googleCallback(req, res) {
        try {
            // Handle Google OAuth callback
            // This is a simplified version - implement full OAuth flow
            const { code } = req.query;

            // Exchange code for token and get user info
            // Create or find user in database
            // Generate JWT token
            // Redirect to frontend with token

            res.redirect(
                `${process.env.FRONTEND_URL}/auth/callback?token=YOUR_JWT_TOKEN`
            );
        } catch (error) {
            console.error("Google callback error:", error);
            res.redirect(
                `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
            );
        }
    }

    // Refresh Token
    async refreshToken(req, res) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: "Token is required",
                });
            }

            // Verify old token
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                ignoreExpiration: true,
            });

            // Generate new token
            const newToken = jwt.sign(
                {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            res.json({
                success: true,
                token: newToken,
            });
        } catch (error) {
            console.error("Refresh token error:", error);
            res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
    }

    // Google OAuth Login with ID Token
    async googleLogin(req, res) {
        try {
            const { id_token } = req.body;

            if (!id_token) {
                return res.status(400).json({
                    success: false,
                    message: "Google ID token is required",
                });
            }

            // Verify Google ID token
            let googleUser;
            try {
                googleUser = await verifyGoogleToken(id_token);
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: error.message || "Invalid Google ID token",
                });
            }

            // Find user by email
            let user = await User.findOne({
                where: { email: googleUser.email },
                attributes: [
                    "id",
                    "name",
                    "email",
                    "role",
                    "is_active",
                    "division_id",
                    "avatar",
                    "oauth_provider",
                    "oauth_id",
                ],
            });

            // If user exists
            if (user) {
                // Check if user is active
                if (!user.is_active) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "Akun Anda belum diaktifkan oleh admin. Silakan hubungi administrator.",
                    });
                }

                // Update OAuth info if not set
                if (!user.oauth_provider || !user.oauth_id) {
                    await user.update({
                        oauth_provider: "google",
                        oauth_id: googleUser.sub,
                    });
                }

                // Log: existing user login via Google
                console.log(`User ${user.email} logged in via Google OAuth`);
            } else {
                // Create new user
                user = await User.create({
                    name: googleUser.name || "User",
                    email: googleUser.email,
                    password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
                    role: "user", // Default role
                    is_active: true, // Auto-activate for Google users
                    oauth_provider: "google",
                    oauth_id: googleUser.sub,
                    division_id: null,
                });

                console.log(`New user created via Google OAuth: ${user.email}`);
            }

            // Generate JWT token (30 days for OAuth)
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );

            // Set cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            // Return user data
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                division_id: user.division_id,
                avatar: user.avatar,
                oauth_provider: user.oauth_provider,
            };

            res.json({
                success: true,
                message: "Google login successful",
                token,
                user: userData,
                isNewUser: !user.oauth_id, // If oauth_id was just set, it's an existing user linking
            });
        } catch (error) {
            console.error("Google login error:", error);
            res.status(500).json({
                success: false,
                message: "Google login failed. Please try again.",
            });
        }
    }
}

export default new AuthController();
