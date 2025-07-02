const prisma = require('../config/prisma');

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const { tenantId, amount } = req.body;
    const proofUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const payment = await prisma.payment.create({
      data: {
        tenantId: Number(tenantId),
        amount: parseFloat(amount),
        status: 'Pending',
        proofUrl,
      },
    });
    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all payments for a tenant
exports.getPaymentsByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const payments = await prisma.payment.findMany({
      where: { tenantId: Number(tenantId) },
      orderBy: { date: 'desc' },
    });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 