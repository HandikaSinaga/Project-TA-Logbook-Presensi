# 📘 API Documentation

**Base URL:** `http://localhost:3001`  
**API Version:** 1.0  
**Last Updated:** January 13, 2026

---

## 🔐 Authentication

All authenticated endpoints require JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### POST `/auth/login`

Login with email and password.

**Request Body:**

```json
{
    "email": "admin@presensi.com",
    "password": "admin123"
}
```

**Response (200):**

```json
{
    "success": true,
    "message": "Login berhasil",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@presensi.com",
        "role": "admin",
        "division_id": 1
    }
}
```

### GET `/auth/google`

Initiate Google OAuth login.

### POST `/auth/refresh`

Refresh access token.

**Request Body:**

```json
{
    "refreshToken": "your_refresh_token"
}
```

---

## 👥 User Management

### GET `/admin/users`

Get all users with pagination.

**Auth:** Admin  
**Query Params:**

-   `page` (number): Page number (default: 1)
-   `limit` (number): Items per page (default: 10)
-   `search` (string): Search by name/email
-   `division_id` (number): Filter by division
-   `role` (string): Filter by role

**Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "nip": "123456",
            "role": "user",
            "division": {
                "id": 1,
                "name": "IT"
            },
            "is_active": true
        }
    ],
    "pagination": {
        "total": 100,
        "page": 1,
        "limit": 10,
        "totalPages": 10
    }
}
```

### POST `/admin/users`

Create new user.

**Auth:** Admin  
**Request Body:**

```json
{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "nip": "789012",
    "password": "password123",
    "role": "user",
    "division_id": 1,
    "periode": "2026-1",
    "sumber_magang": "Internal"
}
```

### PUT `/admin/users/:id`

Update user details.

**Auth:** Admin  
**Request Body:** Same as create

### DELETE `/admin/users/:id`

Delete user (soft delete).

**Auth:** Admin

---

## 📅 Attendance

### POST `/attendance/check-in`

Check in attendance.

**Auth:** User  
**Request Body:**

```json
{
    "latitude": -6.2,
    "longitude": 106.816666,
    "work_type": "wfo",
    "photo": "base64_image_string"
}
```

**Response (201):**

```json
{
    "success": true,
    "message": "Check-in berhasil",
    "data": {
        "id": 123,
        "user_id": 1,
        "date": "2026-01-13",
        "check_in_time": "08:30:00",
        "status": "present",
        "work_type": "wfo",
        "check_in_latitude": -6.2,
        "check_in_longitude": 106.816666
    }
}
```

### PUT `/attendance/check-out/:id`

Check out attendance.

**Auth:** User  
**Request Body:**

```json
{
    "latitude": -6.2,
    "longitude": 106.816666,
    "photo": "base64_image_string"
}
```

### GET `/attendance/my-attendance`

Get user's attendance history.

**Auth:** User  
**Query Params:**

-   `start_date`: Filter start date (YYYY-MM-DD)
-   `end_date`: Filter end date (YYYY-MM-DD)
-   `status`: Filter by status (present, late, absent)

---

## 📝 Logbook

### GET `/logbook`

Get user's logbooks.

**Auth:** User

**Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 45,
            "user_id": 1,
            "date": "2026-01-13",
            "activity": "Backend Development",
            "description": "Implemented REST API for reports",
            "status": "approved",
            "reviewer_id": 5,
            "reviewer": {
                "name": "Supervisor Name"
            },
            "created_at": "2026-01-13T10:30:00Z"
        }
    ]
}
```

### POST `/logbook`

Create new logbook entry.

**Auth:** User  
**Request Body (multipart/form-data):**

```
date: 2026-01-13
activity: Frontend Development
description: Created responsive dashboard
files: [File object]
```

### PUT `/logbook/:id`

Update logbook entry.

**Auth:** User (only own logbook)

### DELETE `/logbook/:id`

Delete logbook entry.

**Auth:** User (only own logbook, if status is pending)

---

## 🏖️ Leave Management

### POST `/leave`

Submit leave request.

**Auth:** User  
**Request Body (multipart/form-data):**

```
type: izin_sakit
start_date: 2026-01-15
end_date: 2026-01-17
duration: 3
reason: Medical treatment
attachment: [File object]
```

**Response (201):**

```json
{
    "success": true,
    "message": "Pengajuan izin berhasil",
    "data": {
        "id": 78,
        "user_id": 1,
        "type": "izin_sakit",
        "start_date": "2026-01-15",
        "end_date": "2026-01-17",
        "duration": 3,
        "reason": "Medical treatment",
        "status": "pending",
        "attachment": "uploads/leave/1736775600_document.pdf"
    }
}
```

### GET `/leave/my-leaves`

Get user's leave requests.

**Auth:** User

### PUT `/supervisor/leave/:id/review`

Review leave request (Supervisor).

**Auth:** Supervisor  
**Request Body:**

```json
{
    "status": "approved",
    "review_note": "Approved"
}
```

### PUT `/admin/leave/:id/approve`

Final approval (Admin).

**Auth:** Admin  
**Request Body:**

```json
{
    "status": "approved",
    "admin_note": "Approved for leave"
}
```

---

## 📊 Reports

### GET `/admin/reports/attendance`

Get attendance report with filters.

**Auth:** Admin  
**Query Params:**

-   `start_date`: Start date (YYYY-MM-DD)
-   `end_date`: End date (YYYY-MM-DD)
-   `division_id`: Filter by division
-   `periode`: Filter by period
-   `sumber_magang`: Filter by internship source
-   `status`: Filter by status
-   `approval_status`: Filter by approval status

**Response (200):**

```json
{
  "success": true,
  "summary": {
    "total_records": 250,
    "present": 200,
    "late": 30,
    "absent": 20,
    "approved": 220,
    "pending": 30
  },
  "data": [...]
}
```

### GET `/admin/reports/attendance/export`

Export attendance report to Excel.

**Auth:** Admin  
**Query Params:** Same as attendance report  
**Response:** Excel file download

### GET `/admin/reports/logbook`

Get logbook report.

**Auth:** Admin

### GET `/admin/reports/izin`

Get leave report.

**Auth:** Admin

### GET `/admin/reports/summary`

Get comprehensive summary report (all data types).

**Auth:** Admin  
**Response (200):**

```json
{
  "success": true,
  "summary": {
    "total": {
      "attendance": 1250,
      "logbook": 850,
      "leave": 120
    },
    "attendance": { ... },
    "logbook": { ... },
    "leave": { ... }
  },
  "data": {
    "attendances": [...],
    "logbooks": [...],
    "leaves": [...]
  }
}
```

### GET `/admin/reports/summary/export`

Export summary report to Excel (3 sheets).

**Auth:** Admin  
**Response:** Excel file with 3 sheets:

-   Presensi (Attendance data)
-   Logbook (Logbook data)
-   Izin Cuti (Leave data)

---

## 🔔 Notifications

### GET `/notifications`

Get user's notifications.

**Auth:** User

**Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 123,
            "user_id": 1,
            "type": "approval",
            "title": "Logbook Approved",
            "message": "Your logbook for 2026-01-13 has been approved",
            "is_read": false,
            "related_type": "logbook",
            "related_id": 45,
            "created_at": "2026-01-13T14:30:00Z"
        }
    ],
    "unread_count": 5
}
```

### PUT `/notifications/:id/read`

Mark notification as read.

**Auth:** User

### PUT `/notifications/read-all`

Mark all notifications as read.

**Auth:** User

---

## 🏢 Divisions

### GET `/divisions`

Get all divisions.

**Auth:** User

**Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Information Technology",
            "description": "IT Department",
            "is_active": true,
            "member_count": 25
        }
    ]
}
```

### POST `/admin/divisions`

Create new division.

**Auth:** Admin  
**Request Body:**

```json
{
    "name": "Human Resources",
    "description": "HR Department"
}
```

---

## ⚙️ Settings

### GET `/admin/settings`

Get application settings.

**Auth:** Admin

**Response (200):**

```json
{
    "success": true,
    "data": {
        "work_start_time": "08:00",
        "work_end_time": "17:00",
        "late_threshold_minutes": 15,
        "auto_checkout_enabled": false,
        "max_leave_days": 12
    }
}
```

### PUT `/admin/settings`

Update application settings.

**Auth:** Admin

---

## 📤 File Upload

### POST `/upload/avatar`

Upload user avatar.

**Auth:** User  
**Content-Type:** multipart/form-data  
**Request Body:**

```
avatar: [File object] (max 5MB, jpg/png)
```

**Response (200):**

```json
{
    "success": true,
    "message": "Avatar berhasil diupload",
    "data": {
        "avatar_url": "/uploads/avatars/user_1_1736775600.jpg"
    }
}
```

---

## ❌ Error Responses

### 400 Bad Request

```json
{
    "success": false,
    "message": "Validation error",
    "errors": [
        {
            "field": "email",
            "message": "Email is required"
        }
    ]
}
```

### 401 Unauthorized

```json
{
    "success": false,
    "message": "Token tidak valid atau sudah kadaluarsa"
}
```

### 403 Forbidden

```json
{
    "success": false,
    "message": "Anda tidak memiliki akses ke resource ini"
}
```

### 404 Not Found

```json
{
    "success": false,
    "message": "Resource tidak ditemukan"
}
```

### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Terjadi kesalahan pada server"
}
```

---

## 🔄 WebSocket Events

**Connection:** `http://localhost:3001` with Socket.IO

### Client → Server

**`authenticate`**

```javascript
socket.emit("authenticate", { token: "jwt_token" });
```

### Server → Client

**`notification`**

```javascript
socket.on("notification", (data) => {
    console.log("New notification:", data);
});
```

**`attendance_update`**

```javascript
socket.on("attendance_update", (data) => {
    console.log("Attendance updated:", data);
});
```

---

## 📋 Rate Limiting

-   **General endpoints:** 100 requests per 15 minutes
-   **Login endpoint:** 5 requests per 15 minutes
-   **File upload:** 10 requests per hour

---

## 🧪 Testing API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@presensi.com","password":"admin123"}'

# Get users (with token)
curl -X GET http://localhost:3001/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Import collection from `docs/postman_collection.json`
2. Set environment variables
3. Authenticate to get token
4. Use {{token}} variable in subsequent requests

---

**For questions or support, contact: handika.sinaga@example.com**
