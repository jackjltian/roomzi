import express from "express";
import {
  getLandlords,
  getLandlordById,
  createLandlord,
  updateLandlord,
  deleteLandlord,
  getLandlordListings,
  getPayments,
} from "../controllers/landlordController.js";
import { autoCreateLandlordProfile } from "../middleware/autoCreateProfile.js";

const router = express.Router();

// GET /api/landlords - Get all landlords
router.get("/", getLandlords);

// GET /api/landlords/:id - Get landlord by ID
router.get("/:id", autoCreateLandlordProfile, getLandlordById);

// POST /api/landlords - Create new landlord
router.post("/", createLandlord);

// PUT /api/landlords/:id - Update landlord
router.put("/:id", autoCreateLandlordProfile, updateLandlord);

// DELETE /api/landlords/:id - Delete landlord
router.delete("/:id", autoCreateLandlordProfile, deleteLandlord);

// GET /api/landlords/:id/listings - Get landlord's listings
router.get("/:id/listings", autoCreateLandlordProfile, getLandlordListings);

// GET /api/landlords/:id/payments - Get listing payments
router.get("/payments/:id", getPayments);

export default router;
