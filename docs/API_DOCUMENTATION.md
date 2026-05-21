# 🔌 API Documentation — Sistem Presensi & Logbook

**Base URL:** `http://localhost:3001/api`  
**Format:** JSON  
**Auth:** `Authorization: Bearer <token>`

---

## 📋 Daftar Isi

- [Authentication](#-authentication)
- [Public Config](#-public-config)
- [User Endpoints](#-user-endpoints-apituser)
- [Supervisor Endpoints](#-supervisor-endpoints-apisupervisor)
- [Admin Endpoints](#-admin-endpoints-apiadmin)
- [Response Format](#-response-format-standar)
- [Error Codes](#-error-codes)

---

## 🔐 Authentication

**Base path:** `/api/auth`  
**Prefix routes:** langsung di `/api` (tanpa `/auth`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/login` | ❌ | Login email + password |
| POST | `/api/register` | ❌ | Register user baru |
| POST | `/api/google-idtoken` | ❌ | Login dengan Google ID Token |
| GET | `/api/google` | ❌ | Redirect Google OAuth |
| GET | `/api/google/callback` | ❌ | Google OAuth callback |
| POST | `/api/logout` | ✅ | Logout & invalidate session |
| GET | `/api/me` | ✅ | Ambil data user saat ini |
| POST | `/api/refresh` | ❌ | Refresh access token |

### POST `/api/login`

```json
// Request
{
  "email": "admin@presensi.com",
  "password": "admin123"
}

// Response 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@presensi.com",
    "role": "admin"
  }
}
```

### GET `/api/me`

```json
// Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin",
    "email": "admin@presensi.com",
    "role": "admin",
    "division_id": null,
    "is_active": true
  }
}
```

---

## 🌐 Public Config

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/config` | ❌ | Konfigurasi publik (Google Client ID, dll) |

```json
// Response 200
{
  "googleClientId": "xxx.apps.googleusercontent.com",
  "appName": "Sistem Presensi & Logbook",
  "apiBaseUrl": "http://localhost:3001/api"
}
```

---

## 👤 User Endpoints `/api/user`

**Guard:** `auth` + `role(user, supervisor, admin)` + `checkDivisionActive` (write ops)

### Dashboard

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/user/dashboard` | Statistik dashboard user |

### Presensi (Attendance)

| Method | Endpoint | Guard Tambahan | Deskripsi |
|--------|----------|----------------|-----------|
| GET | `/user/attendance` | — | Riwayat presensi (dengan pagination) |
| GET | `/user/attendance/today` | — | Presensi hari ini |
| GET | `/user/attendance/recent` | — | Presensi terbaru |
| GET | `/user/attendance/workday-status` | — | Status hari kerja hari ini |
| POST | `/user/attendance/pre-check` | — | Deteksi lokasi sebelum check-in |
| POST | `/user/attendance/check-in` | `validateWorkday` + `checkDivisionActive` | Check-in (foto opsional/wajib) |
| POST | `/user/attendance/check-out` | `checkDivisionActive` | Check-out |

#### GET `/user/attendance` — Query Params

| Param | Tipe | Contoh | Deskripsi |
|-------|------|--------|-----------|
| `month` | integer | `5` | Filter bulan (1-12) |
| `year` | integer | `2026` | Filter tahun |
| `date_from` | string | `2026-05-01` | Range awal |
| `date_to` | string | `2026-05-31` | Range akhir |
| `page` | integer | `1` | Halaman (default: 1) |
| `limit` | integer | `20` | Per halaman (default: 20) |

#### POST `/user/attendance/pre-check`

```json
// Request
{ "latitude": -6.2088, "longitude": 106.8456 }

// Response 200
{
  "success": true,
  "workType": "onsite",
  "isOnsite": true,
  "reason": "Connected to office WiFi",
  "detectionMethod": "ip",
  "requiresPhoto": false,
  "requiresReason": false
}
```

#### POST `/user/attendance/check-in`

```
Content-Type: multipart/form-data
Field: photo (file, wajib jika offsite)
Field: work_type (string: "onsite"|"offsite")
Field: reason (string, wajib jika offsite)
Field: latitude (number, opsional)
Field: longitude (number, opsional)
```

```json
// Response 200
{
  "success": true,
  "message": "Check-in berhasil",
  "data": {
    "id": 123,
    "date": "2026-05-21",
    "check_in_time": "08:05:00",
    "work_type": "onsite",
    "status": "present"
  }
}
```

### Logbook

| Method | Endpoint | Guard | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/user/logbook` | — | Daftar logbook user |
| GET | `/user/logbook/today` | — | Logbook hari ini |
| GET | `/user/logbook/recent` | — | Logbook terbaru |
| POST | `/user/logbook` | `checkDivisionActive` | Buat logbook baru |
| GET | `/user/logbook/:id` | — | Detail logbook |
| PUT | `/user/logbook/:id` | — | Update logbook |
| DELETE | `/user/logbook/:id` | — | Hapus logbook |

#### POST `/user/logbook`

```json
// Request
{
  "date": "2026-05-21",
  "activity": "Meeting with team",
  "description": "Diskusi progress sprint 3",
  "progress": 75
}

// Response 201
{
  "success": true,
  "message": "Logbook berhasil dibuat",
  "data": { "id": 45, "date": "2026-05-21", "status": "pending" }
}
```

### Izin (Leave)

| Method | Endpoint | Guard | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/user/izin` | — | Daftar izin user |
| GET | `/user/izin/quota` | — | Kuota izin tersisa |
| GET | `/user/izin/pending` | — | Izin yang menunggu approval |
| POST | `/user/izin` | `checkDivisionActive` | Ajukan izin baru |
| GET | `/user/izin/:id` | — | Detail izin |
| PUT | `/user/izin/:id` | — | Update izin (jika masih pending) |
| DELETE | `/user/izin/:id` | — | Batalkan izin |

#### POST `/user/izin`

```
Content-Type: multipart/form-data
Field: type (string: "sakit"|"cuti"|"izin"|"lainnya")
Field: start_date (date: YYYY-MM-DD)
Field: end_date (date: YYYY-MM-DD)
Field: reason (string)
Field: attachment (file, opsional)
```

### Divisi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/user/division` | Info divisi user saat ini |
| GET | `/user/divisions/my-division` | Divisi dengan daftar anggota |

### Profil

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/user/profile` | Ambil profil |
| PUT | `/user/profile` | Update profil |
| PUT | `/user/profile/password` | Ganti password |
| POST | `/user/profile/avatar` | Upload avatar (multipart) |
| DELETE | `/user/profile/avatar` | Hapus avatar |

### Kalender & Hari Libur

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/user/calendar` | Kalender kerja user |
| GET | `/user/calendar/date/:date` | Detail tanggal (YYYY-MM-DD) |
| GET | `/user/holidays` | Daftar hari libur |
| GET | `/user/holidays/check` | Cek apakah hari ini libur |
| GET | `/user/holidays/upcoming` | Hari libur mendatang |

---

## 👨‍💼 Supervisor Endpoints `/api/supervisor`

**Guard:** `auth` + `role(supervisor, admin)`

### Dashboard

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/supervisor/dashboard` | Statistik dashboard supervisor |

### Monitoring Presensi Tim

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/supervisor/attendance` | Presensi semua anggota divisi |
| GET | `/supervisor/attendance/today` | Presensi hari ini (tim) |
| PUT | `/supervisor/attendance/:id/approve` | Approve presensi |
| PUT | `/supervisor/attendance/:id/reject` | Reject presensi |

### Monitoring Logbook Tim

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/supervisor/logbook` | Logbook semua anggota divisi |
| GET | `/supervisor/logbook/stats` | Statistik logbook tim |
| GET | `/supervisor/logbook/:id` | Detail logbook |
| PUT | `/supervisor/logbook/:id/approve` | Approve logbook |
| PUT | `/supervisor/logbook/:id/reject` | Reject logbook |
| PUT | `/supervisor/logbook/:id/review` | Review logbook dengan feedback |

### Manajemen Izin Tim

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/supervisor/izin` | Semua izin anggota divisi |
| GET | `/supervisor/izin/pending` | Izin yang menunggu approval |
| PUT | `/supervisor/izin/:id/approve` | Approve izin |
| PUT | `/supervisor/izin/:id/reject` | Reject izin |

#### PUT `/supervisor/izin/:id/reject`

```json
// Request
{ "reason": "Dokumen tidak dilampirkan" }

// Response 200
{ "success": true, "message": "Izin ditolak" }
```

### Manajemen Divisi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/supervisor/division` | Info divisi supervisor |
| GET | `/supervisor/division/members` | Daftar anggota aktif |
| GET | `/supervisor/division/available-users` | User tanpa divisi (untuk assign) |
| POST | `/supervisor/division/assign` | Assign user ke divisi |
| POST | `/supervisor/division/remove` | Remove user dari divisi |

#### POST `/supervisor/division/assign`

```json
// Request
{ "user_id": 15 }

// Response 200
{ "success": true, "message": "User assigned to division successfully" }
```

### Laporan Supervisor

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/supervisor/reports/attendance` | Laporan presensi tim |
| GET | `/supervisor/reports/logbook` | Laporan logbook tim |
| GET | `/supervisor/reports/izin` | Laporan izin tim |

### Kalender & Profil

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/supervisor/calendar` | Kalender kerja supervisor |
| GET | `/supervisor/calendar/date/:date` | Detail tanggal |
| GET | `/supervisor/profile` | Profil supervisor |
| PUT | `/supervisor/profile` | Update profil |
| PUT | `/supervisor/profile/password` | Ganti password |
| POST | `/supervisor/profile/avatar` | Upload avatar |
| DELETE | `/supervisor/profile/avatar` | Hapus avatar |

---

## 🛡️ Admin Endpoints `/api/admin`

**Guard:** `auth` + `role(admin)`

### Dashboard

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/dashboard` | Statistik dashboard admin |

### Manajemen User

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/users` | Daftar semua user (dengan filter) |
| POST | `/admin/users` | Buat user baru |
| GET | `/admin/users/template/download` | Download template Excel import |
| GET | `/admin/users/export` | Export daftar user ke Excel |
| POST | `/admin/users/import` | Import user dari Excel |
| GET | `/admin/users/:id` | Detail user |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Hapus user |
| PUT | `/admin/users/:id/toggle-status` | Aktifkan/nonaktifkan user |
| PUT | `/admin/users/:id/reset-password` | Reset password user |

#### GET `/admin/users` — Query Params

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `search` | string | Cari nama/email |
| `role` | string | Filter: `user`, `supervisor`, `admin` |
| `division_id` | integer | Filter per divisi |
| `is_active` | boolean | Filter status aktif |
| `periode` | string | Filter periode/batch |
| `page` | integer | Halaman |
| `limit` | integer | Per halaman |

#### POST `/admin/users`

```json
// Request
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "password123",
  "role": "user",
  "division_id": 2,
  "periode": "2026-1",
  "nip": "2026001",
  "position": "Frontend Developer"
}

// Response 201
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": 30, "name": "Budi Santoso", "email": "budi@example.com" }
}
```

#### PUT `/admin/users/:id/toggle-status`

```json
// Response 200
{
  "success": true,
  "message": "User deactivated successfully",
  "data": { "id": 30, "is_active": false }
}
```

#### POST `/admin/users/import`

```
Content-Type: multipart/form-data
Field: file (Excel .xlsx/.xls)
```

```json
// Response 200
{
  "success": true,
  "message": "Import berhasil",
  "data": {
    "imported": 15,
    "skipped": 2,
    "errors": ["Row 5: Email sudah terdaftar"]
  }
}
```

### Manajemen Divisi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/divisions` | Daftar semua divisi |
| POST | `/admin/divisions` | Buat divisi baru |
| GET | `/admin/divisions/:id` | Detail divisi |
| PUT | `/admin/divisions/:id` | Update divisi |
| PUT | `/admin/divisions/:id/toggle-status` | Aktifkan/nonaktifkan divisi |
| DELETE | `/admin/divisions/:id` | Hapus divisi (jika kosong) |
| GET | `/admin/divisions/:id/members` | Anggota divisi |
| PUT | `/admin/divisions/:id/assign-users` | Bulk assign users ke divisi |

#### GET `/admin/divisions` — Query Params

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `periode` | string | Filter periode |
| `is_active_periode` | boolean | Filter status periode |

#### POST `/admin/divisions`

```json
// Request
{
  "name": "Divisi Frontend",
  "description": "Tim pengembang frontend",
  "supervisor_id": 5,
  "periode": "2026-1",
  "is_active": true
}
```

#### PUT `/admin/divisions/:id/assign-users`

```json
// Request
{ "user_ids": [12, 15, 18] }

// Response 200
{
  "success": true,
  "message": "Successfully assigned 3 user(s) to division"
}
```

### Manajemen Lokasi Kantor

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/locations` | Daftar lokasi kantor |
| POST | `/admin/locations` | Tambah lokasi baru |
| GET | `/admin/locations/:id` | Detail lokasi |
| PUT | `/admin/locations/:id` | Update lokasi |
| DELETE | `/admin/locations/:id` | Hapus lokasi |

#### POST `/admin/locations`

```json
// Request
{
  "name": "Kantor Pusat",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "radius": 100
}
```

### Manajemen Jaringan Kantor (IP/WiFi)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/office-networks` | Daftar jaringan |
| GET | `/admin/office-networks/active` | Jaringan aktif saja |
| GET | `/admin/office-networks/my-ip` | IP request saat ini |
| POST | `/admin/office-networks` | Tambah jaringan |
| PUT | `/admin/office-networks/:id` | Update jaringan |
| DELETE | `/admin/office-networks/:id` | Hapus jaringan |
| POST | `/admin/office-networks/test-detection` | Test deteksi lokasi |

#### POST `/admin/office-networks`

```json
// Request
{
  "name": "WiFi Kantor Lt.1",
  "ip_start": "192.168.1.1",
  "ip_end": "192.168.1.254",
  "is_active": true
}
```

### Monitoring Presensi (Admin)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/attendance` | Semua presensi (semua user) |
| GET | `/admin/attendance/today` | Presensi hari ini (semua) |
| GET | `/admin/attendance/export` | Export Excel presensi |

#### GET `/admin/attendance` — Query Params

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `user_id` | integer | Filter per user |
| `division_id` | integer | Filter per divisi |
| `date_from` | string | Range tanggal awal |
| `date_to` | string | Range tanggal akhir |
| `status` | string | `present`, `late`, `absent`, `leave` |
| `work_type` | string | `onsite`, `offsite` |
| `page` | integer | Halaman |

### Monitoring Logbook (Admin)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/logbook` | Semua logbook |
| GET | `/admin/logbook/stats` | Statistik logbook global |
| PUT | `/admin/logbooks/:id/approve` | Approve logbook |
| PUT | `/admin/logbooks/:id/reject` | Reject logbook |

### Monitoring Izin (Admin)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/izin` | Semua pengajuan izin |
| PUT | `/admin/izin/:id/approve` | Approve izin |
| PUT | `/admin/izin/:id/reject` | Reject izin dengan alasan |

### Laporan & Export

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/reports/attendance` | Laporan presensi (filter lengkap) |
| GET | `/admin/reports/logbook` | Laporan logbook |
| GET | `/admin/reports/izin` | Laporan izin |
| GET | `/admin/reports/summary` | Ringkasan semua modul |
| GET | `/admin/reports/division` | Laporan per divisi |
| GET | `/admin/reports/attendance/export` | Export Excel laporan presensi |
| GET | `/admin/reports/logbook/export` | Export Excel laporan logbook |
| GET | `/admin/reports/izin/export` | Export Excel laporan izin |
| GET | `/admin/reports/summary/export` | Export Excel ringkasan |
| GET | `/admin/reports/division/export` | Export Excel per divisi |

#### GET `/admin/reports/attendance` — Query Params

| Param | Tipe | Deskripsi |
|-------|------|-----------|
| `user_id` | integer | Filter user spesifik |
| `division_id` | integer | Filter divisi (single select) |
| `date_from` | string | Tanggal awal (YYYY-MM-DD) |
| `date_to` | string | Tanggal akhir (YYYY-MM-DD) |
| `status` | string | Status presensi |
| `work_type` | string | Tipe kerja |
| `page` | integer | Halaman |
| `limit` | integer | Per halaman |

### Pengaturan Aplikasi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/settings` | Semua pengaturan |
| PUT | `/admin/settings` | Update pengaturan |
| GET | `/admin/settings/system` | Info sistem (server, DB) |
| GET | `/admin/settings/time-validation` | Pengaturan validasi waktu |

#### PUT `/admin/settings`

```json
// Request (contoh beberapa key)
{
  "checkin_start": "07:00",
  "checkin_end": "09:00",
  "checkout_start": "16:00",
  "checkout_end": "20:00",
  "late_threshold_minutes": 15,
  "working_days": ["monday","tuesday","wednesday","thursday","friday"]
}
```

### Manajemen Hari Libur

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/holidays` | Daftar hari libur |
| GET | `/admin/holidays/check` | Cek apakah tanggal tertentu libur |
| GET | `/admin/holidays/upcoming` | Hari libur mendatang |
| POST | `/admin/holidays` | Tambah hari libur |
| POST | `/admin/holidays/bulk-import` | Import massal hari libur |
| GET | `/admin/holidays/:id` | Detail hari libur |
| PUT | `/admin/holidays/:id` | Update hari libur |
| DELETE | `/admin/holidays/:id` | Hapus hari libur |
| PATCH | `/admin/holidays/:id/toggle` | Toggle aktif/nonaktif |

#### POST `/admin/holidays`

```json
// Request
{
  "name": "Hari Raya Idul Fitri",
  "date": "2026-03-31",
  "type": "national",
  "is_active": true
}
```

### Kalender Kerja (Admin)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/calendar` | Kalender kerja bulan ini |
| GET | `/admin/calendar/date/:date` | Detail tanggal tertentu |

### Profil Admin

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/profile` | Profil admin |
| PUT | `/admin/profile` | Update profil |
| PUT | `/admin/profile/password` | Ganti password |
| POST | `/admin/profile/avatar` | Upload avatar |
| DELETE | `/admin/profile/avatar` | Hapus avatar |

---

## 📦 Response Format Standar

### Sukses

```json
{
  "success": true,
  "data": { ... },
  "message": "Pesan opsional"
}
```

### List dengan Pagination

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_records": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Deskripsi error yang jelas",
  "code": "ERROR_CODE"
}
```

---

## ❌ Error Codes

| HTTP | Code | Penyebab | Solusi |
|------|------|----------|--------|
| 400 | — | Request tidak valid / field wajib kosong | Cek body request |
| 401 | — | Token tidak ada atau tidak valid | Login ulang |
| 401 | — | Token expired | Login ulang |
| 403 | `ACCOUNT_DEACTIVATED` | Akun user dinonaktifkan | Hubungi admin |
| 403 | `DIVISION_DEACTIVATED` | Divisi dinonaktifkan | Hubungi admin |
| 403 | `DIVISION_PERIODE_ENDED` | Periode divisi sudah berakhir | Hubungi admin |
| 403 | — | Role tidak cukup | Gunakan akun dengan role yang sesuai |
| 404 | — | Resource tidak ditemukan | Cek ID yang digunakan |
| 409 | — | Konflik data (email duplikat, dll) | Cek data yang dikirim |
| 422 | — | Validasi gagal | Cek format field |
| 429 | — | Rate limit terlampaui | Tunggu beberapa menit |
| 500 | — | Error server | Cek log backend |

---

## 🧪 Contoh Testing dengan cURL

### Login

```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@presensi.com","password":"admin123"}'
```

### Gunakan Token

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR..."

# Ambil daftar user
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Buat logbook
curl -X POST http://localhost:3001/api/user/logbook \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-21","activity":"Testing API","progress":80}'
```

### Upload File (Check-in dengan foto)

```bash
curl -X POST http://localhost:3001/api/user/attendance/check-in \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/path/to/selfie.jpg" \
  -F "work_type=offsite" \
  -F "reason=WFH hari ini"
```

---

**Last Updated:** Mei 2026  
**Maintainer:** Handika Sinaga  
**Base URL Production:** Sesuaikan dengan domain deployment
