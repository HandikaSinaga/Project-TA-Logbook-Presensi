# 📚 Dokumentasi — Sistem Presensi & Logbook

> Folder ini berisi semua dokumentasi teknis proyek. Pastikan selalu membaca versi terbaru sesuai tanggal pembaruan di bagian bawah setiap dokumen.

---

## 📑 Daftar Dokumen

| File | Deskripsi | Status |
|------|-----------|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arsitektur sistem, security model, struktur penyimpanan | ✅ Ada |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Panduan deployment local & production | ✅ Ada |

---

## 🗂️ Struktur Folder Dokumentasi

```
docs/
├── README.md               ← Dokumen ini (index)
├── ARCHITECTURE.md         ← Arsitektur sistem & design decisions
└── DEPLOYMENT_GUIDE.md     ← Panduan setup & deployment
```

---

## ⚡ Quick Reference

### Menjalankan Aplikasi Lokal

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# → http://localhost:3001

# Terminal 2 — Frontend
cd frontend && npm run dev
# → http://localhost:5173
```

### Akun Default

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@presensi.com` | `admin123` |
| **Supervisor** | `supervisor@presensi.com` | `super123` |
| **User** | `user@presensi.com` | `user123` |

### Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🔌 API Quick Reference

**Base URL:** `http://localhost:3001/api`

**Authentication:** `Authorization: Bearer <token>`

### Auth Endpoints

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/auth/login` | Login dengan email/password | Tidak |
| GET | `/auth/google` | Redirect Google OAuth | Tidak |
| POST | `/auth/logout` | Logout & invalidate session | Ya |
| GET | `/api/config` | Ambil konfigurasi publik (Google Client ID, dll) | Tidak |

### User Endpoints (`/api/user/`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/attendance` | Riwayat presensi |
| GET | `/attendance/today` | Presensi hari ini |
| POST | `/attendance/check-in` | Check-in (+ foto wajib jika offsite) |
| POST | `/attendance/check-out` | Check-out |
| GET | `/logbook` | Daftar logbook |
| POST | `/logbook` | Buat logbook baru |
| GET | `/izin` | Daftar izin |
| POST | `/izin` | Ajukan izin baru |
| GET | `/dashboard` | Data dashboard user |
| GET | `/profile` | Profil user |
| PUT | `/profile` | Update profil |

### Admin Endpoints (`/api/admin/`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/users` | Daftar semua user |
| POST | `/users` | Buat user baru |
| PUT | `/users/:id` | Update user |
| PUT | `/users/:id/toggle-status` | Aktifkan/nonaktifkan user |
| DELETE | `/users/:id` | Hapus user |
| GET | `/divisions` | Daftar divisi |
| POST | `/divisions` | Buat divisi |
| PUT | `/divisions/:id/toggle-status` | Aktifkan/nonaktifkan divisi |
| GET | `/reports/attendance` | Laporan presensi (dengan filter) |
| GET | `/reports/logbook` | Laporan logbook |
| GET | `/reports/leave` | Laporan izin |

### Response Format

**Sukses:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Deskripsi error",
  "code": "ERROR_CODE"
}
```

**Error Codes Khusus:**

| Code | HTTP | Deskripsi |
|------|------|-----------|
| `ACCOUNT_DEACTIVATED` | 403 | Akun user dinonaktifkan |
| `DIVISION_DEACTIVATED` | 403 | Divisi user dinonaktifkan |
| `DIVISION_PERIODE_ENDED` | 403 | Periode divisi sudah berakhir |

---

## 🗄️ Database Schema (Ringkasan)

### Tabel Utama

```sql
-- Users: menyimpan semua user (admin, supervisor, user)
users (
  id, name, email, password, role,
  division_id, supervisor_id, periode,
  is_active,           -- false = akun nonaktif
  is_active_periode,   -- false = periode selesai
  division_assigned_at -- kapan mulai tracking presensi
)

-- Divisions: unit/departemen
divisions (
  id, name, description, supervisor_id, periode,
  is_active,           -- false = divisi nonaktif
  is_active_periode    -- false = periode divisi selesai
)

-- Attendances: rekaman presensi harian
attendances (
  id, user_id, division_id, date,
  check_in_time, check_out_time,
  check_in_photo, check_out_photo,  -- path file gambar
  work_type,    -- onsite / offsite
  status        -- present / late / absent / leave
)

-- Logbooks: catatan kegiatan harian
logbooks (
  id, user_id, date, activity,
  description, progress,
  attachments,  -- JSON array path file
  status        -- pending / approved / rejected
)

-- Leaves: pengajuan izin
leaves (
  id, user_id, type, start_date, end_date,
  reason, attachment, status
)
```

---

## 🔧 Troubleshooting

### `Error: connect ECONNREFUSED 127.0.0.1:3306`
- MySQL tidak berjalan → Start MySQL service
- Cek `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` di `backend/.env`

### `Invalid token` / `401 Unauthorized`
- Token expired → Login ulang
- Cek `JWT_SECRET` di `.env` tidak berubah setelah restart

### `403 ACCOUNT_DEACTIVATED`
- Akun user di-nonaktifkan oleh admin
- Admin perlu aktifkan kembali di menu Users → Toggle Status

### `403 DIVISION_DEACTIVATED`
- Divisi user sedang nonaktif
- Admin perlu aktifkan divisi di menu Divisions → Toggle Status

### `Access to XMLHttpRequest blocked by CORS`
- Cek `CORS_ORIGIN` di `backend/.env` sesuai URL frontend
- Contoh: `CORS_ORIGIN=http://localhost:5173` (tanpa trailing slash)

### Foto tidak tampil
- Cek folder `backend/public/uploads/` ada dan dapat ditulis
- Jalankan cleanup script untuk file orphan:
  ```bash
  node backend/scripts/cleanupUploads.js --dry-run
  ```

---

## 📝 Catatan Developer

### Menambah Fitur Baru

1. **Model**: Tambah/edit di `backend/models/`
2. **Migration**: Buat migration baru di `backend/database/migrations/`
3. **Controller**: Tambah business logic di `backend/controllers/`
4. **Route**: Daftarkan di `backend/routes/[role]Routes.js`
5. **Frontend**: Tambah halaman di `frontend/src/roles/[role]/`

### Konvensi Kode

- **Backend**: CommonJS → ESM (`import/export`)
- **Naming**: camelCase untuk variabel/fungsi, PascalCase untuk class/komponen
- **Error**: Selalu wrap handler dalam `try/catch`, gunakan format response standar
- **Guard Middleware**: Terapkan `checkDivisionActive` di semua write endpoints user

---

**Last Updated:** Mei 2026  
**Maintainer:** Handika Sinaga  
**License:** MIT
