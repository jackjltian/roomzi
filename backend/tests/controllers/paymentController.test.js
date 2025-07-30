import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createPayment, getPaymentsByTenant, getPaymentsByListing, updatePaymentStatus } from '../../src/controllers/paymentController.js';

// Mock the response and request objects
const mockRes = {
  json: jest.fn().mockReturnThis(),
  status: jest.fn().mockReturnThis(),
};

const mockReq = {
  params: {},
  body: {},
  query: {},
};

describe('Payment Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRes.json.mockClear();
    mockRes.status.mockClear();
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const paymentData = {
        tenantId: 'tenant-1',
        amount: 2500,
        listingId: '1',
      };

      const createdPayment = {
        id: 1,
        tenantId: 'tenant-1',
        listingId: '1',
        amount: 2500,
        status: 'Pending',
        proofUrl: null,
        date: new Date('2024-01-01'),
      };

      mockReq.body = paymentData;
      global.mockPrisma.payment_requests.create.mockResolvedValue(createdPayment);

      await createPayment(mockReq, mockRes);

      expect(global.mockPrisma.payment_requests.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          listingId: BigInt('1'),
          amount: 2500,
          status: 'Pending',
          proofUrl: null,
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payment: createdPayment,
      });
    });

    it('should handle invalid listingId format', async () => {
      const paymentData = {
        tenantId: 'tenant-1',
        amount: 2500,
        listingId: 'invalid-id',
      };

      mockReq.body = paymentData;

      await createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid listingId format',
      });
    });

    it('should handle invalid amount', async () => {
      const paymentData = {
        tenantId: 'tenant-1',
        amount: -100,
        listingId: '1',
      };

      mockReq.body = paymentData;

      await createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Amount must be greater than 0',
      });
    });

    it('should handle missing required fields', async () => {
      const paymentData = {
        tenantId: 'tenant-1',
        // Missing listingId and amount
      };

      mockReq.body = paymentData;

      await createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'tenantId, listingId, and amount are required',
      });
    });

    it('should handle database errors', async () => {
      const paymentData = {
        tenantId: 'tenant-1',
        amount: 2500,
        listingId: '1',
      };

      mockReq.body = paymentData;
      global.mockPrisma.payment_requests.create.mockRejectedValue(new Error('Database connection failed'));

      await createPayment(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
      });
    });
  });

  describe('getPaymentsByTenant', () => {
    it('should return tenant payments successfully', async () => {
      const mockPayments = [
        {
          id: 1,
          tenantId: 'tenant-1',
          listingId: '1',
          amount: 2500,
          status: 'Approved',
          proofUrl: 'https://example.com/proof1.jpg',
          date: new Date('2024-01-01'),
        },
        {
          id: 2,
          tenantId: 'tenant-1',
          listingId: '2',
          amount: 3000,
          status: 'Pending',
          proofUrl: null,
          date: new Date('2024-01-15'),
        },
      ];

      mockReq.params = { tenantId: 'tenant-1' };
      global.mockPrisma.payment_requests.findMany.mockResolvedValue(mockPayments);

      await getPaymentsByTenant(mockReq, mockRes);

      expect(global.mockPrisma.payment_requests.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { date: 'desc' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payments: mockPayments,
      });
    });

    it('should return empty array when tenant has no payments', async () => {
      mockReq.params = { tenantId: 'tenant-1' };
      global.mockPrisma.payment_requests.findMany.mockResolvedValue([]);

      await getPaymentsByTenant(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payments: [],
      });
    });

    it('should handle database errors', async () => {
      mockReq.params = { tenantId: 'tenant-1' };
      global.mockPrisma.payment_requests.findMany.mockRejectedValue(new Error('Database connection failed'));

      await getPaymentsByTenant(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
      });
    });
  });

  describe('getPaymentsByListing', () => {
    it('should return listing payments successfully', async () => {
      const mockPayments = [
        {
          id: 1,
          tenantId: 'tenant-1',
          listingId: '1',
          amount: 2500,
          status: 'Approved',
          date: new Date('2024-01-01'),
        },
        {
          id: 2,
          tenantId: 'tenant-2',
          listingId: '1',
          amount: 2500,
          status: 'Pending',
          date: new Date('2024-01-15'),
        },
      ];

      mockReq.params = { listingId: '1' };
      global.mockPrisma.payment_requests.findMany.mockResolvedValue(mockPayments);

      await getPaymentsByListing(mockReq, mockRes);

      expect(global.mockPrisma.payment_requests.findMany).toHaveBeenCalledWith({
        where: { listingId: BigInt('1') },
        orderBy: { date: 'desc' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payments: mockPayments,
      });
    });

    it('should handle invalid listingId format', async () => {
      mockReq.params = { listingId: 'invalid-id' };

      await getPaymentsByListing(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid listingId format',
      });
    });

    it('should return empty array when listing has no payments', async () => {
      mockReq.params = { listingId: '1' };
      global.mockPrisma.payment_requests.findMany.mockResolvedValue([]);

      await getPaymentsByListing(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payments: [],
      });
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status to Approved successfully', async () => {
      const updatedPayment = {
        id: 1,
        tenantId: 'tenant-1',
        listingId: '1',
        amount: 2500,
        status: 'Approved',
        date: new Date('2024-01-01'),
      };

      mockReq.params = { paymentId: '1' };
      mockReq.body = { status: 'Approved' };
      global.mockPrisma.payment_requests.update.mockResolvedValue(updatedPayment);

      await updatePaymentStatus(mockReq, mockRes);

      expect(global.mockPrisma.payment_requests.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'Approved' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payment: updatedPayment,
      });
    });

    it('should update payment status to Rejected successfully', async () => {
      const updatedPayment = {
        id: 1,
        tenantId: 'tenant-1',
        listingId: '1',
        amount: 2500,
        status: 'Rejected',
        date: new Date('2024-01-01'),
      };

      mockReq.params = { paymentId: '1' };
      mockReq.body = { status: 'Rejected' };
      global.mockPrisma.payment_requests.update.mockResolvedValue(updatedPayment);

      await updatePaymentStatus(mockReq, mockRes);

      expect(global.mockPrisma.payment_requests.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'Rejected' },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        payment: updatedPayment,
      });
    });

    it('should return 404 when payment not found', async () => {
      mockReq.params = { paymentId: '999' };
      mockReq.body = { status: 'Approved' };
      global.mockPrisma.payment_requests.update.mockRejectedValue({ code: 'P2025' });

      await updatePaymentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Payment request not found',
      });
    });

    it('should handle invalid payment ID format', async () => {
      mockReq.params = { paymentId: 'invalid-id' };
      mockReq.body = { status: 'Approved' };

      await updatePaymentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid payment ID format',
      });
    });

    it('should handle invalid status value', async () => {
      mockReq.params = { paymentId: '1' };
      mockReq.body = { status: 'InvalidStatus' };

      await updatePaymentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid status. Must be one of: Pending, Approved, Rejected',
      });
    });

    it('should handle missing status field', async () => {
      mockReq.params = { paymentId: '1' };
      mockReq.body = {};

      await updatePaymentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid status. Must be one of: Pending, Approved, Rejected',
      });
    });

    it('should handle database errors', async () => {
      mockReq.params = { paymentId: '1' };
      mockReq.body = { status: 'Approved' };
      global.mockPrisma.payment_requests.update.mockRejectedValue(new Error('Database connection failed'));

      await updatePaymentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
      });
    });

    it('should handle concurrent status updates', async () => {
      mockReq.params = { paymentId: '1' };
      mockReq.body = { status: 'Approved' };
      global.mockPrisma.payment_requests.update.mockRejectedValue({ code: 'P2025' });

      await updatePaymentStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Payment request not found',
      });
    });
  });
}); 