# ≡ƒôí API Documentation - Sistem Presensi Karyawan

## Base Information

-   **Base URL:** `http://localhost:3001`
-   **Production URL:** `https://your-domain.com/api`
-   **API Version:** v1.0
-   **Content-Type:** `application/json`
-   **Authentication:** JWT Bearer Token

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Endpoints](#2-user-endpoints)
3. [Supervisor Endpoints](#3-supervisor-endpoints)
4. [Admin Endpoints](#4-admin-endpoints)
5. [Error Codes](#5-error-codes)
6. [Rate Limiting](#6-rate-limiting)

---

## 1. Authentication

### 1.1 Login

**Endpoint:** `POST /login`

**Description:** Authenticate user dan dapatkan access token

**Request Body:**

```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Login berhasil",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "user@example.com",
            "role": "user",
            "division_id": 1,
            "division": {
                "id": 1,
                "name": "IT Development"
            }
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Error Response (401):**

```json
{
    "success": false,
    "message": "Email atau password salah"
}
```

---

### 1.2 Register

**Endpoint:** `POST /register`

**Description:** Registrasi user baru (public)

**Request Body:**

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "081234567890",
    "address": "Jakarta"
}
```

**Success Response (201):**

```json
{
    "success": true,
    "message": "Registrasi berhasil",
    "data": {
        "id": 10,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
    }
}
```

---

### 1.3 Get Current User

**Endpoint:** `GET /me`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "user@example.com",
        "role": "user",
        "division_id": 1,
        "phone": "081234567890",
        "address": "Jakarta",
        "avatar": "profiles/avatar_1.jpg",
        "division": {
            "id": 1,
            "name": "IT Development",
            "supervisor": {
                "id": 5,
                "name": "Jane Smith"
            }
        }
    }
}
```

---

### 1.4 Refresh Token

**Endpoint:** `POST /refresh`

**Headers:**

```
Cookie: refreshToken=<refresh_token>
```

**Success Response (200):**

```json
{
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.5 Logout

**Endpoint:** `POST /logout`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Logout berhasil"
}
```

---

## 2. User Endpoints

**Base Path:** `/user`  
**Required Role:** `user`  
**Headers:** `Authorization: Bearer <access_token>`

---

### 2.1 Attendance

#### 2.1.1 Get Attendance History

**Endpoint:** `GET /user/attendance`

**Query Parameters:**

-   `start_date` (optional): Format `YYYY-MM-DD`
-   `end_date` (optional): Format `YYYY-MM-DD`
-   `status` (optional): `present`, `late`, `absent`, `permission`, `leave`

**Example:**

```
GET /user/attendance?start_date=2025-12-01&end_date=2025-12-31&status=present
```

**Success Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 123,
            "user_id": 1,
            "date": "2025-12-06",
            "checkin_time": "08:00:00",
            "checkout_time": "17:00:00",
            "checkin_photo": "attendance/123_checkin.jpg",
            "checkout_photo": "attendance/123_checkout.jpg",
            "checkin_lat": -6.2,
            "checkin_lng": 106.816666,
            "checkout_lat": -6.2,
            "checkout_lng": 106.816666,
            "work_type": "onsite",
            "status": "present",
            "location_validation": "Γ£à Inside office radius - Kantor Pusat",
            "work_hours": "09:00:00",
            "notes": "Checkin pagi",
            "created_at": "2025-12-06T01:00:00.000Z"
        }
    ],
    "pagination": {
        "total": 25,
        "page": 1,
        "limit": 10
    }
}
```

---

#### 2.1.2 Check-in

**Endpoint:** `POST /user/attendance/checkin`

**Request Body:**

```json
{
    "latitude": -6.2,
    "longitude": 106.816666,
    "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "notes": "Checkin pagi"
}
```

**Success Response (201):**

```json
{
    "success": true,
    "message": "Check-in berhasil",
    "data": {
        "id": 124,
        "user_id": 1,
        "date": "2025-12-06",
        "checkin_time": "08:05:00",
        "checkin_photo": "attendance/124_checkin.jpg",
        "work_type": "onsite",
        "location_validation": "Γ£à Inside office radius - Kantor Pusat",
        "status": "present"
    }
}
```

**Error Response (400):**

```json
{
    "success": false,
    "message": "Anda sudah check-in hari ini"
}
```

**Error Response (403):**

```json
{
    "success": false,
    "message": "Check-in hanya diperbolehkan antara 07:00 - 09:00"
}
```

---

#### 2.1.3 Check-out

**Endpoint:** `POST /user/attendance/checkout`

**Request Body:**

```json
{
    "latitude": -6.2,
    "longitude": 106.816666,
    "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "notes": "Checkout sore"
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Check-out berhasil",
    "data": {
        "id": 124,
        "checkout_time": "17:00:00",
        "checkout_photo": "attendance/124_checkout.jpg",
        "work_hours": "08:55:00",
        "location_validation": "Γ£à Inside office radius - Kantor Pusat"
    }
}
```

---

#### 2.1.4 Get Today Status

**Endpoint:** `GET /user/attendance/status`

**Success Response (200):**

```json
{
    "success": true,
    "data": {
        "hasCheckedIn": true,
        "hasCheckedOut": false,
        "attendance": {
            "id": 124,
            "checkin_time": "08:05:00",
            "status": "present"
        }
    }
}
```

---

### 2.2 Logbook

#### 2.2.1 Get All Logbooks

**Endpoint:** `GET /user/logbook`

**Query Parameters:**

-   `start_date` (optional): Format `YYYY-MM-DD`
-   `end_date` (optional): Format `YYYY-MM-DD`
-   `status` (optional): `pending`, `approved`, `rejected`

**Success Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 45,
            "user_id": 1,
            "date": "2025-12-06",
            "activity": "Rapat tim development",
            "description": "Membahas roadmap Q1 2026 dan distribusi task",
            "attachment": "logbook/45_document.pdf",
            "status": "approved",
            "approved_by": 5,
            "approved_at": "2025-12-06T10:30:00.000Z",
            "reject_reason": null,
            "approver": {
                "id": 5,
                "name": "Jane Smith"
            }
        }
    ]
}
```

---

#### 2.2.2 Submit Logbook

**Endpoint:** `POST /user/logbook`

**Content-Type:** `multipart/form-data`

**Form Data:**

-   `date`: `2025-12-06` (required)
-   `activity`: `Rapat tim development` (required)
-   `description`: `Detail aktivitas...` (required)
-   `attachment`: File (optional) - Max 5MB, format: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG

**Success Response (201):**

```json
{
    "success": true,
    "message": "Logbook berhasil ditambahkan",
    "data": {
        "id": 46,
        "user_id": 1,
        "date": "2025-12-06",
        "activity": "Rapat tim development",
        "description": "Detail aktivitas...",
        "attachment": "logbook/46_document.pdf",
        "status": "pending"
    }
}
```

---

#### 2.2.3 Update Logbook

**Endpoint:** `PUT /user/logbook/:id`

**Content-Type:** `multipart/form-data`

**Form Data:** (sama dengan submit)

**Success Response (200):**

```json
{
    "success": true,
    "message": "Logbook berhasil diupdate"
}
```

**Error Response (403):**

```json
{
    "success": false,
    "message": "Tidak dapat mengubah logbook yang sudah diapprove"
}
```

---

#### 2.2.4 Delete Logbook

**Endpoint:** `DELETE /user/logbook/:id`

**Success Response (200):**

```json
{
    "success": true,
    "message": "Logbook berhasil dihapus"
}
```

---

### 2.3 Leave (Cuti/Izin)

#### 2.3.1 Get All Leaves

**Endpoint:** `GET /user/leave`

**Query Parameters:**

-   `status` (optional): `pending`, `approved`, `rejected`

**Success Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 12,
            "user_id": 1,
            "leave_type": "sick",
            "start_date": "2025-12-10",
            "end_date": "2025-12-12",
            "total_days": 3,
            "reason": "Sakit demam",
            "attachment": "leave/12_surat_dokter.pdf",
            "status": "approved",
            "approved_by": 5,
            "approved_at": "2025-12-09T14:00:00.000Z",
            "reject_reason": null,
            "approver": {
                "id": 5,
                "name": "Jane Smith"
            }
        }
    ]
}
```

---

#### 2.3.2 Submit Leave Request

**Endpoint:** `POST /user/leave`

**Content-Type:** `multipart/form-data`

**Form Data:**

-   `leave_type`: `sick` | `annual` | `permission` | `other` (required)
-   `start_date`: `2025-12-10` (required)
-   `end_date`: `2025-12-12` (required)
-   `reason`: `Sakit demam` (required)
-   `attachment`: File (optional) - Max 5MB

**Success Response (201):**

```json
{
    "success": true,
    "message": "Pengajuan cuti berhasil diajukan",
    "data": {
        "id": 13,
        "user_id": 1,
        "leave_type": "sick",
        "start_date": "2025-12-10",
        "end_date": "2025-12-12",
        "total_days": 3,
        "reason": "Sakit demam",
        "status": "pending"
    }
}
```

---

#### 2.3.3 Cancel Leave Request

**Endpoint:** `DELETE /user/leave/:id`

**Success Response (200):**

```json
{
    "success": true,
    "message": "Pengajuan cuti berhasil dibatalkan"
}
```

**Error Response (403):**

```json
{
    "success": false,
    "message": "Tidak dapat membatalkan pengajuan yang sudah disetujui/ditolak"
}
```

---

### 2.4 Profile

#### 2.4.1 Get Profile

**Endpoint:** `GET /user/profile`

**Success Response (200):**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "user@example.com",
        "phone": "081234567890",
        "address": "Jakarta",
        "avatar": "profiles/avatar_1.jpg",
        "division": {
            "id": 1,
            "name": "IT Development"
        }
    }
}
```

---

#### 2.4.2 Update Profile

**Endpoint:** `PUT /user/profile`

**Request Body:**

```json
{
    "name": "John Doe Updated",
    "phone": "081234567890",
    "address": "Jakarta Selatan"
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Profil berhasil diupdate"
}
```

---

#### 2.4.3 Upload Avatar

**Endpoint:** `POST /user/profile/avatar`

**Content-Type:** `multipart/form-data`

**Form Data:**

-   `avatar`: Image file (JPG, PNG) - Max 2MB

**Success Response (200):**

```json
{
    "success": true,
    "message": "Foto profil berhasil diupdate",
    "data": {
        "avatar": "profiles/avatar_1.jpg"
    }
}
```

---

## 3. Supervisor Endpoints

**Base Path:** `/supervisor`  
**Required Role:** `supervisor`  
**Headers:** `Authorization: Bearer <access_token>`

---

### 3.1 Dashboard

**Endpoint:** `GET /supervisor/dashboard`

**Success Response (200):**

```json
{
    "success": true,
    "data": {
        "stats": {
            "totalTeamMembers": 15,
            "presentToday": 12,
            "lateToday": 2,
            "absentToday": 1,
            "pendingLeaves": 3,
            "pendingLogbooks": 5
        },
        "recentActivities": [
            {
                "type": "leave",
                "user": "John Doe",
                "action": "mengajukan cuti sakit",
                "timestamp": "2025-12-06T08:30:00.000Z"
            }
        ]
    }
}
```

---

### 3.2 Team Attendance

**Endpoint:** `GET /supervisor/team/attendance`

**Query Parameters:**

-   `date` (optional): `YYYY-MM-DD` - Default: today
-   `status` (optional): Filter by status

**Success Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 123,
            "user": {
                "id": 1,
                "name": "John Doe",
                "email": "user@example.com"
            },
            "date": "2025-12-06",
            "checkin_time": "08:00:00",
            "checkout_time": "17:00:00",
            "work_hours": "09:00:00",
            "status": "present",
            "work_type": "onsite"
        }
    ]
}
```

---

### 3.3 Team Logbook

**Endpoint:** `GET /supervisor/team/logbook`

**Query Parameters:**

-   `status` (optional): `pending`, `approved`, `rejected`
-   `start_date`, `end_date` (optional)

**Success Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 45,
            "user": {
                "id": 1,
                "name": "John Doe"
            },
            "date": "2025-12-06",
            "activity": "Rapat tim development",
            "description": "Membahas roadmap Q1 2026",
            "status": "pending",
            "attachment": "logbook/45_document.pdf"
        }
    ]
}
```

---

### 3.4 Approve Logbook

**Endpoint:** `PUT /supervisor/logbook/:id/approve`

**Success Response (200):**

```json
{
    "success": true,
    "message": "Logbook berhasil diapprove"
}
```

---

### 3.5 Reject Logbook

**Endpoint:** `PUT /supervisor/logbook/:id/reject`

**Request Body:**

```json
{
    "reject_reason": "Dokumen pendukung tidak lengkap"
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Logbook berhasil ditolak"
}
```

**Error Response (400):**

```json
{
    "success": false,
    "message": "Alasan penolakan harus diisi"
}
```

---

### 3.6 Team Leave

**Endpoint:** `GET /supervisor/team/leave`

**Query Parameters:**

-   `status` (optional): `pending`, `approved`, `rejected`

**Success Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 12,
            "user": {
                "id": 1,
                "name": "John Doe"
            },
            "leave_type": "sick",
            "start_date": "2025-12-10",
            "end_date": "2025-12-12",
            "total_days": 3,
            "reason": "Sakit demam",
            "status": "pending"
        }
    ]
}
```

---

### 3.7 Approve Leave

**Endpoint:** `PUT /supervisor/leave/:id/approve`

**Success Response (200):**

```json
{
    "success": true,
    "message": "Pengajuan cuti berhasil diapprove"
}
```

---

### 3.8 Reject Leave

**Endpoint:** `PUT /supervisor/leave/:id/reject`

**Request Body:**

```json
{
    "reject_reason": "Tanggal bertabrakan dengan event penting"
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Pengajuan cuti berhasil ditolak"
}
```

---

### 3.9 Export Reports

**Endpoint:** `GET /supervisor/reports/export`

**Query Parameters:**

-   `type`: `attendance` | `logbook` | `leave` (required)
-   `format`: `xlsx` | `csv` | `pdf` (required)
-   `start_date`: `YYYY-MM-DD` (required)
-   `end_date`: `YYYY-MM-DD` (required)

**Example:**

```
GET /supervisor/reports/export?type=attendance&format=xlsx&start_date=2025-12-01&end_date=2025-12-31
```

**Success Response (200):**

-   Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
-   Binary file download

**Note:** Supervisor hanya bisa export data divisinya sendiri (security)

---

## 4. Admin Endpoints

**Base Path:** `/admin`  
**Required Role:** `admin`  
**Headers:** `Authorization: Bearer <access_token>`

---

### 4.1 Dashboard

**Endpoint:** `GET /admin/dashboard`

**Success Response (200):**

```json
{
    "success": true,
    "data": {
        "stats": {
            "totalUsers": 50,
            "totalDivisions": 5,
            "presentToday": 45,
            "lateToday": 3,
            "absentToday": 2,
            "pendingLeaves": 8
        },
        "divisionStats": [
            {
                "division_id": 1,
                "division_name": "IT Development",
                "total_members": 15,
                "present": 14,
                "absent": 1
            }
        ]
    }
}
```

---

### 4.2 User Management

#### 4.2.1 Get All Users

**Endpoint:** `GET /admin/users`

**Query Parameters:**

-   `role` (optional): `admin`, `supervisor`, `user`
-   `division_id` (optional): Filter by division
-   `search` (optional): Search by name/email

**Success Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "John Doe",
            "email": "user@example.com",
            "role": "user",
            "division_id": 1,
            "phone": "081234567890",
            "is_active": true,
            "division": {
                "id": 1,
                "name": "IT Development"
            }
        }
    ],
    "pagination": {
        "total": 50,
        "page": 1,
        "limit": 10
    }
}
```

---

#### 4.2.2 Get User Detail

**Endpoint:** `GET /admin/users/:id`

**Success Response (200):**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "user@example.com",
        "role": "user",
        "division_id": 1,
        "phone": "081234567890",
        "address": "Jakarta",
        "avatar": "profiles/avatar_1.jpg",
        "is_active": true,
        "created_at": "2025-01-01T00:00:00.000Z",
        "attendanceStats": {
            "totalPresent": 20,
            "totalLate": 2,
            "totalAbsent": 1
        }
    }
}
```

---

#### 4.2.3 Create User

**Endpoint:** `POST /admin/users`

**Request Body:**

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user",
    "division_id": 1,
    "phone": "081234567890",
    "address": "Jakarta"
}
```

**Success Response (201):**

```json
{
    "success": true,
    "message": "User berhasil ditambahkan",
    "data": {
        "id": 51,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
    }
}
```

---

#### 4.2.4 Update User

**Endpoint:** `PUT /admin/users/:id`

**Request Body:**

```json
{
    "name": "John Doe Updated",
    "role": "supervisor",
    "division_id": 2,
    "phone": "081234567890",
    "is_active": true
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "User berhasil diupdate"
}
```

---

#### 4.2.5 Delete User

**Endpoint:** `DELETE /admin/users/:id`

**Success Response (200):**

```json
{
    "success": true,
    "message": "User berhasil dihapus"
}
```

---

### 4.3 Division Management

#### 4.3.1 Get All Divisions

**Endpoint:** `GET /admin/divisions`

**Success Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "IT Development",
            "description": "Tim pengembangan software",
            "supervisor_id": 5,
            "supervisor": {
                "id": 5,
                "name": "Jane Smith",
                "email": "jane@example.com"
            },
            "memberCount": 15
        }
    ]
}
```

---

#### 4.3.2 Create Division

**Endpoint:** `POST /admin/divisions`

**Request Body:**

```json
{
    "name": "Marketing",
    "description": "Tim pemasaran dan promosi",
    "supervisor_id": 8
}
```

**Success Response (201):**

```json
{
    "success": true,
    "message": "Divisi berhasil ditambahkan",
    "data": {
        "id": 6,
        "name": "Marketing",
        "description": "Tim pemasaran dan promosi"
    }
}
```

---

#### 4.3.3 Update Division

**Endpoint:** `PUT /admin/divisions/:id`

**Request Body:**

```json
{
    "name": "Marketing & Sales",
    "description": "Tim pemasaran, promosi, dan penjualan",
    "supervisor_id": 9
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Divisi berhasil diupdate"
}
```

---

#### 4.3.4 Delete Division

**Endpoint:** `DELETE /admin/divisions/:id`

**Success Response (200):**

```json
{
    "success": true,
    "message": "Divisi berhasil dihapus"
}
```

**Error Response (400):**

```json
{
    "success": false,
    "message": "Tidak dapat menghapus divisi yang masih memiliki anggota"
}
```

---

### 4.4 Location Management (Office Networks)

#### 4.4.1 Get All Locations

**Endpoint:** `GET /admin/locations`

**Success Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Kantor Pusat",
            "address": "Jl. Sudirman No. 123, Jakarta",
            "lat": -6.2,
            "lng": 106.816666,
            "radius": 100,
            "wifi_ssid": "OfficeWiFi-HQ",
            "wifi_bssid": "AA:BB:CC:DD:EE:FF",
            "is_active": true,
            "testing_mode": false
        }
    ]
}
```

---

#### 4.4.2 Create Location

**Endpoint:** `POST /admin/locations`

**Request Body:**

```json
{
    "name": "Kantor Cabang Bandung",
    "address": "Jl. Braga No. 45, Bandung",
    "lat": -6.917464,
    "lng": 107.619123,
    "radius": 50,
    "wifi_ssid": "OfficeWiFi-BDG",
    "wifi_bssid": "BB:CC:DD:EE:FF:AA",
    "is_active": true,
    "testing_mode": false
}
```

**Success Response (201):**

```json
{
    "success": true,
    "message": "Lokasi kantor berhasil ditambahkan",
    "data": {
        "id": 2,
        "name": "Kantor Cabang Bandung"
    }
}
```

---

#### 4.4.3 Update Location

**Endpoint:** `PUT /admin/locations/:id`

**Request Body:** (sama dengan create)

**Success Response (200):**

```json
{
    "success": true,
    "message": "Lokasi kantor berhasil diupdate"
}
```

---

#### 4.4.4 Delete Location

**Endpoint:** `DELETE /admin/locations/:id`

**Success Response (200):**

```json
{
    "success": true,
    "message": "Lokasi kantor berhasil dihapus"
}
```

---

### 4.5 System Reports

#### 4.5.1 Get Attendance Report

**Endpoint:** `GET /admin/reports/attendance`

**Query Parameters:**

-   `start_date`: `YYYY-MM-DD` (required)
-   `end_date`: `YYYY-MM-DD` (required)
-   `division_id` (optional): Filter by division
-   `status` (optional): Filter by status
-   `user_id` (optional): Filter by user

**Success Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 123,
            "user": {
                "id": 1,
                "name": "John Doe",
                "division": "IT Development"
            },
            "date": "2025-12-06",
            "checkin_time": "08:00:00",
            "checkout_time": "17:00:00",
            "work_hours": "09:00:00",
            "status": "present",
            "work_type": "onsite"
        }
    ],
    "summary": {
        "totalPresent": 45,
        "totalLate": 3,
        "totalAbsent": 2,
        "totalLeave": 5
    }
}
```

---

#### 4.5.2 Export Reports (All Divisions)

**Endpoint:** `GET /admin/reports/export`

**Query Parameters:**

-   `type`: `attendance` | `logbook` | `leave` (required)
-   `format`: `xlsx` | `csv` | `pdf` (required)
-   `start_date`: `YYYY-MM-DD` (required)
-   `end_date`: `YYYY-MM-DD` (required)
-   `division_id` (optional): Filter specific division

**Success Response (200):**

-   Binary file download dengan Content-Type sesuai format

---

### 4.6 System Settings

#### 4.6.1 Get Settings

**Endpoint:** `GET /admin/settings`

**Success Response (200):**

```json
{
    "success": true,
    "data": {
        "checkin_start": "07:00",
        "checkin_end": "09:00",
        "checkout_start": "16:00",
        "auto_checkout_time": "18:00",
        "late_tolerance": 15,
        "allow_offsite": true,
        "require_photo": true,
        "maintenance_mode": false
    }
}
```

---

#### 4.6.2 Update Settings

**Endpoint:** `PUT /admin/settings`

**Request Body:**

```json
{
    "checkin_start": "07:30",
    "checkin_end": "09:30",
    "late_tolerance": 10,
    "allow_offsite": false
}
```

**Success Response (200):**

```json
{
    "success": true,
    "message": "Pengaturan sistem berhasil diupdate"
}
```

---

## 5. Error Codes

| Status Code | Description                                           |
| ----------- | ----------------------------------------------------- |
| 200         | OK - Request berhasil                                 |
| 201         | Created - Resource berhasil dibuat                    |
| 400         | Bad Request - Request invalid atau missing parameters |
| 401         | Unauthorized - Token tidak valid atau expired         |
| 403         | Forbidden - Tidak memiliki akses ke resource          |
| 404         | Not Found - Resource tidak ditemukan                  |
| 409         | Conflict - Data sudah ada (duplicate)                 |
| 422         | Unprocessable Entity - Validation error               |
| 429         | Too Many Requests - Rate limit exceeded               |
| 500         | Internal Server Error - Server error                  |

---

## 6. Rate Limiting

-   **Rate:** 100 requests per 15 minutes per IP
-   **Headers:**
    -   `X-RateLimit-Limit`: Total allowed requests
    -   `X-RateLimit-Remaining`: Remaining requests
    -   `X-RateLimit-Reset`: Reset timestamp

**Rate Limit Response (429):**

```json
{
    "success": false,
    "message": "Too many requests, please try again later",
    "retryAfter": 300
}
```

---

## Testing dengan Postman/Thunder Client

### Collection Variables

```json
{
    "baseUrl": "http://localhost:3001",
    "accessToken": "{{token}}",
    "userId": "1"
}
```

### Example Request

**Check-in:**

```bash
curl -X POST http://localhost:3001/user/attendance/checkin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -6.200000,
    "longitude": 106.816666,
    "photo": "data:image/jpeg;base64,...",
    "notes": "Checkin pagi"
  }'
```

---

**Last Updated:** December 6, 2025  
**API Version:** v1.0  
**Contact:** admin@example.com
