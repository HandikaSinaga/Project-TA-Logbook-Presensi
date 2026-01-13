# Frontend Build Instructions

## Problem: PowerShell Execution Policy

Jika Anda mendapat error:

```
npm.ps1 cannot be loaded. The file is not digitally signed.
```

## Solutions:

### Solution 1: Use Batch File (Recommended)

```cmd
# Double-click file ini di Windows Explorer:
build.bat

# Atau jalankan di CMD:
cd frontend
build.bat
```

### Solution 2: Fix PowerShell Execution Policy

**Option A - Temporary (untuk sesi ini saja):**

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
npm run build
```

**Option B - Permanent (untuk user Anda):**

```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
npm run build
```

### Solution 3: Use CMD Instead of PowerShell

```cmd
# Buka CMD (bukan PowerShell)
cd frontend
npm run build
```

### Solution 4: Use Node Directly

```powershell
cd frontend
node node_modules/vite/bin/vite.js build
```

### Solution 5: Use npx

```cmd
cd frontend
npx vite build
```

## Verification

Setelah build berhasil, cek folder `dist/`:

```cmd
dir dist
```

Expected output:

```
dist/
├── index.html
├── vite.svg
└── assets/
    ├── index-[hash].js
    ├── index-[hash].css
    └── vendor-[hash].js
```

## Build Commands

```json
{
    "scripts": {
        "dev": "vite", // Development server
        "build": "vite build", // Production build
        "preview": "vite preview" // Preview production build
    }
}
```

## Alternative: Use VS Code Terminal

1. Open VS Code
2. Terminal → New Terminal
3. Pilih "Command Prompt" (bukan PowerShell)
4. Run: `npm run build`

## For CI/CD

Gunakan CMD atau bash, bukan PowerShell:

```yaml
# GitHub Actions
- name: Build Frontend
  shell: cmd
  run: |
      cd frontend
      npm install
      npm run build
```
