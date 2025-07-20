import { prisma } from "../config/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { supabase } from "../config/supabase.js";

export const createLease = async (req, res) => {
  try {
    console.log('incoming data:', req.body);
    const {
      listingId,
      tenantId,
      startDate,
      endDate,
      rent,
      document,
      signed
    } = req.body;

    // Validate required fields
    if (
      !listingId ||
      !tenantId ||
      !startDate ||
      !endDate ||
      !rent ||
      !document
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Create a signed URL for the document
    const { data, error } = await supabase
      .storage
      .from("leases")
      .createSignedUrl(document, 60 * 60 * 24 * 365); // 1 year expiry

    if (error) {
      return res.status(500).json({
        error: "Failed to create signed URL for document",
      });
    }

    const lease = await prisma.leases.create({
      data: {
        tenant_id: tenantId,
        listing_id: listingId,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        rent: parseFloat(rent),
        document: data.signedUrl,
        signed,
      },
    });

    const responseData = {
      ...lease,
      listing_id: lease.listing_id.toString(),
    };

    res.status(201).json({
      message: "The lease has been created.",
      listing: responseData,
    });
  } catch (err) {
    console.error('Error in createLease:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      error: 'An error occurred while creating the lease.',
      details: err.message,
    })
  }
}

export const checkHasLease = async (req, res) => {
  try {
    const { listingId, tenantId } = req.params;

    const lease = await prisma.leases.findFirst({
      where: {
        listing_id: BigInt(listingId),
        tenant_id: tenantId,
      },
      select: {
        id: true,
      },
    });

    if (lease) {
      const responseData = {
        exists: true,
        leaseId: lease.id,
        signed: lease.signed,
      };
      res.json(responseData);
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error('Error checking if lease exists:', err);
    res.status(500).json({
      error: 'An error occurred while checking if lease exists.',
      details: err.message,
    });
  }
};

export const getLease = async (req, res) => {
  try {
    const { id } = req.params;

    const lease = await prisma.leases.findUnique({
      where: { id: id },
    });

    if (!lease) {
      return res.status(404).json({ error: "Lease not found" });
    }

    const responseData = {
      lease: {
        ...lease,
        listing_id: lease.listing_id.toString(),
      }
    };

    res.json(responseData);
  } catch (err) {
    console.error('Error getting lease:', err);
    res.status(500).json({
      error: 'An error occurred while getting the lease.',
      details: err.message,
    });
  }
}

// export const getDocument = async (req, res) => {
//     try {
//         const leaseId = req.params.leaseId;

//         const lease = await prisma.leases.findUnique({
//             where: { id: leaseId },
//         });

//         if (!lease || !lease.document) {
//             return res.status(404).json({ error: "Lease or document not found" });
//         }

//         // lease.document should be the file path ("documents/[filename].pdf")
//         const { data, error } = await supabase
//             .storage
//             .from("leases")
//             .createSignedUrl(lease.document, 60 * 60); // 1 hour expiry

//         if (error) {
//             return res.status(500).json({ error: "Failed to create document URL" });
//         }

//         return res.json({ url: data.signedUrl });
//     } catch (err) {
//         console.error('Error getting document:', err);
//         res.status(500).json({
//             error: 'An error occurred while getting the document.',
//             details: err.message,
//         })
//     }
// }