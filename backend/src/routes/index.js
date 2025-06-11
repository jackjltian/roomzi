import express from "express";
import propertiesRouter from "./properties.js";

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
  });
});

// Mount routes
router.use("/properties", propertiesRouter);

export default router;
