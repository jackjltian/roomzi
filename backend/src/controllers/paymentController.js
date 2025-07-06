import { prisma } from "../config/prisma.js";

// Create a new payment request
export const createPayment = async (req, res) => {
  try {
    const { tenantId, amount } = req.body;
    const proofUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        tenantId: tenantId,
        amount: parseFloat(amount),
        status: "Pending",
        proofUrl,
      },
    });
    res.status(201).json({ success: true, payment: paymentRequest });
  } catch (err) {
    console.error("Error creating payment request:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all payment requests for a tenant
export const getPaymentsByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const paymentRequests = await prisma.paymentRequest.findMany({
      where: { tenantId: tenantId },
      orderBy: { date: "desc" },
    });
    res.json({ success: true, payments: paymentRequests });
  } catch (err) {
    console.error("Error fetching payment requests:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
