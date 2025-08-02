import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Toronto area coordinates for different neighborhoods
const torontoCoordinates = [
  { lat: 43.6532, lng: -79.3832 }, // Downtown Toronto
  { lat: 43.6544, lng: -79.4047 }, // Kensington Market
  { lat: 43.6487, lng: -79.3975 }, // Queen West
  { lat: 43.6617, lng: -79.3407 }, // Leslieville
  { lat: 43.6675, lng: -79.4065 }, // Yorkville
  { lat: 43.6426, lng: -79.3871 }, // Distillery District
  { lat: 43.6519, lng: -79.3817 }, // Financial District
  { lat: 43.6539, lng: -79.3792 }, // Entertainment District
  { lat: 43.6568, lng: -79.3594 }, // Riverdale
  { lat: 43.6629, lng: -79.3957 }, // Annex
  { lat: 43.6702, lng: -79.3866 }, // Rosedale
];

async function addCoordinates() {
  try {
    console.log('🔍 Adding coordinates to Toronto-based properties...\n');

    // Get all listings without coordinates
    const listingsWithoutCoords = await prisma.listings.findMany({
      where: {
        OR: [
          { coordinates: null },
          { coordinates: '' },
          { coordinates: 'null' }
        ]
      },
      select: {
        id: true,
        title: true,
        address: true,
        city: true
      }
    });

    console.log(`📊 Found ${listingsWithoutCoords.length} listings without coordinates:\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < listingsWithoutCoords.length; i++) {
      const listing = listingsWithoutCoords[i];
      const coordIndex = i % torontoCoordinates.length;
      const coordinates = torontoCoordinates[coordIndex];

      // Skip if the listing is clearly not in Toronto
      if (listing.city && !listing.city.toLowerCase().includes('toronto') && 
          !listing.city.toLowerCase().includes('on') && 
          !listing.city.toLowerCase().includes('ontario')) {
        console.log(`⏭️  Skipping ID: ${listing.id} | Title: ${listing.title} | City: ${listing.city} (not Toronto)`);
        skippedCount++;
        continue;
      }

      try {
        await prisma.listings.update({
          where: { id: listing.id },
          data: {
            coordinates: JSON.stringify(coordinates)
          }
        });

        console.log(`✅ Updated ID: ${listing.id} | Title: ${listing.title} | Coords: ${coordinates.lat}, ${coordinates.lng}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Failed to update ID: ${listing.id} | Error: ${error.message}`);
      }
    }

    console.log('\n📈 Summary:');
    console.log('===========');
    console.log(`✅ Updated: ${updatedCount} listings`);
    console.log(`⏭️  Skipped: ${skippedCount} listings`);
    console.log(`📊 Total processed: ${listingsWithoutCoords.length}`);

  } catch (error) {
    console.error('❌ Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
addCoordinates()
  .then(() => {
    console.log('\n🎉 Update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  }); 