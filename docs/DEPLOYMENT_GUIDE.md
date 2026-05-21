# 🚀 Deployment Guide — Sistem Presensi & Logbook

> Panduan ini mencakup setup lokal untuk development hingga deployment ke server production.

---

## 📋 Daftar Isi

- [Prerequisites](#-prerequisites)
- [Setup Lokal (Development)](#-setup-lokal-development)
- [Konfigurasi Environment](#️-konfigurasi-environment)
- [Google OAuth Setup](#-google-oauth-setup-opsional)
- [Deploy ke Production](#-deploy-ke-production)
  - [Option A: VPS/Dedicated Server](#option-a-vpsdedicated-server)
  - [Option B: Railway / Render](#option-b-railway--render)
  - [Option C: AWS (EC2 + RDS)](#option-c-aws-ec2--rds)
- [Konfigurasi Nginx](#-konfigurasi-nginx)
- [SSL Certificate](#-ssl-certificate)
- [Monitoring & Maintenance](#-monitoring--maintenance)
- [Troubleshooting](#-troubleshooting)

---

## 📋 Prerequisites

| Kebutuhan | Versi Minimum | Download |
|-----------|--------------|---------|
| Node.js | 22.x LTS | [nodejs.org](https://nodejs.org/) |
| MySQL | 8.0 | [mysql.com](https://www.mysql.com/downloads/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |
| npm | 10.x (bundled with Node) | — |

Untuk production tambahan:
- **PM2**: Process manager (`npm install -g pm2`)
- **Nginx**: Reverse proxy & static file server
- **Certbot**: SSL certificate (Let's Encrypt)

---

## 💻 Setup Lokal (Development)

### 1. Clone Repository

```bash
git clone https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi.git
cd Project-TA-Logbook-Presensi
```

### 2. Setup Database

```bash
# Login MySQL
mysql -u root -p

# Buat database
CREATE DATABASE db_presensi_ta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy dan edit file environment
cp .env.example .env
# Edit .env sesuai konfigurasi lokal Anda

# Jalankan migrasi database
npx sequelize-cli db:migrate

# (Opsional) Isi sample data
npx sequelize-cli db:seed:all

# Jalankan development server
npm run dev
```

✅ Backend berjalan di: `http://localhost:3001`

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

✅ Frontend berjalan di: `http://localhost:5173`

### 5. Verifikasi

Buka `http://localhost:5173` dan login dengan:
- Admin: `admin@presensi.com` / `admin123`
- Supervisor: `supervisor@presensi.com` / `super123`
- User: `user@presensi.com` / `user123`

---

## ⚙️ Konfigurasi Environment

Buat file `backend/.env` berdasarkan `backend/.env.example`:

```env
# ─── Application ───────────────────────────────────────────
APP_PORT=3001
NODE_ENV=development        # development | production

# ─── Database ──────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=db_presensi_ta

# ─── JWT Authentication ────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_jwt_secret_minimum_32_chars
JWT_EXPIRES_IN=24h

# ─── CORS ──────────────────────────────────────────────────
# URL frontend (tanpa trailing slash)
CORS_ORIGIN=http://localhost:5173

# ─── Google OAuth (Opsional) ───────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

### Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Nilai Wajib untuk Production

```env
NODE_ENV=production
DB_HOST=<ip-atau-hostname-server-db>
DB_PASSWORD=<password-kuat-minimal-20-karakter>
JWT_SECRET=<random-64-hex-chars>
CORS_ORIGIN=https://yourdomain.com
```

---

## 🔐 Google OAuth Setup (Opsional)

Jika ingin mengaktifkan login dengan Google:

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang ada
3. Aktifkan **Google+ API** dan **Google OAuth 2.0**
4. Buka **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Tambahkan **Authorized redirect URIs**:
   - Development: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
7. Copy **Client ID** dan **Client Secret** ke `backend/.env`

---

## 🌐 Deploy ke Production

### Option A: VPS/Dedicated Server

**Rekomendasi untuk:** Kontrol penuh, skala menengah.

**Provider:** DigitalOcean ($12/bln), Vultr ($12/bln), Linode ($12/bln), IDCloudHost (lokal)

#### 1. Persiapan Server (Ubuntu 22.04)

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install PM2 & Nginx
sudo npm install -g pm2
sudo apt install nginx -y
```

#### 2. Setup Database

```bash
sudo mysql -u root -p

CREATE DATABASE db_presensi_ta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'presensi_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON db_presensi_ta.* TO 'presensi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Upload & Setup Aplikasi

```bash
# Clone repository
git clone https://github.com/HandikaSinaga/Project-TA-Logbook-Presensi.git /var/www/presensi
cd /var/www/presensi

# Setup backend
cd backend
npm install --production
cp .env.example .env
nano .env   # Edit dengan konfigurasi production

# Jalankan migrasi
npx sequelize-cli db:migrate

# Setup permissions untuk uploads
mkdir -p public/uploads
chmod -R 755 public/uploads
```

#### 4. Build Frontend

```bash
# Di mesin lokal atau di server
cd frontend
npm install
npm run build
# Hasilnya ada di frontend/dist/
```

Upload folder `dist/` ke `/var/www/presensi/frontend/dist/` di server.

#### 5. Jalankan dengan PM2

```bash
cd /var/www/presensi/backend

# Start aplikasi
pm2 start index.js --name "presensi-backend"

# Auto-start saat server reboot
pm2 startup
pm2 save
```

**Perintah PM2 berguna:**
```bash
pm2 status            # Lihat status semua proses
pm2 logs presensi-backend   # Lihat log
pm2 restart presensi-backend  # Restart
pm2 stop presensi-backend     # Stop
```

---

### Option B: Railway / Render

**Rekomendasi untuk:** Deploy cepat, tidak mau urus server.

**Harga:** Railway ~$5-20/bln, Render ~$7-25/bln

#### Railway

1. Buat akun di [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Tambah **MySQL Plugin**
4. Set environment variables di Railway dashboard
5. Railway otomatis deploy saat push ke main branch

#### Render

1. Buat akun di [render.com](https://render.com)
2. New → Web Service → Connect GitHub
3. Build Command: `cd backend && npm install`
4. Start Command: `cd backend && node index.js`
5. Add environment variables
6. Tambah **PostgreSQL** atau gunakan external MySQL

> **Note:** Frontend bisa di-deploy terpisah ke **Vercel** atau **Netlify** (gratis untuk static sites).

---

### Option C: AWS (EC2 + RDS)

**Rekomendasi untuk:** Skala enterprise, kebutuhan tinggi.

#### Komponen AWS

| Komponen | Service AWS | Fungsi |
|----------|-------------|--------|
| Backend | EC2 (t3.micro) | Node.js server |
| Database | RDS MySQL | Managed database |
| File storage | S3 (opsional) | User uploads |
| Frontend | S3 + CloudFront | Static hosting |
| DNS + SSL | Route 53 + ACM | Domain & certificate |

#### Setup Singkat EC2

```bash
# EC2 instance: Ubuntu 22.04 t3.micro (free tier eligible)
# Security Group: Port 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API)

# SSH ke EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install dependencies (sama dengan Option A)
```

#### Setup RDS

1. RDS Console → Create database → MySQL 8.0
2. Template: Free tier
3. DB identifier: `presensi-db`
4. Credentials: username + strong password
5. Connectivity: same VPC sebagai EC2
6. Update `DB_HOST` di `.env` dengan RDS endpoint

#### Upload ke S3 (Opsional untuk file storage)

Jika menggunakan S3, modifikasi `backend/utils/uploadHelper.js` untuk menggunakan AWS SDK:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

Tambah ke `.env`:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=presensi-uploads
AWS_REGION=ap-southeast-1
```

---

## 🔧 Konfigurasi Nginx

Gunakan Nginx sebagai reverse proxy untuk backend dan serve static files untuk frontend.

### File Konfigurasi

```bash
sudo nano /etc/nginx/sites-available/presensi
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    root /var/www/presensi/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA routing
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Upload files (served directly)
    location /uploads/ {
        alias /var/www/presensi/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Aktifkan site
sudo ln -s /etc/nginx/sites-available/presensi /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate

Gunakan Let's Encrypt (gratis):

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew (sudah otomatis dengan systemd timer)
sudo certbot renew --dry-run
```

Certbot otomatis update konfigurasi Nginx untuk menggunakan HTTPS.

---

## 📊 Monitoring & Maintenance

### Log Aplikasi

```bash
# PM2 logs real-time
pm2 logs presensi-backend

# Simpan logs ke file
pm2 logs presensi-backend --lines 200 > app.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup Database

```bash
# Manual backup
mysqldump -u presensi_user -p db_presensi_ta > backup_$(date +%Y%m%d).sql

# Cron job backup otomatis harian jam 02:00
echo "0 2 * * * mysqldump -u presensi_user -p'password' db_presensi_ta > /backups/backup_\$(date +\%Y\%m\%d).sql" | crontab -
```

### Cleanup File Upload

Jalankan secara berkala untuk hapus file orphan:

```bash
# Preview dulu
node /var/www/presensi/backend/scripts/cleanupUploads.js --dry-run

# Eksekusi jika sudah yakin
node /var/www/presensi/backend/scripts/cleanupUploads.js

# Cron bulanan
echo "0 3 1 * * node /var/www/presensi/backend/scripts/cleanupUploads.js" | crontab -
```

### Update Aplikasi

```bash
cd /var/www/presensi

# Pull perubahan terbaru
git pull origin main

# Update dependencies backend
cd backend && npm install --production

# Jalankan migrasi jika ada
npx sequelize-cli db:migrate

# Build frontend baru (jika ada perubahan frontend)
cd ../frontend && npm install && npm run build

# Restart backend
pm2 restart presensi-backend
```

---

## 🐛 Troubleshooting

### Backend tidak bisa start

```bash
# Cek error log
pm2 logs presensi-backend --err

# Cek koneksi database
mysql -h localhost -u presensi_user -p db_presensi_ta

# Cek port tidak konflik
netstat -tlnp | grep 3001
```

### Error 502 Bad Gateway

- Backend tidak berjalan → `pm2 status` dan `pm2 restart presensi-backend`
- Port salah di Nginx config → pastikan `proxy_pass http://localhost:3001`

### Upload file gagal

```bash
# Cek permission folder uploads
ls -la /var/www/presensi/backend/public/uploads/

# Perbaiki permission
chmod -R 755 /var/www/presensi/backend/public/uploads/
chown -R www-data:www-data /var/www/presensi/backend/public/uploads/
```

### Database connection error di production

```bash
# Cek MySQL berjalan
sudo systemctl status mysql

# Cek RDS reachable (AWS)
mysql -h <rds-endpoint> -u admin -p
```

### CORS error di production

Update `backend/.env`:
```env
CORS_ORIGIN=https://yourdomain.com
```

Restart backend:
```bash
pm2 restart presensi-backend
```

---

## 📋 Deployment Checklist

Sebelum go-live, pastikan semua item ini sudah dilakukan:

- [ ] `NODE_ENV=production` di `.env`
- [ ] Database credentials production sudah diset
- [ ] `JWT_SECRET` yang kuat (64+ karakter random hex)
- [ ] `CORS_ORIGIN` sesuai domain production
- [ ] Google OAuth redirect URI sudah diupdate
- [ ] SSL certificate aktif (HTTPS)
- [ ] Firewall hanya buka port 22, 80, 443
- [ ] PM2 startup sudah dikonfigurasi
- [ ] Backup database otomatis terjadwal
- [ ] Folder uploads punya permission yang benar
- [ ] `npm run build` frontend sudah dijalankan
- [ ] Akun admin default sudah diganti passwordnya
- [ ] Coba login dengan semua role

---

**Last Updated:** Mei 2026  
**Maintainer:** Handika Sinaga
