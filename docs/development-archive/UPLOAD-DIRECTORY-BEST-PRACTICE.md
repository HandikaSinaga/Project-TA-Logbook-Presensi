# Best Practice: Upload Directory Structure

## 📁 Directory Organization

All uploaded files are stored in **one centralized location** with organized subdirectories by feature:

```
backend/
└── public/
    └── uploads/           ← Single source of truth for all uploads
        ├── avatars/       ← Profile photos (USER, SUPERVISOR, ADMIN)
        ├── attendance/    ← Check-in/Check-out photos
        ├── leave/         ← Leave attachments
        └── logbook/       ← Logbook attachments
```

## ✅ Why This Structure?

### 1. **Single Public Directory**

-   ✅ Easy to serve static files: `app.use(express.static("public"))`
-   ✅ All files accessible via: `http://localhost:3001/uploads/*`
-   ✅ Simplified nginx/Apache configuration for production
-   ✅ Easy backup: backup one directory

### 2. **Organized by Feature**

-   ✅ Clear separation of concerns
-   ✅ Easy to apply different permissions
-   ✅ Easy to set storage limits per feature
-   ✅ Easy to clean up old files per feature

### 3. **Consistent Naming**

-   ✅ Plural names: `avatars`, `attendance`, `leave`, `logbook`
-   ✅ Lowercase for URL consistency
-   ✅ Self-documenting structure

## 📝 Path Standards

### Database Storage Format

```javascript
// Always store relative path from public directory
avatar: "/uploads/avatars/avatar-1-1736543210987.png";
photo: "/uploads/attendance/checkin-1736543210987.jpg";
attachment: "/uploads/leave/leave-doc-1736543210987.pdf";
```

### Frontend Access

```javascript
// Method 1: Using helper function (RECOMMENDED)
import { getAvatarUrl } from "../../utils/Constant";
<img src={getAvatarUrl(user)} alt={user.name} />

// Method 2: Direct concatenation
<img src={`${API_URL.replace('/api', '')}${user.avatar}`} alt={user.name} />

// Method 3: Full URL construction
<img src={`http://localhost:3001${user.avatar}`} alt={user.name} />
```

## 🔧 Backend Configuration

### Upload Config (`backend/config/uploadConfig.js`)

```javascript
const UPLOAD_BASE_PATH = path.join(__dirname, "../public/uploads");

// Avatar uploads - Profile photos
export const uploadAvatar = multer({
    storage: createStorage("avatars"), // Saves to public/uploads/avatars/
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    fileFilter: imageFileFilter, // JPEG, PNG, GIF, WebP only
}).single("avatar");

// Attendance photo uploads
export const uploadAttendancePhoto = multer({
    storage: createStorage("attendance"), // Saves to public/uploads/attendance/
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: imageFileFilter,
}).single("photo");

// Leave attachment uploads
export const uploadLeaveAttachment = multer({
    storage: createStorage("leave"), // Saves to public/uploads/leave/
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: documentFileFilter, // Images + PDF
}).single("attachment");

// Logbook attachment uploads
export const uploadLogbookAttachment = multer({
    storage: createStorage("logbook"), // Saves to public/uploads/logbook/
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: documentFileFilter,
}).single("attachment");
```

### Filename Convention

```javascript
// Format: {originalName}-{timestamp}-{random}.{extension}
// Example: avatar-1736543210987-abc123def.png

const filename = (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
};
```

## 📊 Avatar Specific Configuration

### Current Setup (After Migration)

| Item      | Value                               | Notes                                  |
| --------- | ----------------------------------- | -------------------------------------- |
| Directory | `/uploads/avatars/`                 | Single location for all profile photos |
| Max Size  | 2MB                                 | After cropping                         |
| Formats   | JPEG, PNG, GIF, WebP                | Image files only                       |
| Naming    | `avatar-{userId}-{timestamp}.{ext}` | Auto-generated                         |
| Access    | Public via static serve             | No auth required                       |

### Controller Implementation

```javascript
// ProfileController.js
async uploadAvatar(req, res) {
    const userId = req.user.id;
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    await user.update({ avatar: avatarPath });

    return res.json({
        success: true,
        message: "Avatar updated successfully",
        data: { avatar: user.avatar }
    });
}
```

### Routes Setup

```javascript
// userRoutes.js, supervisorRoutes.js, adminRoutes.js
import { uploadAvatar } from "../config/uploadConfig.js";

router.post("/profile/avatar", uploadAvatar, ProfileController.uploadAvatar);
```

## 🎯 Frontend Helper Function

### Centralized Avatar URL (`frontend/src/utils/Constant.jsx`)

```javascript
export const API_URL = "http://localhost:3001/api";

export const getAvatarUrl = (user) => {
    if (!user) {
        return "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=128";
    }

    if (user.avatar) {
        // Handle external URLs (Google OAuth, etc)
        if (user.avatar.startsWith("http")) {
            return user.avatar;
        }

        // Handle backend relative paths
        // user.avatar = "/uploads/avatars/avatar-1-123456.png"
        // Returns: "http://localhost:3001/uploads/avatars/avatar-1-123456.png"
        return `${API_URL.replace("/api", "")}${user.avatar}`;
    }

    // Fallback to ui-avatars.com with user's name
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name || "User"
    )}&background=random&color=fff&size=128`;
};
```

### Usage in Components

```jsx
import { getAvatarUrl } from "../../utils/Constant";

// In Navbar
<img
    src={getAvatarUrl(userData)}
    alt="profile"
    className="rounded-circle"
    style={{ objectFit: "cover", width: "24px", height: "24px" }}
    onError={(e) => {
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            userData.name
        )}&background=random&color=fff`;
    }}
/>

// In Profile Page
<img
    src={getAvatarUrl(profile)}
    alt="Avatar"
    className="rounded-circle"
    width="150"
    height="150"
    style={{ objectFit: "cover" }}
/>

// In Users Table
<img
    src={getAvatarUrl(user)}
    alt={user.name}
    className="rounded-circle"
    width="32"
    height="32"
    style={{ objectFit: "cover" }}
/>
```

## 🔄 Migration Process

### Migrating Old Avatars

When you have avatars in old locations (e.g., `/uploads/profiles/`), use migration script:

```javascript
// migrate-avatars.mjs
import db from "./database/db.js";
import fs from "fs";
import path from "path";

const migrateAvatars = async () => {
    // 1. Find users with old paths
    const [users] = await db.query(`
        SELECT id, name, avatar 
        FROM users 
        WHERE avatar LIKE '/uploads/profiles/%'
    `);

    // 2. Copy files to new location
    const oldDir = "public/uploads/profiles";
    const newDir = "public/uploads/avatars";

    for (const user of users) {
        const filename = path.basename(user.avatar);
        const newPath = `/uploads/avatars/${filename}`;

        fs.copyFileSync(
            path.join(oldDir, filename),
            path.join(newDir, filename)
        );

        // 3. Update database
        await db.query(
            "UPDATE users SET avatar = :newPath WHERE id = :userId",
            { replacements: { newPath, userId: user.id } }
        );
    }
};
```

### Migration Checklist

-   [x] Create `/uploads/avatars/` directory
-   [x] Copy all avatar files to new location
-   [x] Update database paths
-   [x] Verify all avatars accessible
-   [x] Update frontend helper to use correct path
-   [x] Test avatar display in all roles
-   [x] Remove old `/uploads/profiles/` directory (optional)

## 🚀 Production Considerations

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.example.com;

    # Serve static uploads directly
    location /uploads/ {
        alias /var/www/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Storage Limits

```javascript
// Recommended limits per directory
const STORAGE_LIMITS = {
    avatars: 2 * 1024 * 1024, // 2MB per file
    attendance: 5 * 1024 * 1024, // 5MB per file
    leave: 5 * 1024 * 1024, // 5MB per file
    logbook: 5 * 1024 * 1024, // 5MB per file
};
```

### Cleanup Strategy

```javascript
// Example: Delete old attendance photos after 90 days
const cleanupOldFiles = async () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const attendanceDir = "public/uploads/attendance";
    const files = fs.readdirSync(attendanceDir);

    for (const file of files) {
        const filePath = path.join(attendanceDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < ninetyDaysAgo) {
            fs.unlinkSync(filePath);
        }
    }
};
```

## 📈 Benefits Summary

### For Developers

-   ✅ Single location = easier maintenance
-   ✅ Organized structure = easy to find files
-   ✅ Consistent naming = predictable paths
-   ✅ Centralized helper = DRY principle

### For Users

-   ✅ Fast loading (static serve)
-   ✅ Reliable avatar display
-   ✅ Consistent experience across roles
-   ✅ Graceful fallbacks on error

### For Operations

-   ✅ Simple backup strategy
-   ✅ Easy monitoring of storage
-   ✅ Clear separation for permissions
-   ✅ Scalable to CDN if needed

## 🎯 Current Implementation

### Directories Created

```bash
backend/public/uploads/
├── avatars/         ✅ Profile photos (3 files migrated)
├── attendance/      ✅ Check-in/out photos
├── leave/          ✅ Leave attachments
└── logbook/        ✅ Logbook attachments
```

### Files Migrated

```
✓ avatar-1-1764872327687.png   (Admin System)
✓ avatar-24-1764928511797.png  (user)
✓ avatar-25-1764944181186.png  (Handika Juan Putra Sinaga)
```

### Database Updated

```sql
-- All avatar paths now standardized to:
-- /uploads/avatars/avatar-{userId}-{timestamp}.{ext}
```

### Frontend Helper Active

```javascript
// All components now use:
getAvatarUrl(user) → Full URL with fallback
```

---

**Best Practice Achieved:** Single `/uploads/` directory with organized subdirectories, consistent naming, and centralized helper function. All avatars now seamlessly linked to backend storage.
