import express from "express";
import {
  createLease,
  checkHasLease,
  getLease
  // getDocument
} from "../controllers/leaseController.js";

const router = express.Router();

// POST /api/leases - Create new lease
router.post("/", createLease);

// GET /api/leases/:id - Get lease by id
router.get("/:id", getLease);

// // GET /api/leases/document/:leaseId - Get document
// router.get("/document/:leaseId", getDocument);

// GET /api/leases/:listingId/:tenantId - Get lease ID, if it exists
router.get("/:listingId/:tenantId", checkHasLease);

export default router;