# ≡ƒôª Library & Dependencies Documentation

Dokumentasi lengkap library yang digunakan dalam Sistem Presensi Karyawan untuk memudahkan instalasi dan deployment.

---

## Table of Contents

1. [Backend Dependencies](#1-backend-dependencies)
2. [Frontend Dependencies](#2-frontend-dependencies)
3. [Installation Guide](#3-installation-guide)
4. [Version Compatibility](#4-version-compatibility)
5. [Production Optimization](#5-production-optimization)

---

## 1. Backend Dependencies

### Core Framework

#### express (^4.19.2)

**Purpose:** Web framework untuk Node.js  
**Usage:** Core HTTP server, routing, middleware handling  
**Installation:**

```bash
npm install express@^4.19.2
```

**Documentation:** https://expressjs.com/

---

### Database & ORM

#### sequelize (^6.37.3)

**Purpose:** SQL ORM untuk Node.js  
**Usage:** Database modeling, migrations, queries  
**Installation:**

```bash
npm install sequelize@^6.37.3
```

**Documentation:** https://sequelize.org/

#### mysql2 (^3.11.0)

**Purpose:** MySQL driver untuk Node.js  
**Usage:** Database connection, query execution  
**Installation:**

```bash
npm install mysql2@^3.11.0
```

**Documentation:** https://github.com/sidorares/node-mysql2

#### sequelize-cli (^6.6.2)

**Purpose:** CLI tool untuk Sequelize  
**Usage:** Generate migrations, seeders, models  
**Installation:**

```bash
npm install --save-dev sequelize-cli@^6.6.2
```

**Commands:**

```bash
npx sequelize-cli migration:generate --name migration-name
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

**Documentation:** https://github.com/sequelize/cli

---

### Authentication & Security

#### bcrypt (^5.1.1)

**Purpose:** Password hashing library  
**Usage:** Hash password saat registrasi, compare saat login  
**Installation:**

```bash
npm install bcrypt@^5.1.1
```

**Example:**

```javascript
import bcrypt from "bcrypt";

// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Compare password
const isMatch = await bcrypt.compare(password, hashedPassword);
```

**Documentation:** https://github.com/kelektiv/node.bcrypt.js

#### jsonwebtoken (^9.0.2)

**Purpose:** JWT token generation & verification  
**Usage:** Generate access & refresh tokens, verify auth  
**Installation:**

```bash
npm install jsonwebtoken@^9.0.2
```

**Example:**

```javascript
import jwt from "jsonwebtoken";

// Generate token
const token = jwt.sign({ userId: 1, role: "user" }, SECRET, {
    expiresIn: "15m",
});

// Verify token
const decoded = jwt.verify(token, SECRET);
```

**Documentation:** https://github.com/auth0/node-jsonwebtoken

#### cookie-parser (^1.4.6)

**Purpose:** Parse HTTP cookies  
**Usage:** Extract refresh token dari cookies  
**Installation:**

```bash
npm install cookie-parser@^1.4.6
```

**Documentation:** https://github.com/expressjs/cookie-parser

---

### Middleware & Utilities

#### cors (^2.8.5)

**Purpose:** Enable Cross-Origin Resource Sharing  
**Usage:** Allow frontend (localhost:5173) akses backend API  
**Installation:**

```bash
npm install cors@^2.8.5
```

**Configuration:**

```javascript
import cors from "cors";

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);
```

**Documentation:** https://github.com/expressjs/cors

#### dotenv (^16.4.5)

**Purpose:** Load environment variables dari .env file  
**Usage:** Database config, JWT secrets, ports  
**Installation:**

```bash
npm install dotenv@^16.4.5
```

**Example:**

```javascript
import dotenv from "dotenv";
dotenv.config();

const port = process.env.APP_PORT || 3001;
```

**Documentation:** https://github.com/motdotla/dotenv

#### multer (^1.4.5-lts.1)

**Purpose:** Multipart/form-data handling untuk file upload  
**Usage:** Upload foto presensi, avatar, attachment  
**Installation:**

```bash
npm install multer@^1.4.5-lts.1
```

**Example:**

```javascript
import multer from "multer";

const storage = multer.diskStorage({
    destination: "public/uploads/attendance",
    filename: (req, file, cb) => {
        cb(null, `attendance_${Date.now()}.jpg`);
    },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
```

**Documentation:** https://github.com/expressjs/multer

---

### Date & Time

#### moment-timezone (^0.5.45)

**Purpose:** Parse, validate, manipulate, dan display dates  
**Usage:** Timezone conversion (Asia/Jakarta), date formatting  
**Installation:**

```bash
npm install moment-timezone@^0.5.45
```

**Example:**

```javascript
import moment from "moment-timezone";

const now = moment().tz("Asia/Jakarta");
const formatted = now.format("YYYY-MM-DD HH:mm:ss");
```

**Documentation:** https://momentjs.com/timezone/

---

### Task Scheduling

#### node-cron (^4.2.1)

**Purpose:** Cron job scheduler  
**Usage:** Auto-checkout scheduler (setiap hari jam 18:00)  
**Installation:**

```bash
npm install node-cron@^4.2.1
```

**Example:**

```javascript
import cron from "node-cron";

// Run every day at 18:00
cron.schedule("0 18 * * *", async () => {
    console.log("Running auto-checkout...");
    // Auto-checkout logic
});
```

**Documentation:** https://github.com/node-cron/node-cron

---

### File Processing

#### xlsx (^0.18.5)

**Purpose:** Excel file generation & parsing  
**Usage:** Export laporan presensi/logbook/cuti ke XLSX  
**Installation:**

```bash
npm install xlsx@^0.18.5
```

**Example:**

```javascript
import XLSX from "xlsx";

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);
res.send(buffer);
```

**Documentation:** https://docs.sheetjs.com/

---

### Email & OAuth

#### nodemailer (^6.9.14)

**Purpose:** Email sending service  
**Usage:** Send notification emails (optional feature)  
**Installation:**

```bash
npm install nodemailer@^6.9.14
```

**Example:**

```javascript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});

await transporter.sendMail({
    from: "noreply@attendance.com",
    to: "user@example.com",
    subject: "Cuti Disetujui",
    html: "<p>Pengajuan cuti Anda telah disetujui</p>",
});
```

**Documentation:** https://nodemailer.com/

#### google-auth-library (^10.5.0)

**Purpose:** Google OAuth authentication  
**Usage:** Login dengan Google (optional feature)  
**Installation:**

```bash
npm install google-auth-library@^10.5.0
```

**Documentation:** https://github.com/googleapis/google-auth-library-nodejs

---

### Utilities

#### uuid (^10.0.0)

**Purpose:** Generate universally unique identifiers  
**Usage:** Generate unique IDs untuk files, sessions  
**Installation:**

```bash
npm install uuid@^10.0.0
```

**Example:**

```javascript
import { v4 as uuidv4 } from "uuid";

const uniqueId = uuidv4(); // '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
```

**Documentation:** https://github.com/uuidjs/uuid

---

### Development

#### nodemon (^3.1.4)

**Purpose:** Auto-restart server saat file changes  
**Usage:** Development mode dengan hot-reload  
**Installation:**

```bash
npm install --save-dev nodemon@^3.1.4
```

**Configuration (package.json):**

```json
{
    "scripts": {
        "dev": "nodemon index.js"
    }
}
```

**Documentation:** https://nodemon.io/

---

## 2. Frontend Dependencies

### Core Framework

#### react (^18.3.1)

**Purpose:** UI library untuk building user interfaces  
**Usage:** Component-based architecture  
**Installation:**

```bash
npm install react@^18.3.1
```

**Documentation:** https://react.dev/

#### react-dom (^18.3.1)

**Purpose:** React renderer untuk DOM  
**Usage:** Render React components ke browser  
**Installation:**

```bash
npm install react-dom@^18.3.1
```

**Documentation:** https://react.dev/reference/react-dom

---

### Build Tool

#### vite (^5.3.4)

**Purpose:** Fast build tool & dev server  
**Usage:** Development server, production build, HMR  
**Installation:**

```bash
npm install --save-dev vite@^5.3.4
```

**Commands:**

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

**Documentation:** https://vitejs.dev/

#### @vitejs/plugin-react (^4.3.1)

**Purpose:** Vite plugin untuk React  
**Usage:** Enable Fast Refresh, JSX transform  
**Installation:**

```bash
npm install --save-dev @vitejs/plugin-react@^4.3.1
```

**Documentation:** https://github.com/vitejs/vite-plugin-react

---

### Routing

#### react-router-dom (^6.26.0)

**Purpose:** Client-side routing untuk React  
**Usage:** Navigation, protected routes, role-based routing  
**Installation:**

```bash
npm install react-router-dom@^6.26.0
```

**Example:**

```javascript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

<BrowserRouter>
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user/*" element={<UserRoutes />} />
    </Routes>
</BrowserRouter>;
```

**Documentation:** https://reactrouter.com/

---

### HTTP Client

#### axios (^1.7.7)

**Purpose:** Promise-based HTTP client  
**Usage:** API calls, interceptors, token management  
**Installation:**

```bash
npm install axios@^1.7.7
```

**Example:**

```javascript
import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:3001",
    withCredentials: true,
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// API call
const response = await axiosInstance.get("/user/attendance");
```

**Documentation:** https://axios-http.com/

---

### UI Framework

#### bootstrap (^5.3.3)

**Purpose:** CSS framework  
**Usage:** Responsive layout, components styling  
**Installation:**

```bash
npm install bootstrap@^5.3.3
```

**Import:**

```javascript
import "bootstrap/dist/css/bootstrap.min.css";
```

**Documentation:** https://getbootstrap.com/

#### react-bootstrap (^2.10.4)

**Purpose:** Bootstrap components untuk React  
**Usage:** Modal, Button, Card, Form components  
**Installation:**

```bash
npm install react-bootstrap@^2.10.4
```

**Example:**

```javascript
import { Modal, Button } from "react-bootstrap";

<Modal show={show} onHide={handleClose}>
    <Modal.Header closeButton>
        <Modal.Title>Detail Presensi</Modal.Title>
    </Modal.Header>
    <Modal.Body>Content here</Modal.Body>
</Modal>;
```

**Documentation:** https://react-bootstrap.github.io/

#### bootstrap-icons (^1.13.1)

**Purpose:** Icon library dari Bootstrap  
**Usage:** UI icons  
**Installation:**

```bash
npm install bootstrap-icons@^1.13.1
```

**Import:**

```javascript
import "bootstrap-icons/font/bootstrap-icons.css";
```

**Usage:**

```html
<i className="bi bi-check-circle"></i> <i className="bi bi-person-fill"></i>
```

**Documentation:** https://icons.getbootstrap.com/

---

### User Feedback

#### react-hot-toast (^2.6.0)

**Purpose:** Toast notifications  
**Usage:** Success/error messages, loading states  
**Installation:**

```bash
npm install react-hot-toast@^2.6.0
```

**Example:**

```javascript
import toast, { Toaster } from "react-hot-toast";

// Show toast
toast.success("Check-in berhasil");
toast.error("Gagal check-in");
toast.loading("Memproses...");

// Component
<Toaster position="top-right" />;
```

**Documentation:** https://react-hot-toast.com/

---

### Utilities

#### jwt-decode (^4.0.0)

**Purpose:** Decode JWT tokens  
**Usage:** Extract user info dari token tanpa verify  
**Installation:**

```bash
npm install jwt-decode@^4.0.0
```

**Example:**

```javascript
import { jwtDecode } from "jwt-decode";

const token = localStorage.getItem("token");
const decoded = jwtDecode(token);
console.log(decoded.userId, decoded.role);
```

**Documentation:** https://github.com/auth0/jwt-decode

#### react-image-crop (^11.0.10)

**Purpose:** Image cropping component  
**Usage:** Crop foto profil sebelum upload  
**Installation:**

```bash
npm install react-image-crop@^11.0.10
```

**Documentation:** https://github.com/DominicTobias/react-image-crop

#### react-loading-skeleton (^3.5.0)

**Purpose:** Loading placeholder components  
**Usage:** Skeleton loading saat fetch data  
**Installation:**

```bash
npm install react-loading-skeleton@^3.5.0
```

**Example:**

```javascript
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

{
    loading ? <Skeleton count={5} /> : <DataTable />;
}
```

**Documentation:** https://github.com/dvtng/react-loading-skeleton

---

### Code Quality (Dev Dependencies)

#### eslint (^8.57.0)

**Purpose:** JavaScript linter  
**Usage:** Code quality checking  
**Installation:**

```bash
npm install --save-dev eslint@^8.57.0
```

#### eslint-plugin-react (^7.34.3)

**Purpose:** React-specific ESLint rules  
**Installation:**

```bash
npm install --save-dev eslint-plugin-react@^7.34.3
```

#### eslint-plugin-react-hooks (^4.6.2)

**Purpose:** ESLint rules untuk React Hooks  
**Installation:**

```bash
npm install --save-dev eslint-plugin-react-hooks@^4.6.2
```

---

## 3. Installation Guide

### Full Installation - Backend

```bash
cd backend

# Install all dependencies
npm install

# Or install individually
npm install express@^4.19.2 sequelize@^6.37.3 mysql2@^3.11.0 bcrypt@^5.1.1 \
            jsonwebtoken@^9.0.2 cookie-parser@^1.4.6 cors@^2.8.5 \
            dotenv@^16.4.5 multer@^1.4.5-lts.1 moment-timezone@^0.5.45 \
            node-cron@^4.2.1 xlsx@^0.18.5 nodemailer@^6.9.14 \
            google-auth-library@^10.5.0 uuid@^10.0.0

# Dev dependencies
npm install --save-dev sequelize-cli@^6.6.2 nodemon@^3.1.4
```

### Full Installation - Frontend

```bash
cd frontend

# Install all dependencies
npm install

# Or install individually
npm install react@^18.3.1 react-dom@^18.3.1 react-router-dom@^6.26.0 \
            axios@^1.7.7 bootstrap@^5.3.3 react-bootstrap@^2.10.4 \
            bootstrap-icons@^1.13.1 react-hot-toast@^2.6.0 \
            jwt-decode@^4.0.0 react-image-crop@^11.0.10 \
            react-loading-skeleton@^3.5.0

# Dev dependencies
npm install --save-dev vite@^5.3.4 @vitejs/plugin-react@^4.3.1 \
                       eslint@^8.57.0 eslint-plugin-react@^7.34.3 \
                       eslint-plugin-react-hooks@^4.6.2
```

---

## 4. Version Compatibility

### Node.js Versions

| Package   | Node.js Min Version |
| --------- | ------------------- |
| express   | >= 14.0.0           |
| sequelize | >= 10.0.0           |
| react     | >= 16.14.0          |
| vite      | >= 18.0.0           |

**Recommended:** Node.js 18.x atau 20.x LTS

### Database Compatibility

-   **MySQL:** 5.7, 8.0+
-   **MariaDB:** 10.3+

### Browser Support

-   **Chrome:** >= 90
-   **Firefox:** >= 88
-   **Safari:** >= 14
-   **Edge:** >= 90

---

## 5. Production Optimization

### Backend Production

**Install production dependencies only:**

```bash
npm install --production
```

**PM2 Configuration (ecosystem.config.js):**

```javascript
module.exports = {
    apps: [
        {
            name: "attendance-api",
            script: "index.js",
            instances: "max",
            exec_mode: "cluster",
            env_production: {
                NODE_ENV: "production",
                APP_PORT: 3001,
            },
        },
    ],
};
```

### Frontend Production

**Build optimization:**

```bash
npm run build

# Output: dist/ folder
# - JS bundle dengan code splitting
# - CSS minified
# - Assets optimized
# - Gzip compression ready
```

**Vite Build Configuration:**

```javascript
// vite.config.js
export default {
    build: {
        outDir: "dist",
        minify: "esbuild",
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom"],
                    router: ["react-router-dom"],
                    ui: ["bootstrap", "react-bootstrap"],
                },
            },
        },
    },
};
```

---

## Package Size Analysis

### Backend Dependencies Size

```
Total: ~45 MB
- express: 0.5 MB
- sequelize: 3.5 MB
- mysql2: 1.2 MB
- bcrypt: 2.8 MB (native bindings)
- Other packages: ~37 MB
```

### Frontend Dependencies Size

```
Total: ~85 MB (node_modules)
Build output: ~500 KB (gzipped)

- react + react-dom: 0.3 MB (gzipped)
- bootstrap: 0.15 MB (gzipped)
- Other packages: varies
```

---

## Security Best Practices

### Dependencies Audit

```bash
# Check vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Force fix (may break)
npm audit fix --force
```

### Update Dependencies

```bash
# Check outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all (careful!)
npm update
```

### Lock Files

Γ£à **Commit `package-lock.json`** untuk consistent installs  
Γ£à **Use exact versions** di production  
Γ£à **Regular security audits**

---

## Troubleshooting

### bcrypt Installation Error

**Windows:**

```bash
npm install --global windows-build-tools
npm install bcrypt
```

**Linux:**

```bash
sudo apt install build-essential python3
npm install bcrypt
```

### Node Modules Size

**Clean install:**

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Peer Dependencies Warning

Biasanya safe to ignore, atau install manually:

```bash
npm install <peer-dependency>
```

---

**Last Updated:** December 6, 2025  
**Node.js Version:** 18.x, 20.x LTS  
**Package Manager:** npm 9.x+
