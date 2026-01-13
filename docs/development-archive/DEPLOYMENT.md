# ≡ƒÜÇ Deployment Guide - Sistem Presensi Karyawan

Panduan lengkap deployment aplikasi ke berbagai platform cloud.

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [VPS/Server Deployment (Ubuntu)](#2-vpsserver-deployment-ubuntu)
3. [Heroku Deployment](#3-heroku-deployment)
4. [Vercel (Frontend) + Railway (Backend)](#4-vercel-frontend--railway-backend)
5. [Docker Deployment](#5-docker-deployment)
6. [Post-Deployment](#6-post-deployment)

---

## 1. Pre-Deployment Checklist

### Γ£à Backend Preparation

-   [ ] Set `NODE_ENV=production` di environment variables
-   [ ] Generate secure JWT secrets (min 64 characters)
-   [ ] Update `CLIENT_URL` dengan production frontend URL
-   [ ] Setup production database (MySQL di cloud)
-   [ ] Konfigurasi CORS untuk production domain
-   [ ] Remove console.log statements (optional)
-   [ ] Test semua endpoints dengan production config

### Γ£à Frontend Preparation

-   [ ] Update `API_BASE_URL` di `src/utils/Constant.jsx`
-   [ ] Build production: `npm run build`
-   [ ] Test production build: `npm run preview`
-   [ ] Verify semua API calls menggunakan production URL
-   [ ] Check responsive design di berbagai device
-   [ ] Test semua role (admin, supervisor, user)

### Γ£à Database Preparation

-   [ ] Backup database lokal
-   [ ] Setup MySQL di cloud provider
-   [ ] Run migrations: `npm run db:migrate`
-   [ ] Seed initial data (optional): `npm run db:seed`
-   [ ] Verify koneksi database dari server

### Γ£à Security Checklist

-   [ ] JWT secrets unique & minimum 64 characters
-   [ ] Database password strong
-   [ ] HTTPS/SSL enabled
-   [ ] Environment variables secure (tidak hardcoded)
-   [ ] CORS configured untuk specific domain
-   [ ] Rate limiting enabled
-   [ ] File upload size limits configured

---

## 2. VPS/Server Deployment (Ubuntu)

Deployment ke VPS seperti DigitalOcean, Linode, AWS EC2, atau Google Cloud VM.

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v  # v18.x.x
npm -v   # 9.x.x

# Install MySQL
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### Step 2: MySQL Setup

```bash
# Login ke MySQL
sudo mysql -u root -p

# Buat database dan user
CREATE DATABASE db_presensi_ta;
CREATE USER 'presensi_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON db_presensi_ta.* TO 'presensi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Upload Project

**Option A: Git Clone**

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/your-username/project-ta.git
cd project-ta

# Set ownership
sudo chown -R $USER:$USER /var/www/project-ta
```

**Option B: SCP Upload**

```bash
# Dari local machine
scp -r project-ta user@your-server-ip:/var/www/
```

### Step 4: Backend Setup

```bash
cd /var/www/project-ta/backend

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env
```

**Edit .env untuk production:**

```env
APP_PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-domain.com

DB_HOST=localhost
DB_USER=presensi_user
DB_PASSWORD=strong_password_here
DB_NAME=db_presensi_ta

ACCESS_TOKEN_SECRET=generate_dengan_crypto_64_chars
REFRESH_TOKEN_SECRET=generate_dengan_crypto_64_chars
```

**Run migrations:**

```bash
npm run db:migrate
npm run db:seed  # optional
```

### Step 5: Frontend Build

```bash
cd /var/www/project-ta/frontend

# Install dependencies
npm install

# Update API URL
nano src/utils/Constant.jsx
```

**Update Constant.jsx:**

```javascript
export const API_BASE_URL = "https://your-domain.com/api";
```

**Build production:**

```bash
npm run build
# Output: dist/ folder
```

### Step 6: Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/attendance
```

**Nginx config:**

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend (React build)
    root /var/www/project-ta/frontend/dist;
    index index.html;

    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads directory
    location /uploads/ {
        alias /var/www/project-ta/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Enable site:**

```bash
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (crontab)
sudo crontab -e
# Add line:
0 0 * * * certbot renew --quiet
```

### Step 8: Start Backend with PM2

```bash
cd /var/www/project-ta/backend

# Start with PM2
pm2 start index.js --name attendance-api

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
# Copy and run the command shown

# Monitor
pm2 status
pm2 logs attendance-api
pm2 monit
```

**PM2 Configuration (optional):**

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
    apps: [
        {
            name: "attendance-api",
            script: "index.js",
            instances: 2,
            exec_mode: "cluster",
            watch: false,
            env_production: {
                NODE_ENV: "production",
                APP_PORT: 3001,
            },
            error_file: "./logs/error.log",
            out_file: "./logs/output.log",
            time: true,
        },
    ],
};
```

```bash
pm2 start ecosystem.config.js --env production
```

### Step 9: Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

---

## 3. Heroku Deployment

### Step 1: Prepare Project

**Create root package.json:**

```bash
cd project-ta
nano package.json
```

```json
{
    "name": "attendance-system",
    "version": "1.0.0",
    "scripts": {
        "start": "cd backend && npm start",
        "heroku-postbuild": "cd frontend && npm install && npm run build && cd ../backend && npm install"
    },
    "engines": {
        "node": "18.x",
        "npm": "9.x"
    }
}
```

**Create Procfile:**

```bash
nano Procfile
```

```
web: npm start
```

### Step 2: Heroku Setup

```bash
# Install Heroku CLI
# Windows: Download dari heroku.com/cli
# Mac: brew tap heroku/brew && brew install heroku
# Linux: curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create your-app-name

# Add MySQL addon (JawsDB)
heroku addons:create jawsdb:kitefin

# Get database credentials
heroku config:get JAWSDB_URL
# Format: mysql://user:password@host:port/database
```

### Step 3: Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set APP_PORT=\$PORT
heroku config:set CLIENT_URL=https://your-app-name.herokuapp.com

# Parse JAWSDB_URL manually or set:
heroku config:set DB_HOST=your-db-host
heroku config:set DB_USER=your-db-user
heroku config:set DB_PASSWORD=your-db-password
heroku config:set DB_NAME=your-db-name

heroku config:set ACCESS_TOKEN_SECRET=your-64-char-secret
heroku config:set REFRESH_TOKEN_SECRET=your-64-char-secret

# View all config
heroku config
```

### Step 4: Deploy

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial deployment"

# Add Heroku remote
heroku git:remote -a your-app-name

# Push to Heroku
git push heroku main

# Run migrations
heroku run npm run db:migrate --prefix backend

# Open app
heroku open

# Check logs
heroku logs --tail
```

---

## 4. Vercel (Frontend) + Railway (Backend)

### Frontend ke Vercel

**Step 1: Prepare Frontend**

```bash
cd frontend

# Update API URL
nano src/utils/Constant.jsx
```

```javascript
export const API_BASE_URL = "https://your-backend.railway.app";
```

**Step 2: Deploy to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Setup and deploy: Yes
# - Which scope: Your account
# - Link to existing project: No
# - Project name: attendance-frontend
# - Directory: ./
# - Override settings: No
```

**Vercel Dashboard Configuration:**

-   Build Command: `npm run build`
-   Output Directory: `dist`
-   Install Command: `npm install`

### Backend ke Railway

**Step 1: Railway Setup**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Link to project
railway link
```

**Step 2: Add MySQL Database**

```
# Via Railway Dashboard:
1. Go to your project
2. Click "New" ΓåÆ "Database" ΓåÆ "Add MySQL"
3. Copy connection URL
```

**Step 3: Environment Variables**

```bash
# Set via Railway CLI or Dashboard
railway variables set NODE_ENV=production
railway variables set APP_PORT=3001
railway variables set CLIENT_URL=https://your-frontend.vercel.app

# Database (dari Railway MySQL)
railway variables set DB_HOST=containers-us-west-xxx.railway.app
railway variables set DB_USER=root
railway variables set DB_PASSWORD=xxx
railway variables set DB_NAME=railway

railway variables set ACCESS_TOKEN_SECRET=your-secret
railway variables set REFRESH_TOKEN_SECRET=your-secret
```

**Step 4: Deploy**

```bash
# Deploy
railway up

# Run migrations
railway run npm run db:migrate

# Check logs
railway logs
```

---

## 5. Docker Deployment

**Dockerfile - Backend:**

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
```

**Dockerfile - Frontend:**

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

**docker-compose.yml:**

```yaml
version: "3.8"

services:
    db:
        image: mysql:8.0
        restart: always
        environment:
            MYSQL_ROOT_PASSWORD: rootpassword
            MYSQL_DATABASE: db_presensi_ta
            MYSQL_USER: presensi_user
            MYSQL_PASSWORD: userpassword
        volumes:
            - mysql_data:/var/lib/mysql
        ports:
            - "3306:3306"

    backend:
        build: ./backend
        restart: always
        ports:
            - "3001:3001"
        environment:
            NODE_ENV: production
            DB_HOST: db
            DB_USER: presensi_user
            DB_PASSWORD: userpassword
            DB_NAME: db_presensi_ta
            ACCESS_TOKEN_SECRET: your-secret-here
            REFRESH_TOKEN_SECRET: your-secret-here
        depends_on:
            - db
        volumes:
            - ./backend/public/uploads:/app/public/uploads

    frontend:
        build: ./frontend
        restart: always
        ports:
            - "80:80"
        depends_on:
            - backend

volumes:
    mysql_data:
```

**Deploy with Docker Compose:**

```bash
# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec backend npm run db:migrate

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 6. Post-Deployment

### Monitoring

**PM2 Monitoring:**

```bash
pm2 monit
pm2 logs attendance-api --lines 100
pm2 status
```

**Nginx Logs:**

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup Database

**Automated Backup Script:**

```bash
nano /root/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="db_presensi_ta"
DB_USER="presensi_user"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x /root/backup-db.sh

# Crontab - daily at 2 AM
crontab -e
0 2 * * * /root/backup-db.sh
```

### Health Checks

**Backend Health Endpoint:**

```javascript
// backend/index.js
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
```

**Monitor with cron:**

```bash
*/5 * * * * curl -f https://your-domain.com/api/health || systemctl restart attendance-api
```

### Performance Optimization

**Nginx Caching:**

```nginx
# Add to server block
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**PM2 Cluster Mode:**

```bash
pm2 start index.js -i max  # Use all CPU cores
```

### Security Hardening

**Fail2ban for Nginx:**

```bash
sudo apt install fail2ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-req-limit]
enabled = true
filter = nginx-req-limit
action = iptables-multiport[name=ReqLimit, port="http,https"]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
```

---

## Troubleshooting

### 502 Bad Gateway

```bash
# Check backend status
pm2 status
pm2 logs attendance-api

# Check nginx config
sudo nginx -t

# Restart services
pm2 restart attendance-api
sudo systemctl restart nginx
```

### Database Connection Failed

```bash
# Test MySQL connection
mysql -u presensi_user -p -h localhost db_presensi_ta

# Check MySQL status
sudo systemctl status mysql

# Check .env configuration
cat /var/www/project-ta/backend/.env
```

### CORS Error

-   Verify `CLIENT_URL` di backend .env
-   Check Nginx proxy headers
-   Verify frontend API_BASE_URL

---

**Last Updated:** December 6, 2025  
**Tested Platforms:** Ubuntu 22.04 LTS, Heroku, Vercel, Railway  
**Support:** admin@example.com
