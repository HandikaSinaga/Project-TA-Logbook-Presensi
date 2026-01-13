# 🚀 Attendance System - React + Express

Modern attendance management system built with **React 18** and **Express.js**.

## 📁 Project Structure

```
project-ta/
├── backend/              # Express.js API (Port 3001)
│   ├── config/           # Database & environment config
│   ├── controllers/      # Business logic handlers
│   ├── database/         # Migrations & seeders
│   ├── middlewares/      # Auth, CORS, error handling
│   ├── models/           # Sequelize ORM models
│   ├── routes/           # API endpoints
│   └── index.js          # Server entry point
│
├── frontend/             # React SPA (Port 5173)
│   ├── src/
│   │   ├── assets/       # Static assets & styles
│   │   ├── roles/        # Role-based components (admin, supervisor, user)
│   │   ├── services/     # API service layer
│   │   ├── utils/        # Helpers & constants
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # React entry point
│   └── vite.config.js    # Vite configuration
│
└── english-adaptive-learning/  # Reference project (DO NOT MODIFY)
```

## ⚙️ Tech Stack

### Backend

-   **Framework:** Express 4.19.2
-   **Database:** MySQL (Sequelize ORM 6.37.3)
-   **Authentication:** JWT (jsonwebtoken 9.0.2)
-   **Runtime:** Node.js 22.x (ES Modules)
-   **Database Name:** `db_presensi_ta`

### Frontend

-   **Framework:** React 18.3.1
-   **Build Tool:** Vite 5.3.4
-   **UI Library:** Bootstrap 5.3.3 + react-bootstrap 2.10.4
-   **Routing:** react-router-dom 6.26.0
-   **HTTP Client:** Axios 1.7.7

## 🚀 Quick Start

### Prerequisites

-   Node.js 22.x
-   MySQL (Laragon)
-   Git

### 1. Database Setup

```bash
# Create database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS db_presensi_ta;"

# Run migrations
cd backend
npm install
npm run db:migrate

# Seed development data
npm run db:seed
```

### 2. Backend Setup

```bash
cd backend

# Environment already configured in .env:
# - APP_PORT=3001
# - DB_NAME=db_presensi_ta
# - JWT secrets configured

# Start server
node index.js
# ✅ Server running on port 3001
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
node_modules\.bin\vite.cmd
# ✅ Frontend running on http://localhost:5173
```

## 🔑 Test Credentials

```
Admin:
  Email: admin@example.com
  Password: password123

Supervisor:
  Email: supervisor@example.com
  Password: password123

User:
  Email: user@example.com
  Password: password123
```

## 📡 API Endpoints

### Authentication

-   `POST /login` - User login
-   `POST /register` - User registration
-   `POST /logout` - User logout
-   `GET /me` - Get current user
-   `POST /refresh` - Refresh JWT token

### User Routes (`/user`)

-   Attendance management (check-in, check-out)
-   Logbook entries
-   Leave requests
-   Profile management

### Supervisor Routes (`/supervisor`)

-   Team attendance monitoring
-   Leave approval
-   Logbook review

### Admin Routes (`/admin`)

-   User management (CRUD)
-   Division management
-   Location management
-   System reports

## 🏗️ Architecture

### Clean Structure (Aligned with `english-adaptive-learning`)

✅ Single `.env` in backend only  
✅ Frontend reads API URL from `src/utils/Constant.jsx`  
✅ Centralized routes via `routes/index.js`  
✅ No `/api` prefix in routes  
✅ ES modules throughout (`"type": "module"`)  
✅ Modular model organization

### Database

-   **Single Database:** `db_presensi_ta`
-   **ORM:** Sequelize with migrations
-   **Connection:** Configured in `backend/config/config.js`

### Environment Variables

```env
# backend/.env
APP_PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=db_presensi_ta

ACCESS_TOKEN_SECRET=***
REFRESH_TOKEN_SECRET=***
```

## 🧪 Available Scripts

### Backend

```bash
node index.js      # Production server
npm run dev        # Development with nodemon (if available)
npm run db:migrate # Run migrations
npm run db:seed    # Seed data
```

### Frontend

```bash
node_modules\.bin\vite.cmd  # Development server (Windows)
npm run dev                 # Development server (if npm works)
npm run build               # Production build
```

## 🎯 Features

### User Role

-   ✅ Check-in/Check-out attendance
-   ✅ Location-based validation
-   ✅ Logbook entries
-   ✅ Leave requests
-   ✅ Profile management

### Supervisor Role

-   ✅ Team monitoring
-   ✅ Attendance approval
-   ✅ Leave management
-   ✅ Logbook review

### Admin Role

-   ✅ Complete user management
-   ✅ Division & location setup
-   ✅ System-wide reports
-   ✅ Configuration management

## 🔧 Development

### Project Alignment

This project follows the architecture of `english-adaptive-learning`:

-   Clean folder structure
-   ES modules standard
-   Centralized routing
-   Single environment configuration
-   Bootstrap UI framework
-   Role-based access control

### Code Style

-   **Backend:** ES6+ with async/await
-   **Frontend:** Functional React with Hooks
-   **Database:** Sequelize models with relations
-   **Auth:** JWT with refresh tokens

## 📝 Notes

### PowerShell Execution Policy

If you encounter "script is not digitally signed" error:

```powershell
# Use direct binary
node_modules\.bin\vite.cmd

# Or set execution policy
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### CORS Configuration

Backend configured to accept requests from `http://localhost:5173`.  
Credentials enabled for JWT cookies.

### Database Migrations

All migrations located in `backend/database/migrations/`.  
Run `npm run db:migrate` after pulling changes.

## 🌐 Access

-   **Frontend:** http://localhost:5173
-   **Backend API:** http://localhost:3001
-   **Health Check:** http://localhost:3001/health

## 📚 Reference

This project structure is aligned with `english-adaptive-learning/`.  
See that folder for reference implementation patterns.

---

**Version:** 2.0.0 (React + Express Migration)  
**Last Updated:** December 3, 2025  
**Architecture:** MODE EXTREME++ Cleanup Complete ✅
