import express from "express";
import landlordController from "../controllers/landlordController.js";

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
export const landlordRouter = express.Router();

landlordRouter.post('/create-listing', landlordController.createListing);
landlordRouter.get('/get-listings', landlordController.getListings);

export default router;
