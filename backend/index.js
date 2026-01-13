import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { testConnection } from "./database/db.js";
import router from "./routes/index.js";
import { startAutoCheckoutScheduler } from "./utils/autoCheckoutScheduler.js";

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 3001;

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        // Allow localhost on any port for development
        if (origin.startsWith("http://localhost:")) {
            return callback(null, true);
        }

        // Check against allowed origins
        const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:3000",
            process.env.CLIENT_URL,
        ].filter(Boolean);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Centralized routes
app.use("/api", router);

// Public folder for uploads
app.use(express.static("public"));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Attendance API is running" });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
    });
});

app.listen(PORT, async () => {
    testConnection();
    await startAutoCheckoutScheduler(); // Initialize auto checkout scheduler
    console.log(`Server running on port ${PORT}`);
    console.log(`Auto checkout scheduler initialized`);
});
