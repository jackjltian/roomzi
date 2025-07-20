import express from "express";
import multer from "multer";
import {
  getLeasesForTenant,
  getLeaseById,
  uploadSignedLease,
  getLeaseHistoryForTenantAndListing
} from "../controllers/leaseController.js";

const router = express.Router();
const upload = multer(); // For handling multipart/form-data

// GET /api/leases/history?tenantId=...&listingId=... - Get lease history for a tenant and property
router.get("/history", getLeaseHistoryForTenantAndListing);

// GET /api/leases/tenant/:tenantId - Get all leases for a tenant
router.get("/tenant/:tenantId", getLeasesForTenant);

// GET /api/leases/:leaseId - Get a specific lease
router.get("/:leaseId", getLeaseById);

// POST /api/leases/:leaseId/upload - Upload a signed lease file
router.post("/:leaseId/upload", upload.single("file"), uploadSignedLease);

export default router; 