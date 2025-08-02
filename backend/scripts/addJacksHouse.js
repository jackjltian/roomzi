import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function addJacksHouse() {
  try {
    console.log("🏠 Adding Jack's house to the database...");

    // Create a landlord for Jack's house
    const landlordId = uuidv4();
    const landlord = await prisma.landlord_profiles.upsert({
      where: { id: landlordId },
      update: {},
      create: {
        id: landlordId,
        full_name: "Jack Johnson",
        email: "jack.johnson@example.com",
        phone: "555-0123",
        image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        address: "123 Jack's Street, Toronto, ON",
      },
    });

    // Create Jack's house listing
    const listing = await prisma.listings.create({
      data: {
        landlord_id: landlord.id,
        title: "Jack's House",
        type: "House",
        address: "456 Jack's Avenue",
        city: "Toronto",
        state: "ON",
        zip_code: "M5V 3A8",
        bedrooms: 3,
        bathrooms: 2,
        area: 1200.0,
        price: 3500.0,
        description: "Beautiful house owned by Jack. Great location with amazing amenities.",
        lease_type: "12 months",
        amenities: [
          "Garden",
          "Garage",
          "Fireplace",
          "Hardwood floors",
          "Updated kitchen",
          "WiFi",
          "Laundry",
        ],
        requirements: "Good credit score, stable income, references",
        house_rules: "No smoking, pets allowed with deposit, quiet hours after 10 PM",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
          "https://images.unsplash.com/photo-1605146769289-440113cc3d00",
          "https://images.unsplash.com/photo-1449844908441-8829872d2607",
        ]),
        landlord_name: landlord.full_name,
        landlord_phone: landlord.phone,
        coordinates: "43.6532,-79.3832", // Toronto coordinates
        available: true,
      },
    });

    console.log("✅ Jack's house added successfully!");
    console.log(`🏠 Listing ID: ${listing.id}`);
    console.log(`👨‍💼 Landlord: ${landlord.full_name}`);
    console.log(`📍 Coordinates: ${listing.coordinates}`);
    console.log(`💰 Price: $${listing.price}/month`);

  } catch (error) {
    console.error("❌ Error adding Jack's house:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addJacksHouse(); 