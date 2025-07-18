import { PrismaClient } from "@prisma/client";
import convertBigIntToString from "../utils/convertBigIntToString.js";
const prisma = new PrismaClient();

const createViewingRequest = async (req, res) => {
  try {
    const { propertyId, tenantId, landlordId, requestedDateTime } = req.body;
    console.log("Received viewing request:", req.body);
    if (!propertyId || !tenantId || !landlordId || !requestedDateTime) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const viewingRequest = await prisma.viewingRequest.create({
      data: {
        propertyId: Number(propertyId),
        tenantId,
        landlordId,
        requestedDateTime: new Date(requestedDateTime),
      },
      include: { listing: true, tenant: true, landlord: true },
    });
    res.status(201).json(convertBigIntToString(viewingRequest));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create viewing request." });
  }
};

const getViewingRequestsForLandlord = async (req, res) => {
  try {
    const { landlordId } = req.query;
    if (!landlordId) {
      return res.status(400).json({ error: "Missing landlordId." });
    }
    const requests = await prisma.viewingRequest.findMany({
      where: { landlordId },
      include: { listing: true, tenant: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(convertBigIntToString(requests));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch viewing requests." });
  }
};

const getViewingRequestsForTenant = async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenantId." });
    }
    const requests = await prisma.viewingRequest.findMany({
      where: { tenantId },
      include: { listing: true, landlord: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(convertBigIntToString(requests));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch viewing requests." });
  }
};

const updateViewingRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, proposedDateTime } = req.body;
    if (!["Approved", "Declined", "Proposed", "Closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    const updateData = { status };
    if (status === "Proposed" && proposedDateTime) {
      updateData.proposedDateTime = new Date(proposedDateTime);
    } else if (status === "Approved") {
      // If approving a proposed time, set requestedDateTime to proposedDateTime and clear proposedDateTime
      const req = await prisma.viewingRequest.findUnique({
        where: { id: Number(id) },
      });
      if (req && req.proposedDateTime) {
        updateData.requestedDateTime = req.proposedDateTime;
        updateData.proposedDateTime = null;
      }
    } else if (status !== "Proposed") {
      updateData.proposedDateTime = null;
    }
    const updated = await prisma.viewingRequest.update({
      where: { id: Number(id) },
      data: updateData,
      include: { listing: true, tenant: true, landlord: true },
    });
    res.json(convertBigIntToString(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update viewing request status." });
  }
};

const getApprovedViewings = async (req, res) => {
  try {
    const { userId, role } = req.query;
    if (!userId || !role) {
      return res.status(400).json({ error: "Missing userId or role." });
    }
    let where = { status: "Approved" };
    if (role === "tenant") {
      where.tenantId = userId;
    } else if (role === "landlord") {
      where.landlordId = userId;
    } else {
      return res.status(400).json({ error: "Invalid role." });
    }
    const viewings = await prisma.viewingRequest.findMany({
      where,
      include: { listing: true },
      orderBy: { requestedDateTime: "asc" },
    });
    res.json(convertBigIntToString(viewings));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch approved viewings." });
  }
};

export default {
  createViewingRequest,
  getViewingRequestsForLandlord,
  getViewingRequestsForTenant,
  updateViewingRequestStatus,
  getApprovedViewings,
};
