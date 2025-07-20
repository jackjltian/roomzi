import express from "express";
import multer from "multer";
import {
  createLease,
  checkHasLease,
  getLease,
  getLeasesForTenant,
  getLeaseById,
  uploadSignedLease,
  getLeaseHistoryForTenantAndListing
} from "../controllers/leaseController.js";

const router = express.Router();
const upload = multer(); // For handling multipart/form-data

// POST /api/leases - Create new lease
router.post("/", createLease);

// GET /api/leases/:id - Get lease by id
router.get("/:id", getLease);

// GET /api/leases/:listingId/:tenantId - Get lease ID, if it exists
router.get("/:listingId/:tenantId", checkHasLease);

// GET /api/leases/history?tenantId=...&listingId=... - Get lease history for a tenant and property
router.get("/history", getLeaseHistoryForTenantAndListing);

// GET /api/leases/tenant/:tenantId - Get all leases for a tenant
router.get("/tenant/:tenantId", getLeasesForTenant);

// GET /api/leases/:leaseId - Get a specific lease
router.get("/:leaseId", getLeaseById);

// POST /api/leases/:leaseId/upload - Upload a signed lease file
router.post("/:leaseId/upload", upload.single("file"), uploadSignedLease);

export default router; 
