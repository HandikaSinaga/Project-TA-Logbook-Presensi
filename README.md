# 🚀 Sistem Presensi & Logbook - Full Stack Web Application

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.19.2-lightgrey.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistem manajemen presensi dan logbook modern yang dibangun dengan **React 18** (Frontend) dan **Express.js** (Backend), dirancang untuk performa tingkat enterprise dengan kontrol akses berbasis role, notifikasi real-time, dan pelaporan komprehensif.

---

## 📋 Daftar Isi

-   [Fitur Utama](#-fitur-utama)
-   [Teknologi](#-teknologi)
-   [Struktur Project](#-struktur-project)
-   [Instalasi](#-instalasi)
-   [Konfigurasi](#-konfigurasi)
-   [Development](#-development)
-   [Deployment](#-deployment)
-   [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

### 👥 Manajemen User

-   **Multi-role System**: Role Admin, Supervisor, dan User dengan permission granular
-   **Import/Export User**: Manajemen user massal via Excel template
-   **Manajemen Profil**: Upload avatar dengan crop image, informasi personal
-   **Manajemen Divisi**: Organisasi user berdasarkan departemen
-   **Aktivasi/Deaktivasi**: Kontrol status akun user
-   **Reset Password**: Fitur reset password untuk admin

### 📅 Sistem Presensi

-   **Check-in/Check-out**: Verifikasi lokasi berbasis GPS
-   **Deteksi Tipe Kerja**: Onsite (di kantor) atau Offsite (di luar kantor) otomatis
-   **Validasi Lokasi**: Radius GPS dan koordinat kantor
-   **Capture Foto**: Foto selfie untuk verifikasi identitas
-   **Auto Checkout**: Checkout otomatis di akhir hari
-   **Deteksi Keterlambatan**: Status otomatis berdasarkan jadwal kantor
-   **Riwayat Presensi**: History lengkap dengan detail waktu dan lokasi

### 📝 Manajemen Logbook

-   **Tracking Aktivitas Harian**: Catat aktivitas kerja dengan deskripsi detail
-   **Progress Percentage**: Persentase penyelesaian kegiatan
-   **Attachment File**: Upload dokumen pendukung
-   **Sistem Review**: Supervisor dapat review dan approve logbook
-   **Status Approval**: Pending, Approved, Rejected dengan feedback
-   **Filter & Export**: Filter data dan export ke Excel

### 🏖️ Manajemen Izin

-   **Multiple Leave Types**: Sakit, cuti, keperluan pribadi
-   **Durasi Multi-hari**: Support izin beberapa hari
-   **Workflow Approval**: Request → Review → Approval
-   **Upload Dokumen**: Lampirkan surat keterangan atau dokumen pendukung
-   **History Izin**: Riwayat pengajuan dengan status lengkap

### 📊 Laporan & Analitik

-   **Dashboard Real-time**: Statistik terkini untuk setiap role
-   **Multiple Report Types**: Laporan presensi, logbook, izin
-   **Advanced Filters**: Filter berdasarkan divisi, periode, tanggal
-   **Export ke Excel**: Format profesional dengan data lengkap
-   **Visualisasi Data**: Grafik dan tabel interaktif

### 🔔 Notifikasi Real-time

-   **Live Updates**: Sistem notifikasi berbasis WebSocket
-   **Action Notifications**: Approval, rejection, perubahan status
-   **Unread Counter**: Indikator visual untuk notifikasi baru
-   **Notification Center**: Manajemen notifikasi terpusat

### 🎨 Modern UI/UX

-   **Responsive Design**: Optimasi untuk mobile, tablet, desktop
-   **Bootstrap 5.3**: Framework UI modern dan konsisten
-   **Interactive Components**: Modal, toast notifications, tooltips
-   **Tab Navigation**: Presentasi data terorganisir
-   **Badge Counters**: Ringkasan data visual

### 🔒 Fitur Keamanan

-   **JWT Authentication**: Autentikasi berbasis token yang aman
-   **Google OAuth**: Login dengan akun Google
-   **Password Encryption**: Hashing dengan Bcrypt
-   **CORS Protection**: Kebijakan cross-origin yang dapat dikonfigurasi
-   **Role-based Access**: Sistem permission granular
-   **Token Refresh**: Automatic token renewal

---

## 🛠 Teknologi

### Backend

| Teknologi           | Versi   | Fungsi                    |
| ------------------- | ------- | ------------------------- |
| **Node.js**         | 22.x    | Runtime environment       |
| **Express.js**      | 4.19.2  | Web framework             |
| **MySQL**           | 8.0+    | Relational database       |
| **Sequelize**       | 6.37.3  | ORM untuk database        |
| **JWT**             | 9.0.2   | Authentication            |
| **Bcrypt**          | 5.1.1   | Password hashing          |
| **Multer**          | 1.4.5   | File upload handling      |
| **ExcelJS**         | 4.4.0   | Excel file generation     |
| **Node-cron**       | 3.0.3   | Scheduled tasks           |

### Frontend

| Teknologi            | Versi   | Fungsi                    |
| -------------------- | ------- | ------------------------- |
| **React**            | 18.3.1  | UI library                |
| **Vite**             | 5.3.4   | Build tool & dev server   |
| **React Router**     | 6.26.0  | Client-side routing       |
| **Axios**            | 1.7.7   | HTTP client               |
| **Bootstrap**        | 5.3.3   | CSS framework             |
| **React Bootstrap**  | 2.10.4  | React UI components       |
| **React Hot Toast**  | 2.4.1   | Notifications             |
| **React Image Crop** | 11.0.7  | Image cropping            |

---

## 📁 Struktur Project

```
project-ta/
├── backend/                    # Express.js API Server (Port 3001)
│   ├── config/                 # Konfigurasi database & aplikasi
│   ├── controllers/            # Business logic handlers
│   ├── database/               # Migrations & seeders
│   ├── middlewares/            # Express middlewares
│   ├── models/                 # Sequelize ORM models
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic services
│   ├── utils/                  # Helper utilities
│   ├── public/uploads/         # User uploads
│   └── index.js                # Server entry point
│
├── frontend/                   # React SPA (Port 5173)
│   ├── src/
│   │   ├── assets/             # Static assets
│   │   ├── roles/              # Role-based components
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── supervisor/     # Supervisor panel
│   │   │   └── user/           # User interface
│   │   ├── utils/              # Helper utilities
│   │   └── App.jsx             # Root component
│   ├── public/                 # Public assets
│   └── vite.config.js          # Vite configuration
│
├── docs/                       # Documentation
│   ├── API_DOCUMENTATION.md    # API reference
│   ├── AWS_DEPLOYMENT_GUIDE.md # Cloud deployment guide
│   └── development-reports/    # Development logs (archived)
│
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
├── LICENSE                     # MIT License
└── QUICK-START.md              # Quick start guide
```

---

## 🚀 Installation

### Prerequisites

Ensure you have the following installed:

-   **Node.js** 22.x or higher ([Download](https://nodejs.org/))
-   **MySQL** 8.0 or higher ([Download](https://www.mysql.com/downloads/))
-   **Git** ([Download](https://git-scm.com/downloads))

### 1. Clone Repository

```bash
git clone https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi.git
cd Project-TA-Logbook-Presensi
```

### 2. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE db_presensi_ta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# nano .env  (Linux/Mac)
# notepad .env  (Windows)

# Run migrations
npx sequelize-cli db:migrate

# Seed development data (optional)
npx sequelize-cli db:seed:all

# Start server
npm start
```

✅ Backend should now be running on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server (no .env needed!)
npm run dev
```

✅ Frontend should now be running on `http://localhost:5173`

**Note:** Frontend tidak memerlukan file `.env`! Semua konfigurasi (Google Client ID, API URL, dll) diambil dari backend melalui endpoint `/api/config`.

---

## ⚙️ Konfigurasi

### Backend Environment Variables

Buat file `.env` di folder `backend/`:

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
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=24h

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend Configuration

**Frontend TIDAK memerlukan file `.env`!**

Semua konfigurasi diambil dari backend melalui endpoint `/api/config`.

---

## 👨‍💻 Development

### Menjalankan Aplikasi

#### Backend
```bash
cd backend
npm run dev    # Development mode dengan auto-reload
```

Backend berjalan di `http://localhost:3001`

#### Frontend
```bash
cd frontend
npm run dev    # Development server
```

Frontend berjalan di `http://localhost:5173`

### Build untuk Production

```bash
cd frontend
npm run build  # Output: dist/ folder
```

### Default Test Credentials

**Admin:**
- Email: `admin@presensi.com`
- Password: `admin123`

**Supervisor:**

-   Email: `supervisor@presensi.com`
-   Password: `super123`

**User:**

-   Email: `user@presensi.com`
-   Password: `user123`

---

## 📚 API Documentation

Comprehensive API documentation is available at [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

### Quick API Reference

**Base URL:** `http://localhost:3001`

| Endpoint                    | Method | Description          | Auth Required |
| --------------------------- | ------ | -------------------- | ------------- |
| `/auth/login`               | POST   | User login           | No            |
| `/auth/google`              | GET    | Google OAuth         | No            |
| `/auth/refresh`             | POST   | Refresh token        | Yes           |
| `/admin/users`              | GET    | List users           | Admin         |
| `/admin/users/:id`          | PUT    | Update user          | Admin         |
| `/attendance/check-in`      | POST   | Check in             | User          |
| `/attendance/check-out/:id` | PUT    | Check out            | User          |
| `/logbook`                  | POST   | Create logbook       | User          |
| `/leave`                    | POST   | Submit leave request | User          |
| `/admin/reports/attendance` | GET    | Attendance report    | Admin         |

See full documentation for request/response examples, authentication, and error codes.

---

## 🚀 Deployment

### Deployment to AWS

Comprehensive AWS deployment guide is available at [docs/AWS_DEPLOYMENT_GUIDE.md](./docs/AWS_DEPLOYMENT_GUIDE.md)

**Quick Overview:**

1. **Backend (EC2 + PM2)**: Deploy Node.js application with process manager
2. **Database (RDS MySQL)**: Managed database service with automated backups
3. **File Storage (S3)**: Store user uploads (avatars, attendance, leave documents)
4. **Frontend (Nginx or S3+CloudFront)**:
    - **Option A**: Nginx serves `dist/` folder (simple setup)
    - **Option B**: S3 + CloudFront CDN (production-grade)
5. **Domain (Route 53 + ACM)**: DNS management with SSL certificates

**Production Build Process:**

```bash
# 1. Build frontend locally
cd frontend
npm run build  # Creates dist/ folder

# 2. Upload ONLY dist/ folder to server
rsync -avz dist/ user@server:/var/www/presensi/

# 3. Nginx serves dist/ folder
# See docs/AWS_DEPLOYMENT_GUIDE.md for Nginx config
```

6. **Application Load Balancer**: HTTPS & load balancing
7. **CloudWatch**: Monitoring and logs

### Other Deployment Options

#### Heroku (Backend)

```bash
heroku create your-app-name
heroku addons:create cleardb:ignite
git push heroku main
```

#### Vercel (Frontend)

```bash
npm install -g vercel
vercel --prod
```
- Email: `supervisor@presensi.com`
- Password: `supervisor123`

**User:**
- Email: `user@presensi.com`
- Password: `user123`

---

## 🚀 Deployment

### Build untuk Production

```bash
cd frontend
npm run build
```

Build output akan berada di folder `dist/`.

### Deploy ke Server

1. Upload folder `dist/` ke web server (Nginx/Apache)
2. Setup backend di server dengan PM2 atau similar
3. Konfigurasi database di server
4. Update environment variables untuk production

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check MySQL service
mysql -u root -p

# Verify credentials di .env
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### CORS Error
- Cek `CORS_ORIGIN` di backend `.env`
- Pastikan sesuai dengan URL frontend

---

## 📝 Lisensi

Project ini dilisensikan di bawah **MIT License**.

---

## 👨‍💻 Developer

**Handika Sinaga**
- GitHub: [@HandikaSinaga](https://github.com/HandikaSinaga)
- Repository: [Project-TA-Logbook-Presensi](https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi)

---

## 📞 Support

Jika menemukan bug atau memiliki pertanyaan, silakan buat issue di GitHub repository.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨‍💻 Author

**Handika Sinaga**

-   GitHub: [@HandikaSinaga](https://github.com/HandikaSinaga)
-   Repository: [Project-TA-Logbook-Presensi](https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi)

---

## 🙏 Acknowledgments

-   React Team for amazing framework
-   Express.js community
-   Sequelize ORM developers
-   Bootstrap team
-   All open-source contributors

---

## 📮 Support

For support, email handika.sinaga@example.com or open an issue in the repository.

---

## 🗺 Roadmap

### Version 2.0 (Planned)

-   [ ] Mobile app (React Native)
-   [ ] Advanced analytics dashboard
-   [ ] Biometric attendance
-   [ ] Multi-language support
-   [ ] Time tracking integration
-   [ ] Payroll integration
-   [ ] API webhooks

### Version 1.5 (In Progress)

-   [x] Real-time notifications
-   [x] Advanced reporting with pagination
-   [x] Google OAuth integration
-   [ ] Email notifications
-   [ ] PDF export reports
-   [ ] Calendar integration

---

**Made with ❤️ by Handika Sinaga**

⭐ Star this repo if you find it helpful!
