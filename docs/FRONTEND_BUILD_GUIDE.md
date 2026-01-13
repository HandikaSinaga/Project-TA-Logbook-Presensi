# 🏗️ Frontend Build & Deployment Guide

## Development vs Production

### Development Mode

```bash
npm run dev
# Runs on http://localhost:5173
# Hot module replacement (HMR)
# Source maps enabled
# No optimization
```

### Production Build

```bash
npm run build
# Output: dist/ folder
# Minified and optimized
# Code splitting
# Tree shaking
# Gzip ready
```

---

## Build Configuration

### Vite Config (`vite.config.js`)

```javascript
{
  build: {
    outDir: 'dist',                    // Output directory
    emptyOutDir: true,                 // Clean before build
    sourcemap: false,                  // No source maps in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          bootstrap: ['bootstrap', 'react-bootstrap'],
          utils: ['axios', 'jwt-decode']
        }
      }
    }
  }
}
```

**Benefits:**

-   ✅ Smaller bundle sizes
-   ✅ Better caching (vendor chunks separate)
-   ✅ Faster page loads
-   ✅ Parallel downloads

---

## Build Output Structure

```
dist/
├── index.html                 # Entry point (no cache)
├── vite.svg                   # Favicon
└── assets/
    ├── index-[hash].js        # Main app bundle (1-2 MB)
    ├── vendor-[hash].js       # React, Router (500 KB)
    ├── bootstrap-[hash].js    # UI components (300 KB)
    ├── utils-[hash].js        # Utilities (100 KB)
    └── index-[hash].css       # Styles (200 KB)
```

**Hash in filenames:**

-   Changes on every build if content changes
-   Enables cache busting
-   Old cached files automatically invalidated

---

## Deployment Process

### Option 1: Nginx (Simple)

```bash
# 1. Build locally
npm run build

# 2. Upload dist/ folder to server
scp -r dist/* user@server:/var/www/presensi/

# 3. Nginx serves dist/ folder
# nginx.conf:
server {
    root /var/www/presensi;  # Points to dist/ content
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA routing
    }
}
```

### Option 2: S3 + CloudFront (Production)

```bash
# 1. Build locally
npm run build

# 2. Upload to S3
aws s3 sync dist/ s3://your-bucket --delete

# 3. CloudFront serves from S3
# Global CDN distribution
# HTTPS enabled
# Low latency worldwide
```

---

## Environment Variables

### `.env.production`

```env
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_GOOGLE_CLIENT_ID=your_production_client_id
```

**Important:**

-   ⚠️ Only `VITE_*` variables are exposed to browser
-   ⚠️ Never put secrets in frontend `.env`
-   ✅ API keys for client-side services only (Google OAuth, etc.)

---

## Build Optimization

### Code Splitting

-   Automatic route-based splitting
-   Vendor chunks (React, Bootstrap)
-   Dynamic imports for heavy components

### Tree Shaking

-   Unused code removed
-   ES6 modules required
-   Import only what you use

### Minification

-   JavaScript: Terser
-   CSS: cssnano
-   HTML: html-minifier-terser

### Compression

-   Gzip: 70-80% size reduction
-   Brotli: 75-85% size reduction (if enabled)

---

## Testing Production Build

```bash
# Build
npm run build

# Preview locally
npm run preview
# Opens http://localhost:4173

# Test in browser:
# 1. Check network tab (bundle sizes)
# 2. Check lighthouse score
# 3. Test all routes
# 4. Test API calls
```

---

## Common Issues

### 1. Blank Page After Deploy

```bash
# Check browser console
# Usually: incorrect base path or API URL

# Fix: Update .env.production
VITE_API_URL=https://your-correct-api.com
```

### 2. 404 on Refresh

```bash
# Problem: Nginx not configured for SPA
# Fix: Add to nginx.conf
location / {
    try_files $uri $uri/ /index.html;
}
```

### 3. API Calls Failing

```bash
# Check CORS on backend
CORS_ORIGIN=https://your-frontend-domain.com

# Check API URL in .env.production
VITE_API_URL=https://api.yourdomain.com
```

### 4. Large Bundle Size

```bash
# Analyze bundle
npm run build -- --analyze

# Solutions:
# - Lazy load routes
# - Use dynamic imports
# - Optimize images
# - Remove unused dependencies
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Frontend

on:
    push:
        branches: [main]

jobs:
    deploy:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "22"

            - name: Install dependencies
              run: cd frontend && npm ci

            - name: Build
              run: cd frontend && npm run build
              env:
                  VITE_API_URL: ${{ secrets.API_URL }}
                  VITE_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}

            - name: Deploy to S3
              run: |
                  aws s3 sync frontend/dist/ s3://your-bucket --delete
              env:
                  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
                  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## Performance Checklist

-   [ ] Run `npm run build` successfully
-   [ ] Total bundle size < 3 MB
-   [ ] Lighthouse score > 90
-   [ ] First contentful paint < 2s
-   [ ] Time to interactive < 3s
-   [ ] All routes work after refresh
-   [ ] API calls successful
-   [ ] Images optimized
-   [ ] Fonts loaded correctly
-   [ ] No console errors

---

## Best Practices

✅ **DO:**

-   Build locally before deploying
-   Test production build with `npm run preview`
-   Use environment variables for API URLs
-   Enable gzip compression on server
-   Set proper cache headers
-   Monitor bundle sizes

❌ **DON'T:**

-   Deploy source code (`src/` folder)
-   Commit `dist/` folder to git
-   Hardcode API URLs in code
-   Include dev dependencies in production
-   Use `npm run dev` in production

---

## Further Reading

-   [Vite Build Guide](https://vitejs.dev/guide/build.html)
-   [Deployment Best Practices](https://vitejs.dev/guide/static-deploy.html)
-   [Nginx SPA Configuration](https://router.vuejs.org/guide/essentials/history-mode.html#nginx)
