import express from "express";
import multer from "multer";
import {
  createLease,
  checkHasLease,
  getLeaseWithDocument,
  getLeasesForTenant,
  getLeaseById,
  uploadSignedLease,
  getLeaseHistoryForTenantAndListing
} from "../controllers/leaseController.js";

const router = express.Router();
const upload = multer(); // For handling multipart/form-data

// POST /api/leases - Create new lease
router.post("/", createLease);

// GET /api/leases/history?tenantId=...&listingId=... - Get lease history for a tenant and property
router.get("/history", getLeaseHistoryForTenantAndListing);

// GET /api/leases/tenant/:tenantId - Get all leases for a tenant
router.get("/tenant/:tenantId", getLeasesForTenant);

// GET /api/leases/document/:id - Get lease by id (must come before generic routes)
router.get("/document/:id", getLeaseWithDocument);

// GET /api/leases/:listingId/:tenantId - Get lease ID, if it exists
router.get("/:listingId/:tenantId", checkHasLease);

// GET /api/leases/:leaseId - Get a specific lease (must be last to avoid conflicts)
router.get("/:leaseId", getLeaseById);

// POST /api/leases/:leaseId/upload - Upload a signed lease file
router.post("/:leaseId/upload", upload.single("file"), uploadSignedLease);

export default router; 
