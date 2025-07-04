import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { successResponse } from "./utils/response.js";
import { supabase } from "./config/supabase.js";
import { landlordRouter } from "./routes/index.js";
import { prisma } from "./config/prisma.js";
import apiRoutes from "./routes/index.js";
import chatRoutes from "./routes/chat.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import multer from 'multer';
import path from 'path';

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || "http://localhost:8080",
    "http://localhost:8081","http://localhost:8082",
    "http://localhost:8083",
    "http://localhost:8084",
    "http://localhost:8085",
    "http://localhost:8086",
    "http://localhost:8087",
    "http://localhost:8088",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8082",
    "http://127.0.0.1:8083",
    "http://127.0.0.1:8084",
    "http://127.0.0.1:8085",
    "http://127.0.0.1:8086",
    "http://127.0.0.1:8087",
    "http://127.0.0.1:8088"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
  ],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Save with original extension
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// Routes
app.use("/api/payments", paymentRoutes);
app.use("/api/landlord", landlordRouter);

// API routes
app.use("/api", apiRoutes);
app.use("/api/chat", chatRoutes);

// Basic health check route
app.get("/api/health", (req, res) => {
  res.json(
    successResponse(
      {
        environment: process.env.NODE_ENV,
        frontendUrl: process.env.FRONTEND_URL,
        database: "Connected",
      },
      "Server is running"
    )
  );
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔄 Gracefully shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🔄 Gracefully shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`
🚀 Server is running!
📡 Port: ${port}
🌍 Environment: ${process.env.NODE_ENV || "development"}
🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:8080"}
🗄️  Database: Prisma + Supabase PostgreSQL
📋 API Routes: 
   • /api/landlords - Landlord management
   • /api/tenants - Tenant management  
   • /api/listings - Property listings
   • /api/chats - Messaging system
  `);
});
