/**
 * Upload Configuration - ORGANIZED SYSTEM
 *
 * This file provides upload middleware using the organized folder structure
 * from uploadHelper.js. All files are stored in hierarchical paths:
 *
 * - Attendance: public/uploads/attendance/{year}/{month}/division-{id}/
 * - Leave: public/uploads/leave/{year}/{month}/division-{id}/
 * - Logbook: public/uploads/logbook/{year}/{month}/division-{id}/
 * - Avatars: public/uploads/avatars/division-{id}/
 *
 * Benefits:
 * - Scalable: Millions of files organized by date and division
 * - Maintainable: Easy to find, backup, or clean up specific periods
 * - Performant: Prevents filesystem slowdown from too many files in one folder
 */

import { createUploadMiddleware } from "../utils/uploadHelper.js";

// Attendance photo uploads (check-in/check-out photos)
export const uploadAttendancePhoto = createUploadMiddleware(
    "attendance",
    "photo",
    {
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }
);

// Leave attachment uploads (sick notes, documents)
export const uploadLeaveAttachment = createUploadMiddleware(
    "leave",
    "attachment",
    {
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }
);

// Logbook attachment uploads (daily reports, images)
export const uploadLogbookAttachment = createUploadMiddleware(
    "logbook",
    "attachment",
    {
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }
);

// User avatar/profile photo uploads
export const uploadProfilePhoto = createUploadMiddleware("avatar", "avatar", {
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// Alias for consistency
export const uploadAvatar = uploadProfilePhoto;

export default {
    uploadAttendancePhoto,
    uploadLeaveAttachment,
    uploadLogbookAttachment,
    uploadProfilePhoto,
    uploadAvatar,
};
