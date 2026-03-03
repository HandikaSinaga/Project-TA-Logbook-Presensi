# 📚 Dokumentasi Project - Sistem Presensi & Logbook

Selamat datang di folder dokumentasi! Folder ini berisi semua panduan teknis yang Anda butuhkan untuk memahami, mengembangkan, dan men-deploy aplikasi Sistem Presensi & Logbook.

---

## 📑 Daftar Dokumen

### 🚀 Deployment & Setup

#### [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Panduan deployment lengkap untuk semua environment**

**Isi:**

- ✅ Setup lokal (development)
- ✅ Deployment ke AWS (EC2 + RDS)
- ✅ Deployment ke Railway/Render
- ✅ Setup VPS manual
- ✅ Konfigurasi Nginx sebagai reverse proxy
- ✅ Setup domain & SSL certificate
- ✅ Monitoring & maintenance
- ✅ Troubleshooting common issues
- ✅ Estimasi biaya cloud provider

**Kapan menggunakan:**

- Pertama kali setup project
- Deploy ke production/staging
- Troubleshooting deployment issues

---

#### [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md)

**Panduan lengkap environment variables & konfigurasi**

**Isi:**

- ✅ Penjelasan setiap environment variable
- ✅ Setup JWT secrets (4 secrets berbeda)
- ✅ Konfigurasi database (MySQL)
- ✅ Setup Google OAuth 2.0 (step-by-step)
- ✅ Konfigurasi email SMTP (Gmail)
- ✅ Configuration per environment (dev/staging/production)
- ✅ Security best practices
- ✅ Troubleshooting konfigurasi

**Kapan menggunakan:**

- Setup `.env` file
- Masalah authentication (JWT, Google OAuth)
- Setup email notifications
- Security audit

---

### 🔌 API Documentation

#### [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

**Dokumentasi lengkap REST API endpoints**

**Isi:**

- ✅ Authentication flow (JWT, Google OAuth)
- ✅ Auth endpoints (login, register, forgot password)
- ✅ User management endpoints
- ✅ Attendance endpoints (check-in/out, history)
- ✅ Logbook endpoints (create, approve, reject)
- ✅ Leave management endpoints
- ✅ Dashboard statistics endpoints
- ✅ Reports generation endpoints
- ✅ Settings configuration endpoints
- ✅ Error handling & status codes
- ✅ Rate limiting policies

**Kapan menggunakan:**

- Integrasi frontend-backend
- Testing API dengan Postman/Thunder Client
- Debugging API issues
- Development fitur baru

---

### 💾 Database

#### [db-ta.sql](./db-ta.sql)

**Database schema & sample data**

**Isi:**

- ✅ Complete database structure (30+ tables)
- ✅ Sample users (admin, supervisor, user)
- ✅ System settings defaults
- ✅ Office locations & divisions
- ✅ Sample attendance & logbook data

**Kapan menggunakan:**

- Initial database setup
- Reset database ke clean state
- Migration ke server baru

**Import Database:**

```bash
# MySQL command line
mysql -u root -p db_presensi_ta < docs/db-ta.sql

# AWS RDS
mysql -h [RDS_ENDPOINT] -u admin -p db_presensi_ta < docs/db-ta.sql
```

---

## 🗂️ Struktur Dokumentasi

```
docs/
├── DEPLOYMENT_GUIDE.md          # 📦 Panduan deployment lengkap
├── API_DOCUMENTATION.md         # 🔌 Dokumentasi REST API
├── ENVIRONMENT_CONFIG.md        # 🔧 Konfigurasi environment variables
├── db-ta.sql                    # 💾 Database schema & data
└── README.md                    # 📚 Dokumen ini
```

---

## 🚀 Quick Start Guide

### 1. Setup Lokal (First Time)

**Step 1: Clone Repository**

```bash
git clone https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi.git
cd Project-TA-Logbook-Presensi
```

**Step 2: Setup Database**

```bash
# Login MySQL
mysql -u root -p

# Create database
CREATE DATABASE db_presensi_ta;
USE db_presensi_ta;
SOURCE docs/db-ta.sql;
```

**Step 3: Setup Backend**

```bash
cd backend
npm install
cp .env.example .env
nano .env  # Edit konfigurasi (lihat ENVIRONMENT_CONFIG.md)
npm run dev
```

**Step 4: Setup Frontend**

```bash
cd frontend
npm install
npm run dev
```

**Step 5: Access Application**

- Frontend: http://localhost:5173
- Backend: http://localhost:3001/api
- Login: `admin@presensi.com` / `admin123`

**📖 Detail lengkap:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#deployment-lokal)

---

### 2. Deploy ke Production

**Pilih Cloud Provider:**

#### Option A: AWS (EC2 + RDS)

- ✅ Scalable & professional
- ✅ Free tier 12 bulan
- ✅ Full control infrastructure
- ❌ Complex setup
- **Cost:** FREE (1 tahun), ~$25-57/bulan setelahnya

#### Option B: Railway/Render

- ✅ Simple & fast deployment
- ✅ Git-based auto deploy
- ✅ Managed database
- ❌ Limited free tier
- **Cost:** ~$10-20/bulan

#### Option C: VPS (DigitalOcean, Vultr, Linode)

- ✅ Full control
- ✅ Predictable pricing
- ✅ Good performance
- ❌ Manual setup
- **Cost:** ~$12-27/bulan

**📖 Panduan lengkap untuk semua provider:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#deployment-production)

---

### 3. Setup Environment Variables

**File:** `backend/.env`

**Minimal Configuration:**

```env
APP_PORT=3001
NODE_ENV=production
CLIENT_URL=https://yourdomain.com

DB_HOST=[RDS_ENDPOINT]
DB_USER=admin
DB_PASSWORD=[STRONG_PASSWORD]
DB_NAME=db_presensi_ta

JWT_SECRET=[64_CHARS_RANDOM]
ACCESS_TOKEN_SECRET=[64_CHARS_RANDOM]
REFRESH_TOKEN_SECRET=[64_CHARS_RANDOM]
RESET_PASSWORD_SECRET=[64_CHARS_RANDOM]
```

**Generate Secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**📖 Penjelasan lengkap setiap variable:** [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md)

---

### 4. Testing API

**Using cURL:**

```bash
# Test config endpoint
curl http://localhost:3001/api/config

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@presensi.com","password":"admin123"}'
```

**Using Postman:**

1. Import collection (coming soon)
2. Set baseUrl: `http://localhost:3001/api`
3. Login → Copy token
4. Set Authorization: `Bearer {token}`

**📖 Full API reference:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🔧 Troubleshooting

### Issue: Cannot connect to database

**Error:**

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**

1. Check MySQL is running
2. Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` di `.env`
3. Test connection: `mysql -h localhost -u root -p`

**📖 More solutions:** [ENVIRONMENT_CONFIG.md - Troubleshooting](./ENVIRONMENT_CONFIG.md#troubleshooting)

---

### Issue: Invalid JWT token

**Error:**

```json
{ "success": false, "message": "Invalid token" }
```

**Solution:**

1. Regenerate JWT secrets (4 secrets berbeda)
2. Update `.env`
3. Restart backend
4. Clear localStorage & login again

**📖 More solutions:** [ENVIRONMENT_CONFIG.md - Issue 2](./ENVIRONMENT_CONFIG.md#issue-2-invalid-jwt-token)

---

### Issue: Google OAuth not working

**Error:**

```
redirect_uri_mismatch
```

**Solution:**

1. Check `GOOGLE_REDIRECT_URI` di `.env`
2. Match dengan "Authorized redirect URIs" di Google Cloud Console
3. Enable Google+ API

**📖 Complete Google OAuth setup:** [ENVIRONMENT_CONFIG.md - Google OAuth Setup](./ENVIRONMENT_CONFIG.md#google-oauth-setup)

---

### Issue: CORS error

**Error:**

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**

1. Check `CLIENT_URL` di backend `.env`
2. Must match frontend URL exactly (no trailing slash)
3. Restart backend

**📖 More CORS solutions:** [ENVIRONMENT_CONFIG.md - Issue 5](./ENVIRONMENT_CONFIG.md#issue-5-cors-error)

---

## 📞 Support & Contact

### Dokumentasi Issues

Jika menemukan:

- Kesalahan di dokumentasi
- Informasi yang kurang jelas
- Step yang tidak work

**Buat issue di GitHub:**
https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi/issues

**Format Issue:**

```
Title: [DOCS] Nama masalah
Body:
- File: DEPLOYMENT_GUIDE.md
- Section: AWS EC2 Setup
- Issue: Step 5 tidak jelas...
- Suggestion: Tambahkan screenshot...
```

---

### Development Questions

**Email:** handika.sinaga@example.com

**GitHub Discussions:**
https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi/discussions

---

## 📝 Contributing to Documentation

Ingin improve dokumentasi? Follow step ini:

### 1. Fork & Clone

```bash
git clone https://github.com/YourUsername/Project-TA-Logbook-Presensi.git
cd Project-TA-Logbook-Presensi
git checkout -b docs-improvement
```

### 2. Edit Documentation

Edit file di `docs/`:

- Use Markdown format
- Add code examples
- Include screenshots if helpful
- Keep consistent formatting

### 3. Submit Pull Request

```bash
git add docs/
git commit -m "docs: improve deployment guide AWS section"
git push origin docs-improvement
```

Create PR di GitHub dengan description yang jelas.

---

## 🗓️ Documentation Updates

### Version History

**v1.0.0 (February 2026)**

- ✅ Initial complete documentation
- ✅ DEPLOYMENT_GUIDE.md created
- ✅ API_DOCUMENTATION.md updated
- ✅ ENVIRONMENT_CONFIG.md created
- ✅ README.md for docs folder

---

### Planned Updates

**v1.1.0 (March 2026)**

- [ ] Postman collection
- [ ] Docker deployment guide
- [ ] CI/CD pipeline documentation
- [ ] Performance optimization guide
- [ ] Security audit checklist

**v1.2.0 (April 2026)**

- [ ] Mobile app documentation
- [ ] GraphQL API documentation
- [ ] Microservices architecture guide

---

## 📚 Additional Resources

### External Documentation

**Node.js:**

- Official: https://nodejs.org/docs
- Best Practices: https://github.com/goldbergyoni/nodebestpractices

**Express.js:**

- Official: https://expressjs.com
- Security: https://expressjs.com/en/advanced/best-practice-security.html

**React:**

- Official: https://react.dev
- Hooks: https://react.dev/reference/react

**MySQL:**

- Official: https://dev.mysql.com/doc/
- Optimization: https://dev.mysql.com/doc/refman/8.0/en/optimization.html

**AWS:**

- EC2: https://docs.aws.amazon.com/ec2/
- RDS: https://docs.aws.amazon.com/rds/
- VPC: https://docs.aws.amazon.com/vpc/

---

### Learning Resources

**Full Stack Development:**

- freeCodeCamp: https://www.freecodecamp.org
- The Odin Project: https://www.theodinproject.com

**DevOps & Deployment:**

- DigitalOcean Tutorials: https://www.digitalocean.com/community/tutorials
- AWS Training: https://aws.amazon.com/training/

**Security:**

- OWASP: https://owasp.org
- Web Security Academy: https://portswigger.net/web-security

---

## 🎯 Documentation Goals

Dokumentasi ini dibuat dengan tujuan:

1. **Onboarding Developer Baru**: Developer baru bisa setup environment < 30 menit
2. **Self-Service Troubleshooting**: 80% masalah bisa diselesaikan tanpa bantuan
3. **Production Ready**: Panduan production-ready dengan security best practices
4. **Maintainability**: Dokumentasi mudah di-update dan di-maintain
5. **Comprehensive**: Cover semua aspek dari development sampai production

---

**Last Updated**: February 2026  
**Maintainer**: Handika Sinaga  
**License**: MIT
