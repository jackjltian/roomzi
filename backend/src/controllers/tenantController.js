import { prisma } from "../config/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";

// Get all tenants
export const getTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant_profiles.findMany({
      include: {
        listings: {
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            state: true,
            available: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.json(successResponse(tenants, "Tenants retrieved successfully"));
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get tenant by ID
export const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant_profiles.findUnique({
      where: { id },
      include: {
        listings: {
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            state: true,
            bedrooms: true,
            bathrooms: true,
            available: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!tenant) {
      return res
        .status(404)
        .json(errorResponse(new Error("Tenant not found"), 404));
    }

    res.json(successResponse(tenant, "Tenant retrieved successfully"));
  } catch (error) {
    console.error("Error fetching tenant:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Create new tenant (with upsert functionality)
export const createTenant = async (req, res) => {
  try {
    const { id, full_name, email, phone, image_url, address } = req.body;

    // Use upsert to handle both create and update scenarios
    const tenant = await prisma.tenant_profiles.upsert({
      where: { id },
      update: {
        // Update existing profile with new data if provided
        ...(full_name && { full_name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(image_url !== undefined && { image_url }),
        ...(address !== undefined && { address }),
        updated_at: new Date(),
      },
      create: {
        id,
        full_name: full_name || email.split("@")[0], // Use email prefix as fallback
        email,
        phone,
        image_url,
        address,
      },
    });

    res
      .status(201)
      .json(
        successResponse(tenant, "Tenant profile created/updated successfully")
      );
  } catch (error) {
    console.error("Error creating/updating tenant:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Update tenant
export const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, image_url, address } = req.body;

    const tenant = await prisma.tenant_profiles.update({
      where: { id },
      data: {
        ...(full_name && { full_name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(image_url !== undefined && { image_url }),
        ...(address !== undefined && { address }),
        updated_at: new Date(),
      },
    });

    res.json(successResponse(tenant, "Tenant updated successfully"));
  } catch (error) {
    console.error("Error updating tenant:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(errorResponse(new Error("Tenant not found"), 404));
    }

    res.status(500).json(errorResponse(error));
  }
};

// Delete tenant
export const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.tenant_profiles.delete({
      where: { id },
    });

    res.json(successResponse(null, "Tenant deleted successfully"));
  } catch (error) {
    console.error("Error deleting tenant:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(errorResponse(new Error("Tenant not found"), 404));
    }

    res.status(500).json(errorResponse(error));
  }
};
