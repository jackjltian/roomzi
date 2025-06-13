import express from "express";
import {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../controllers/tenantController.js";

const router = express.Router();

// GET /api/tenants - Get all tenants
router.get("/", getTenants);

// GET /api/tenants/:id - Get tenant by ID
router.get("/:id", getTenantById);

// POST /api/tenants - Create new tenant
router.post("/", createTenant);

// PUT /api/tenants/:id - Update tenant
router.put("/:id", updateTenant);

// DELETE /api/tenants/:id - Delete tenant
router.delete("/:id", deleteTenant);

export default router;
