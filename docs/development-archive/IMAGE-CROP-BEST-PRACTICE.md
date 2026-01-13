# Best Practice: Image Crop untuk Foto Profil

## 📋 Overview

Implementasi image cropping untuk foto profil di semua role (User, Supervisor, Admin) menggunakan pendekatan best practice yang konsisten dan user-friendly.

## ✨ Fitur Utama

### 1. **ImageCropModal Component**

Located: `frontend/src/components/common/ImageCropModal.jsx`

Reusable component untuk crop gambar dengan fitur:

-   ✅ **Circular Crop**: Preview bulat sesuai tampilan avatar
-   ✅ **Zoom Control**: Slider untuk zoom in/out (1x - 3x)
-   ✅ **Drag to Position**: Seret gambar untuk positioning
-   ✅ **File Validation**:
    -   Input max: 5MB
    -   Output max: 2MB (configurable)
    -   Format: image/\* only
-   ✅ **Error Handling**: Toast notification untuk error
-   ✅ **Loading State**: Spinner saat processing
-   ✅ **Optimized Output**: JPEG 95% quality

### 2. **Props & Configuration**

```jsx
<ImageCropModal
    show={boolean}              // Modal visibility
    onHide={function}           // Close handler
    imageSrc={string}           // Base64 image source
    onCropComplete={function}   // Callback with cropped File
    aspectRatio={number}        // Default: 1 (square/circle)
    maxFileSize={number}        // Default: 2MB
/>
```

## 🎯 Implementation Flow

### Workflow:

```
1. User clicks "Pilih Foto" button
   ↓
2. File input opens (accept="image/*")
   ↓
3. Validate file size (max 5MB) & type
   ↓
4. Convert to base64 → Show ImageCropModal
   ↓
5. User crops image (circular preview)
   ↓
6. User clicks "Simpan"
   ↓
7. Canvas renders cropped area → Blob
   ↓
8. Convert Blob → File object
   ↓
9. Validate output size (max 2MB)
   ↓
10. Return File via onCropComplete callback
    ↓
11. Preview cropped image & enable upload button
    ↓
12. Upload to backend via FormData
```

## 📝 Code Examples

### User Profile Implementation

```jsx
import ImageCropModal from "../../components/common/ImageCropModal";

const Profile = () => {
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageSrcForCrop, setImageSrcForCrop] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Step 1: Handle file selection
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate size
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 5MB");
                return;
            }

            // Validate type
            if (!file.type.startsWith("image/")) {
                toast.error("File harus berupa gambar");
                return;
            }

            // Convert to base64 for crop modal
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrcForCrop(reader.result);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset input for re-selection
        e.target.value = null;
    };

    // Step 2: Handle cropped result
    const handleCropComplete = (croppedFile) => {
        setAvatarFile(croppedFile);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(croppedFile);
    };

    // Step 3: Upload to backend
    const handleAvatarUpload = async () => {
        if (!avatarFile) return;

        try {
            const formData = new FormData();
            formData.append("avatar", avatarFile);

            await axiosInstance.post("/user/profile/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Avatar berhasil diupdate");
            setAvatarFile(null);
            setAvatarPreview(null);
            fetchProfile();
        } catch (error) {
            console.error("Error uploading avatar:", error);
            toast.error("Gagal mengupload avatar");
        }
    };

    return (
        <>
            {/* File Input */}
            <input
                type="file"
                id="avatarInput"
                className="d-none"
                accept="image/*"
                onChange={handleAvatarChange}
            />

            {/* Crop Modal */}
            <ImageCropModal
                show={showCropModal}
                onHide={() => setShowCropModal(false)}
                imageSrc={imageSrcForCrop}
                onCropComplete={handleCropComplete}
                aspectRatio={1}
                maxFileSize={2 * 1024 * 1024}
            />
        </>
    );
};
```

## 🎨 Avatar Display Standards

### 1. **Centralized Helper Function**

Location: `frontend/src/utils/Constant.jsx`

```jsx
export const getAvatarUrl = (user) => {
    if (!user) {
        return "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=128";
    }
    if (user.avatar) {
        // External URL (Google, etc)
        if (user.avatar.startsWith("http")) {
            return user.avatar;
        }
        // Backend relative path
        return `${API_URL.replace("/api", "")}${user.avatar}`;
    }
    // Fallback to ui-avatars.com
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name || "User"
    )}&background=random&color=fff&size=128`;
};
```

### 2. **Avatar Image Component**

```jsx
<img
    src={getAvatarUrl(user)}
    alt={user.name}
    className="rounded-circle"
    width="100"
    height="100"
    style={{ objectFit: "cover" }}
    onError={(e) => {
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name
        )}&background=random&color=fff&size=128`;
    }}
/>
```

**Key Attributes:**

-   `style={{ objectFit: "cover" }}` - Maintains aspect ratio
-   `onError` - Fallback to ui-avatars.com if image fails
-   `className="rounded-circle"` - Bootstrap class for circular shape

## 🔧 Backend Requirements

### Upload Endpoint

```javascript
// Express multer configuration
const storage = multer.diskStorage({
    destination: "./public/uploads/avatars",
    filename: (req, file, cb) => {
        const uniqueName = `avatar-${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}`;
        const ext = path.extname(file.originalname);
        cb(null, uniqueName + ext);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files allowed"));
        }
    },
});

router.post("/profile/avatar", upload.single("avatar"), async (req, res) => {
    // Save path to database: /uploads/avatars/filename.jpg
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    // Update user.avatar in database
});
```

## 📦 Dependencies

```json
{
    "dependencies": {
        "react-easy-crop": "^5.0.8"
    }
}
```

## 🎯 Best Practices Applied

### 1. **File Validation**

-   ✅ Validate before crop (5MB max input)
-   ✅ Validate after crop (2MB max output)
-   ✅ Type checking (image/\* only)
-   ✅ Extension checking on backend

### 2. **User Experience**

-   ✅ Preview before upload
-   ✅ Circular crop matches avatar display
-   ✅ Zoom control for flexibility
-   ✅ Drag to position
-   ✅ Loading states
-   ✅ Clear error messages

### 3. **Performance**

-   ✅ Canvas rendering (fast)
-   ✅ JPEG output at 95% quality
-   ✅ Compressed file size
-   ✅ Optimized base64 conversion

### 4. **Error Handling**

-   ✅ Toast notifications
-   ✅ Fallback avatars (ui-avatars.com)
-   ✅ `onError` handler on img tags
-   ✅ Try-catch blocks

### 5. **Consistency**

-   ✅ Same workflow across all roles
-   ✅ Centralized helper function
-   ✅ Reusable component
-   ✅ Consistent UI/UX

## 🖼️ Avatar Sizes

### Recommended Sizes:

-   **Navbar**: 24x24px (thumbnail)
-   **Profile Card**: 150x150px (medium)
-   **Profile Header**: 200x200px (large)
-   **User Table**: 32x32px (small)
-   **Division Members**: 100x100px (medium)

All sizes use `objectFit: "cover"` to maintain aspect ratio.

## 🚀 Usage Locations

### ✅ Implemented:

1. **Admin Profile** - `/admin/profile`
2. **Supervisor Profile** - `/supervisor/profile`
3. **User Profile** - `/user/profile`

### ✅ Display Locations:

1. **Navbar** (all roles) - Uses `getAvatarUrl(userData)`
2. **Profile Pages** (all roles) - Crop + upload workflow
3. **Users Table** (admin) - Uses `getAvatarUrl(user)`
4. **Division Members** (user/supervisor) - Uses `getAvatarUrl(member)`
5. **Supervisor Card** (user division) - Uses `getAvatarUrl(supervisor)`

## 📊 File Size Limits

| Stage   | Limit | Reason                                |
| ------- | ----- | ------------------------------------- |
| Input   | 5MB   | Allow high-quality photos from phones |
| Output  | 2MB   | Balance quality vs bandwidth          |
| Backend | 2MB   | Match frontend validation             |

## 🎨 UI Components

### File Input Button

```jsx
<button
    className="btn btn-outline-primary btn-sm w-100 mb-2"
    onClick={() => document.getElementById("avatarInput").click()}
>
    <i className="bi bi-camera me-2"></i>
    Pilih Foto
</button>
```

### Upload Button (conditional)

```jsx
{
    avatarFile && (
        <button
            className="btn btn-primary btn-sm w-100"
            onClick={handleAvatarUpload}
        >
            <i className="bi bi-upload me-2"></i>
            Upload
        </button>
    );
}
```

## 🔍 Testing Checklist

-   [ ] Upload image < 2MB → Success
-   [ ] Upload image > 5MB → Error toast
-   [ ] Upload non-image file → Error toast
-   [ ] Crop image → Preview updates
-   [ ] Zoom control → Image scales
-   [ ] Drag image → Position changes
-   [ ] Cancel crop → Modal closes, no changes
-   [ ] Save crop → File created, preview shown
-   [ ] Upload cropped → Backend receives, database updates
-   [ ] Avatar displays in navbar
-   [ ] Avatar displays in profile
-   [ ] Avatar displays in tables/cards
-   [ ] Image load error → Fallback to ui-avatars.com

## 📝 Notes

-   Semua foto profil di-crop dalam bentuk **bulat** untuk konsistensi
-   Output format: **JPEG** dengan quality **95%**
-   Fallback menggunakan **ui-avatars.com** dengan nama user
-   Input reset after selection untuk memungkinkan re-upload file yang sama
-   Modal dapat ditutup dengan ESC key atau close button
-   Zoom range: **1x - 3x** (dapat di-adjust via slider)

## 🎉 Benefits

1. **Consistent UX** - Same workflow across all roles
2. **Professional Look** - Circular avatars, cropped properly
3. **Optimized Performance** - Compressed images, fast loading
4. **Error Resilient** - Fallbacks and error handling
5. **User Friendly** - Preview before commit
6. **Maintainable** - Reusable component
7. **Scalable** - Easy to add to new features

---

**Commit:** `e40d9420` - feat: Implement best practice image crop for profile photos across all roles

**Files Modified:** 9 files (8 modified, 1 new)

-   Created: `frontend/src/components/common/ImageCropModal.jsx`
-   Updated: All Profile.jsx files (User, Supervisor, Admin)
-   Updated: User Division.jsx for avatar display
-   Updated: package.json & package-lock.json

**Dependencies Added:** react-easy-crop@5.0.8
