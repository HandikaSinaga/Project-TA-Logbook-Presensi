import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ==========================================
// Vite Configuration
// ==========================================
// Frontend automatically detects environment:
// - Development (npm run dev): uses http://localhost:3001/api
// - Production (npm run build): uses /api (via Nginx proxy)
// No .env file needed in frontend!
// ==========================================

export default defineConfig(({ mode }) => ({
    plugins: [react()],
    
    // Ensure production mode sets correct environment
    mode: mode,

    // Development server
    server: {
        port: 5173,
        // Proxy API calls to backend (no CORS issues in dev)
        proxy: {
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
                secure: false,
            },
            "/uploads": {
                target: "http://localhost:3001",
                changeOrigin: true,
                secure: false,
            },
        },
    },

    // Production build
    build: {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap: false,
        assetsDir: "assets",
        rollupOptions: {
            output: {
                // Code splitting for better caching
                manualChunks: {
                    vendor: ["react", "react-dom", "react-router-dom"],
                    bootstrap: ["bootstrap", "react-bootstrap"],
                    utils: ["axios", "jwt-decode"],
                },
                // Asset naming with hash for cache busting
                assetFileNames: "assets/[name]-[hash][extname]",
                chunkFileNames: "assets/[name]-[hash].js",
                entryFileNames: "assets/[name]-[hash].js",
            },
        },
    },

    // Preview production build locally
    preview: {
        port: 4173,
        // Proxy for testing production build locally
        proxy: {
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
                secure: false,
            },
            "/uploads": {
                target: "http://localhost:3001",
                changeOrigin: true,
                secure: false,
            },
        },
    },
}));
