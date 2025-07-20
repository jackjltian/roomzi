import { prisma } from "../config/prisma.js";
import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

// Helper to convert BigInt and Date to string
const convertBigIntToString = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(convertBigIntToString);
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }
  return obj;
};

// Get all leases for a tenant
export const getLeasesForTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const leases = await prisma.leases.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: "desc" },
      include: {
        listings: {
          select: {
            id: true,
            title: true,
            address: true,
            images: true,
          },
        },
      },
    });
    res.json(successResponse(convertBigIntToString(leases), "Leases retrieved successfully"));
  } catch (error) {
    console.error("Error fetching leases:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get a specific lease by ID
export const getLeaseById = async (req, res) => {
  try {
    const { leaseId } = req.params;
    // Explicitly select all relevant fields, including document
    const lease = await prisma.leases.findUnique({
      where: { id: leaseId },
      select: {
        id: true,
        created_at: true,
        tenant_id: true,
        listing_id: true,
        start_date: true,
        end_date: true,
        rent: true,
        signed: true,
        document: true, // Ensure document is always included
      },
    });
    if (!lease) {
      return res.status(404).json(errorResponse(new Error("Lease not found"), 404));
    }
    res.json(successResponse(convertBigIntToString(lease), "Lease retrieved successfully"));
  } catch (error) {
    console.error("Error fetching lease:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Upload a signed lease file
export const uploadSignedLease = async (req, res) => {
  try {
    const { leaseId } = req.params;
    if (!req.file) {
      return res.status(400).json(errorResponse(new Error("No file uploaded"), 400));
    }
    // Upload to Supabase Storage
    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `signed_${leaseId}_${Date.now()}.${fileExt}`;
    const { data, error: uploadError } = await supabase.storage.from('leases').upload(fileName, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      throw uploadError;
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('leases').getPublicUrl(fileName);
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      throw new Error("Could not get file URL");
    }
    // Update lease record
    const updatedLease = await prisma.leases.update({
      where: { id: leaseId },
      data: { document: publicUrl, signed: true },
    });

    // Also update the corresponding listing: set tenant_id and available = false
    if (updatedLease.listing_id && updatedLease.tenant_id) {
      await prisma.listings.update({
        where: { id: BigInt(updatedLease.listing_id) },
        data: {
          tenant_id: updatedLease.tenant_id,
          available: false,
        },
      });
    }

    res.json(successResponse(convertBigIntToString(updatedLease), "Signed lease uploaded successfully"));
  } catch (error) {
    console.error("Error uploading signed lease:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get lease history for a tenant and a specific listing
export const getLeaseHistoryForTenantAndListing = async (req, res) => {
  try {
    const { tenantId, listingId } = req.query;
    if (!tenantId || !listingId) {
      return res.status(400).json(errorResponse(new Error("Missing tenantId or listingId"), 400));
    }
    const leases = await prisma.leases.findMany({
      where: {
        tenant_id: tenantId,
        listing_id: BigInt(listingId),
      },
      orderBy: { start_date: "desc" },
    });
    res.json(successResponse(convertBigIntToString(leases), "Lease history retrieved successfully"));
  } catch (error) {
    console.error("Error fetching lease history:", error);
    res.status(500).json(errorResponse(error));
  }
}; 