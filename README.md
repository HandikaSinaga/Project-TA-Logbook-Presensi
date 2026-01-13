# 🚀 Sistem Presensi & Logbook - Full Stack Web Application

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.19.2-lightgrey.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Modern attendance and logbook management system built with **React 18** (Frontend) and **Express.js** (Backend), designed for enterprise-level performance with role-based access control, real-time notifications, and comprehensive reporting.

---

## 📋 Table of Contents

-   [Features](#-features)
-   [Tech Stack](#-tech-stack)
-   [Project Structure](#-project-structure)
-   [Installation](#-installation)
-   [Configuration](#-configuration)
-   [Development](#-development)
-   [API Documentation](#-api-documentation)
-   [Deployment](#-deployment)
-   [License](#-license)

---

## ✨ Features

### 👥 User Management

-   **Multi-role System**: Admin, Supervisor, User roles with granular permissions
-   **User Import/Export**: Bulk user management via Excel templates
-   **Profile Management**: Avatar upload with image cropping, personal information
-   **Division Management**: Organize users by departments

### 📅 Attendance System

-   **Check-in/Check-out**: GPS-based location verification
-   **Multiple Work Types**: WFO (Work From Office), WFH (Work From Home)
-   **Auto Checkout**: Automatic checkout at end of day
-   **Late Detection**: Automatic status based on office schedule
-   **Approval Workflow**: Two-level approval system (Supervisor → Admin)

### 📝 Logbook Management

-   **Daily Activity Tracking**: Record work activities with descriptions
-   **File Attachments**: Upload supporting documents
-   **Review System**: Supervisor can review and approve logbooks
-   **Activity Categories**: Organize activities by type

### 🏖️ Leave Management

-   **Multiple Leave Types**: Sick leave, personal leave with customizable types
-   **Duration Tracking**: Multi-day leave support
-   **Approval Workflow**: Request → Review → Approval
-   **Leave Balance**: Track remaining leave days
-   **Document Upload**: Attach medical certificates or supporting documents

### 📊 Advanced Reporting

-   **Multiple Report Types**: Attendance, Logbook, Leave, Summary reports
-   **Smart Pagination**: Handle 10,000+ records efficiently
-   **Column Sorting**: Sort by date, user, status, etc.
-   **Advanced Filters**: Filter by division, period, source, date range
-   **Excel Export**: Professional formatted reports with complete data

### 🔔 Real-time Notifications

-   **Live Updates**: WebSocket-based notification system
-   **Action Notifications**: Approval, rejection, status changes
-   **Unread Counter**: Visual indicators for new notifications
-   **Notification Center**: Centralized notification management

### 🎨 Modern UI/UX

-   **Responsive Design**: Mobile, tablet, desktop optimized
-   **Dark Mode Support**: Eye-friendly interface
-   **Interactive Components**: Modals, toasts, tooltips
-   **Tab Navigation**: Organized data presentation
-   **Badge Counters**: Visual data summaries

### 🔒 Security Features

-   **JWT Authentication**: Secure token-based auth
-   **Google OAuth**: One-click login with Google
-   **Password Encryption**: Bcrypt hashing
-   **CORS Protection**: Configurable cross-origin policies
-   **Role-based Access**: Granular permission system

---

## 🛠 Tech Stack

### Backend

| Technology     | Version | Purpose                 |
| -------------- | ------- | ----------------------- |
| **Node.js**    | 22.x    | Runtime environment     |
| **Express.js** | 4.19.2  | Web framework           |
| **MySQL**      | 8.0+    | Relational database     |
| **Sequelize**  | 6.37.3  | ORM for database        |
| **JWT**        | 9.0.2   | Authentication          |
| **Bcrypt**     | 5.1.1   | Password hashing        |
| **Multer**     | 1.4.5   | File upload handling    |
| **ExcelJS**    | 4.4.0   | Excel file generation   |
| **Socket.io**  | 4.8.1   | Real-time communication |
| **Node-cron**  | 3.0.3   | Scheduled tasks         |
| **Sharp**      | 0.33.5  | Image processing        |

### Frontend

| Technology           | Version | Purpose                 |
| -------------------- | ------- | ----------------------- |
| **React**            | 18.3.1  | UI library              |
| **Vite**             | 5.3.4   | Build tool & dev server |
| **React Router**     | 6.26.0  | Client-side routing     |
| **Axios**            | 1.7.7   | HTTP client             |
| **Bootstrap**        | 5.3.3   | CSS framework           |
| **React Bootstrap**  | 2.10.4  | React UI components     |
| **React Hot Toast**  | 2.4.1   | Notifications           |
| **React Image Crop** | 11.0.7  | Image cropping          |
| **Socket.io Client** | 4.8.1   | WebSocket client        |

---

## 📁 Project Structure

```
project-ta/
├── backend/                    # Express.js API Server (Port 3001)
│   ├── config/                 # Database & app configuration
│   │   ├── config.js           # Sequelize database config
│   │   └── app.config.js       # Application settings
│   ├── controllers/            # Business logic handlers
│   │   ├── AuthController.js   # Authentication
│   │   ├── UserController.js   # User management
│   │   ├── AttendanceController.js
│   │   ├── LogbookController.js
│   │   ├── LeaveController.js
│   │   ├── ReportController.js
│   │   └── NotificationController.js
│   ├── database/               # Database migrations & seeds
│   │   ├── migrations/         # Schema migrations
│   │   └── seeders/            # Sample data
│   ├── middlewares/            # Express middlewares
│   │   ├── authenticate.js     # JWT verification
│   │   ├── roleMiddleware.js   # Role-based access
│   │   └── errorHandler.js     # Error handling
│   ├── models/                 # Sequelize ORM models
│   │   ├── User.js
│   │   ├── Attendance.js
│   │   ├── Logbook.js
│   │   ├── Leave.js
│   │   └── Division.js
│   ├── routes/                 # API route definitions
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── attendanceRoutes.js
│   │   └── ...
│   ├── services/               # Business logic services
│   │   ├── ExportService.js    # Excel export
│   │   ├── UploadService.js    # File uploads
│   │   └── EmailService.js     # Email notifications
│   ├── utils/                  # Helper utilities
│   ├── public/                 # Static files
│   │   └── uploads/            # User uploads (avatars, docs)
│   ├── .env                    # Environment variables
│   ├── .env.example            # Environment template
│   ├── package.json            # Dependencies
│   └── index.js                # Server entry point
│
├── frontend/                   # React SPA (Port 5173)
│   ├── src/
│   │   ├── assets/             # Static assets
│   │   │   ├── css/            # Stylesheets
│   │   │   └── images/         # Images
│   │   ├── roles/              # Role-based components
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── supervisor/     # Supervisor panel
│   │   │   └── user/           # User interface
│   │   ├── services/           # API service layer
│   │   │   └── api.js          # Axios instance
│   │   ├── utils/              # Helper utilities
│   │   │   ├── axiosInstance.js
│   │   │   └── constants.js
│   │   ├── App.jsx             # Root component
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── public/                 # Public assets
│   ├── index.html              # HTML template
│   ├── vite.config.js          # Vite configuration
│   ├── package.json            # Dependencies
│   └── .env.example            # Environment template
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

# Copy environment file
cp .env.example .env

# Edit .env with backend API URL
# nano .env  (Linux/Mac)
# notepad .env  (Windows)

# Start development server
npm run dev
```

✅ Frontend should now be running on `http://localhost:5173`

---

## ⚙️ Configuration

### Backend Environment Variables

Create `.env` file in `backend/` directory:

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
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Email (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Upload Settings
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/jpg
ALLOWED_DOC_TYPES=application/pdf,application/msword

# CORS
CORS_ORIGIN=http://localhost:5173

# Auto Checkout Settings
AUTO_CHECKOUT_ENABLED=false
FORCE_CHECKOUT_TIME=23:59:59
```

### Frontend Environment Variables

Create `.env` file in `frontend/` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Upload Limits
VITE_MAX_FILE_SIZE=5
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/jpg
```

---

## 👨‍💻 Development

### Development Commands

#### Backend

```bash
cd backend

# Start server (development mode with nodemon)
npm run dev

# Start server (production mode)
npm start

# Run migrations
npm run db:migrate

# Rollback migrations
npm run db:migrate:undo

# Create new migration
npm run migration:generate -- --name migration_name

# Seed database
npm run db:seed

# Create new seeder
npm run seeder:generate -- --name seeder_name

# Run tests
npm test
```

#### Frontend

```bash
cd frontend

# Start development server
npm run dev

# Build for production (output: dist/ folder)
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

**Important for Production:**

-   ✅ `npm run build` creates optimized production build in `dist/` folder
-   ✅ Deploy only the `dist/` folder to Nginx/S3, NOT the entire frontend directory
-   ✅ Built assets are minified, optimized, and code-split for performance
-   ❌ Never deploy source code (`src/`) to production

### Default Test Credentials

After running seeders, use these credentials:

**Admin:**

-   Email: `admin@presensi.com`
-   Password: `admin123`

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

#### Docker Deployment

```bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test

# Run specific test file
npm test -- tests/auth.test.js

# Run with coverage
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend
npm test

# Run with coverage
npm run test:coverage
```

---

## 📊 Performance Optimization

### Backend Optimization

-   **Database Indexing**: Indexed on frequently queried fields
-   **Query Optimization**: Eager loading with Sequelize
-   **Response Caching**: Redis for frequent queries
-   **Connection Pooling**: MySQL connection pool (max 10)

### Frontend Optimization

-   **Code Splitting**: React lazy loading
-   **Image Optimization**: Sharp for image processing
-   **Pagination**: Handle 10,000+ records efficiently
-   **Bundle Size**: Tree shaking with Vite

### Monitoring

```bash
# Backend performance
npm install -g clinic
clinic doctor -- node index.js

# Frontend bundle analysis
npm run build -- --analyze
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Style

-   Use ESLint configuration provided
-   Follow React best practices
-   Write meaningful commit messages
-   Add tests for new features

---

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed**

```bash
# Check MySQL service
mysql -u root -p

# Verify credentials in .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
```

**2. Port Already in Use**

```bash
# Kill process on port 3001 (backend)
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

**3. CORS Error**

-   Verify `CORS_ORIGIN` in backend `.env`
-   Check frontend API URL configuration

**4. Upload Folder Permission**

```bash
chmod 755 backend/public/uploads
```

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Handika Sinaga

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

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
