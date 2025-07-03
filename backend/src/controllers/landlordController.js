import { prisma } from "../config/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { supabase } from "../config/supabase.js";

// Get all landlords
export const getLandlords = async (req, res) => {
  try {
    const landlords = await prisma.landlord_profiles.findMany({
      orderBy: { created_at: "desc" },
    });

    res.json(successResponse(landlords, "Landlords retrieved successfully"));
  } catch (error) {
    console.error("Error fetching landlords:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get landlord by ID
export const getLandlordById = async (req, res) => {
  try {
    const { id } = req.params;

    const landlord = await prisma.landlord_profiles.findUnique({
      where: { id },
    });

    if (!landlord) {
      return res
        .status(404)
        .json(errorResponse(new Error("Landlord not found"), 404));
    }

    res.json(successResponse(landlord, "Landlord retrieved successfully"));
  } catch (error) {
    console.error("Error fetching landlord:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Create new landlord (with upsert functionality)
export const createLandlord = async (req, res) => {
  try {
    const { id, full_name, email, phone, image_url, address, documents } =
      req.body;

    // Use upsert to handle both create and update scenarios
    const landlord = await prisma.landlord_profiles.upsert({
      where: { id },
      update: {
        // Update existing profile with new data if provided
        ...(full_name && { full_name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(image_url !== undefined && { image_url }),
        ...(address !== undefined && { address }),
        ...(documents !== undefined && { documents }),
        updated_at: new Date(),
      },
      create: {
        id,
        full_name: full_name || email.split("@")[0], // Use email prefix as fallback
        email,
        phone,
        image_url,
        address,
        documents: documents || [],
      },
    });

    res
      .status(201)
      .json(
        successResponse(
          landlord,
          "Landlord profile created/updated successfully"
        )
      );
  } catch (error) {
    console.error("Error creating/updating landlord:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Update landlord
export const updateLandlord = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, image_url, address, documents } = req.body;

    const landlord = await prisma.landlord_profiles.update({
      where: { id },
      data: {
        ...(full_name && { full_name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(image_url !== undefined && { image_url }),
        ...(address !== undefined && { address }),
        ...(documents !== undefined && { documents }),
        updated_at: new Date(),
      },
    });

    res.json(successResponse(landlord, "Landlord updated successfully"));
  } catch (error) {
    console.error("Error updating landlord:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(errorResponse(new Error("Landlord not found"), 404));
    }

    res.status(500).json(errorResponse(error));
  }
};

// Delete landlord
export const deleteLandlord = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.landlord_profiles.delete({
      where: { id },
    });

    res.json(successResponse(null, "Landlord deleted successfully"));
  } catch (error) {
    console.error("Error deleting landlord:", error);

    if (error.code === "P2025") {
      return res
        .status(404)
        .json(errorResponse(new Error("Landlord not found"), 404));
    }

    res.status(500).json(errorResponse(error));
  }
};

// Get landlord's listings
export const getLandlordListings = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeUnavailable = false } = req.query;

    const where = {
      landlord_id: id,
      ...(includeUnavailable !== "true" && { available: true }),
    };

    const listings = await prisma.listings.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    res.json(
      successResponse(listings, "Landlord listings retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching landlord listings:", error);
    res.status(500).json(errorResponse(error));
  }
};

export const createListing = async (req, res) => {
  try {
    console.log("incoming data", req.body);
    const {
      title,
      type,
      address,
      city,
      state,
      zipCode,
      bedrooms,
      bathrooms,
      area,
      price,
      description,
      leaseType,
      amenities,
      requirements,
      houseRules,
      images,
      landlordId,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !type ||
      !address ||
      !city ||
      !state ||
      !zipCode ||
      !price ||
      !landlordId
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const { data, error } = await supabase
      .from("listings")
      .insert([
        {
          title,
          type,
          address,
          city,
          state,
          zip_code: zipCode,
          bedrooms,
          bathrooms,
          area,
          price,
          description,
          lease_type: leaseType,
          amenities,
          requirements,
          house_rules: houseRules,
          images,
          landlord_id: landlordId,
          available: true,
        },
      ])
      .select();

    if (error) {
      console.error(error);
      return res.status(500).json({
        error: "An error occurred while creating the listing.",
      });
    }

    res.status(201).json({
      message: "The listing has been created.",
      listing: data[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "An error occurred while creating the listing.",
    });
  }
};

export const getListings = async (req, res) => {
  try {
    const { data, error } = await supabase.from("listings").select("*");

    if (error) {
      console.error(error);
      return res.status(500).json({
        error: "An error occurred while getting the listings.",
      });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "An error occurred while getting the listings.",
    });
  }
};
