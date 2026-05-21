# 🏛️ Arsitektur Sistem — Presensi & Logbook

> Dokumen ini menjelaskan arsitektur keseluruhan, model keamanan, struktur penyimpanan file, dan keputusan desain utama sistem.

---

## 📋 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Arsitektur Aplikasi](#️-arsitektur-aplikasi)
- [Model Keamanan](#-model-keamanan)
- [Lifecycle User & Divisi](#-lifecycle-user--divisi)
- [Struktur Penyimpanan File](#-struktur-penyimpanan-file)
- [Alur Presensi](#-alur-presensi)
- [Middleware Stack](#-middleware-stack)
- [Keputusan Desain](#-keputusan-desain)

---

## 🌐 Gambaran Umum

Sistem ini adalah **Full-Stack Web Application** dengan arsitektur:

```
Browser ──► React SPA (Vite) ──► Express.js REST API ──► MySQL
              Port 5173              Port 3001
```

- **Frontend**: Single Page Application (SPA) berbasis React + Vite
- **Backend**: REST API server berbasis Express.js dengan Sequelize ORM
- **Database**: MySQL 8.0 dengan relasi foreign key
- **File Storage**: Penyimpanan lokal terorganisir (dapat dimigrasikan ke S3)
- **Real-time**: Socket.io untuk notifikasi live

---

## 🏗️ Arsitektur Aplikasi

### Stack Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                             │
│  React 18 + Vite + Bootstrap 5 + React Router 6            │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────────┐   │
│  │  Admin   │  │ Supervisor │  │       User           │   │
│  │  Pages   │  │   Pages    │  │       Pages          │   │
│  └──────────┘  └────────────┘  └──────────────────────┘   │
│         ▲                                  │               │
│         │           Axios + JWT            │               │
└─────────┼──────────────────────────────────┼───────────────┘
          │                                  │
          ▼                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS (Port 3001)                   │
│                                                             │
│  Middleware Pipeline:                                       │
│  CORS → Auth (JWT+DB) → RoleCheck → DivisionActive → ...   │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Controllers │  │   Services   │  │    Schedulers    │  │
│  │  (Business  │  │  (Complex    │  │  (Cron Jobs:     │  │
│  │   Logic)    │  │   Queries)   │  │  auto-checkout)  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Sequelize ORM Models                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL 8.0 Database                       │
│  users, divisions, attendances, logbooks, leaves,           │
│  holidays, office_networks, app_settings, ...               │
└─────────────────────────────────────────────────────────────┘
```

### Struktur Route

| Prefix | Guard | Untuk |
|--------|-------|-------|
| `/api/auth/*` | Tidak ada | Login, OAuth, Config |
| `/api/user/*` | `auth` + `role(user,supervisor,admin)` | User features |
| `/api/supervisor/*` | `auth` + `role(supervisor,admin)` | Supervisor features |
| `/api/admin/*` | `auth` + `role(admin)` | Admin features |

---

## 🔒 Model Keamanan

### Authentication Flow

```
1. User kirim email + password ke POST /api/auth/login
   │
2. Backend verifikasi password (bcrypt.compare)
   │
3. Jika valid → Generate JWT (payload: {id, email, role})
   │
4. Setiap request berikutnya:
   │
   ├── auth.js middleware:
   │   ├── Decode JWT
   │   ├── Query DB: User.findByPk(decoded.id)  ← DB CHECK
   │   ├── Cek user.is_active === true           ← ACTIVE CHECK
   │   └── Attach req.user = {id, email, role, division_id}
   │
   └── Dilanjutkan ke middleware/controller berikutnya
```

> **Mengapa query DB di setiap request?**
> JWT stateless — sekali diissue tidak bisa di-invalidate. Dengan query DB, admin yang menonaktifkan akun user langsung efektif meskipun token JWT belum expired.

### Division Active Guard

Untuk operasi **write** (check-in, logbook, izin), ada middleware tambahan:

```
checkDivisionActive.js:
   │
   ├── Query Division by user.division_id
   ├── Cek division.is_active === true
   ├── Cek division.is_active_periode === true
   │
   ├── Jika nonaktif → 403 DIVISION_DEACTIVATED
   ├── Jika periode berakhir → 403 DIVISION_PERIODE_ENDED
   └── Jika aktif → lanjut ke controller
```

### CORS Policy

```js
// Hanya izinkan origin dari CORS_ORIGIN di .env
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
```

---

## 🔄 Lifecycle User & Divisi

### User Status

```
REGISTERED ──► ACTIVE (is_active: true)
                  │
                  ├── Dapat check-in, buat logbook, ajukan izin
                  ├── Muncul di laporan
                  │
                  ▼
            INACTIVE (is_active: false)
                  │
                  ├── Semua API request ditolak (403)
                  ├── Data historis tetap tersimpan
                  ├── Tidak muncul di daftar aktif
                  └── AttendanceService SKIP backfill absensi
```

### Division Status

```
ACTIVE (is_active: true, is_active_periode: true)
   │
   ├── Member dapat check-in, logbook, dan izin
   │
   ▼
PERIODE ENDED (is_active_periode: false)
   │
   ├── Operasi tulis baru diblokir (403 DIVISION_PERIODE_ENDED)
   ├── Data historis tetap bisa dibaca
   │
   ▼
DEACTIVATED (is_active: false)
   │
   ├── Semua operasi write diblokir (403 DIVISION_DEACTIVATED)
   ├── AttendanceService SKIP backfill untuk semua member
   └── Data historis tetap tersimpan
```

### Cascade Rules

| Aksi | Efek |
|------|------|
| User dinonaktifkan | JWT ditolak di request berikutnya, no new data |
| Divisi dinonaktifkan | Check-in, logbook, izin member diblokir |
| Periode divisi berakhir | Sama dengan nonaktif, data bisa dibaca |
| User dihapus | Data historis perlu dipertahankan (soft delete disarankan) |
| Divisi dihapus | Hanya bisa jika tidak punya member |

---

## 📦 Struktur Penyimpanan File

### Hierarki Folder

```
public/uploads/
├── attendance/
│   └── periode-{batch}/          ← Grouping per angkatan/batch
│       └── {year}/               ← Tahun upload
│           └── {month}/          ← Bulan upload (2 digit: 01-12)
│               └── div-{id}/     ← Divisi user
│                   └── user-{id}-{timestamp}-{randomhex}.webp
│
├── logbook/
│   └── (struktur sama dengan attendance)
│
├── leave/
│   └── (struktur sama dengan attendance)
│
└── avatars/
    └── div-{id}/                 ← Dikelompokkan per divisi
        └── user-{id}-{timestamp}-{randomhex}.webp
```

### Contoh Path Nyata

```
uploads/attendance/periode-2026-1/2026/05/div-3/user-24-1716534123456-a1b2c3d4e5f6g7h8.webp
uploads/logbook/periode-angkatan-15/2026/05/div-1/user-11-1716534999999-z9y8x7w6v5u4t3s2.pdf
uploads/avatars/div-2/user-7-1716530000000-abcdef1234567890.webp
```

### Konvensi Penamaan File

| Bagian | Format | Contoh |
|--------|--------|--------|
| Prefix | `user-` | `user-` |
| User ID | Integer | `24-` |
| Timestamp | Unix ms | `1716534123456-` |
| Random hex | 16 karakter | `a1b2c3d4e5f6g7h8` |
| Ekstensi | Sesuai MIME | `.webp`, `.pdf` |

### Keamanan Upload

- **MIME validation**: Hanya `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- **Ekstensi dari MIME**: Tidak dari nama file asli (mencegah upload `.php` atau `.html`)
- **Ukuran maksimum**: 5 MB per file
- **Optimasi gambar**: Jika Sharp tersedia, gambar di-resize dan dikonversi ke WebP (80% quality)

### Storage Cleanup

Jalankan secara berkala untuk membersihkan file orphan (tidak ada di DB):

```bash
# Dry run — lihat preview dulu
node backend/scripts/cleanupUploads.js --dry-run

# Eksekusi
node backend/scripts/cleanupUploads.js
```

Script ini akan:
1. Scan semua file di `public/uploads/`
2. Cek setiap file ke database (`attendances`, `users`, `logbooks`)
3. Hapus file yang tidak direferensikan
4. Bersihkan folder kosong
5. **Tidak menyentuh** file yang masih ada di DB (meskipun format lama)

---

## 📅 Alur Presensi

### Check-in Flow

```
User tekan tombol Check-in
    │
    ▼
Frontend kirim GPS koordinat (opsional) ke:
POST /api/user/attendance/pre-check
    │
    ▼
Backend cek lokasi:
    ├── Deteksi IP/WiFi → apakah dari jaringan kantor?
    ├── GPS → apakah dalam radius kantor?
    └── Tentukan workType: "onsite" atau "offsite"
    │
    ▼
User lihat tipe kerja:
    ├── ONSITE → langsung bisa check-in
    └── OFFSITE → wajib foto selfie + alasan
    │
    ▼
POST /api/user/attendance/check-in
    ├── Middleware: validateWorkday → apakah hari kerja?
    ├── Middleware: checkDivisionActive → apakah divisi aktif?
    ├── Upload foto (jika offsite)
    └── Simpan record attendance
    │
    ▼
Response: status check-in, waktu, workType
```

### Auto-checkout Scheduler

```
Setiap hari jam 23:59 (Asia/Jakarta):
    │
    ├── Query semua attendance yang belum checkout hari ini
    ├── Filter hanya divisi aktif & user aktif
    ├── Set check_out_time = 23:59:59
    └── Tandai sebagai auto-checkout
```

### Backfill Absensi

Saat user membuka halaman presensi, sistem otomatis mengisi rekaman "absen" untuk hari kerja yang terlewat:

```
AttendanceService.ensureAttendanceRecords(userId, startDate, endDate):
    │
    ├── Cek user.is_active → skip jika false
    ├── Cek division.is_active → skip jika false
    ├── Iterasi setiap hari dalam range
    │   ├── Skip jika sudah ada record
    │   ├── Skip jika bukan hari kerja (libur/weekend)
    │   ├── Skip jika sebelum user join divisi
    │   ├── Skip jika user sedang izin (approved leave)
    │   └── Buat record "absent" jika semua kondisi terpenuhi
    └── Bulk insert records baru
```

---

## 🔗 Middleware Stack

Urutan middleware yang diterapkan pada setiap request:

```
Request
    │
    ├── 1. CORS (express-cors)
    ├── 2. Body Parser (express.json)
    ├── 3. Cookie Parser (cookie-parser)
    │
    ├── [Route matched]
    │
    ├── 4. auth.js          → Decode JWT + DB is_active check
    ├── 5. roleCheck.js     → Cek role sesuai route
    │
    ├── [Write endpoints saja:]
    ├── 6. validateWorkday  → Hari kerja? (untuk check-in)
    ├── 7. checkDivisionActive → Divisi aktif?
    ├── 8. Multer upload    → Handle file upload
    │
    └── 9. Controller       → Business logic
```

---

## 💡 Keputusan Desain

### 1. JWT + DB Query (Hybrid Auth)

**Masalah:** JWT stateless tidak bisa di-invalidate saat user dinonaktifkan.

**Solusi:** Setiap request query DB untuk cek `is_active`. Trade-off: 1 extra DB query per request.

**Mitigasi performance:** Query hanya 1 kolom (`is_active`) dari tabel `users` by primary key — sangat cepat karena indexed. Jika traffic sangat tinggi, pertimbangkan Redis cache (60 detik TTL).

### 2. Upload Struktur per Periode/Batch

**Masalah:** Dengan ribuan user selama bertahun-tahun, satu folder bisa memiliki ratusan ribu file.

**Solusi:** Hierarki `periode → year → month → division` memastikan max ~500 file per folder terminal (asumsi 1 foto/hari, 25 hari kerja/bulan, 20 user/divisi).

### 3. Soft Deactivation vs Hard Delete

**Prinsip:** Data historis **tidak pernah dihapus**, hanya dinonaktifkan.

- User/divisi dinonaktifkan → `is_active: false`, data tetap ada
- Delete user hanya dilakukan admin dengan konfirmasi eksplisit
- Rekaman presensi, logbook, izin tidak ikut terhapus

### 4. Frontend Tanpa `.env`

**Masalah:** Konfigurasi seperti Google Client ID berbeda per environment.

**Solusi:** Backend expose endpoint `/api/config` yang mengembalikan konfigurasi publik. Frontend fetch sekali saat load. Tidak perlu rebuild frontend untuk ganti konfigurasi.

---

**Last Updated:** Mei 2026  
**Maintainer:** Handika Sinaga
