import express from "express";
import multer from "multer";
import {
  createPayment,
  getPaymentsByTenant,
} from "../controllers/paymentController.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" }); // You can configure storage as needed

// Create a new payment (with file upload)
router.post("/", upload.single("proof"), createPayment);

// Get all payments for a tenant
router.get("/tenant/:tenantId", getPaymentsByTenant);

export default router;
