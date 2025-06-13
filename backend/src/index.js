import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { successResponse } from "./utils/response.js";
import { supabase } from "./config/supabase.js";
import { landlordRouter } from "./routes/index.js";

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/landlord', landlordRouter);

// Basic health check route
app.get("/api/health", (req, res) => {
  res.json(
    successResponse(
      {
        environment: process.env.NODE_ENV,
        frontendUrl: process.env.FRONTEND_URL,
      },
      "Server is running"
    )
  );
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`
🚀 Server is running!
📡 Port: ${port}
🌍 Environment: ${process.env.NODE_ENV || "development"}
🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:8080"}
  `);
});
