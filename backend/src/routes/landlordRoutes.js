import express from "express";
import {
  getLandlords,
  getLandlordById,
  createLandlord,
  updateLandlord,
  deleteLandlord,
  getLandlordListings,
} from "../controllers/landlordController.js";

const router = express.Router();

// GET /api/landlords - Get all landlords
router.get("/", getLandlords);

// GET /api/landlords/:id - Get landlord by ID
router.get("/:id", getLandlordById);

// POST /api/landlords - Create new landlord
router.post("/", createLandlord);

// PUT /api/landlords/:id - Update landlord
router.put("/:id", updateLandlord);

// DELETE /api/landlords/:id - Delete landlord
router.delete("/:id", deleteLandlord);

// GET /api/landlords/:id/listings - Get landlord's listings
router.get("/:id/listings", getLandlordListings);

export default router;
