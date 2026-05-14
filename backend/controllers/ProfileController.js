import models from "../models/index.js";
import bcrypt from "bcryptjs";
import { getPublicPath } from "../utils/uploadHelper.js";
import fs from "fs";
import path from "path";

const { User } = models;

class ProfileController {
    // Get profile
    async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const user = await User.findByPk(userId, {
                include: [
                    {
                        association: "division",
                        attributes: ["id", "name"],
                    },
                ],
                attributes: {
                    exclude: ["password", "remember_token"],
                },
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            console.error("Get profile error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get profile",
            });
        }
    }

    // Update profile (only editable fields)
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const {
                bio,
                linkedin,
                instagram,
                telegram,
                github,
                twitter,
                facebook,
            } = req.body;

            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Only allow updating social media and bio
            // Admin-managed fields (name, email, nip, phone, address, etc) cannot be edited
            const updateData = {
                bio: bio !== undefined ? bio : user.bio,
                linkedin: linkedin !== undefined ? linkedin : user.linkedin,
                instagram: instagram !== undefined ? instagram : user.instagram,
                telegram: telegram !== undefined ? telegram : user.telegram,
                github: github !== undefined ? github : user.github,
                twitter: twitter !== undefined ? twitter : user.twitter,
                facebook: facebook !== undefined ? facebook : user.facebook,
            };

            await user.update(updateData);

            res.json({
                success: true,
                message: "Profile updated successfully",
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    bio: user.bio,
                    linkedin: user.linkedin,
                    instagram: user.instagram,
                    telegram: user.telegram,
                    github: user.github,
                    twitter: user.twitter,
                    facebook: user.facebook,
                },
            });
        } catch (error) {
            console.error("Update profile error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update profile",
            });
        }
    }

    // Change password
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { current_password, new_password } = req.body;

            if (!current_password || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: "Current password and new password are required",
                });
            }

            if (new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "New password must be at least 6 characters",
                });
            }

            const user = await User.findByPk(userId, {
                attributes: ["id", "password"],
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Verify current password
            const isPasswordValid = await bcrypt.compare(
                current_password,
                user.password,
            );
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: "Current password is incorrect",
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(new_password, 10);

            await user.update({
                password: hashedPassword,
            });

            res.json({
                success: true,
                message: "Password changed successfully",
            });
        } catch (error) {
            console.error("Change password error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to change password",
            });
        }
    }

    // Upload avatar
    async uploadAvatar(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Check if file was uploaded via multer
            if (req.file) {
                // Remove old avatar if it's a local file
                if (user.avatar && user.avatar.startsWith("/uploads/")) {
                    const oldAvatarPath = path.join(
                        process.cwd(),
                        "public",
                        user.avatar,
                    );
                    if (fs.existsSync(oldAvatarPath)) {
                        fs.unlinkSync(oldAvatarPath);
                    }
                }

                // Use organized path structure
                const avatarPath = getPublicPath(req.file.path);

                await user.update({
                    avatar: avatarPath,
                });

                return res.json({
                    success: true,
                    message: "Avatar updated successfully",
                    data: {
                        avatar: user.avatar,
                    },
                });
            }

            // Fallback: manual URL from body (for external URLs like Google)
            const { avatar_url } = req.body;

            if (avatar_url !== undefined) {
                // If there's an old avatar and we are changing to a new external URL or deleting it (empty string)
                if (
                    user.avatar &&
                    user.avatar.startsWith("/uploads/") &&
                    user.avatar !== avatar_url
                ) {
                    const oldAvatarPath = path.join(
                        process.cwd(),
                        "public",
                        user.avatar,
                    );
                    if (fs.existsSync(oldAvatarPath)) {
                        fs.unlinkSync(oldAvatarPath);
                    }
                }

                if (!avatar_url) {
                    // if avatar_url is empty string, meaning delete
                    await user.update({ avatar: null });
                } else {
                    await user.update({ avatar: avatar_url });
                }

                return res.json({
                    success: true,
                    message: "Avatar updated successfully",
                    data: {
                        avatar: user.avatar,
                    },
                });
            }

            return res.status(400).json({
                success: false,
                message: "Avatar file or URL is required",
            });
        } catch (error) {
            console.error("Upload avatar error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to upload avatar",
            });
        }
    }

    // Remove avatar explicitly
    async removeAvatar(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (user.avatar && user.avatar.startsWith("/uploads/")) {
                const oldAvatarPath = path.join(
                    process.cwd(),
                    "public",
                    user.avatar,
                );
                if (fs.existsSync(oldAvatarPath)) {
                    fs.unlinkSync(oldAvatarPath);
                }
            }

            await user.update({ avatar: null });

            return res.json({
                success: true,
                message: "Avatar removed successfully",
                data: {
                    avatar: null,
                },
            });
        } catch (error) {
            console.error("Remove avatar error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to remove avatar",
            });
        }
    }
}

export default new ProfileController();
