# 🚀 Sistem Presensi & Logbook

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.19.2-000000?logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistem manajemen presensi dan logbook modern berbasis web untuk organisasi/instansi magang. Dibangun dengan **React 18** (Frontend) dan **Express.js** (Backend), dengan kontrol akses berbasis role, notifikasi real-time, dan pelaporan komprehensif.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi](#-teknologi)
- [Struktur Project](#-struktur-project)
- [Quick Start](#-quick-start)
- [Konfigurasi Environment](#️-konfigurasi-environment)
- [Development](#-development)
- [Dokumentasi Lengkap](#-dokumentasi-lengkap)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

### 👥 Manajemen User & Divisi
- **Multi-role System**: Admin, Supervisor, dan User dengan permission granular
- **Lifecycle Management**: Aktivasi/nonaktivasi user dan divisi — data terhenti otomatis saat nonaktif
- **Import/Export User**: Manajemen massal via Excel template
- **Manajemen Divisi**: Organisasi per divisi dengan periode/batch
- **Reset Password**: Admin dapat reset password user

### 📅 Sistem Presensi
- **Check-in/Check-out**: Verifikasi lokasi berbasis GPS + IP/WiFi
- **Deteksi Tipe Kerja**: Onsite (di kantor) atau Offsite otomatis
- **Capture Foto**: Selfie untuk verifikasi identitas
- **Auto Checkout**: Checkout otomatis di akhir hari kerja
- **Kalender Kerja**: Hari libur nasional, cuti bersama, jadwal custom

### 📝 Manajemen Logbook
- **Tracking Aktivitas Harian**: Deskripsi aktivitas dengan progress persentase
- **Attachment File**: Upload dokumen pendukung
- **Sistem Review**: Supervisor dapat review dan approve logbook

### 🏖️ Manajemen Izin
- **Multiple Leave Types**: Sakit, cuti, keperluan pribadi, dan lainnya
- **Durasi Multi-hari**: Support izin beberapa hari sekaligus
- **Workflow Approval**: Request → Supervisor Review → Keputusan
- **Upload Dokumen**: Lampirkan surat keterangan

### 📊 Laporan & Analitik
- **Dashboard Real-time**: Statistik terkini per role
- **Multiple Report Types**: Laporan presensi, logbook, dan izin
- **Advanced Filters**: Filter divisi (searchable), periode, tanggal range, dan user spesifik
- **Export ke Excel**: Format profesional dengan data lengkap

### 🔒 Keamanan
- **JWT + DB Validation**: Token diverifikasi ke DB setiap request — akun nonaktif langsung ditolak
- **Google OAuth 2.0**: Login dengan akun Google
- **Password Hashing**: Bcrypt dengan salt rounds
- **Role-based Access Control**: Permission granular per role
- **Division Active Guard**: Operasi data diblokir jika divisi sedang nonaktif

---

## 🛠 Teknologi

### Backend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Node.js** | 22.x | Runtime environment |
| **Express.js** | 4.19.2 | Web framework |
| **MySQL** | 8.0+ | Relational database |
| **Sequelize** | 6.37.3 | ORM |
| **JWT** | 9.0.2 | Authentication |
| **Bcrypt** | 5.1.1 | Password hashing |
| **Multer** | 1.4.5 | File upload handling |
| **Sharp** | latest | Image optimization (WebP) |
| **ExcelJS** | 4.4.0 | Excel export |
| **Node-cron** | 3.0.3 | Scheduled tasks |
| **Socket.io** | latest | Real-time notifications |

### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React** | 18.3.1 | UI library |
| **Vite** | 5.3.4 | Build tool & dev server |
| **React Router** | 6.26.0 | Client-side routing |
| **Axios** | 1.7.7 | HTTP client |
| **Bootstrap** | 5.3.3 | CSS framework |
| **React Bootstrap** | 2.10.4 | React UI components |
| **React Hot Toast** | 2.4.1 | Toast notifications |

---

## 📁 Struktur Project

```
Project-TA-Logbook-Presensi/
├── backend/                         # Express.js API Server (Port 3001)
│   ├── config/
│   │   ├── config.js                # Sequelize DB config
│   │   └── uploadConfig.js          # Multer upload config
│   ├── controllers/                 # Business logic handlers
│   │   ├── AuthController.js
│   │   ├── AttendanceController.js
│   │   ├── CalendarController.js
│   │   ├── DashboardController.js
│   │   ├── DivisionController.js
│   │   ├── LeaveController.js
│   │   ├── LogbookController.js
│   │   ├── ProfileController.js
│   │   ├── ReportController.js
│   │   ├── SettingsController.js
│   │   └── UserController.js
│   ├── database/
│   │   ├── db.js                    # Database connection
│   │   ├── migrations/              # Sequelize migrations
│   │   └── seeders/                 # Database seeders
│   ├── middlewares/
│   │   ├── auth.js                  # JWT + DB is_active validation
│   │   ├── checkDivisionActive.js   # Division lifecycle guard
│   │   ├── divisionAccessControl.js # Division access control
│   │   ├── roleCheck.js             # Role-based access
│   │   ├── validateWorkday.js       # Workday validation
│   │   └── uploadAvatar.js          # Avatar upload handler
│   ├── models/
│   │   ├── index.js                 # Model associations
│   │   ├── attendanceModels/
│   │   ├── divisionsModels/
│   │   ├── leaveModels/
│   │   ├── logbookModels/
│   │   ├── officeNetworkModels/
│   │   ├── settingsModels/
│   │   └── usersModels/
│   ├── routes/
│   │   ├── index.js
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── supervisorRoutes.js
│   │   └── userRoutes.js
│   ├── scripts/
│   │   └── cleanupUploads.js        # Storage cleanup utility
│   ├── services/
│   │   ├── AttendanceService.js     # Attendance backfill logic
│   │   ├── ExportService.js         # Excel export
│   │   ├── ImportExportUserService.js
│   │   └── WorkCalendarService.js
│   ├── utils/
│   │   ├── dateHelper.js
│   │   ├── locationHelper.js
│   │   ├── timeValidationHelper.js
│   │   └── uploadHelper.js          # Organized file storage
│   ├── public/
│   │   └── uploads/                 # File storage (lihat struktur di docs/)
│   │       ├── attendance/
│   │       ├── avatars/
│   │       ├── leave/
│   │       └── logbook/
│   ├── .env.example
│   ├── index.js                     # Server entry point
│   └── package.json
│
├── frontend/                        # React SPA (Port 5173)
│   ├── src/
│   │   ├── assets/styles/           # CSS (index.css, darkmode.css)
│   │   ├── components/layout/       # Layout components per role
│   │   ├── context/                 # React Context (Theme, Auth, etc.)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── roles/                   # Pages per role
│   │   │   ├── admin/
│   │   │   ├── supervisor/
│   │   │   ├── user/
│   │   │   └── public/              # Login & public pages
│   │   ├── utils/
│   │   │   ├── axiosInstance.jsx    # Axios with interceptors
│   │   │   ├── Constant.jsx         # App constants
│   │   │   └── ProtectedRoute.jsx   # Route guard
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/                            # Dokumentasi teknis
│   ├── README.md                    # Docs index (file ini)
│   ├── DEPLOYMENT_GUIDE.md          # Panduan deployment
│   └── ARCHITECTURE.md              # Arsitektur sistem
│
├── .gitignore
├── LICENSE
└── README.md                        # File ini
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 22.x → [nodejs.org](https://nodejs.org/)
- **MySQL** ≥ 8.0 → [mysql.com](https://www.mysql.com/downloads/)
- **Git** → [git-scm.com](https://git-scm.com/)

### 1. Clone Repository

```bash
git clone https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi.git
cd Project-TA-Logbook-Presensi
```

### 2. Setup Database

```bash
mysql -u root -p
CREATE DATABASE db_presensi_ta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi Anda
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all  # Opsional: sample data
npm run dev
```

✅ Backend berjalan di `http://localhost:3001`

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend berjalan di `http://localhost:5173`

> **Note:** Frontend **tidak memerlukan** file `.env`. Semua konfigurasi (Google Client ID, API URL) diambil dari backend melalui endpoint `/api/config`.

### 5. Akun Default

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@presensi.com` | `admin123` |
| Supervisor | `supervisor@presensi.com` | `super123` |
| User | `user@presensi.com` | `user123` |

---

## ⚙️ Konfigurasi Environment

Buat file `backend/.env` berdasarkan template `backend/.env.example`:

```env
# Application
APP_PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=db_presensi_ta

# JWT
JWT_SECRET=your_jwt_secret_key_minimum_32_characters

# Google OAuth (Opsional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CORS
CORS_ORIGIN=http://localhost:5173
```

Generate JWT secret yang aman:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 👨‍💻 Development

### Available Scripts

**Backend:**
```bash
npm run dev     # Development mode (nodemon auto-reload)
npm start       # Production mode
```

**Frontend:**
```bash
npm run dev     # Development server (Vite HMR)
npm run build   # Production build → dist/
npm run preview # Preview production build
```

**Utility:**
```bash
# Cleanup orphaned upload files (tidak ada di DB)
cd backend
node scripts/cleanupUploads.js --dry-run  # Preview dulu
node scripts/cleanupUploads.js            # Eksekusi

# Database management
npx sequelize-cli db:migrate              # Run migrations
npx sequelize-cli db:migrate:undo         # Rollback migration
npx sequelize-cli db:seed:all             # Run all seeders
```

---

## 📚 Dokumentasi Lengkap

Dokumentasi teknis tersedia di folder [`docs/`](./docs/README.md):

| Dokumen | Deskripsi |
|---------|-----------|
| [docs/README.md](./docs/README.md) | Index dokumentasi & Quick Reference |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arsitektur sistem, security model, storage |
| [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Panduan deployment production |

---

## 🐛 Troubleshooting

**Database Connection Error:**
```bash
# Verifikasi MySQL berjalan
mysql -u root -p
# Cek DB_HOST, DB_USER, DB_PASSWORD di .env
```

**Port Already In Use:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**CORS Error:**
- Pastikan `CORS_ORIGIN` di `backend/.env` sesuai dengan URL frontend (tanpa trailing slash)

**Akun Tidak Bisa Login:**
- Pastikan `is_active = true` di tabel `users`
- Cek apakah divisi user juga masih aktif (`is_active = true` di tabel `divisions`)

---

## 📝 Lisensi

Project ini dilisensikan di bawah **[MIT License](LICENSE)**.

---

## 👨‍💻 Author

**Handika Sinaga**

- GitHub: [@HandikaSinaga](https://github.com/HandikaSinaga)
- Repository: [Project-TA-Logbook-Presensi](https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi)

---

**Made with ❤️ for Tugas Akhir**
