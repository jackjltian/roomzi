import { prisma } from "../config/prisma.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/response.js";

// Get all listings with pagination and filtering
export const getListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      state,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      type,
      available = true,
    } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Build where clause for filtering
    const where = {
      ...(available !== "false" && { available: true }),
      ...(city && { city: { contains: city, mode: "insensitive" } }),
      ...(state && { state: { contains: state, mode: "insensitive" } }),
      ...(type && { type: { contains: type, mode: "insensitive" } }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
      ...(bedrooms && { bedrooms: { gte: parseInt(bedrooms) } }),
      ...(bathrooms && { bathrooms: { gte: parseInt(bathrooms) } }),
    };

    const [listings, total] = await Promise.all([
      prisma.listings.findMany({
        where,
        include: {
          landlord_profiles: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
            },
          },
          tenant_profiles: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take,
      }),
      prisma.listings.count({ where }),
    ]);

    // Convert BigInt fields to strings for JSON serialization
    const safeListings = listings.map(listing => ({
      ...listing,
      id: listing.id.toString(),
      landlord_id: listing.landlord_id?.toString(),
      tenant_id: listing.tenant_id?.toString(),
      landlord_profiles: listing.landlord_profiles
        ? {
            ...listing.landlord_profiles,
            id: listing.landlord_profiles.id?.toString(),
          }
        : undefined,
      tenant_profiles: listing.tenant_profiles
        ? {
            ...listing.tenant_profiles,
            id: listing.tenant_profiles.id?.toString(),
          }
        : undefined,
      images: Array.isArray(listing.images)
        ? listing.images
        : (typeof listing.images === 'string' && listing.images.trim().startsWith('[')
            ? JSON.parse(listing.images)
            : []),
      amenities: Array.isArray(listing.amenities)
        ? listing.amenities
        : (typeof listing.amenities === 'string' && listing.amenities.trim().startsWith('[')
            ? JSON.parse(listing.amenities)
            : []),
      requirements: Array.isArray(listing.requirements)
        ? listing.requirements
        : (typeof listing.requirements === 'string' && listing.requirements.trim().startsWith('[')
            ? JSON.parse(listing.requirements)
            : (listing.requirements ? [listing.requirements] : [])),
      house_rules: Array.isArray(listing.house_rules)
        ? listing.house_rules
        : (typeof listing.house_rules === 'string' && listing.house_rules.trim().startsWith('[')
            ? JSON.parse(listing.house_rules)
            : (listing.house_rules ? [listing.house_rules] : [])),
    }));

    res.json(paginatedResponse(safeListings, parseInt(page), take, total));
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get listing by ID
export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listings.findUnique({
      where: { id: BigInt(id) },
      include: {
        landlord_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            image_url: true,
          },
        },
        tenant_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            image_url: true,
          },
        },
      },
    });

    if (!listing) {
      return res
        .status(404)
        .json(errorResponse(new Error("Listing not found"), 404));
    }

    // Convert BigInt to string for JSON serialization and map landlord/tenant data
    const responseData = {
      ...listing,
      id: listing.id.toString(),
      landlord_id: listing.landlord_id?.toString(),
      tenant_id: listing.tenant_id?.toString(),
      landlord_name: listing.landlord_profiles?.full_name,
      landlord_phone: listing.landlord_profiles?.phone,
      tenant_name: listing.tenant_profiles?.full_name,
      tenant_phone: listing.tenant_profiles?.phone,
      images: Array.isArray(listing.images)
        ? listing.images
        : (typeof listing.images === 'string' && listing.images.trim().startsWith('[')
            ? JSON.parse(listing.images)
            : []),
      amenities: Array.isArray(listing.amenities)
        ? listing.amenities
        : (typeof listing.amenities === 'string' && listing.amenities.trim().startsWith('[')
            ? JSON.parse(listing.amenities)
            : []),
      requirements: Array.isArray(listing.requirements)
        ? listing.requirements
        : (typeof listing.requirements === 'string' && listing.requirements.trim().startsWith('[')
            ? JSON.parse(listing.requirements)
            : (listing.requirements ? [listing.requirements] : [])),
      house_rules: Array.isArray(listing.house_rules)
        ? listing.house_rules
        : (typeof listing.house_rules === 'string' && listing.house_rules.trim().startsWith('[')
            ? JSON.parse(listing.house_rules)
            : (listing.house_rules ? [listing.house_rules] : [])),
    };

    res.json(successResponse(responseData, "Listing retrieved successfully"));
  } catch (error) {
    console.error("Error fetching listing:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Create new listing
export const createListing = async (req, res) => {
  try {
    const {
      landlord_id,
      tenant_id,
      title,
      type,
      address,
      city,
      state,
      zip_code,
      bedrooms,
      bathrooms,
      area,
      price,
      description,
      lease_type,
      amenities,
      requirements,
      house_rules,
      images,
      landlord_name,
      landlord_phone,
      coordinates,
      available = true,
    } = req.body;

    const listing = await prisma.listings.create({
      data: {
        landlord_id,
        tenant_id,
        title,
        type,
        address,
        city,
        state,
        zip_code,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        area: area ? parseFloat(area) : null,
        price: price ? parseFloat(price) : null,
        description,
        lease_type,
        amenities: amenities || [],
        requirements,
        house_rules,
        images,
        landlord_name,
        landlord_phone,
        coordinates,
        available,
      },
      include: {
        landlord_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Convert BigInt to string for JSON serialization
    const responseData = {
      ...listing,
      id: listing.id.toString(),
    };

    res
      .status(201)
      .json(successResponse(responseData, "Listing created successfully"));
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Update listing
export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Process numeric fields
    if (updateData.bedrooms)
      updateData.bedrooms = parseInt(updateData.bedrooms);
    if (updateData.bathrooms)
      updateData.bathrooms = parseInt(updateData.bathrooms);
    if (updateData.area) updateData.area = parseFloat(updateData.area);
    if (updateData.price) updateData.price = parseFloat(updateData.price);

    const listing = await prisma.listings.update({
      where: { id: id },
      data: updateData,
      include: {
        landlord_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Convert BigInt to string for JSON serialization
    const responseData = {
      ...listing,
      id: listing.id.toString(),
    };

    res.json(successResponse(responseData, "Listing updated successfully"));
  } catch (error) {
    console.error("Error updating listing:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(errorResponse(new Error("Listing not found"), 404));
    }

    res.status(500).json(errorResponse(error));
  }
};

// Delete listing
export const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.listings.delete({
      where: { id: id },
    });

    res.json(successResponse(null, "Listing deleted successfully"));
  } catch (error) {
    console.error("Error deleting listing:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(errorResponse(new Error("Listing not found"), 404));
    }

    res.status(500).json(errorResponse(error));
  }
};

// Get listings by landlord
export const getListingsByLandlord = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { includeUnavailable = false } = req.query;

    const where = {
      landlord_id: landlordId,
      ...(includeUnavailable !== "true" && { available: true }),
    };

    const listings = await prisma.listings.findMany({
      where,
      include: {
        tenant_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Convert BigInt to string for JSON serialization
    const responseData = listings.map((listing) => ({
      ...listing,
      id: listing.id.toString(),
    }));

    res.json(
      successResponse(responseData, "Landlord listings retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching landlord listings:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get listings by tenant
export const getListingsByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const listings = await prisma.listings.findMany({
      where: {
        tenant_id: tenantId,
      },
      include: {
        landlord_profiles: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Convert BigInt to string for JSON serialization
    const responseData = listings.map((listing) => ({
      ...listing,
      id: listing.id.toString(),
    }));

    res.json(
      successResponse(responseData, "Tenant listings retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching tenant listings:", error);
    res.status(500).json(errorResponse(error));
  }
};
