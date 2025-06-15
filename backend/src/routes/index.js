import express from "express";
import landlordRoutes from "./landlordRoutes.js";
import tenantRoutes from "./tenantRoutes.js";
import listingRoutes from "./listingRoutes.js";
import chatRoutes from "./chatRoutes.js";

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
router.use("/landlords", landlordRoutes);
router.use("/tenants", tenantRoutes);
router.use("/listings", listingRoutes);
router.use("/chats", chatRoutes);

export default router;
